use std::sync::Arc;

use sqlx::PgPool;

use crate::config::Config;
use crate::room::RoomRegistry;
use crate::storage::ReplayStore;

/// Shared application state plumbed into every Axum handler.
#[derive(Clone)]
pub struct AppState {
    pub cfg: Arc<Config>,
    pub pool: PgPool,
    pub rooms: Arc<RoomRegistry>,
    pub replay: Arc<ReplayStore>,
}
