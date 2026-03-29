/**
 * AssistantMessage component
 * Renders assistant parts with compact context grouping for read/glob/grep/list
 * while keeping the VS Code-specific todo and dock behavior.
 */

import { Component, For, Show, createMemo, createSignal } from "solid-js"
import { Dynamic } from "solid-js/web"
import { Collapsible } from "@kilocode/kilo-ui/collapsible"
import { Part, PART_MAPPING, ToolRegistry } from "@kilocode/kilo-ui/message-part"
import { useI18n } from "@kilocode/kilo-ui/context/i18n"
import type {
  AssistantMessage as SDKAssistantMessage,
  Part as SDKPart,
  Message as SDKMessage,
  ToolPart,
} from "@kilocode/sdk/v2"
import { useData } from "@kilocode/kilo-ui/context/data"
import { groupAssistantParts, summarizeContextParts, type AssistantGroup } from "./assistant-message-context"

// Tools that the upstream message-part renderer suppresses (returns null for).
// We render these ourselves via ToolRegistry when they complete,
// so the user can see what the AI set up.
export const UPSTREAM_SUPPRESSED_TOOLS = new Set(["todowrite", "todoread"])

function isRenderable(part: SDKPart): boolean {
  if (part.type === "tool") {
    const tool = (part as SDKPart & { tool: string }).tool
    const state = (part as SDKPart & { state: { status: string } }).state
    if (UPSTREAM_SUPPRESSED_TOOLS.has(tool)) {
      // Show todo parts only when completed (permissions are now in the dock)
      return state.status === "completed"
    }
    if (tool === "question" && (state.status === "pending" || state.status === "running")) return false
    return true
  }
  if (part.type === "text") return !!(part as SDKPart & { text: string }).text?.trim()
  if (part.type === "reasoning") return !!(part as SDKPart & { text: string }).text?.trim()
  return !!PART_MAPPING[part.type]
}

interface AssistantMessageProps {
  message: SDKAssistantMessage
  showAssistantCopyPartID?: string | null
}

function TodoToolCard(props: { part: ToolPart }) {
  const render = ToolRegistry.render(props.part.tool)
  const state = props.part.state
  const metadata = createMemo(() => {
    if (state.status === "running") return state.metadata ?? {}
    if (state.status === "completed") return state.metadata ?? {}
    if (state.status === "error") return state.metadata ?? {}
    return {}
  })
  const output = createMemo(() => {
    if (state.status === "completed") return state.output
    return undefined
  })
  return (
    <Show when={render}>
      {(renderFn) => (
        <Dynamic
          component={renderFn()}
          input={state?.input ?? {}}
          metadata={metadata()}
          tool={props.part.tool}
          output={output()}
          status={state?.status}
          defaultOpen
        />
      )}
    </Show>
  )
}

function contextToolTrigger(part: ToolPart, t: (key: string) => string) {
  const input = (part.state.input ?? {}) as Record<string, unknown>
  const path = typeof input.path === "string" ? input.path : "/"
  const filePath = typeof input.filePath === "string" ? input.filePath : ""
  const pattern = typeof input.pattern === "string" ? input.pattern : undefined
  const include = typeof input.include === "string" ? input.include : undefined
  const offset = typeof input.offset === "number" ? input.offset : undefined
  const limit = typeof input.limit === "number" ? input.limit : undefined

  if (part.tool === "read") {
    const args: string[] = []
    if (offset !== undefined) args.push("offset=" + offset)
    if (limit !== undefined) args.push("limit=" + limit)
    return {
      title: t("ui.tool.read"),
      subtitle: filePath,
      args,
    }
  }

  if (part.tool === "list") {
    return {
      title: t("ui.tool.list"),
      subtitle: path,
      args: [] as string[],
    }
  }

  if (part.tool === "glob") {
    return {
      title: t("ui.tool.glob"),
      subtitle: path,
      args: pattern ? ["pattern=" + pattern] : [],
    }
  }

  const args: string[] = []
  if (pattern) args.push("pattern=" + pattern)
  if (include) args.push("include=" + include)
  return {
    title: t("ui.tool.grep"),
    subtitle: path,
    args,
  }
}

function contextSummary(
  count: ReturnType<typeof summarizeContextParts>,
  t: ReturnType<typeof useI18n>["t"],
) {
  const items: string[] = []
  if (count.read) {
    items.push(
      t(count.read === 1 ? "ui.messagePart.context.read.one" : "ui.messagePart.context.read.other", {
        count: count.read,
      }),
    )
  }
  if (count.search) {
    items.push(
      t(count.search === 1 ? "ui.messagePart.context.search.one" : "ui.messagePart.context.search.other", {
        count: count.search,
      }),
    )
  }
  if (count.list) {
    items.push(
      t(count.list === 1 ? "ui.messagePart.context.list.one" : "ui.messagePart.context.list.other", {
        count: count.list,
      }),
    )
  }
  return items.join(" • ")
}

function ContextToolGroup(props: { parts: ToolPart[] }) {
  const i18n = useI18n()
  const [open, setOpen] = createSignal(false)
  const pending = createMemo(() =>
    props.parts.some((part) => part.state.status === "pending" || part.state.status === "running"),
  )
  const summary = createMemo(() => summarizeContextParts(props.parts))
  const title = createMemo(() =>
    pending() ? i18n.t("ui.sessionTurn.status.gatheringContext") : i18n.t("ui.sessionTurn.status.gatheredContext"),
  )
  const label = createMemo(() => contextSummary(summary(), i18n.t))

  return (
    <div data-component="tool-part-wrapper" data-part-type="tool">
      <Collapsible open={open()} onOpenChange={setOpen} variant="ghost">
        <Collapsible.Trigger>
          <div data-component="context-tool-group-trigger">
            <span
              data-slot="context-tool-group-title"
              class="min-w-0 flex items-center gap-2 text-14-medium text-text-strong"
            >
              <span data-slot="context-tool-group-label" class="shrink-0">
                {title()}
              </span>
              <span
                data-slot="context-tool-group-summary"
                class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-normal text-text-base"
              >
                {label()}
              </span>
            </span>
            <Collapsible.Arrow />
          </div>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div data-component="context-tool-group-list">
            <For each={props.parts}>
              {(part) => {
                const trigger = createMemo(() => contextToolTrigger(part, i18n.t))
                const running = createMemo(() => part.state.status === "pending" || part.state.status === "running")
                return (
                  <div data-slot="context-tool-group-item">
                    <div data-component="tool-trigger">
                      <div data-slot="basic-tool-tool-trigger-content">
                        <div data-slot="basic-tool-tool-info">
                          <div data-slot="basic-tool-tool-info-structured">
                            <div data-slot="basic-tool-tool-info-main">
                              <span data-slot="basic-tool-tool-title">{trigger().title}</span>
                              <Show when={!running() && trigger().subtitle}>
                                <span data-slot="basic-tool-tool-subtitle">{trigger().subtitle}</span>
                              </Show>
                              <Show when={!running() && trigger().args.length}>
                                <For each={trigger().args}>
                                  {(arg) => <span data-slot="basic-tool-tool-arg">{arg}</span>}
                                </For>
                              </Show>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </Collapsible.Content>
      </Collapsible>
    </div>
  )
}

export const AssistantMessage: Component<AssistantMessageProps> = (props) => {
  const data = useData()

  const parts = createMemo<AssistantGroup[]>(() => {
    const stored = data.store.part?.[props.message.id]
    if (!stored) return []
    return groupAssistantParts((stored as SDKPart[]).filter((part) => isRenderable(part)))
  })

  return (
    <>
      <For each={parts()}>
        {(entry) => {
          if (entry.type === "context") {
            return <ContextToolGroup parts={entry.parts} />
          }

          const part = entry.part
          // Upstream PART_MAPPING["tool"] returns null for todowrite/todoread,
          // so we detect them here and render via ToolRegistry directly.
          const isUpstreamSuppressed =
            part.type === "tool" && UPSTREAM_SUPPRESSED_TOOLS.has((part as SDKPart & { tool: string }).tool)
          return (
            <Show when={isUpstreamSuppressed || PART_MAPPING[part.type]}>
              <div data-component="tool-part-wrapper" data-part-type={part.type}>
                <Show
                  when={isUpstreamSuppressed}
                  fallback={
                    <Part
                      part={part}
                      message={props.message as SDKMessage}
                      showAssistantCopyPartID={props.showAssistantCopyPartID}
                    />
                  }
                >
                  <TodoToolCard part={part as unknown as ToolPart} />
                </Show>
              </div>
            </Show>
          )
        }}
      </For>
    </>
  )
}
