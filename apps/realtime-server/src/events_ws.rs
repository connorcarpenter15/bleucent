use std::sync::Arc;

use axum::extract::ws::{Message, WebSocket};
use chrono::{DateTime, Utc};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::PgPool;
use tracing::{debug, warn};
use uuid::Uuid;

use crate::auth::Role;
use crate::persistence::insert_event;
use crate::room::{Room, TelemetryFanout};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct IncomingEvent {
    pub kind: String,
    pub payload: Value,
    #[serde(default)]
    pub ts: Option<DateTime<Utc>>,
    #[serde(default)]
    pub actor: Option<String>,
}

/// Runs one telemetry-channel WebSocket connection. Reads JSON event objects
/// from the client, persists them, fans them out to every other connection in
/// the same room. Also forwards every event published by other connections
/// back to this client.
pub async fn run_events_ws(
    socket: WebSocket,
    room: Arc<Room>,
    pool: PgPool,
    role: Role,
    interview_id: Uuid,
    subject: String,
) {
    let (mut sender, mut receiver) = socket.split();
    let mut peer_rx = room.events.subscribe();

    let actor_default = match role {
        Role::Candidate => "candidate".to_string(),
        Role::Interviewer => "interviewer".to_string(),
    };

    loop {
        tokio::select! {
            maybe_msg = receiver.next() => {
                let Some(Ok(msg)) = maybe_msg else { break };
                let bytes = match msg {
                    Message::Text(t) => t.into_bytes(),
                    Message::Binary(b) => b,
                    Message::Close(_) => break,
                    Message::Ping(p) => { let _ = sender.send(Message::Pong(p)).await; continue; }
                    _ => continue,
                };
                let parsed: Result<IncomingEvent, _> = serde_json::from_slice(&bytes);
                match parsed {
                    Ok(ev) => {
                        let actor = ev.actor.clone().unwrap_or_else(|| actor_default.clone());
                        let ts = ev.ts.unwrap_or_else(Utc::now);
                        let seq = room.next_seq().await;
                        let fanout = TelemetryFanout {
                            kind: ev.kind.clone(),
                            actor: actor.clone(),
                            ts,
                            payload: ev.payload.clone(),
                            seq,
                        };
                        let _ = room.events.send(fanout);
                        // Persist asynchronously; failure is logged, not fatal.
                        let pool_ref = pool.clone();
                        let interview_id_copy = interview_id;
                        tokio::spawn(async move {
                            if let Err(err) = insert_event(
                                &pool_ref,
                                interview_id_copy,
                                ts,
                                &ev.kind,
                                &actor,
                                &ev.payload,
                                seq,
                            )
                            .await
                            {
                                warn!(?err, "failed to persist telemetry event");
                            }
                        });
                    }
                    Err(err) => debug!(?err, "ignoring malformed event"),
                }
            }
            Ok(fanout) = peer_rx.recv() => {
                let envelope = serde_json::json!({
                    "kind": fanout.kind,
                    "actor": fanout.actor,
                    "ts": fanout.ts,
                    "payload": fanout.payload,
                    "seq": fanout.seq,
                });
                let bytes = match serde_json::to_vec(&envelope) {
                    Ok(b) => b,
                    Err(_) => continue,
                };
                if sender.send(Message::Binary(bytes)).await.is_err() {
                    break;
                }
            }
        }
    }

    let _ = subject;
}
