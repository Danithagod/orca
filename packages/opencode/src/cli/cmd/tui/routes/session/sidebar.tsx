import { createMemo, For, Show } from "solid-js"
import { TextAttributes } from "@opentui/core"
import path from "path"
import type { AssistantMessage, ToolPart } from "@kilocode/sdk/v2"

import { Installation } from "@/installation"
import { Locale } from "@/util/locale"
import { useSync } from "@tui/context/sync"
import { useTheme } from "../../context/theme"
import { useDirectory } from "../../context/directory"
import { TodoStatus } from "../../component/todo-status"
import { WorkflowActivity } from "../../component/workflow-activity"
import { OrcaDivider, OrcaPanel } from "../../component/orca-ui"
import { isPausedTool, normalizeTodoStatus } from "../../component/activity-state"

const CONTEXT_BAR = 26
const CONTEXT_LINE = 24
const STATE_LABEL = 20
const STATE_VALUE = 10
const META_LABEL = 5
const META_VALUE = 24
const WORKFLOW_TOOLS = new Set(["task", "agent_spawn", "delegate"])

function trim(str: string, len: number) {
  if (str.length <= len) return str
  if (len <= 1) return str.slice(0, len)
  return Locale.truncateMiddle(str, len)
}

function lead(str: string, len: number) {
  const text = Locale.truncate(str, len)
  return text.padEnd(len, " ")
}

function tail(str: string, len: number) {
  const text = trim(str, len)
  if (text.length >= len) return text
  return text.padStart(len, " ")
}

function compact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value)
}

function tokenTotal(msg: AssistantMessage) {
  return (
    msg.tokens.total ??
    msg.tokens.input +
      msg.tokens.output +
      msg.tokens.reasoning +
      (msg.tokens.cache?.read ?? 0) +
      (msg.tokens.cache?.write ?? 0)
  )
}

function ContextBar(props: { percent: number }) {
  const { theme } = useTheme()
  const percent = createMemo(() => Math.max(0, Math.min(100, props.percent)))
  const filled = createMemo(() => {
    if (percent() <= 0) return 0
    return Math.max(1, Math.round((percent() / 100) * CONTEXT_BAR))
  })
  const empty = createMemo(() => Math.max(0, CONTEXT_BAR - filled()))

  return (
    <box flexDirection="row" alignItems="center" gap={1}>
      <text fg={theme.primary} wrapMode="none">
        {Array(filled()).fill("/").join("")}
      </text>
      <Show when={empty() > 0}>
        <text fg={theme.borderSubtle} wrapMode="none">
          {Array(empty()).fill("/").join("")}
        </text>
      </Show>
      <text fg={theme.textMuted} wrapMode="none">
        {percent()}%
      </text>
    </box>
  )
}

function Metric(props: { label: string; detail: string; percent: number; tone?: "default" | "success" }) {
  const { theme } = useTheme()
  const lineColor = createMemo(() => {
    if (props.tone === "success") return theme.success
    return theme.text
  })
  const line = createMemo(() => `${props.label}: ${trim(props.detail, CONTEXT_LINE)}`)

  return (
    <box flexDirection="column" gap={0} flexShrink={0}>
      <box minHeight={1} flexShrink={0}>
        <text fg={lineColor()} wrapMode="none">
          {line()}
        </text>
      </box>
      <box minHeight={1} flexShrink={0}>
        <ContextBar percent={props.percent} />
      </box>
    </box>
  )
}

function InfoRow(props: { icon: string; label: string; value: string; tone?: "default" | "success" | "warning" }) {
  const { theme } = useTheme()
  const fg = createMemo(() => {
    if (props.tone === "success") return theme.success
    if (props.tone === "warning") return theme.warning
    return theme.text
  })

  return (
    <box flexDirection="row" alignItems="center" gap={1}>
      <text fg={theme.primary} wrapMode="none" width={2}>
        {lead(props.icon, 2)}
      </text>
      <text fg={theme.textMuted} wrapMode="none" width={STATE_LABEL}>
        {lead(trim(props.label, STATE_LABEL), STATE_LABEL)}
      </text>
      <box flexGrow={1} minWidth={1} />
      <text fg={fg()} wrapMode="none" width={STATE_VALUE}>
        {tail(props.value, STATE_VALUE)}
      </text>
    </box>
  )
}

function MetaRow(props: { label: string; value: string; accent?: boolean; valueAccent?: boolean }) {
  const { theme } = useTheme()
  return (
    <box flexDirection="row" alignItems="center" gap={1}>
      <text
        fg={props.accent ? theme.primary : theme.textMuted}
        attributes={props.accent ? TextAttributes.BOLD : undefined}
        wrapMode="none"
        width={META_LABEL}
      >
        {lead(props.label, META_LABEL)}
      </text>
      <text
        fg={props.valueAccent ? theme.primary : theme.textMuted}
        attributes={props.valueAccent ? TextAttributes.BOLD : undefined}
        wrapMode="none"
        width={META_VALUE}
      >
        {trim(props.value, META_VALUE)}
      </text>
    </box>
  )
}

function DiffRow(props: { file: string; additions: number; deletions: number }) {
  const { theme } = useTheme()

  return (
    <box flexDirection="row" alignItems="center" gap={1}>
      <text fg={theme.primary} wrapMode="none" width={2}>
        {lead("~", 2)}
      </text>
      <text fg={theme.textMuted} wrapMode="none" width={STATE_LABEL}>
        {lead(trim(props.file, STATE_LABEL), STATE_LABEL)}
      </text>
      <box flexGrow={1} minWidth={1} />
      <box flexDirection="row" alignItems="center" gap={1} width={STATE_VALUE} justifyContent="flex-end">
        <text fg={theme.success} wrapMode="none" attributes={TextAttributes.BOLD}>
          {`+${props.additions}`}
        </text>
        <text fg={theme.error} wrapMode="none" attributes={TextAttributes.BOLD}>
          {`-${props.deletions}`}
        </text>
      </box>
    </box>
  )
}

function TodoRow(props: { status: string; label: string }) {
  const { theme } = useTheme()
  const fg = createMemo(() => {
    if (props.status === "completed") return theme.success
    if (props.status === "in_progress") return theme.warning
    if (props.status === "paused") return theme.warning
    if (props.status === "failed") return theme.error
    return theme.textMuted
  })

  return (
    <box flexDirection="row" alignItems="center" gap={1}>
      <text fg={fg()} wrapMode="none" width={STATE_LABEL}>
        {lead(trim(props.label, STATE_LABEL), STATE_LABEL)}
      </text>
      <box flexGrow={1} minWidth={1} />
      <box flexDirection="row" width={STATE_VALUE}>
        <box flexGrow={1} minWidth={1} />
        <TodoStatus status={props.status} compact />
      </box>
    </box>
  )
}

function isWorkflowTool(part: unknown): part is ToolPart {
  if (!part || typeof part !== "object") return false
  if (!("type" in part) || !("tool" in part)) return false
  return (part as ToolPart).type === "tool" && WORKFLOW_TOOLS.has((part as ToolPart).tool)
}

function workflowLabel(part: ToolPart) {
  if ("title" in part.state && typeof part.state.title === "string" && part.state.title.trim()) return part.state.title.trim()
  if (part.tool === "task" && typeof part.state.input.description === "string") return part.state.input.description
  if (part.tool === "agent_spawn" && typeof part.state.input.assignTask === "string" && part.state.input.assignTask.trim())
    return part.state.input.assignTask
  if (part.tool === "delegate" && typeof part.state.input.prompt === "string" && part.state.input.prompt.trim())
    return part.state.input.prompt
  return Locale.titlecase(part.tool.replaceAll("_", " "))
}

function workflowStatus(part: ToolPart) {
  if (part.state.status === "running") return "in_progress"
  if (isPausedTool(part)) return "paused"
  if (part.state.status === "completed") return "completed"
  if (part.state.status === "error") return "failed"
  return "pending"
}

type WorkflowItem = {
  status: string
  label: string
}

function workflowKey(label: string) {
  return label.trim().toLowerCase()
}

export function Sidebar(props: { sessionID: string; overlay?: boolean }) {
  const sync = useSync()
  const { theme } = useTheme()
  const session = createMemo(() => sync.session.get(props.sessionID)!)
  const todo = createMemo(() => sync.data.todo[props.sessionID] ?? [])
  const diff = createMemo(() => sync.data.session_diff[props.sessionID] ?? [])
  const messages = createMemo(() => sync.data.message[props.sessionID] ?? [])
  const directory = useDirectory()
  const last = createMemo(() => {
    return messages().findLast((item) => item.role === "assistant" && tokenTotal(item as AssistantMessage) > 0) as
      | AssistantMessage
      | undefined
  })

  const usage = createMemo(() => {
    const totalCost = messages().reduce((sum, x) => sum + (x.role === "assistant" ? x.cost : 0), 0)
    const item = last()
    if (!item) {
      return {
        tokens: 0,
        contextLimit: 0,
        promptLimit: 0,
        tokenPercent: 0,
        usagePercent: 0,
        cost: totalCost,
        maxCost: 0,
        costPercent: 0,
      }
    }

    const total = tokenTotal(item)
    const used = item.tokens.input + (item.tokens.cache?.read ?? 0)
    const model = sync.data.provider.find((x) => x.id === item.providerID)?.models[item.modelID]
    const contextLimit = model?.limit.context ?? 0
    const promptLimit = Math.min(model?.limit.input ?? contextLimit, contextLimit)
    const outputLimit = model?.limit.output ?? 0
    const rates = model?.cost.experimentalOver200K && promptLimit > 200_000 ? model.cost.experimentalOver200K : model?.cost
    const maxCost = rates ? (promptLimit * rates.input + outputLimit * rates.output) / 1_000_000 : 0

    return {
      tokens: total,
      contextLimit,
      promptLimit,
      tokenPercent: contextLimit ? Math.round((total / contextLimit) * 100) : 0,
      usagePercent: contextLimit ? Math.round((used / contextLimit) * 100) : 0,
      cost: totalCost,
      maxCost,
      costPercent: maxCost ? Math.round((totalCost / maxCost) * 100) : 0,
    }
  })

  const cost = createMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(usage().cost)
  })
  const tokensDetail = createMemo(() => {
    if (!usage().contextLimit) return `${compact(usage().tokens)} total`
    return `${compact(usage().tokens)} of ${compact(usage().contextLimit)} context`
  })
  const usageDetail = createMemo(() => {
    if (!usage().promptLimit) return "context window"
    return `${compact(usage().promptLimit)} prompt max`
  })
  const costDetail = createMemo(() => {
    if (!usage().maxCost) return cost()
    return `${cost()} spent`
  })

  const lsp = createMemo(() => sync.data.lsp)
  const activeLsp = createMemo(() => lsp().filter((item) => item.status === "connected"))
  const lspTitle = createMemo(() => {
    if (activeLsp().length === 0) return "No active servers"
    return activeLsp()
      .map((item) => {
        const value = item.id.replace(/-language-server$/i, "")
        if (value === "typescript") return "ts"
        return trim(value, 10)
      })
      .join(", ")
  })
  const pendingTodo = createMemo(() => todo().filter((item) => item.status !== "completed"))
  const diffPreview = createMemo(() => diff().slice(0, 4))
  const workflowMsg = createMemo(() => {
    return messages().findLast((item) => {
      if (item.role !== "assistant") return false
      const parts = sync.data.part[item.id] ?? []
      return parts.some(isWorkflowTool)
    }) as AssistantMessage | undefined
  })
  const workflow = createMemo(() => {
    const msg = workflowMsg()
    if (!msg) return [] as WorkflowItem[]
    const parts = (sync.data.part[msg.id] ?? []).filter(isWorkflowTool)
    if (parts.length === 0) return [] as WorkflowItem[]
    return parts.slice(-8).map((part) => ({
      status: workflowStatus(part),
      label: workflowLabel(part),
    }))
  })
  const todoRows = createMemo(() => todo().map((item) => ({ status: item.status, label: item.content })))
  const active = createMemo(() => {
    const status = sync.session.status(props.sessionID)
    return status === "working" || status === "compacting"
  })
  const rows = createMemo(() => {
    const seen = new Set<string>()
    const out = [] as WorkflowItem[]

    for (const item of todoRows()) {
      const key = workflowKey(item.label)
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        ...item,
        status: normalizeTodoStatus(item.status, active()),
      })
    }

    for (const item of workflow()) {
      const key = workflowKey(item.label)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(item)
    }

    return out
  })
  const working = createMemo(() => {
    const status = sync.session.status(props.sessionID)
    return status === "working" || status === "compacting"
  })
  const workflowPercent = createMemo(() => {
    const total = rows().length
    if (total === 0) return 0
    const done = rows().filter((item) => item.status === "completed").length
    return (done / total) * 100
  })
  const workflowBadge = createMemo(() => {
    const open = rows().filter((item) => item.status !== "completed").length
    const paused = rows().filter((item) => item.status === "paused").length
    if (open > 0 && working()) {
      return {
        state: "active" as const,
        animate: true,
      }
    }
    if (paused > 0) {
      return {
        state: "paused" as const,
        animate: false,
      }
    }
    if (open > 0) {
      return {
        state: "pending" as const,
        animate: false,
      }
    }
    return {
      state: "idle" as const,
      animate: false,
    }
  })
  const model = createMemo(() => {
    const item = last()
    if (!item) return "waiting"
    return item.modelID
  })
  const branch = createMemo(() => sync.data.vcs?.branch ?? "detached")
  const dir = createMemo(() => {
    const value = directory()
    const current = sync.data.vcs?.branch
    const base = path.basename(current ? value.replace(`:${current}`, "") : value)
    return current ? `${base}:${current}` : base
  })

  return (
    <Show when={session()}>
      <box paddingTop={1} paddingRight={2} paddingBottom={1} width={44} height="100%">
        <box flexDirection="column" gap={0} height="100%">
          <OrcaPanel title="CONTEXT" titleRight="ORCA" bgColor="panel" variant="card" padding={1} height={13}>
            <box flexDirection="column" gap={1}>
              <Metric label="Tokens" detail={tokensDetail()} percent={usage().tokenPercent} />
              <Metric label="Usage" detail={usageDetail()} percent={usage().usagePercent} />
              <Metric label="Cost" detail={costDetail()} percent={usage().costPercent} tone="success" />
            </box>
          </OrcaPanel>

          <OrcaPanel bgColor="panel" variant="card" padding={1}>
            <box flexDirection="row" alignItems="center" gap={1}>
              <box flexDirection="row" alignItems="center" gap={1} minWidth={1} flexGrow={1} flexShrink={1}>
                <text fg={theme.primary} attributes={TextAttributes.BOLD} wrapMode="none">
                  LSP
                </text>
                <text fg={activeLsp().length > 0 ? theme.success : theme.textMuted} wrapMode="none">
                  •
                </text>
                <text
                  fg={activeLsp().length > 0 ? theme.text : theme.textMuted}
                  wrapMode="none"
                  minWidth={1}
                  flexGrow={1}
                >
                  {lspTitle()}
                </text>
              </box>
              <Show when={activeLsp().length > 0}>
                <text fg={theme.success} wrapMode="none" flexShrink={0}>
                  {`${activeLsp().length} live`}
                </text>
              </Show>
            </box>
          </OrcaPanel>

          <box flexGrow={1} height="100%">
            <OrcaPanel
              title="WORKFLOW"
              bgColor="panel"
              variant="card"
              padding={0}
              height="100%"
            >
              <box flexDirection="column" flexGrow={1} height="100%">
                <box flexDirection="column" flexGrow={1} gap={0} paddingTop={1} paddingLeft={1} paddingRight={1}>
                  <Show
                    when={rows().length > 0}
                    fallback={
                      <text fg={theme.textMuted} wrapMode="word">
                        No workflow yet. Delegated tasks and todos will appear here.
                      </text>
                    }
                  >
                    <box flexDirection="column" gap={0}>
                      <For each={rows()}>
                        {(item) => (
                          <TodoRow status={item.status} label={item.label} />
                        )}
                      </For>
                    </box>
                  </Show>

                  <Show when={diffPreview().length > 0}>
                    <box flexDirection="column" gap={0}>
                      <OrcaDivider title="CHANGES" />
                      <For each={diffPreview()}>
                        {(item) => {
                          const file = path.basename(item.file)
                          return <DiffRow file={file} additions={item.additions ?? 0} deletions={item.deletions ?? 0} />
                        }}
                      </For>
                    </box>
                  </Show>

                  <box flexGrow={1} />
                </box>
                <WorkflowActivity
                  state={workflowBadge().state}
                  percent={workflowPercent()}
                  animate={workflowBadge().animate}
                />
              </box>
            </OrcaPanel>
          </box>

          <OrcaPanel bgColor="panel" variant="card" padding={1} footer="ORCA /status">
            <box flexDirection="column" gap={0}>
              <MetaRow label="DIR" value={dir()} />
              <MetaRow label="BRCH" value={branch()} />
              <MetaRow label="MODL" value={model()} />
              <MetaRow label="TODO" value={`${pendingTodo().length} pending`} />
              <MetaRow label="DIFF" value={`${diff().length} changes`} />
              <MetaRow label="VER" value={`v${Installation.VERSION}`} accent={true} valueAccent={true} />
            </box>
          </OrcaPanel>
        </box>
      </box>
    </Show>
  )
}
