fn main() {
    if tauri_build::is_dev() && std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
        unsafe {
            std::env::set_var("TAURI_CONFIG", r#"{"bundle":{"externalBin":[]}}"#);
        }
    }

    tauri_build::build()
}
