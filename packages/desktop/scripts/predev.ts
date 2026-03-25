import { $ } from "bun"

import { copyBinaryToDevSidecarFolder, getCurrentSidecar, windowsify } from "./utils"

const RUST_TARGET = Bun.env.TAURI_ENV_TARGET_TRIPLE

const sidecarConfig = getCurrentSidecar(RUST_TARGET)

const binaryPath = windowsify(`../opencode/dist/${sidecarConfig.ocBinary}/bin/kilo`) // kilocode_change

await (sidecarConfig.ocBinary.includes("-baseline")
  ? $`bun run build --single --baseline`.cwd("../opencode")
  : $`bun run build --single`.cwd("../opencode"))

await copyBinaryToDevSidecarFolder(binaryPath, RUST_TARGET)
