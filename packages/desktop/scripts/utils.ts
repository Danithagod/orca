import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises"
import { join } from "node:path"

export const SIDECAR_BINARIES: Array<{ rustTarget: string; ocBinary: string; assetExt: string }> = [
  {
    rustTarget: "aarch64-apple-darwin",
    ocBinary: "@orca/cli-darwin-arm64", // kilocode_change
    assetExt: "zip",
  },
  {
    rustTarget: "x86_64-apple-darwin",
    ocBinary: "@orca/cli-darwin-x64", // kilocode_change
    assetExt: "zip",
  },
  {
    rustTarget: "x86_64-pc-windows-msvc",
    ocBinary: "@orca/cli-windows-x64", // kilocode_change
    assetExt: "zip",
  },
  {
    rustTarget: "x86_64-unknown-linux-gnu",
    ocBinary: "@orca/cli-linux-x64", // kilocode_change
    assetExt: "tar.gz",
  },
  {
    rustTarget: "aarch64-unknown-linux-gnu",
    ocBinary: "@orca/cli-linux-arm64", // kilocode_change
    assetExt: "tar.gz",
  },
]

export const RUST_TARGET = Bun.env.RUST_TARGET
const SIDECAR_DIR = "src-tauri/sidecars"
const DEV_SIDECAR_KEEP = 5

export function getCurrentSidecar(target = RUST_TARGET) {
  if (!target && !RUST_TARGET) throw new Error("RUST_TARGET not set")

  const binaryConfig = SIDECAR_BINARIES.find((b) => b.rustTarget === target)
  if (!binaryConfig) throw new Error(`Sidecar configuration not available for Rust target '${RUST_TARGET}'`)

  return binaryConfig
}

function getTarget(target = RUST_TARGET) {
  if (!target && !RUST_TARGET) throw new Error("RUST_TARGET not set")
  return target
}

export async function copyBinaryToSidecarFolder(source: string, target = RUST_TARGET) {
  const triple = getTarget(target)
  await mkdir(SIDECAR_DIR, { recursive: true })
  const dest = windowsify(join(SIDECAR_DIR, `kilo-cli-${triple}`)) // kilocode_change
  await copyFile(source, dest)

  console.log(`Copied ${source} to ${dest}`)
}

export async function copyBinaryToDevSidecarFolder(source: string, target = RUST_TARGET) {
  const triple = getTarget(target)
  await mkdir(SIDECAR_DIR, { recursive: true })
  const prefix = `kilo-cli-${triple}`
  const dest = windowsify(join(SIDECAR_DIR, `${prefix}-${Date.now()}`)) // kilocode_change

  await copyFile(source, dest)
  await pruneDevSidecars(prefix, dest)

  console.log(`Copied ${source} to ${dest}`)
}

async function pruneDevSidecars(prefix: string, keep: string) {
  const files = await readdir(SIDECAR_DIR)
  const all = await Promise.all(
    files
      .filter((name) => name.startsWith(prefix))
      .map(async (name) => ({
        path: join(SIDECAR_DIR, name),
        stat: await stat(join(SIDECAR_DIR, name)),
      })),
  )

  const extra = all
    .filter((file) => file.path !== keep)
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
    .slice(DEV_SIDECAR_KEEP - 1)

  await Promise.all(
    extra.map((file) =>
      rm(file.path, { force: true }).catch(() => {
        return
      }),
    ),
  )
}

export function windowsify(path: string) {
  if (path.endsWith(".exe")) return path
  return `${path}${process.platform === "win32" ? ".exe" : ""}`
}
