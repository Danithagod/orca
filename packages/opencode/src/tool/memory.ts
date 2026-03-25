import z from "zod"
import { Tool } from "./tool"
import { MemoryEngine } from "../orca/memory"
import { Instance } from "../project/instance"
import { MemoryCategory } from "../orca/types"

const MEMORY_STORE_DESCRIPTION = `Store information in persistent memory for later recall. Use this to remember patterns, decisions, context, and lessons learned.

Categories:
- pattern: Code patterns and conventions discovered
- preference: User preferences and coding style
- context: Project context and architecture decisions
- decision: Technical decisions made and reasoning
- lesson: Lessons learned from errors or issues
- relationship: Connections between files and components
- error: Known issues and their solutions
- todo: Tasks and todo items to remember`

const MEMORY_RECALL_DESCRIPTION = `Recall information from persistent memory. Search by key or query.

Options:
- key: Exact key to recall
- query: Search query for semantic search
- limit: Maximum results to return`

const MEMORY_SEARCH_DESCRIPTION = `Search memories using semantic search. Returns matching memories sorted by relevance.`

const MEMORY_LIST_DESCRIPTION = `List all memories, optionally filtered by category.`

const MEMORY_FORGET_DESCRIPTION = `Delete a memory by ID. Requires confirmation.`

async function ensureMemoryInit() {
  const projectPath = Instance.directory
  await MemoryEngine.init({ projectPath })
}

export const MemoryStoreTool = Tool.define("memory_store", {
  description: MEMORY_STORE_DESCRIPTION,
  parameters: z.object({
    key: z.string().describe("Unique key for this memory"),
    title: z.string().describe("Short title for this memory"),
    content: z.string().describe("Full content to store"),
    category: MemoryCategory.describe("Memory category"),
    priority: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
    tags: z.array(z.string()).optional().describe("Tags for organization"),
    filePath: z.string().optional().describe("Related file path"),
    relatedIds: z.array(z.string()).optional().describe("Related memory IDs"),
  }),
  async execute(params, ctx) {
    await ensureMemoryInit()

    await ctx.ask({
      permission: "memory_store",
      patterns: ["*"],
      always: ["*"],
      metadata: { key: params.key, category: params.category },
    })

    const memory = await MemoryEngine.store({
      key: params.key,
      title: params.title,
      content: params.content,
      category: params.category,
      priority: params.priority,
      tags: params.tags,
      filePath: params.filePath,
      relatedIds: params.relatedIds,
    })

    return {
      title: `Stored: ${params.key}`,
      output: `Memory stored with ID: ${memory.id}\nCategory: ${memory.category}\nTitle: ${memory.title}`,
      metadata: { memoryId: memory.id, key: memory.key, count: 1 },
    }
  },
})

export const MemoryRecallTool = Tool.define("memory_recall", {
  description: MEMORY_RECALL_DESCRIPTION,
  parameters: z.object({
    key: z.string().optional().describe("Exact key to recall"),
    query: z.string().optional().describe("Search query"),
    limit: z.number().optional().default(10).describe("Max results"),
  }),
  async execute(params, ctx) {
    await ensureMemoryInit()

    await ctx.ask({
      permission: "memory_recall",
      patterns: ["*"],
      always: ["*"],
      metadata: { key: params.key, query: params.query },
    })

    if (params.key) {
      const result = await MemoryEngine.recall({ key: params.key, includeRelated: false })
      if (!result) {
        return {
          title: `Not found: ${params.key}`,
          output: `No memory found with key: ${params.key}`,
          metadata: { memoryId: "", count: 0 },
        }
      }
      return {
        title: `Recalled: ${params.key}`,
        output: `## ${result.memory.title}\n\n${result.memory.content}`,
        metadata: { memoryId: result.memory.id, count: 1 },
      }
    }

    if (params.query) {
      const results = await MemoryEngine.search({
        query: params.query,
        limit: params.limit ?? 10,
        minScore: 0.3,
        includeContent: true,
      })
      const output = results
        .map(
          (r, i) =>
            `${i + 1}. **${r.memory.title}** (${(r.score * 100).toFixed(0)}%)\n   ${r.memory.summary ?? r.memory.content.slice(0, 100)}...`,
        )
        .join("\n\n")
      return {
        title: `Found ${results.length} memories`,
        output,
        metadata: { memoryId: "", count: results.length },
      }
    }

    const result = await MemoryEngine.list({
      limit: params.limit ?? 10,
      offset: 0,
      sortBy: "updatedAt",
      sortOrder: "desc",
    })
    const output = result.items.map((m, i) => `${i + 1}. **${m.key}** [${m.category}]\n   ${m.title}`).join("\n")
    return {
      title: `${result.total} memories`,
      output,
      metadata: { memoryId: "", count: result.total },
    }
  },
})

export const MemorySearchTool = Tool.define("memory_search", {
  description: MEMORY_SEARCH_DESCRIPTION,
  parameters: z.object({
    query: z.string().describe("Search query"),
    categories: z.array(MemoryCategory).optional().describe("Filter by categories"),
    limit: z.number().optional().default(10).describe("Max results"),
  }),
  async execute(params, ctx) {
    await ensureMemoryInit()

    await ctx.ask({
      permission: "memory_search",
      patterns: ["*"],
      always: ["*"],
      metadata: { query: params.query },
    })

    const results = await MemoryEngine.search({
      query: params.query,
      categories: params.categories,
      limit: params.limit ?? 10,
      minScore: 0.3,
      includeContent: true,
    })

    const output = results
      .map(
        (r, i) =>
          `${i + 1}. **${r.memory.title}** (${(r.score * 100).toFixed(0)}%)\n   Category: ${r.memory.category}\n   ${r.memory.content.slice(0, 200)}...`,
      )
      .join("\n\n")

    return {
      title: `Found ${results.length} memories`,
      output,
      metadata: { count: results.length },
    }
  },
})

export const MemoryListTool = Tool.define("memory_list", {
  description: MEMORY_LIST_DESCRIPTION,
  parameters: z.object({
    category: MemoryCategory.optional().describe("Filter by category"),
    limit: z.number().optional().default(20).describe("Max results"),
  }),
  async execute(params, ctx) {
    await ensureMemoryInit()

    await ctx.ask({
      permission: "memory_list",
      patterns: ["*"],
      always: ["*"],
      metadata: {},
    })

    const result = await MemoryEngine.list({
      category: params.category,
      limit: params.limit ?? 20,
      offset: 0,
      sortBy: "updatedAt",
      sortOrder: "desc",
    })

    const output = result.items
      .map((m, i) => `${i + 1}. **${m.key}** [${m.category}] (${m.priority})\n   ${m.title}`)
      .join("\n")

    return {
      title: `${result.total} memories`,
      output,
      metadata: { count: result.items.length, total: result.total },
    }
  },
})

export const MemoryForgetTool = Tool.define("memory_forget", {
  description: MEMORY_FORGET_DESCRIPTION,
  parameters: z.object({
    id: z.string().describe("Memory ID to delete"),
    cascade: z.boolean().optional().default(false).describe("Delete related memories"),
    confirm: z.boolean().default(false).describe("Confirmation required"),
  }),
  async execute(params, ctx) {
    await ensureMemoryInit()

    if (!params.confirm) {
      return {
        title: "Confirmation required",
        output: "Set confirm=true to delete this memory. This action cannot be undone.",
        metadata: { deleted: false, id: params.id },
      }
    }

    await ctx.ask({
      permission: "memory_forget",
      patterns: ["*"],
      always: ["*"],
      metadata: { id: params.id },
    })

    await MemoryEngine.delete_({ id: params.id, cascade: params.cascade ?? false })

    return {
      title: `Deleted: ${params.id}`,
      output: `Memory ${params.id} has been deleted.`,
      metadata: { deleted: true, id: params.id },
    }
  },
})
