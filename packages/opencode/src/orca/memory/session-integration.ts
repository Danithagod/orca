import { Bus } from "../../bus"
import { Session } from "../../session"
import { Instance } from "../../project/instance"
import { MemoryEngine } from "./index"
import { MemoryCategory } from "../types"
import { Log } from "../../util/log"

const log = Log.create({ service: "orca.session-memory" })

const sessionMemories = new Map<string, string[]>()

export namespace SessionMemory {
  export function initialize() {
    Bus.subscribe(Session.Event.Created, async (event) => {
      const sessionId = event.properties.info.id
      const projectPath = Instance.directory

      log.info("session created, loading memories", { sessionId, projectPath })

      try {
        await MemoryEngine.init({ projectPath })
        const memories = await MemoryEngine.search({
          query: `project:${projectPath}`,
          categories: ["pattern", "decision", "lesson", "context"],
          limit: 10,
          minScore: 0.3,
          includeContent: true,
        })

        const memoryKeys = memories.map((m) => m.memory.key)
        sessionMemories.set(sessionId, memoryKeys)

        log.info("loaded session memories", {
          sessionId,
          count: memoryKeys.length,
          keys: memoryKeys.slice(0, 5),
        })
      } catch (err) {
        log.error("failed to load session memories", { sessionId, err })
      }
    })

    Bus.subscribe(Session.Event.TurnClose, async (event) => {
      const sessionId = event.properties.sessionID
      const reason = event.properties.reason

      if (reason !== "completed") {
        log.debug("session turn closed without completion, skipping capture", {
          sessionId,
          reason,
        })
        return
      }

      log.info("session turn completed, checking for capture", { sessionId })
    })

    Bus.subscribe(Session.Event.Deleted, async (event) => {
      const sessionId = event.properties.info.id
      sessionMemories.delete(sessionId)
      log.debug("session deleted, cleaned up memory cache", { sessionId })
    })
  }

  export async function captureMemory(input: {
    sessionId: string
    key: string
    title: string
    content: string
    category: MemoryCategory
    metadata?: Record<string, unknown>
  }): Promise<void> {
    try {
      const projectPath = (() => {
        try {
          return Instance.directory
        } catch {
          return null
        }
      })()

      if (projectPath) {
        await MemoryEngine.init({ projectPath })
      }
      await MemoryEngine.store({
        key: input.key,
        title: input.title,
        content: input.content,
        category: input.category,
        tags: ["session", input.sessionId],
        metadata: {
          ...input.metadata,
          sessionId: input.sessionId,
          capturedAt: new Date().toISOString(),
        },
      })

      const keys = sessionMemories.get(input.sessionId) ?? []
      keys.push(input.key)
      sessionMemories.set(input.sessionId, keys)

      log.info("captured session memory", {
        sessionId: input.sessionId,
        key: input.key,
        category: input.category,
      })
    } catch (err) {
      log.error("failed to capture session memory", {
        sessionId: input.sessionId,
        key: input.key,
        err,
      })
    }
  }

  export async function recallMemories(sessionId: string): Promise<string[]> {
    return sessionMemories.get(sessionId) ?? []
  }

  export async function getSessionContext(sessionId: string): Promise<string> {
    const projectPath = Instance.directory
    const memoryKeys = sessionMemories.get(sessionId) ?? []

    if (memoryKeys.length === 0) {
      return ""
    }

    try {
      await MemoryEngine.init({ projectPath })
      const memories = await MemoryEngine.list({
        keys: memoryKeys,
        limit: 20,
        offset: 0,
        sortBy: "updatedAt",
        sortOrder: "desc",
      })

      const context = memories.items.map((m) => `[${m.category}] ${m.title}: ${m.content}`).join("\n\n")

      return context
    } catch (err) {
      log.error("failed to get session context", { sessionId, err })
      return ""
    }
  }

  export async function searchRelevantMemories(
    query: string,
    options?: {
      categories?: MemoryCategory[]
      limit?: number
    },
  ): Promise<string> {
    const projectPath = Instance.directory

    try {
      await MemoryEngine.init({ projectPath })
      const results = await MemoryEngine.search({
        query,
        categories: options?.categories,
        limit: options?.limit ?? 5,
        minScore: 0.5,
        includeContent: true,
      })

      if (results.length === 0) {
        return ""
      }

      return results
        .map((r) => `[${r.memory.category}] ${r.memory.title}: ${r.memory.content.slice(0, 200)}`)
        .join("\n\n")
    } catch (err) {
      log.error("failed to search memories", { query, err })
      return ""
    }
  }
}
