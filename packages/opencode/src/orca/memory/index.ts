import { z } from "zod"
import { fn } from "../../util/fn"
import { MemoryStoreInput, MemorySearchInput, MemoryListFilter, type Memory, MemoryCategory } from "../types"
import { Config } from "../config"
import type { MemoryBackend, SearchQuery, ListFilter, PaginatedResult } from "./types"
import { LocalBackend } from "./backends/local"

let memoryBackend: MemoryBackend | null = null
let currentProjectPath: string | null = null

async function getBackend(): Promise<MemoryBackend> {
  if (memoryBackend) return memoryBackend

  const config = Config.getMemoryConfig()
  const projectPath = currentProjectPath ?? process.cwd()

  // Note: mem0 and letta backends will be added later
  // For now, only local backend is supported
  memoryBackend = new LocalBackend(config.local)
  await memoryBackend.init()

  return memoryBackend
}

export { SessionMemory } from "./session-integration"
export { ContextHooks, initializeContextHooks } from "./context-hooks"

export namespace MemoryEngine {
  export const init = fn(
    z.object({ projectPath: z.string(), backend: z.enum(["local", "mem0", "letta"]).optional() }),
    async (input) => {
      currentProjectPath = input.projectPath

      if (input.backend) {
        // For now, only local backend is fully implemented
        // mem0 and letta will be added in follow-up
      }

      await getBackend()
      return { initialized: true }
    },
  )

  export const store = fn(MemoryStoreInput, async (input) => {
    const backend = await getBackend()
    const now = new Date()
    const memory: Memory = {
      id: crypto.randomUUID(),
      key: input.key,
      title: input.title,
      content: input.content,
      summary: input.summary ?? input.title,
      category: input.category,
      priority: input.priority ?? "medium",
      tags: input.tags ?? [],
      projectPath: currentProjectPath ?? process.cwd(),
      filePath: input.filePath,
      sessionId: input.sessionId,
      parentId: input.parentId,
      relatedIds: input.relatedIds ?? [],
      metadata: input.metadata ?? {},
      accessCount: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
    }
    return backend.create(memory)
  })

  export const recall = fn(z.object({ key: z.string(), includeRelated: z.boolean().default(false) }), async (input) => {
    const backend = await getBackend()
    const memory = await backend.getByKey(input.key)
    if (!memory) return null

    await backend.updateAccess(memory.id)

    if (input.includeRelated && memory.relatedIds.length > 0) {
      const related = await backend.getMany(memory.relatedIds)
      return { memory, related }
    }
    return { memory, related: [] }
  })

  export const search = fn(MemorySearchInput, async (input) => {
    const backend = await getBackend()
    return backend.search({
      query: input.query,
      categories: input.categories,
      tags: input.tags,
      limit: input.limit,
      minScore: input.minScore,
    })
  })

  export const list = fn(MemoryListFilter, async (input) => {
    const backend = await getBackend()
    return backend.list({
      category: input.category,
      tags: input.tags,
      keys: input.keys,
      limit: input.limit,
      offset: input.offset,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    })
  })

  export const update = fn(
    z.object({
      id: z.string(),
      updates: z.object({
        content: z.string().optional(),
        title: z.string().optional(),
        category: MemoryCategory.optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        tags: z.array(z.string()).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    }),
    async (input) => {
      const backend = await getBackend()
      return backend.update(input.id, input.updates)
    },
  )

  export const delete_ = fn(z.object({ id: z.string(), cascade: z.boolean().default(false) }), async (input) => {
    const backend = await getBackend()
    if (input.cascade) await backend.deleteCascade(input.id)
    else await backend.delete(input.id)
    return { deleted: true }
  })

  export const get = fn(z.object({ id: z.string() }), async (input) => {
    const backend = await getBackend()
    return backend.get(input.id)
  })

  export const getMany = fn(z.object({ ids: z.array(z.string()) }), async (input) => {
    const backend = await getBackend()
    return backend.getMany(input.ids)
  })

  export const getProjectMemories = fn(z.object({ projectPath: z.string() }), async (input) => {
    const backend = await getBackend()
    return backend.getByProject(input.projectPath)
  })

  export const clear = fn(z.object({ projectPath: z.string(), confirm: z.boolean().default(false) }), async (input) => {
    const backend = await getBackend()
    if (!input.confirm) throw new Error("Clear requires confirm=true")
    await backend.clearProject(input.projectPath)
    return { cleared: true }
  })
}
