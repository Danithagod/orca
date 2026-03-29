import { createMemo, Match, onCleanup, onMount, Show, Switch } from "solid-js"
import { createStore } from "solid-js/store"
import { TextAttributes } from "@opentui/core"

import { useTheme } from "../../context/theme"
import { useSync } from "../../context/sync"
import { useDirectory } from "../../context/directory"
import { useConnected } from "../../component/dialog-model"
import { useRoute } from "../../context/route"

function Keycap(props: { label: string }) {
  const { theme } = useTheme()
  return (
    <box backgroundColor={theme.backgroundElement} paddingLeft={1} paddingRight={1}>
      <text fg={theme.primary} attributes={TextAttributes.BOLD} wrapMode="none">
        {props.label}
      </text>
    </box>
  )
}

export function Footer(props: { child?: boolean }) {
  const { theme } = useTheme()
  const sync = useSync()
  const route = useRoute()
  const mcp = createMemo(() => Object.values(sync.data.mcp).filter((x) => x.status === "connected").length)
  const lsp = createMemo(() => Object.keys(sync.data.lsp).length)
  const permissions = createMemo(() => {
    if (route.data.type !== "session") return []
    return sync.data.permission[route.data.sessionID] ?? []
  })
  const directory = useDirectory()
  const connected = useConnected()
  const dir = createMemo(() => {
    const value = directory()
    if (value.length <= 72) return value
    return "..." + value.slice(-69)
  })

  const [store, setStore] = createStore({
    welcome: false,
  })

  onMount(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []

    function tick() {
      if (connected()) return
      if (!store.welcome) {
        setStore("welcome", true)
        timeouts.push(setTimeout(() => tick(), 5000))
        return
      }

      setStore("welcome", false)
      timeouts.push(setTimeout(() => tick(), 10000))
    }

    timeouts.push(setTimeout(() => tick(), 10000))

    onCleanup(() => {
      timeouts.forEach(clearTimeout)
    })
  })

  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      gap={2}
      flexShrink={0}
      backgroundColor={theme.backgroundPanel}
      width="100%"
      paddingLeft={1}
      paddingRight={1}
      border={["top"]}
      borderColor={theme.border}
    >
      <box flexDirection="row" gap={1} minWidth={1} flexShrink={1} alignItems="center">
        <text fg={theme.primary} attributes={TextAttributes.BOLD}>
          Orca
        </text>
        <text fg={theme.textMuted}>|</text>
        <text fg={theme.textMuted} wrapMode="none">
          {dir()}
        </text>
      </box>

      <box gap={1} flexDirection="row" flexShrink={0} alignItems="center">
        <Switch>
          <Match when={store.welcome}>
            <text fg={theme.textMuted}>
              Connect more providers with <span style={{ fg: theme.primary }}>/connect</span>
            </text>
          </Match>
          <Match when={connected()}>
            <Show when={permissions().length > 0}>
              <text fg={theme.warning} wrapMode="none">
                {permissions().length} permission{permissions().length > 1 ? "s" : ""}
              </text>
            </Show>
            <Show when={props.child}>
              <Keycap label="ESC" />
              <text fg={theme.textMuted}>back</text>
              <text fg={theme.textMuted}>•</text>
            </Show>
            <Keycap label="TAB" />
            <text fg={theme.textMuted}>agents</text>
            <Keycap label="CTRL+P" />
            <text fg={theme.textMuted}>commands</text>
            <text fg={theme.textMuted}>•</text>
            <text fg={theme.textMuted}>{lsp()} LSP</text>
            <Show when={mcp() > 0}>
              <text fg={theme.textMuted}>•</text>
              <text fg={theme.textMuted}>{mcp()} MCP</text>
            </Show>
            <text fg={theme.textMuted}>ORCA /status</text>
          </Match>
        </Switch>
      </box>
    </box>
  )
}
