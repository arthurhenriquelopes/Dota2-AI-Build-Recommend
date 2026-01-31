use crate::models::{BuildRecommendation, BuildRequest};
use serde_json::json;

#[allow(dead_code)]
pub struct ManusClient {
    api_key: String,
    base_url: String,
}

impl ManusClient {
    pub fn new(api_key: String) -> Self {
        ManusClient {
            api_key,
            base_url: "https://api.manus.im/v1".to_string(),
        }
    }

    pub async fn recommend_build(&self, request: &BuildRequest) -> Result<BuildRecommendation, String> {
        let client = reqwest::Client::new();
        
        let prompt = format!(
            "Recommend a Dota 2 item build for **{}** (Position {}). \
            \n\n**Context:**\n- Allies: {}\n- Enemies: {}\n\n\
            Return a valid JSON object with the following structure:\n\
            {{\n  \"item_build\": [\n    {{ \"item_name\": \"Item Name\", \"reasoning\": \"Why this item?\", \"icon_url\": null }}\n  ],\n  \"reasoning\": \"Overall strategy summary.\"\n}}\n\
            Note: For 'icon_url', return null (the frontend handles icons). Provide 4-6 key items.",
            request.user_hero, 
            request.user_position, 
            request.allies.join(", "), 
            request.enemies.join(", ")
        );

        let payload = json!({
            "model": "manus-1", // Using manus-1 as the model identifier
            "messages": [
                {"role": "system", "content": "You are a professional high-MMR Dota 2 coach. You optimize builds for specific matchups. Return ONLY JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        });

        println!("Sending request to Manus AI...");

        let response = client
            .post(format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("API Error: {}", error_text));
        }

        let response_json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        // Extract content from OpenAI-compatible response format
        let content = response_json["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("Invalid response format: missing content")?;

        // Clean up code blocks if present (markdown json)
        let clean_content = content
            .trim()
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        let recommendation: BuildRecommendation = serde_json::from_str(clean_content)
            .map_err(|e| format!("Failed to parse JSON content: {}. Content: {}", e, clean_content))?;

        Ok(recommendation)
    }
}
