import { createMemo, Match, onCleanup, onMount, Show, Switch } from "solid-js"
import { useTheme } from "../../context/theme"
import { useSync } from "../../context/sync"
import { useDirectory } from "../../context/directory"
import { useConnected } from "../../component/dialog-model"
import { createStore } from "solid-js/store"
import { useRoute } from "../../context/route"

export function Footer() {
  const { theme } = useTheme()
  const sync = useSync()
  const route = useRoute()
  const mcp = createMemo(() => Object.values(sync.data.mcp).filter((x) => x.status === "connected").length)
  const mcpError = createMemo(() => Object.values(sync.data.mcp).some((x) => x.status === "failed"))
  const lsp = createMemo(() => Object.keys(sync.data.lsp))
  const permissions = createMemo(() => {
    if (route.data.type !== "session") return []
    return sync.data.permission[route.data.sessionID] ?? []
  })
  const directory = useDirectory()
  const connected = useConnected()

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

      if (store.welcome) {
        setStore("welcome", false)
        timeouts.push(setTimeout(() => tick(), 10_000))
        return
      }
    }
    timeouts.push(setTimeout(() => tick(), 10_000))

    onCleanup(() => {
      timeouts.forEach(clearTimeout)
    })
  })

  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      gap={1}
      flexShrink={0}
      backgroundColor={theme.primary}
      paddingLeft={1}
      paddingRight={1}
      width="100%"
    >
      <box flexDirection="row" gap={1}>
        <text fg={theme.background} attributes={1}>Orca</text>
        <text fg={theme.background} attributes={2}>│</text>
        <text fg={theme.background} attributes={2}>{directory()}</text>
      </box>
      <box gap={2} flexDirection="row" flexShrink={0}>
        <Switch>
          <Match when={store.welcome}>
            <text fg={theme.background} attributes={2}>
              Get started <span style={{ fg: theme.background, opacity: 0.7 }}>/connect</span>
            </text>
          </Match>
          <Match when={connected()}>
            <Show when={permissions().length > 0}>
              <text fg={theme.background} attributes={1}>
                △ {permissions().length} Permission{permissions().length > 1 ? "s" : ""}
              </text>
            </Show>
            <text fg={theme.background} attributes={1 | 2}> {/* BOLD | ITALIC */}
              TAB <span style={{ italic: true, bold: false }}>AGENTS</span>
            </text>
            <text fg={theme.background} attributes={1 | 2}>
              CTRL+P <span style={{ italic: true, bold: false }}>COMMANDS</span>
            </text>
            <text fg={theme.background}>
              <span style={{ fg: theme.background }}>●</span> {lsp().length} LSP
            </text>
            <Show when={mcp()}>
              <text fg={theme.background}>
                <span style={{ fg: lsp().length > 0 ? theme.background : theme.background, opacity: 0.7 }}>◉ </span>
                {mcp()} MCP
              </text>
            </Show>
            <text fg={theme.background} attributes={2}>/status</text>
          </Match>
        </Switch>
      </box>
    </box>
  )
}
