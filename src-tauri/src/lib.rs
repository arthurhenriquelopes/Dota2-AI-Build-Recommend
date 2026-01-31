pub mod models;
pub mod manus_client;

use models::{BuildRequest, BuildRecommendation};
use manus_client::ManusClient;

#[tauri::command]
async fn recommend_build(request: BuildRequest) -> Result<BuildRecommendation, String> {
    // In a real app, API Key should be from env or settings
    let api_key = "sk-iUNn-sfxKdBn2iwWEZgL0F1myTNkNQRD9T1S6Bn8Ds3jpi2XkGdqK-o0nMSZT0MAZeJAttBQaK6a-FInzTPOdo8vvYQF".to_string(); 
    let client = ManusClient::new(api_key);
    client.recommend_build(&request).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![recommend_build])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
