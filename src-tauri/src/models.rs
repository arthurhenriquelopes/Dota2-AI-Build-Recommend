use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Hero {
    pub id: u32,
    pub name: String,
    pub localized_name: String,
    pub primary_attr: String,
    pub attack_type: String,
    pub roles: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BuildRequest {
    pub user_hero: String,
    pub user_position: String, // "P1", "P2", etc.
    pub allies: Vec<String>,
    pub enemies: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BuildRecommendation {
    pub item_build: Vec<ItemRecommendation>,
    pub reasoning: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ItemRecommendation {
    pub item_name: String,
    pub reasoning: String,
    pub icon_url: Option<String>,
}
