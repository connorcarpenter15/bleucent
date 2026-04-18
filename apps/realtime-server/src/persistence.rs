use anyhow::Result;
use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

/// Inserts a single telemetry event row. Called from the realtime broadcaster
/// when an event arrives on `/events/{interview_id}`.
pub async fn insert_event(
    pool: &PgPool,
    interview_id: Uuid,
    ts: DateTime<Utc>,
    kind: &str,
    actor: &str,
    payload: &Value,
    seq: i32,
) -> Result<()> {
    sqlx::query(
        r#"INSERT INTO interview_event (interview_id, ts, kind, actor, payload, seq)
           VALUES ($1, $2, $3, $4, $5, $6)"#,
    )
    .bind(interview_id)
    .bind(ts)
    .bind(kind)
    .bind(actor)
    .bind(payload)
    .bind(seq)
    .execute(pool)
    .await?;
    Ok(())
}

/// Loads the full event log for an interview in chronological order. Used by
/// the explicit-end webhook and the idle-room GC to flush to S3.
pub async fn load_event_log(pool: &PgPool, interview_id: Uuid) -> Result<Vec<Value>> {
    let rows: Vec<(DateTime<Utc>, String, String, Value, i32)> = sqlx::query_as(
        r#"SELECT ts, kind, actor, payload, seq
           FROM interview_event
           WHERE interview_id = $1
           ORDER BY ts ASC, seq ASC"#,
    )
    .bind(interview_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|(ts, kind, actor, payload, seq)| {
            serde_json::json!({
                "ts": ts,
                "kind": kind,
                "actor": actor,
                "payload": payload,
                "seq": seq,
            })
        })
        .collect())
}

/// Marks the interview as completed and stamps the replay key.
pub async fn mark_completed(
    pool: &PgPool,
    interview_id: Uuid,
    replay_s3_key: Option<&str>,
) -> Result<()> {
    sqlx::query(
        r#"UPDATE interview
           SET status = 'completed',
               ended_at = COALESCE(ended_at, now()),
               replay_s3_key = COALESCE($2, replay_s3_key),
               updated_at = now()
           WHERE id = $1"#,
    )
    .bind(interview_id)
    .bind(replay_s3_key)
    .execute(pool)
    .await?;
    Ok(())
}
