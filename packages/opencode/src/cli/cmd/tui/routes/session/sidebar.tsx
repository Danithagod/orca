import { useSync } from "@tui/context/sync"
import { createMemo, For, Show, Switch, Match, createSignal, onMount, onCleanup } from "solid-js"
import { createStore } from "solid-js/store"
import { useTheme } from "../../context/theme"
import { Locale } from "@/util/locale"
import path from "path"
import type { AssistantMessage } from "@kilocode/sdk/v2"
import { Global } from "@/global"
import { Installation } from "@/installation"
import { useKeybind } from "../../context/keybind"
import { useDirectory } from "../../context/directory"
import { useKV } from "../../context/kv"
import { TodoItem } from "../../component/todo-item"
import { OrcaDivider, OrcaPanel, OrcaStatusBadge } from "../../component/orca-ui"
import { OrcaBorder } from "../../component/border"
import { MemoryEngine } from "@/orca/memory"
import { Orchestrator } from "@/orca/orchestrator"
import { Instance } from "@/project/instance"
import { TextAttributes } from "@opentui/core"
import { OrcaMiniLogo } from "../../component/orca-logo"
import { File } from "@/file"

export function Sidebar(props: { sessionID: string; overlay?: boolean }) {
  const sync = useSync()
  const { theme } = useTheme()
  const session = createMemo(() => sync.session.get(props.sessionID)!)
  const diff = createMemo(() => sync.data.session_diff[props.sessionID] ?? [])
  const todo = createMemo(() => sync.data.todo[props.sessionID] ?? [])
  const messages = createMemo(() => sync.data.message[props.sessionID] ?? [])

  const [memoryCount, setMemoryCount] = createSignal(0)
  const [agentCount, setAgentCount] = createSignal(0)
  const [memoryCategories, setMemoryCategories] = createSignal<{ category: string; count: number }[]>([])
  const [agents, setAgents] = createSignal<{ type: string; status: string }[]>([])
  const [projectStatus, setProjectStatus] = createSignal<File.Info[]>([])

  onMount(async () => {
    try {
      const projectPath = Instance.directory
      await MemoryEngine.init({ projectPath })
      await Orchestrator.init({ projectPath })

      const memories = await MemoryEngine.list({ limit: 100, offset: 0, sortBy: "updatedAt", sortOrder: "desc" })
      setMemoryCount(memories.total)

      const categories = new Map<string, number>()
      for (const m of memories.items) {
        categories.set(m.category, (categories.get(m.category) ?? 0) + 1)
      }
      setMemoryCategories(Array.from(categories.entries()).map(([category, count]) => ({ category, count })))

      const agentList = await Orchestrator.getAgents({})
      setAgentCount(agentList.length)
      setAgents(agentList.map((a) => ({ type: a.type, status: a.status })))
    } catch (err) {
      // Memory/Orchestrator not initialized yet
    }

    // Fetch initial project status
    File.status().then(setProjectStatus)

    // Poll for project status changes every 5 seconds
    const interval = setInterval(() => {
      File.status().then(setProjectStatus)
    }, 5000)

    onCleanup(() => clearInterval(interval))
  })

  const [expanded, setExpanded] = createStore({
    mcp: true,
    diff: true,
    todo: true,
    lsp: true,
    project: true,
  })

  // Sort MCP servers alphabetically for consistent display order
  const mcpEntries = createMemo(() => Object.entries(sync.data.mcp).sort(([a], [b]) => a[0].localeCompare(b[0])))

  // Count connected and error MCP servers for collapsed header display
  const connectedMcpCount = createMemo(() => mcpEntries().filter(([_, item]) => item.status === "connected").length)
  const errorMcpCount = createMemo(
    () =>
      mcpEntries().filter(
        ([_, item]) =>
          item.status === "failed" || item.status === "needs_auth" || item.status === "needs_client_registration",
      ).length,
  )

  const cost = createMemo(() => {
    const total = messages().reduce((sum, x) => sum + (x.role === "assistant" ? x.cost : 0), 0)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(total)
  })

  const context = createMemo(() => {
    const last = messages().findLast((x) => x.role === "assistant" && x.tokens.output > 0) as AssistantMessage
    if (!last) return
    const total =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    const model = sync.data.provider.find((x) => x.id === last.providerID)?.models[last.modelID]
    return {
      tokens: total.toLocaleString(),
      percentage: model?.limit.context ? Math.round((total / model.limit.context) * 100) : null,
    }
  })

  const directory = useDirectory()
  const kv = useKV()

  const hasProviders = createMemo(() =>
    // kilocode_change - exclude "kilo" (anonymous autoload) alongside "opencode"
    sync.data.provider.some(
      (x) => (x.id !== "opencode" && x.id !== "kilo") || Object.values(x.models).some((y) => y.cost?.input !== 0),
    ),
  )
  const gettingStartedDismissed = createMemo(() => kv.get("dismissed_getting_started", false))

  const CollapsibleDivider = (props: {
    title: string
    expanded: boolean
    onToggle: () => void
    count?: number
    activeCount?: number
  }) => (
    <box onMouseDown={props.onToggle} width="100%">
      <OrcaDivider title={
        `${props.expanded ? "▼" : "▶"} ${props.title}${
          !props.expanded && props.count ? ` (${props.count})` : ""
        }${
          !props.expanded && props.activeCount ? ` (${props.activeCount})` : ""
        }`
      } />
    </box>
  )

  return (
    <Show when={session()}>
      <OrcaPanel width={42} height="100%" padding={1} borderStyle="rounded" borderColor={theme.accent}>
        <scrollbox
          flexGrow={1}
          verticalScrollbarOptions={{
            trackOptions: {
              backgroundColor: theme.background,
              foregroundColor: theme.borderActive,
            },
          }}
        >
          <box flexShrink={0} gap={0} paddingRight={1}>
            <box alignItems="center" marginBottom={0.5}>
              <OrcaMiniLogo />
            </box>

            <box paddingRight={1} paddingBottom={0.5}>
              <text fg={theme.textMuted} wrapMode="word">
                {session().title}
              </text>
              <Show when={session().share?.url}>
                <text fg={theme.textMuted} marginTop={0.25}>{session().share!.url}</text>
              </Show>
            </box>

            <OrcaDivider title="Context" />

            <box paddingLeft={1} paddingRight={1}>
              <box flexDirection="row" justifyContent="space-between">
                <text fg={theme.textMuted}>Tokens</text>
                <text fg={theme.text}>{context()?.tokens ?? 0}</text>
              </box>
              <box flexDirection="row" justifyContent="space-between">
                <text fg={theme.textMuted}>Usage</text>
                <text fg={theme.text}>{context()?.percentage ?? 0}%</text>
              </box>
              <box flexDirection="row" justifyContent="space-between">
                <text fg={theme.textMuted}>Cost</text>
                <text fg={theme.success}>{cost()}</text>
              </box>
            </box>

            <Show when={mcpEntries().length > 0}>
              <CollapsibleDivider
                title="MCP"
                expanded={expanded.mcp}
                onToggle={() => mcpEntries().length > 2 && setExpanded("mcp", !expanded.mcp)}
                activeCount={connectedMcpCount()}
              />
              <Show when={mcpEntries().length <= 2 || expanded.mcp}>
                <box paddingLeft={1} paddingRight={1}>
                  <For each={mcpEntries()}>
                    {([key, item]) => (
                      <box flexDirection="row" gap={1}>
                        <OrcaStatusBadge
                          status={
                            item.status === "connected" ? "success" : item.status === "failed" ? "error" : "idle"
                          }
                          label={key}
                        />
                        <box flexGrow={1} />
                        <Show when={item.status !== "connected"}>
                          <text fg={theme.textMuted} wrapMode="none">
                            <Switch fallback={item.status}>
                              <Match when={item.status === "failed" && item}>
                                {(val) => <i>{val().error.slice(0, 10)}...</i>}
                              </Match>
                              <Match when={item.status === "disabled"}>Off</Match>
                              <Match when={(item.status as string) === "needs_auth"}>Auth</Match>
                            </Switch>
                          </text>
                        </Show>
                      </box>
                    )}
                  </For>
                </box>
              </Show>
            </Show>

            <CollapsibleDivider
              title="LSP"
              expanded={expanded.lsp}
              onToggle={() => sync.data.lsp.length > 2 && setExpanded("lsp", !expanded.lsp)}
              count={sync.data.lsp.length}
            />
            <Show when={sync.data.lsp.length <= 2 || expanded.lsp}>
              <box paddingLeft={1} paddingRight={1}>
                <Show when={sync.data.lsp.length === 0}>
                  <text fg={theme.textMuted} wrapMode="word">
                    {sync.data.config.lsp === false ? "Disabled" : "Pending..."}
                  </text>
                </Show>
                <For each={sync.data.lsp}>
                  {(item) => (
                    <box flexDirection="row" gap={1}>
                      <OrcaStatusBadge status={item.status === "connected" ? "success" : "error"} label={item.id} />
                    </box>
                  )}
                </For>
              </box>
            </Show>

            <Show when={todo().length > 0 && todo().some((t) => t.status !== "completed")}>
              <CollapsibleDivider
                title="Todo"
                expanded={expanded.todo}
                onToggle={() => todo().length > 2 && setExpanded("todo", !expanded.todo)}
                count={todo().filter((t) => t.status !== "completed").length}
              />
              <Show when={todo().length <= 2 || expanded.todo}>
                <box paddingLeft={1} paddingRight={1}>
                  <For each={todo()}>{(todo) => <TodoItem status={todo.status} content={todo.content} />}</For>
                </box>
              </Show>
            </Show>

            <Show when={memoryCount() > 0}>
              <OrcaDivider title="Memory" />
              <box paddingLeft={1} paddingRight={1}>
                <box flexDirection="row" justifyContent="space-between">
                  <text fg={theme.textMuted}>Total</text>
                  <text fg={theme.accent}>{memoryCount()}</text>
                </box>
                <For each={memoryCategories().slice(0, 4)}>
                  {(item) => (
                    <box flexDirection="row" justifyContent="space-between">
                      <text fg={theme.textMuted}>{item.category}</text>
                      <text fg={theme.text}>{item.count}</text>
                    </box>
                  )}
                </For>
              </box>
            </Show>

            <Show when={agentCount() > 0}>
              <OrcaDivider title="Agents" />
              <box paddingLeft={1} paddingRight={1}>
                <For each={agents()}>
                  {(agent) => (
                    <box flexDirection="row" gap={1}>
                      <OrcaStatusBadge status={agent.status === "active" ? "active" : "idle"} label={agent.type} />
                    </box>
                  )}
                </For>
              </box>
            </Show>

            <Show when={diff().length > 0}>
              <CollapsibleDivider
                title="Session Changes"
                expanded={expanded.diff}
                onToggle={() => diff().length > 2 && setExpanded("diff", !expanded.diff)}
                count={diff().length}
              />
              <Show when={diff().length <= 2 || expanded.diff}>
                <box paddingLeft={1} paddingRight={1}>
                  <For each={diff() || []}>
                    {(item) => {
                      return (
                        <box flexDirection="row" gap={1} justifyContent="space-between">
                          <text fg={theme.textMuted} wrapMode="none">
                            {path.basename(item.file)}
                          </text>
                          <box flexDirection="row" gap={1} flexShrink={0}>
                            <Show when={item.additions}>
                              <text fg={theme.success}>+{item.additions}</text>
                            </Show>
                            <Show when={item.deletions}>
                              <text fg={theme.error}>-{item.deletions}</text>
                            </Show>
                          </box>
                        </box>
                      )
                    }}
                  </For>
                </box>
              </Show>
            </Show>

            <Show when={projectStatus().length > 0}>
              <CollapsibleDivider
                title="Modified Files"
                expanded={expanded.project}
                onToggle={() => projectStatus().length > 2 && setExpanded("project", !expanded.project)}
                count={projectStatus().length}
              />
              <Show when={projectStatus().length <= 2 || expanded.project}>
                <box paddingLeft={1} paddingRight={1}>
                  <For each={projectStatus()}>
                    {(item) => {
                      return (
                        <box flexDirection="row" gap={1} justifyContent="space-between">
                          <text fg={theme.textMuted} wrapMode="none">
                            {path.basename(item.path)}
                          </text>
                          <box flexDirection="row" gap={1} flexShrink={0}>
                            <Show when={item.status === "added"}>
                              <text fg={theme.success}>A</text>
                            </Show>
                            <Show when={item.status === "modified"}>
                              <text fg={theme.accent}>M</text>
                            </Show>
                            <Show when={item.status === "deleted"}>
                              <text fg={theme.error}>D</text>
                            </Show>
                          </box>
                        </box>
                      )
                    }}
                  </For>
                </box>
              </Show>
            </Show>
          </box>
        </scrollbox>

        <box flexShrink={0} gap={0} paddingTop={0.5}>
          <Show when={!hasProviders() && !gettingStartedDismissed()}>
            <box
              backgroundColor={theme.backgroundElement}
              padding={1}
              gap={1}
              marginBottom={0.5}
              border={["top", "bottom", "left", "right"]}
              borderColor={theme.accent}
              customBorderChars={OrcaBorder.rounded}
            >
              <box flexDirection="row" justifyContent="space-between">
                <text fg={theme.accent} attributes={TextAttributes.BOLD}>
                  Welcome
                </text>
                <text fg={theme.textMuted} onMouseDown={() => kv.set("dismissed_getting_started", true)}>
                  ✕
                </text>
              </box>
              <text fg={theme.textMuted} wrapMode="word">
                Free models available. Run /connect to add more.
              </text>
            </box>
          </Show>

          <box flexDirection="row" gap={1}>
            <text fg={theme.textMuted} width={4}>
              DIR
            </text>
            <text fg={theme.text} wrapMode="none">
              {path.basename(directory())}
            </text>
          </box>

          <box flexDirection="row" gap={1}>
            <text fg={theme.accent} attributes={TextAttributes.BOLD} width={4}>
              ORCA
            </text>
            <text fg={theme.textMuted}>v{Installation.VERSION}</text>
          </box>
        </box>
      </OrcaPanel>
    </Show>
  )
}
