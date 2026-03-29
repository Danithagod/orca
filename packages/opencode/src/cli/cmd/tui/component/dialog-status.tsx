import { TextAttributes } from "@opentui/core"
import { fileURLToPath } from "bun"
import path from "path"
import { useTheme } from "../context/theme"
import { useDialog } from "@tui/ui/dialog"
import { useSync } from "@tui/context/sync"
import { For, Match, Switch, Show, createMemo } from "solid-js"
import { Installation } from "../../../../installation"
import { Global } from "@/global" // kilocode_change
import { OrcaDivider, OrcaStatusBadge } from "./orca-ui"

export type DialogStatusProps = {}

export function DialogStatus() {
  const sync = useSync()
  const { theme } = useTheme()
  const dialog = useDialog()

  const enabledFormatters = createMemo(() => sync.data.formatter.filter((f) => f.enabled))

  const plugins = createMemo(() => {
    const list = sync.data.config.plugin ?? []
    const result = list.map((value) => {
      if (value.startsWith("file://")) {
        const path = fileURLToPath(value)
        const parts = path.split("/")
        const filename = parts.pop() || path
        if (!filename.includes(".")) return { name: filename }
        const basename = filename.split(".")[0]
        if (basename === "index") {
          const dirname = parts.pop()
          const name = dirname || basename
          return { name }
        }
        return { name: basename }
      }
      const index = value.lastIndexOf("@")
      if (index <= 0) return { name: value, version: "latest" }
      const name = value.substring(0, index)
      const version = value.substring(index + 1)
      return { name, version }
    })
    return result.toSorted((a, b) => a.name.localeCompare(b.name))
  })

  return (
    <box paddingLeft={1} paddingRight={1} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <text fg={theme.accent} attributes={TextAttributes.BOLD}>
          ORCA STATUS
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          esc
        </text>
      </box>

      <text fg={theme.textMuted} marginBottom={1}>Orca v{Installation.VERSION}</text>

      <OrcaDivider />

      <box marginTop={1} marginBottom={1}>
        <text fg={theme.accent} attributes={TextAttributes.BOLD} marginBottom={0.5}>Paths</text>
        <box flexDirection="row" gap={2}>
          <text fg={theme.textMuted} width={15}>Global config</text>
          <text fg={theme.text}>{Global.Path.config.replace(Global.Path.home, "~")}</text>
        </box>
        <Show when={sync.data.path.directory}>
          <box flexDirection="row" gap={2}>
            <text fg={theme.textMuted} width={15}>Project</text>
            <text fg={theme.text}>{sync.data.path.directory.replace(Global.Path.home, "~")}</text>
          </box>
        </Show>
      </box>

      <OrcaDivider />

      <Show when={Object.keys(sync.data.mcp).length > 0} fallback={<box marginTop={1}><text fg={theme.textMuted}>No MCP Servers</text></box>}>
        <box marginTop={1} marginBottom={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD} marginBottom={0.5}>MCP Servers ({Object.keys(sync.data.mcp).length})</text>
          <For each={Object.entries(sync.data.mcp)}>
            {([key, item]) => (
              <box flexDirection="row" gap={1} marginTop={0.5}>
                <OrcaStatusBadge
                  status={item.status === "connected" ? "success" : (item.status === "failed" ? "error" : "idle")}
                  label={key}
                />
                <box flexGrow={1} />
                <text fg={theme.textMuted} wrapMode="word">
                  <Switch fallback={item.status}>
                    <Match when={item.status === "connected"}>Connected</Match>
                    <Match when={item.status === "failed" && item}>{(val) => val().error.slice(0, 30)}</Match>
                    <Match when={item.status === "disabled"}>Disabled</Match>
                    <Match when={(item.status as string) === "needs_auth"}>Needs Auth</Match>
                  </Switch>
                </text>
              </box>
            )}
          </For>
        </box>
      </Show>

      <OrcaDivider />

      <Show when={sync.data.lsp.length > 0}>
        <box marginTop={1} marginBottom={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD} marginBottom={0.5}>LSP Servers ({sync.data.lsp.length})</text>
          <For each={sync.data.lsp}>
            {(item) => (
              <box flexDirection="row" gap={1} marginTop={0.5}>
                <OrcaStatusBadge
                  status={item.status === "connected" ? "success" : item.status === "ready" ? "idle" : "error"}
                  label={item.id}
                />
                <box flexGrow={1} />
                <text fg={theme.textMuted} wrapMode="none">
                  {item.status === "connected" ? `attached ${path.basename(item.root)}` : `${item.status} ${path.basename(item.root)}`}
                </text>
              </box>
            )}
          </For>
        </box>
        <OrcaDivider />
      </Show>

      <Show when={enabledFormatters().length > 0}>
        <box marginTop={1} marginBottom={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD} marginBottom={0.5}>Formatters ({enabledFormatters().length})</text>
          <For each={enabledFormatters()}>
            {(item) => (
              <box flexDirection="row" gap={1}>
                <OrcaStatusBadge status="success" label={item.name} />
              </box>
            )}
          </For>
        </box>
        <OrcaDivider />
      </Show>

      <Show when={plugins().length > 0}>
        <box marginTop={1} marginBottom={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD} marginBottom={0.5}>Plugins ({plugins().length})</text>
          <For each={plugins()}>
            {(item) => (
              <box flexDirection="row" gap={1} marginTop={0.5}>
                <OrcaStatusBadge status="success" label={item.name} />
                <Show when={item.version}>
                  <text fg={theme.textMuted}> @{item.version}</text>
                </Show>
              </box>
            )}
          </For>
        </box>
      </Show>
    </box>
  )
}
