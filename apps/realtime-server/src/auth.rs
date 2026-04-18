use jsonwebtoken::{decode, errors::Error as JwtError, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Claims carried by the short-lived JWT issued by the Next.js app and used to
/// authenticate browser WebSocket upgrades. Mirrors `RealtimeJwtClaims` in
/// `packages/shared-protocol`.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RealtimeClaims {
    pub sub: String,
    #[serde(rename = "interviewId")]
    pub interview_id: Uuid,
    pub role: Role,
    pub iat: i64,
    pub exp: i64,
    #[serde(default)]
    pub iss: Option<String>,
    #[serde(default)]
    pub aud: Option<serde_json::Value>,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    Candidate,
    Interviewer,
}

pub fn decode_token(token: &str, secret: &str) -> Result<RealtimeClaims, JwtError> {
    let key = DecodingKey::from_secret(secret.as_bytes());
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_audience(&["bleucent-realtime"]);
    validation.set_issuer(&["bleucent-web"]);
    let data = decode::<RealtimeClaims>(token, &key, &validation)?;
    Ok(data.claims)
}
