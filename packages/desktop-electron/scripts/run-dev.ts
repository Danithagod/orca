#!/usr/bin/env bun

import { $ } from "bun"
import { copyFileSync, mkdirSync, renameSync, existsSync } from "fs"
import { join } from "path"

const rootDir = join(process.cwd(), "..", "opencode", "dist", "@orca")
const baselineSrc = join(rootDir, "cli-windows-x64-baseline")
const resourcesDir = join(process.cwd(), "resources")
const opencodeCli = join(resourcesDir, "opencode-cli.exe")

if (!existsSync(baselineSrc)) {
  console.error("CLI not built. Run: cd packages/opencode && bun run build")
  process.exit(1)
}

console.log("Setting up desktop-electron resources...")

mkdirSync(resourcesDir, { recursive: true })

const files = [
  "kilo.exe",
  "index.js",
  "index.js.map",
  "worker.js",
  "worker.js.map",
  "parser.worker.js",
  "parser.worker.js.map",
]
for (const file of files) {
  const src = join(baselineSrc, "bin", file)
  if (existsSync(src)) {
    copyFileSync(src, join(resourcesDir, file))
  }
}

const srcExe = join(baselineSrc, "bin", "kilo.exe")
if (existsSync(srcExe)) {
  renameSync(srcExe, opencodeCli)
}

console.log("Icons...")
await $`bun ./scripts/copy-icons.ts dev`

console.log("Starting electron...")
await $`bun run electron-vite dev`
