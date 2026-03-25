import { Bus } from "../../bus"
import { MessageV2 } from "../../session/message-v2"
import { MemoryCategory } from "../types"
import { SessionMemory } from "./session-integration"
import { Log } from "../../util/log"

const log = Log.create({ service: "orca.context-hooks" })

export interface ToolContext {
  sessionId: string
  toolName: string
  input: Record<string, unknown>
  output?: string
  metadata?: Record<string, unknown>
  success: boolean
}

export interface MemoryCaptureRule {
  toolName: string | string[]
  shouldCapture: (ctx: ToolContext) => boolean
  extractMemory: (ctx: ToolContext) => {
    key: string
    title: string
    content: string
    category: MemoryCategory
    metadata?: Record<string, unknown>
  } | null
}

const captureRules: MemoryCaptureRule[] = [
  {
    toolName: ["edit", "write"],
    shouldCapture: (ctx) => ctx.success && !!ctx.input.filePath,
    extractMemory: (ctx) => {
      const filePath = ctx.input.filePath as string
      const content = typeof ctx.output === "string" ? ctx.output.slice(0, 500) : ""

      return {
        key: `file-change:${filePath}`,
        title: `File modified: ${filePath}`,
        content: content,
        category: "context",
        metadata: {
          filePath,
          tool: ctx.toolName,
          timestamp: new Date().toISOString(),
        },
      }
    },
  },
  {
    toolName: "bash",
    shouldCapture: (ctx) => {
      const success = ctx.success
      const command = ctx.input.command as string | undefined
      if (!command) return false

      const isSignificant =
        command.includes("npm run") ||
        command.includes("bun run") ||
        command.includes("pnpm") ||
        command.includes("cargo") ||
        command.includes("make") ||
        command.includes("docker")

      return success && isSignificant
    },
    extractMemory: (ctx) => {
      const command = ctx.input.command as string
      const output = typeof ctx.output === "string" ? ctx.output.slice(0, 300) : ""

      return {
        key: `command:${command.slice(0, 50)}`,
        title: `Executed: ${command.slice(0, 50)}`,
        content: `Command: ${command}\n\nOutput:\n${output}`,
        category: "context",
        metadata: {
          command,
          tool: "bash",
          timestamp: new Date().toISOString(),
        },
      }
    },
  },
  {
    toolName: "read",
    shouldCapture: (ctx) => {
      const filePath = ctx.input.filePath as string | undefined
      if (!filePath) return false

      const isConfigFile =
        filePath.includes("package.json") ||
        filePath.includes("tsconfig") ||
        filePath.includes(".config.") ||
        filePath.includes("settings")

      return ctx.success && isConfigFile
    },
    extractMemory: (ctx) => {
      const filePath = ctx.input.filePath as string
      const content = typeof ctx.output === "string" ? ctx.output.slice(0, 500) : ""

      return {
        key: `config-read:${filePath}`,
        title: `Config read: ${filePath}`,
        content: content,
        category: "context",
        metadata: {
          filePath,
          tool: "read",
          timestamp: new Date().toISOString(),
        },
      }
    },
  },
]

export namespace ContextHooks {
  const enabled = new Map<string, boolean>()

  export function enable(sessionId: string) {
    enabled.set(sessionId, true)
    log.debug("context hooks enabled", { sessionId })
  }

  export function disable(sessionId: string) {
    enabled.set(sessionId, false)
    log.debug("context hooks disabled", { sessionId })
  }

  export function isEnabled(sessionId: string): boolean {
    return enabled.get(sessionId) ?? false
  }

  export async function onToolComplete(ctx: ToolContext): Promise<void> {
    if (!isEnabled(ctx.sessionId)) {
      return
    }

    for (const rule of captureRules) {
      const toolNames = Array.isArray(rule.toolName) ? rule.toolName : [rule.toolName]

      if (!toolNames.includes(ctx.toolName)) {
        continue
      }

      try {
        if (!rule.shouldCapture(ctx)) {
          continue
        }

        const memoryData = rule.extractMemory(ctx)
        if (!memoryData) {
          continue
        }

        await SessionMemory.captureMemory({
          sessionId: ctx.sessionId,
          ...memoryData,
        })

        log.debug("captured memory from tool", {
          sessionId: ctx.sessionId,
          tool: ctx.toolName,
          key: memoryData.key,
        })
      } catch (err) {
        log.error("failed to capture memory from tool", {
          sessionId: ctx.sessionId,
          tool: ctx.toolName,
          err,
        })
      }
    }
  }

  export function addRule(rule: MemoryCaptureRule): void {
    captureRules.push(rule)
    log.debug("added capture rule", { toolName: rule.toolName })
  }

  export function removeRule(toolName: string): void {
    const index = captureRules.findIndex(
      (r) => (Array.isArray(r.toolName) ? r.toolName.join(",") : r.toolName) === toolName,
    )
    if (index >= 0) {
      captureRules.splice(index, 1)
      log.debug("removed capture rule", { toolName })
    }
  }

  export function getRules(): MemoryCaptureRule[] {
    return [...captureRules]
  }
}

export function initializeContextHooks(): void {
  log.info("initializing context hooks")

  Bus.subscribe(MessageV2.Event.PartUpdated, async (event) => {
    const part = event.properties.part

    if (part.type !== "tool") return

    const toolPart = part as MessageV2.ToolPart
    if (toolPart.state.status !== "completed" && toolPart.state.status !== "error") return

    const sessionId = toolPart.sessionID
    const success = toolPart.state.status === "completed"

    const output = success && "output" in toolPart.state ? toolPart.state.output : undefined
    const metadata = "metadata" in toolPart.state ? toolPart.state.metadata : undefined

    ContextHooks.onToolComplete({
      sessionId,
      toolName: toolPart.tool,
      input: (toolPart.state.input as Record<string, unknown>) ?? {},
      output,
      metadata: metadata as Record<string, unknown> | undefined,
      success,
    }).catch((err) => {
      log.error("context hook error", { err, sessionId, tool: toolPart.tool })
    })
  })

  log.info("context hooks initialized")
}
