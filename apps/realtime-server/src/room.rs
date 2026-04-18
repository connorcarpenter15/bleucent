use std::sync::Arc;
use std::time::Instant;

use chrono::{DateTime, Utc};
use dashmap::DashMap;
use serde_json::Value;
use tokio::sync::{broadcast, Mutex};
use uuid::Uuid;
use yrs::types::ToJson;
use yrs::{Any, Doc, GetString, Map, MapRef, Out, ReadTxn, Transact};

/// Per-room state. Tracks how many WebSocket clients are currently connected
/// and when (if ever) the room dropped to zero clients, so the GC task can
/// distinguish between a transient disconnect and an abandoned interview.
///
/// IMPORTANT: We never close on the last disconnect. The session is closed
/// only by an explicit `POST /internal/end/{interview_id}` from the web app
/// or by the idle GC after `idle_timeout_secs` of zero clients.
pub struct Room {
    #[allow(dead_code)]
    pub interview_id: Uuid,
    /// The shared Yjs document. Held behind a Mutex so we can apply updates
    /// from many concurrent WebSocket tasks without juggling lifetimes.
    pub doc: Mutex<Doc>,
    /// Per-room broadcast of raw y-websocket binary frames. Each connected
    /// `/yjs/{id}` socket subscribes; anything one peer sends is relayed.
    pub yjs_broadcast: broadcast::Sender<YjsBroadcast>,
    /// Per-room broadcast of telemetry events for `/events/{id}` sockets.
    pub events: broadcast::Sender<TelemetryFanout>,
    pub event_seq: Mutex<i32>,
    connected_clients: Mutex<usize>,
    last_empty_at: Mutex<Option<Instant>>,
    closed: Mutex<bool>,
}

#[derive(Clone, Debug)]
pub struct YjsBroadcast {
    /// The source connection id, so the broadcaster can skip echoing back to
    /// itself.
    pub from: u64,
    pub bytes: bytes::Bytes,
}

impl Room {
    pub fn new(interview_id: Uuid) -> Self {
        let doc = Doc::new();
        // Pre-create the top-level shared types so clients see consistent shapes.
        {
            let txn = doc.transact_mut();
            let _code: MapRef = doc.get_or_insert_map("code");
            let _nodes: MapRef = doc.get_or_insert_map("canvas_nodes");
            let _edges: MapRef = doc.get_or_insert_map("canvas_edges");
            drop(txn);
        }
        let (yjs_broadcast, _) = broadcast::channel(2048);
        let (events, _) = broadcast::channel(1024);
        Self {
            interview_id,
            doc: Mutex::new(doc),
            yjs_broadcast,
            events,
            event_seq: Mutex::new(0),
            connected_clients: Mutex::new(0),
            last_empty_at: Mutex::new(Some(Instant::now())),
            closed: Mutex::new(false),
        }
    }

    pub async fn client_connected(&self) {
        let mut count = self.connected_clients.lock().await;
        *count += 1;
        if *count == 1 {
            *self.last_empty_at.lock().await = None;
        }
    }

    pub async fn client_disconnected(&self) {
        let mut count = self.connected_clients.lock().await;
        if *count > 0 {
            *count -= 1;
        }
        if *count == 0 {
            *self.last_empty_at.lock().await = Some(Instant::now());
        }
    }

    pub async fn is_idle_for(&self, secs: u64) -> bool {
        let last = self.last_empty_at.lock().await;
        match *last {
            Some(t) => t.elapsed().as_secs() >= secs,
            None => false,
        }
    }

    pub async fn is_closed(&self) -> bool {
        *self.closed.lock().await
    }

    pub async fn mark_closed(&self) {
        *self.closed.lock().await = true;
    }

    pub async fn next_seq(&self) -> i32 {
        let mut s = self.event_seq.lock().await;
        *s += 1;
        *s
    }

    /// Walks the canvas sub-docs and returns the React-Flow-shaped JSON used
    /// by the AI orchestrator's `GET /internal/snapshot/{id}` route.
    pub async fn snapshot_canvas(&self) -> Value {
        let doc = self.doc.lock().await;
        let txn = doc.transact();
        let nodes_map = doc.get_or_insert_map("canvas_nodes");
        let edges_map = doc.get_or_insert_map("canvas_edges");
        let nodes: Vec<Value> = nodes_map
            .iter(&txn)
            .map(|(_, v)| out_to_json(&v, &txn))
            .collect();
        let edges: Vec<Value> = edges_map
            .iter(&txn)
            .map(|(_, v)| out_to_json(&v, &txn))
            .collect();
        serde_json::json!({ "nodes": nodes, "edges": edges })
    }

    /// Walks the code sub-doc (a map of file path -> contents string) and
    /// returns a list of `{ path, contents }`.
    pub async fn snapshot_code(&self) -> Vec<Value> {
        let doc = self.doc.lock().await;
        let txn = doc.transact();
        let code_map = doc.get_or_insert_map("code");
        let mut files = Vec::new();
        for (path, value) in code_map.iter(&txn) {
            let contents = match &value {
                Out::Any(Any::String(s)) => s.to_string(),
                Out::YText(t) => t.get_string(&txn),
                other => out_to_json(other, &txn).to_string(),
            };
            files.push(serde_json::json!({ "path": path.to_string(), "contents": contents }));
        }
        files
    }
}

fn out_to_json<T: ReadTxn>(value: &Out, txn: &T) -> Value {
    match value {
        Out::Any(a) => any_to_json(a.clone()),
        Out::YText(t) => Value::String(t.get_string(txn)),
        Out::YArray(a) => any_to_json(a.to_json(txn)),
        Out::YMap(m) => any_to_json(m.to_json(txn)),
        _ => Value::Null,
    }
}

fn any_to_json(value: Any) -> Value {
    match value {
        Any::Null | Any::Undefined => Value::Null,
        Any::Bool(b) => Value::Bool(b),
        Any::Number(n) => serde_json::Number::from_f64(n)
            .map(Value::Number)
            .unwrap_or(Value::Null),
        Any::BigInt(n) => Value::Number(n.into()),
        Any::String(s) => Value::String(s.to_string()),
        Any::Buffer(b) => Value::String(format!("<buffer:{} bytes>", b.len())),
        Any::Array(items) => Value::Array(items.iter().cloned().map(any_to_json).collect()),
        Any::Map(map) => {
            let mut out = serde_json::Map::new();
            for (k, v) in map.iter() {
                out.insert(k.to_string(), any_to_json(v.clone()));
            }
            Value::Object(out)
        }
    }
}

/// One in-memory event broadcast across the room's `/events/{id}` connections.
#[derive(Clone, Debug)]
pub struct TelemetryFanout {
    pub kind: String,
    pub actor: String,
    pub ts: DateTime<Utc>,
    pub payload: Value,
    pub seq: i32,
}

#[derive(Default)]
pub struct RoomRegistry {
    rooms: DashMap<Uuid, Arc<Room>>,
}

impl RoomRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_or_create(&self, interview_id: Uuid) -> Arc<Room> {
        self.rooms
            .entry(interview_id)
            .or_insert_with(|| Arc::new(Room::new(interview_id)))
            .clone()
    }

    pub fn get(&self, interview_id: &Uuid) -> Option<Arc<Room>> {
        self.rooms.get(interview_id).map(|r| r.clone())
    }

    pub fn remove(&self, interview_id: &Uuid) {
        self.rooms.remove(interview_id);
    }

    pub fn iter_ids(&self) -> Vec<Uuid> {
        self.rooms.iter().map(|kv| *kv.key()).collect()
    }
}
