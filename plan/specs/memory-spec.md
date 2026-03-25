# Orca Memory Specification

## Overview

Persistent memory system that preserves context across sessions, enabling agents to recall project knowledge, decisions, and patterns.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Memory Engine                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   mem0      │  │   Letta     │  │   Local Storage    │ │
│  │   Adapter   │  │   Adapter   │  │   Adapter          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Memory Interface                          │ │
│  │  store() | recall() | search() | delete() | list()   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Core Schemas

```typescript
import { z } from "zod"

export const MemoryCategory = z.enum([
  "architecture", // Project structure, files, folders
  "conventions", // Coding standards, patterns
  "decisions", // Design decisions, trade-offs
  "todos", // Pending tasks, reminders
  "context", // Current session context
  "patterns", // Reusable code patterns
  "errors", // Known issues and solutions
  "dependencies", // Package and lib info
  "config", // Configuration details
  "workflow", // Process and workflow info
])

export type MemoryCategory = z.infer<typeof MemoryCategory>

export const MemoryPriority = z.enum(["low", "medium", "high", "critical"])
export type MemoryPriority = z.infer<typeof MemoryPriority>

export const Memory = z.object({
  id: z.string().uuid(),

  // Identification
  key: z.string().max(200), // Human-readable key
  title: z.string().max(500), // Short description

  // Content
  content: z.string(), // Full memory content
  summary: z.string().max(1000), // AI-generated summary

  // Classification
  category: MemoryCategory,
  priority: MemoryPriority.default("medium"),
  tags: z.array(z.string()).default([]),

  // Context
  projectPath: z.string(), // Project root path
  filePath: z.string().optional(), // Related file (if any)
  sessionId: z.string().optional(), // Session that created it

  // Relationships
  parentId: z.string().uuid().optional(),
  relatedIds: z.array(z.string()).default([]),

  // Metadata
  metadata: z.record(z.unknown()).default({}),

  // Embedding (for semantic search)
  embedding: z.array(z.number()).optional(),

  // Access tracking
  accessCount: z.number().default(0),
  lastAccessedAt: z.date().optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().optional(), // TTL for temporary memories
})

export type Memory = z.infer<typeof Memory>

export const MemorySearchResult = z.object({
  memory: Memory,
  score: z.number().min(0).max(1),
  highlights: z.array(z.string()).optional(),
})

export type MemorySearchResult = z.infer<typeof MemorySearchResult>
```

### Project Memory Index

```typescript
export const ProjectMemoryIndex = z.object({
  projectPath: z.string(),
  projectName: z.string(),

  // Statistics
  totalMemories: z.number().default(0),
  totalSizeBytes: z.number().default(0),

  // Category counts
  categoryCounts: z.record(z.number()).default({}),

  // Last activity
  lastMemoryAt: z.date().optional(),
  lastSessionAt: z.date().optional(),

  // Index metadata
  indexedAt: z.date(),
  version: z.number().default(1),
})

export type ProjectMemoryIndex = z.infer<typeof ProjectMemoryIndex>
```

---

## Memory Interface

### Core Operations

```typescript
export namespace MemoryEngine {
  // Initialization
  export const init = fn(
    z.object({
      projectPath: z.string(),
      backend: z.enum(["mem0", "letta", "local"]).default("local"),
      config: z.record(z.unknown()).optional(),
    }),
    async (input) => {
      // Initialize memory backend
      // Create/load project index
      // Return memory engine instance
    },
  )

  // Store a memory
  export const store = fn(
    z.object({
      key: z.string(),
      title: z.string(),
      content: z.string(),
      category: MemoryCategory,
      priority: MemoryPriority.optional(),
      tags: z.array(z.string()).optional(),
      filePath: z.string().optional(),
      sessionId: z.string().optional(),
      parentId: z.string().optional(),
      relatedIds: z.array(z.string()).optional(),
      metadata: z.record(z.unknown()).optional(),
      expiresAt: z.date().optional(),
    }),
    async (input) => {
      // Create memory record
      // Generate embedding
      // Store in backend
      // Update index
      // Return memory ID
    },
  )

  // Recall specific memory by key
  export const recall = fn(
    z.object({
      key: z.string(),
      includeRelated: z.boolean().default(false),
    }),
    async (input) => {
      // Look up memory by key
      // Optionally fetch related memories
      // Update access metadata
      // Return memory(es)
    },
  )

  // Semantic search
  export const search = fn(
    z.object({
      query: z.string(),
      categories: z.array(MemoryCategory).optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().min(1).max(100).default(10),
      minScore: z.number().min(0).max(1).default(0.5),
      includeContent: z.boolean().default(true),
    }),
    async (input) => {
      // Generate query embedding
      // Perform vector search
      // Filter by categories/tags
      // Return ranked results
    },
  )

  // List all memories (paginated)
  export const list = fn(
    z.object({
      category: MemoryCategory.optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      sortBy: z.enum(["createdAt", "updatedAt", "accessCount", "priority"]).default("updatedAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
    async (input) => {
      // Query memories with filters
      // Sort and paginate
      // Return memory list
    },
  )

  // Update memory
  export const update = fn(
    z.object({
      id: z.string(),
      updates: z.object({
        content: z.string().optional(),
        title: z.string().optional(),
        category: MemoryCategory.optional(),
        priority: MemoryPriority.optional(),
        tags: z.array(z.string()).optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    }),
    async (input) => {
      // Find and update memory
      // Regenerate embedding if content changed
      // Return updated memory
    },
  )

  // Delete memory
  export const delete_ = fn(
    z.object({
      id: z.string(),
      cascade: z.boolean().default(false), // Delete children
    }),
    async (input) => {
      // Delete memory
      // Optionally cascade delete
      // Update index
    },
  )

  // Get memories by IDs
  export const getMany = fn(
    z.object({
      ids: z.array(z.string()),
    }),
    async (input) => {
      // Batch fetch memories
      // Return memory map
    },
  )

  // Get related memories
  export const getRelated = fn(
    z.object({
      id: z.string(),
      depth: z.number().min(1).max(3).default(1),
    }),
    async (input) => {
      // Traverse relationship graph
      // Return related memories
    },
  )
}
```

### Context Injection

```typescript
export namespace MemoryContext {
  // Get relevant context for a query/tool
  export const getContext = fn(
    z.object({
      query: z.string(),
      tool: z.string().optional(),
      filePath: z.string().optional(),
      maxTokens: z.number().default(2000),
    }),
    async (input) => {
      // Search for relevant memories
      // Rank by relevance and recency
      // Format for LLM context
      // Truncate to token limit
    },
  )

  // Capture insights from session
  export const captureInsight = fn(
    z.object({
      type: z.enum(["decision", "pattern", "error", "success"]),
      description: z.string(),
      context: z.string(),
      references: z.array(z.string()).optional(),
    }),
    async (input) => {
      // Create memory from insight
      // Link to relevant files/memories
    },
  )
}
```

---

## Backends

### Backend Interface

```typescript
interface MemoryBackend {
  // Lifecycle
  init(config: BackendConfig): Promise<void>
  close(): Promise<void>

  // CRUD
  create(memory: MemoryInput): Promise<Memory>
  read(id: string): Promise<Memory | null>
  update(id: string, updates: Partial<Memory>): Promise<Memory>
  delete(id: string): Promise<void>

  // Query
  search(query: SearchQuery): Promise<SearchResult[]>
  list(filter: ListFilter): Promise<PaginatedResult<Memory>>

  // Embedding
  embed(text: string): Promise<number[]>

  // Index management
  createIndex(projectPath: string): Promise<ProjectMemoryIndex>
  loadIndex(projectPath: string): Promise<ProjectMemoryIndex | null>
  saveIndex(index: ProjectMemoryIndex): Promise<void>
}
```

### mem0 Adapter

```typescript
// packages/opencode/src/orca/memory/backends/mem0.ts

import { MemoryBackend, Memory, SearchQuery, SearchResult } from "../types"

export class Mem0Backend implements MemoryBackend {
  private client: Mem0Client

  async init(config: Mem0Config): Promise<void> {
    this.client = new Mem0Client({
      apiKey: config.apiKey,
      projectId: config.projectId,
    })
  }

  async create(memory: MemoryInput): Promise<Memory> {
    const result = await this.client.memories.create({
      content: memory.content,
      metadata: {
        key: memory.key,
        category: memory.category,
        projectPath: memory.projectPath,
        ...memory.metadata,
      },
    })

    return this.fromMem0(result)
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const results = await this.client.memories.search({
      query: query.query,
      limit: query.limit,
      filters: {
        projectPath: this.projectPath,
        ...(query.categories && { category: { $in: query.categories } }),
      },
    })

    return results.map((r) => ({
      memory: this.fromMem0(r),
      score: r.score,
    }))
  }

  async embed(text: string): Promise<number[]> {
    return this.client.embeddings.create({ input: text })
  }

  // ... other methods
}
```

### Letta Adapter

```typescript
// packages/opencode/src/orca/memory/backends/letta.ts

import { MemoryBackend, Memory } from "../types"

export class LettaBackend implements MemoryBackend {
  private client: LettaClient

  async init(config: LettaConfig): Promise<void> {
    this.client = new LettaClient({
      baseUrl: config.baseUrl ?? "http://localhost:8283",
      apiKey: config.apiKey,
    })
  }

  async create(memory: MemoryInput): Promise<Memory> {
    // Letta uses archival_memory for persistent storage
    const result = await this.client.agents.memory.createArchivalMemory({
      agent_id: this.agentId,
      memory: {
        content: JSON.stringify({
          key: memory.key,
          title: memory.title,
          content: memory.content,
          category: memory.category,
          projectId: memory.projectPath,
        }),
      },
    })

    return this.fromLetta(result)
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const embedding = await this.embed(query.query)

    const results = await this.client.agents.memory.searchArchivalMemory({
      agent_id: this.agentId,
      query: embedding,
      limit: query.limit,
    })

    return results.map((r) => {
      const parsed = JSON.parse(r.content)
      return {
        memory: this.fromLetta(parsed, r.id),
        score: r.distance,
      }
    })
  }

  // ... other methods
}
```

### Local (SQLite + Vector) Adapter

```typescript
// packages/opencode/src/orca/memory/backends/local.ts

import { Database } from "bun:sqlite"
import { MemoryBackend, Memory } from "../types"

export class LocalBackend implements MemoryBackend {
  private db: Database
  private embedder: Embedder

  async init(config: LocalConfig): Promise<void> {
    const dbPath = `${config.projectPath}/.orca/memory.db`

    this.db = new Database(dbPath)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        category TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        tags TEXT DEFAULT '[]',
        project_path TEXT NOT NULL,
        file_path TEXT,
        session_id TEXT,
        parent_id TEXT,
        related_ids TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        embedding BLOB,
        access_count INTEGER DEFAULT 0,
        last_accessed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        expires_at TEXT
      )
    `)

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key)
    `)

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category)
    `)

    this.db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        content,
        title,
        summary
      )
    `)

    this.embedder = new Embedder(config.embeddingModel ?? "all-MiniLM-L6-v2")
  }

  async create(memory: MemoryInput): Promise<Memory> {
    const id = crypto.randomUUID()
    const now = new Date()

    const embedding = await this.embedder.embed(memory.content)

    const stmt = this.db.prepare(`
      INSERT INTO memories (
        id, key, title, content, summary, category, priority,
        tags, project_path, file_path, session_id, parent_id,
        related_ids, metadata, embedding, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      memory.key,
      memory.title,
      memory.content,
      memory.summary ?? memory.title,
      memory.category,
      memory.priority ?? "medium",
      JSON.stringify(memory.tags ?? []),
      memory.projectPath,
      memory.filePath ?? null,
      memory.sessionId ?? null,
      memory.parentId ?? null,
      JSON.stringify(memory.relatedIds ?? []),
      JSON.stringify(memory.metadata ?? {}),
      Buffer.from(new Float32Array(embedding).buffer),
      now.toISOString(),
      now.toISOString(),
    )

    return this.getById(id)
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const embedding = await this.embedder.embed(query.query)

    // Vector similarity search using cosine distance
    const stmt = this.db.prepare(`
      SELECT 
        *, 
        (1 - (dot_product(embedding, ?) / (norm(embedding) * norm(?)))) as score
      FROM memories
      WHERE project_path = ?
        ${query.categories ? "AND category IN (SELECT value FROM json_each(?))" : ""}
        AND score >= ?
      ORDER BY score DESC
      LIMIT ?
    `)

    const results = stmt.all(
      Buffer.from(new Float32Array(embedding).buffer),
      Buffer.from(new Float32Array(embedding).buffer),
      this.projectPath,
      query.categories ? JSON.stringify(query.categories) : null,
      query.minScore,
      query.limit,
    )

    return results.map((r) => ({
      memory: this.fromRow(r),
      score: r.score,
    }))
  }

  // ... other methods
}
```

---

## Embeddings

### Embedding Provider

```typescript
// packages/opencode/src/orca/memory/embeddings/index.ts

export interface Embedder {
  embed(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>
  dimensions(): number
}

export class OpenAIEmbedder implements Embedder {
  private model: string = "text-embedding-3-small"
  private client: OpenAI

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    })
    return response.data[0].embedding
  }

  dimensions(): number {
    return 1536
  }
}

export class LocalEmbedder implements Embedder {
  private model: string
  private runner: EmbeddingModel

  async init(model: string = "all-MiniLM-L6-v2"): Promise<void> {
    this.model = model
    this.runner = await loadEmbeddingModel(model)
  }

  async embed(text: string): Promise<number[]> {
    return this.runner.embed(text)
  }

  dimensions(): number {
    return 384
  }
}
```

---

## Automatic Capture

### Tool Execution Hooks

```typescript
// packages/opencode/src/orca/memory/hooks.ts

export namespace MemoryHooks {
  // Hook: Before tool execution
  export const beforeTool = async (tool: string, input: unknown) => {
    // Load relevant context
    const context = await MemoryContext.getContext({
      query: JSON.stringify(input),
      tool,
      maxTokens: 1000,
    })

    return { context }
  }

  // Hook: After tool execution
  export const afterTool = async (tool: string, input: unknown, result: unknown) => {
    // Analyze result for insights
    const insights = await analyzeResult(tool, input, result)

    // Store relevant memories
    for (const insight of insights) {
      await MemoryEngine.store({
        key: insight.key,
        title: insight.title,
        content: insight.content,
        category: insight.category,
        tags: insight.tags,
      })
    }
  }

  // Hook: Session start
  export const onSessionStart = async (projectPath: string) => {
    // Load project index
    const index = await MemoryEngine.loadIndex(projectPath)

    // Retrieve recent context
    const recentMemories = await MemoryEngine.search({
      query: "recent work context",
      limit: 20,
      sortBy: "updatedAt",
    })

    return {
      index,
      recentMemories,
    }
  }

  // Hook: Session end
  export const onSessionEnd = async (projectPath: string, sessionSummary: string) => {
    // Store session summary
    await MemoryEngine.store({
      key: `session-${Date.now()}`,
      title: "Session Summary",
      content: sessionSummary,
      category: "context",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })
  }
}
```

### Auto-extraction

```typescript
// packages/opencode/src/orca/memory/extraction.ts

export namespace MemoryExtraction {
  // Extract decisions from conversation
  export const extractDecisions = async (messages: Message[]): Promise<ExtractedDecision[]> => {
    // Pattern: "Let's use X", "We decided on Y", etc.
    const decisionPatterns = [
      /let'?s (use|go with|implement) (.+)/i,
      /we (decided|chose|agreed) (?:on|to use) (.+)/i,
      /the (?:approach|solution|pattern) (?:will be|is) (.+)/i,
    ]

    const decisions: ExtractedDecision[] = []

    for (const msg of messages) {
      for (const pattern of decisionPatterns) {
        const match = msg.content.match(pattern)
        if (match) {
          decisions.push({
            content: match[0],
            context: msg.content,
            category: "decisions",
          })
        }
      }
    }

    return decisions
  }

  // Extract patterns from code
  export const extractPatterns = async (files: FileInfo[]): Promise<ExtractedPattern[]> => {
    const patterns: ExtractedPattern[] = []

    for (const file of files) {
      // Detect naming conventions
      const namingPattern = detectNamingConvention(file.content)
      if (namingPattern) {
        patterns.push({
          key: `naming-${file.path}`,
          content: namingPattern,
          category: "conventions",
          filePath: file.path,
        })
      }

      // Detect architectural patterns
      const archPattern = detectArchPattern(file.content)
      if (archPattern) {
        patterns.push({
          key: `arch-${file.path}`,
          content: archPattern,
          category: "architecture",
          filePath: file.path,
        })
      }
    }

    return patterns
  }
}
```

---

## Commands

### Memory CLI Commands

```typescript
// packages/opencode/src/orca/commands/memory.ts

export namespace MemoryCommands {
  export const recall = fn(
    z.object({
      query: z.string(),
      format: z.enum(["summary", "full", "json"]).default("summary"),
    }),
    async (input) => {
      const results = await MemoryEngine.search({
        query: input.query,
        limit: 5,
      })

      if (results.length === 0) {
        return "No memories found matching query."
      }

      switch (input.format) {
        case "json":
          return JSON.stringify(results, null, 2)
        case "full":
          return results
            .map(
              (r) =>
                `## ${r.memory.title}\n` +
                `Category: ${r.memory.category}\n` +
                `Relevance: ${(r.score * 100).toFixed(1)}%\n\n` +
                `${r.memory.content}\n`,
            )
            .join("\n---\n\n")
        default:
          return results
            .map((r) => `• ${r.memory.title} (${r.memory.category}) - ${(r.score * 100).toFixed(0)}%`)
            .join("\n")
      }
    },
  )

  export const store = fn(
    z.object({
      key: z.string(),
      content: z.string(),
      category: MemoryCategory,
      tags: z.array(z.string()).optional(),
    }),
    async (input) => {
      const memory = await MemoryEngine.store(input)
      return `Memory stored: ${memory.id}`
    },
  )

  export const list = fn(
    z.object({
      category: MemoryCategory.optional(),
      limit: z.number().default(20),
    }),
    async (input) => {
      const memories = await MemoryEngine.list({
        category: input.category,
        limit: input.limit,
        sortBy: "updatedAt",
      })

      return memories.items.map((m) => `${m.id.slice(0, 8)} | ${m.key} | ${m.category} | ${m.title}`).join("\n")
    },
  )

  export const show = fn(
    z.object({
      id: z.string(),
    }),
    async (input) => {
      const memory = await MemoryEngine.read(input.id)

      if (!memory) {
        return `Memory not found: ${input.id}`
      }

      return formatMemoryDetail(memory)
    },
  )

  export const forget = fn(
    z.object({
      id: z.string(),
      confirm: z.boolean().default(false),
    }),
    async (input) => {
      if (!input.confirm) {
        return "Use --confirm to delete memory."
      }

      await MemoryEngine.delete(input.id)
      return `Memory forgotten: ${input.id}`
    },
  )
}
```

---

## File Structure

```
packages/opencode/src/orca/memory/
├── index.ts                    # Public exports
├── types.ts                    # Zod schemas and types
├── engine.ts                   # Main memory engine
├── backends/
│   ├── interface.ts            # Backend interface
│   ├── mem0.ts                 # mem0 adapter
│   ├── letta.ts               # Letta adapter
│   └── local.ts               # SQLite + vector adapter
├── embeddings/
│   ├── index.ts               # Embedder interface
│   ├── openai.ts              # OpenAI embeddings
│   └── local.ts               # Local model embeddings
├── hooks/
│   ├── index.ts               # Hook exports
│   ├── tool-hooks.ts          # Tool execution hooks
│   └── session-hooks.ts       # Session lifecycle hooks
├── extraction/
│   ├── index.ts               # Extraction exports
│   ├── decisions.ts           # Decision extraction
│   ├── patterns.ts            # Pattern extraction
│   └── insights.ts            # Insight extraction
├── commands/
│   └── memory.ts              # Memory CLI commands
└── utils/
    ├── format.ts              # Memory formatting
    ├── ranking.ts             # Result ranking
    └── context.ts              # Context building
```

---

## Configuration

```json
{
  "memory": {
    "backend": "local",
    "local": {
      "embeddingModel": "all-MiniLM-L6-v2",
      "maxMemories": 10000
    },
    "mem0": {
      "apiKey": "${MEM0_API_KEY}",
      "projectId": "orca-default"
    },
    "letta": {
      "baseUrl": "http://localhost:8283",
      "agentId": "${LETTA_AGENT_ID}"
    },
    "capture": {
      "autoExtract": true,
      "patterns": true,
      "decisions": true,
      "errors": true
    },
    "retention": {
      "defaultTTL": null,
      "maxAge": "365d"
    }
  }
}
```
