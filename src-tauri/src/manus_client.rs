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
            base_url: "https://api.manus.ai/v1".to_string(),
        }
    }

    pub async fn recommend_build(&self, request: &BuildRequest) -> Result<BuildRecommendation, String> {
        let client = reqwest::Client::new();
        
        // 1. Construct Prompt
        let prompt = format!(
            "Recommend a Dota 2 item build for **{}** (Position {}). \
            \n\n**Context:**\n- Allies: {}\n- Enemies: {}\n\n\
            Return a valid JSON object with the following structure:\n\
            {{\n  \"item_build\": [\n    {{ \"item_name\": \"Item Name\", \"reasoning\": \"Why this item?\", \"icon_url\": null }}\n  ],\n  \"reasoning\": \"Overall strategy summary.\"\n}}\n\
            Note: For 'icon_url', return null (the frontend handles icons). Provide 4-6 key items. Return ONLY JSON, no markdown formatting.",
            request.user_hero, 
            request.user_position, 
            request.allies.join(", "), 
            request.enemies.join(", ")
        );

        // 2. Create Task
        let payload = json!({
            "prompt": prompt,
            "model": "manus-1", // Using manus-1 as identifier
            "agent_profile": "manus-1.6-lite-adaptive" // Explicit profile from observed response
        });

        println!("Creating Manus AI task...");
        let create_res = client
            .post(format!("{}/tasks", self.base_url))
            .header("API_KEY", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to create task: {}", e))?;

        if !create_res.status().is_success() {
            let err = create_res.text().await.unwrap_or_default();
            return Err(format!("API Creation Error: {}", err));
        }

        let task_json: serde_json::Value = create_res.json().await
            .map_err(|e| format!("Failed to parse creation response: {}", e))?;
        
        let task_id = task_json["task_id"].as_str()
            .or_else(|| task_json["id"].as_str()) // API might return "id" or "task_id"
            .ok_or("No task_id in response")?
            .to_string();

        println!("Task created: {}. Polling for results...", task_id);

        // 3. Poll for Completion
        let mut attempts = 0;
        let max_attempts = 60; // 60 * 2s = 120s timeout
        
        loop {
            if attempts >= max_attempts {
                return Err("Timeout waiting for AI response".to_string());
            }
            attempts += 1;
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;

            let poll_res = client
                .get(format!("{}/tasks/{}", self.base_url, task_id))
                .header("API_KEY", &self.api_key)
                .send()
                .await
                .map_err(|e| format!("Polling failed: {}", e))?;

            if !poll_res.status().is_success() {
                continue; // Retry on transient errors? Or fail? Let's fail for now to be safe
            }

            let task_status: serde_json::Value = poll_res.json().await
                .map_err(|e| format!("Failed to parse poll response: {}", e))?;

            let status = task_status["status"].as_str().unwrap_or("unknown");
            println!("Task status: {}", status);

            if status == "completed" {
                // 4. Extract Result
                if let Some(outputs) = task_status["output"].as_array() {
                    // Find the last assistant message
                    for msg in outputs.iter().rev() {
                        if msg["role"].as_str().unwrap_or("") == "assistant" {
                            if let Some(content_arr) = msg["content"].as_array() {
                                for content_item in content_arr {
                                    if content_item["type"].as_str().unwrap_or("") == "output_text" {
                                        let text = content_item["text"].as_str().unwrap_or("");
                                        // Try to parse this as the JSON result
                                        
                                        // Clean markdown code blocks
                                        let clean_text = text
                                            .trim()
                                            .trim_start_matches("```json")
                                            .trim_start_matches("```")
                                            .trim_end_matches("```")
                                            .trim();

                                        match serde_json::from_str::<BuildRecommendation>(clean_text) {
                                            Ok(rec) => return Ok(rec),
                                            Err(_) => {
                                                // Continue searching if this block wasn't it, 
                                                // but usually it's the main response.
                                                // If parsing fails, it might be an intermediate message? 
                                                // But usually the final answer is the one.
                                                // Let's print debug if we fail to parse
                                                println!("Failed to parse JSON candidate: {}", clean_text);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                return Err("Task completed but no valid JSON build found".to_string());
            } else if status == "failed" || status == "error" {
                 return Err(format!("Task failed: {:?}", task_status));
            }
        }
    }
}
