/**
 * Registers compact expanded renderers for sub-agent tools (`task`,
 * `agent_spawn`, `delegate`) so child-session activity is visible inline.
 */

import { Component, createEffect, createMemo, For, Show } from "solid-js"
import { ToolRegistry, ToolProps, getToolInfo } from "@kilocode/kilo-ui/message-part"
import { BasicTool } from "@kilocode/kilo-ui/basic-tool"
import { Icon } from "@kilocode/kilo-ui/icon"
import { IconButton } from "@kilocode/kilo-ui/icon-button"
import { useData } from "@kilocode/kilo-ui/context/data"
import { useI18n } from "@kilocode/kilo-ui/context/i18n"
import { createAutoScroll } from "@kilocode/kilo-ui/hooks"
import { useSession } from "../../context/session"
import { useVSCode } from "../../context/vscode"
import { useWorktreeMode } from "../../context/worktree-mode"
import type { ToolPart, Message as SDKMessage } from "@kilocode/sdk/v2"

/** Collect all tool parts from all assistant messages in a given session. */
function getSessionToolParts(store: ReturnType<typeof useData>["store"], sessionId: string): ToolPart[] {
  const messages = (store.message?.[sessionId] as SDKMessage[] | undefined)?.filter((m) => m.role === "assistant")
  if (!messages) return []
  const parts: ToolPart[] = []
  for (const m of messages) {
    const msgParts = store.part?.[m.id]
    if (msgParts) {
      for (const p of msgParts) {
        if (p && p.type === "tool") parts.push(p as ToolPart)
      }
    }
  }
  return parts
}

function getSessionAssistantMessages(store: ReturnType<typeof useData>["store"], sessionId: string): SDKMessage[] {
  const messages = store.message?.[sessionId] as SDKMessage[] | undefined
  if (!messages) return []
  return messages.filter((m) => m.role === "assistant")
}

function countTokens(msg: SDKMessage) {
  if (msg.role !== "assistant" || !msg.tokens) return 0
  return (
    msg.tokens.total ??
    msg.tokens.input + msg.tokens.output + (msg.tokens.reasoning ?? 0) + (msg.tokens.cache?.read ?? 0) + (msg.tokens.cache?.write ?? 0)
  )
}

function formatTokens(count: number) {
  if (count >= 10000) return `${Math.round(count / 1000)}k tok`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k tok`
  return `${count} tok`
}

const TaskToolRenderer: Component<ToolProps> = (props) => {
  const data = useData()
  const i18n = useI18n()
  const session = useSession()
  const vscode = useVSCode()
  const worktreeMode = useWorktreeMode()
  // Hide the open-in-tab button inside the Agent Manager
  const inAgentManager = worktreeMode !== undefined

  const childSessionId = () => props.metadata.sessionId as string | undefined

  const running = createMemo(() => props.status === "pending" || props.status === "running")

  // Warm child session data immediately so completed task tools already have
  // their compact child tool list available when the user expands them.
  createEffect(() => {
    const id = childSessionId()
    if (!id) return
    session.syncSession(id)
  })

  const title = createMemo(() => {
    const input = props.input as Record<string, unknown>
    const metadata = props.metadata as Record<string, unknown>
    const type =
      typeof input.subagent_type === "string"
        ? input.subagent_type
        : typeof input.type === "string"
          ? input.type
          : typeof metadata.subagentType === "string"
            ? metadata.subagentType
            : props.tool
    return i18n.t("ui.tool.agent", { type })
  })

  const description = createMemo(() => {
    const input = props.input as Record<string, unknown>
    const metadata = props.metadata as Record<string, unknown>
    const val = metadata.title ?? input.description ?? input.assignTask ?? input.prompt
    return typeof val === "string" ? val : undefined
  })

  // All tool parts from the child session — the compact summary list
  const childToolParts = createMemo(() => {
    const id = childSessionId()
    if (!id) return []
    return getSessionToolParts(data.store, id)
  })

  const childTodos = createMemo(() => session.sessionTodos(childSessionId()))
  const childTokens = createMemo(() => {
    const id = childSessionId()
    if (!id) return 0
    return getSessionAssistantMessages(data.store, id).reduce((sum, msg) => sum + countTokens(msg), 0)
  })
  const summary = createMemo(() => {
    const items: string[] = []
    if (childToolParts().length > 0) items.push(`${childToolParts().length} tools`)
    if (childTodos().length > 0) items.push(`${childTodos().length} todos`)
    if (childTokens() > 0) items.push(formatTokens(childTokens()))
    return items.join(" · ")
  })

  const autoScroll = createAutoScroll({
    working: running,
    overflowAnchor: "auto",
  })

  const openInTab = (e: MouseEvent) => {
    e.stopPropagation()
    const id = childSessionId()
    if (!id) return
    vscode.postMessage({ type: "openSubAgentViewer", sessionID: id, title: description() })
  }

  const trigger = () => (
    <div data-slot="basic-tool-tool-info-structured">
      <div data-slot="basic-tool-tool-info-main">
        <span data-slot="basic-tool-tool-title" class="capitalize">
          {title()}
        </span>
        <Show when={description() || summary()}>
          <span data-slot="basic-tool-tool-subtitle">
            {description()}
            <Show when={summary()}>
              {description() ? " " : ""}({summary()})
            </Show>
          </span>
        </Show>
      </div>
      <Show when={!inAgentManager && childSessionId()}>
        <IconButton
          icon="square-arrow-top-right"
          size="small"
          variant="ghost"
          aria-label="Open sub-agent in tab"
          onClick={openInTab}
        />
      </Show>
    </div>
  )

  return (
    <div data-component="tool-part-wrapper">
      <BasicTool icon="task" status={props.status} trigger={trigger()} defaultOpen>
        <div ref={autoScroll.scrollRef} onScroll={autoScroll.handleScroll} data-component="tool-output" data-scrollable>
          <div ref={autoScroll.contentRef} data-component="task-tools">
            <For each={childToolParts()}>
              {(item) => {
                const info = createMemo(() => getToolInfo(item.tool, item.state?.input))
                const subtitle = createMemo(() => {
                  if (info().subtitle) return info().subtitle
                  const state = item.state as { status: string; title?: string }
                  if (state.status === "completed" || state.status === "running") {
                    return state.title
                  }
                  return undefined
                })
                return (
                  <div data-slot="task-tool-item">
                    <Icon name={info().icon} size="small" />
                    <span data-slot="task-tool-title">{info().title}</span>
                    <Show when={subtitle()}>
                      <span data-slot="task-tool-subtitle">{subtitle()}</span>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </BasicTool>
    </div>
  )
}

/**
 * Override the upstream sub-agent tool registrations with the compact child-session renderer.
 * Must be called once at app startup.
 */
export function registerExpandedTaskTool() {
  for (const name of ["task", "agent_spawn", "delegate"]) {
    ToolRegistry.register({
      name,
      render: TaskToolRenderer,
    })
  }
}
