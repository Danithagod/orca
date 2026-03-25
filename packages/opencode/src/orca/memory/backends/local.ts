import type { Memory, MemoryCategory } from "../../types"
import type { MemoryBackend, SearchQuery, ListFilter, PaginatedResult } from "../types"
import { Config } from "../../config"

export class LocalBackend implements MemoryBackend {
  private db: any = null
  private dbPath: string

  constructor(config?: { dbPath?: string; embeddingModel?: string; vectorDimensions?: number }) {
    const memoryConfig = Config.getMemoryConfig()
    this.dbPath = config?.dbPath ?? memoryConfig.local.dbPath
  }

  async init(): Promise<void> {
    const fs = await import("fs")
    const path = await import("path")
    const { Database } = await import("bun:sqlite")

    const dbDir = path.dirname(this.dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    this.db = new Database(this.dbPath)
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

    this.db.run("CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key)")
    this.db.run("CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category)")
    this.db.run("CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project_path)")

    this.db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        content, title, summary, content='memories', content_rowid='rowid'
      )
    `)

    this.db.run(`
      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts(rowid, content, title, summary)
        VALUES (new.rowid, new.content, new.title, new.summary);
      END
    `)
    this.db.run(`
      CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
        INSERT INTO memories_fts(memories_fts, rowid, content, title, summary)
        VALUES('delete', old.rowid, old.content, old.title, old.summary);
      END
    `)
    this.db.run(`
      CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
        INSERT INTO memories_fts(memories_fts, rowid, content, title, summary)
        VALUES('delete', old.rowid, old.content, old.title, old.summary);
        INSERT INTO memories_fts(rowid, content, title, summary)
        VALUES (new.rowid, new.content, new.title, new.summary);
      END
    `)
  }

  async create(memory: Memory): Promise<Memory> {
    const stmt = this.db.prepare(`
      INSERT INTO memories (
        id, key, title, content, summary, category, priority,
        tags, project_path, file_path, session_id, parent_id,
        related_ids, metadata, access_count, created_at, updated_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      memory.id,
      memory.key,
      memory.title,
      memory.content,
      memory.summary ?? null,
      memory.category,
      memory.priority,
      JSON.stringify(memory.tags),
      memory.projectPath,
      memory.filePath ?? null,
      memory.sessionId ?? null,
      memory.parentId ?? null,
      JSON.stringify(memory.relatedIds),
      JSON.stringify(memory.metadata ?? {}),
      memory.accessCount,
      memory.createdAt.toISOString(),
      memory.updatedAt.toISOString(),
      memory.expiresAt?.toISOString() ?? null,
    )

    return memory
  }

  async get(id: string): Promise<Memory | null> {
    const stmt = this.db.prepare("SELECT * FROM memories WHERE id = ?")
    const row = stmt.get(id)
    return row ? this.fromRow(row) : null
  }

  async getByKey(key: string): Promise<Memory | null> {
    const stmt = this.db.prepare("SELECT * FROM memories WHERE key = ?")
    const row = stmt.get(key)
    return row ? this.fromRow(row) : null
  }

  async getMany(ids: string[]): Promise<Memory[]> {
    if (ids.length === 0) return []
    const placeholders = ids.map(() => "?").join(",")
    const stmt = this.db.prepare(`SELECT * FROM memories WHERE id IN (${placeholders})`)
    return (stmt.all(...ids) as any[]).map((row) => this.fromRow(row))
  }

  async update(id: string, updates: Partial<Memory>): Promise<Memory> {
    const existing = await this.get(id)
    if (!existing) throw new Error(`Memory not found: ${id}`)

    const updated = { ...existing, ...updates, updatedAt: new Date() }

    const stmt = this.db.prepare(`
      UPDATE memories SET title = ?, content = ?, summary = ?, category = ?,
        priority = ?, tags = ?, related_ids = ?, metadata = ?, updated_at = ?
      WHERE id = ?
    `)

    stmt.run(
      updated.title,
      updated.content,
      updated.summary ?? null,
      updated.category,
      updated.priority,
      JSON.stringify(updated.tags),
      JSON.stringify(updated.relatedIds ?? []),
      JSON.stringify(updated.metadata ?? {}),
      updated.updatedAt.toISOString(),
      id,
    )

    return updated
  }

  async delete(id: string): Promise<void> {
    this.db.prepare("DELETE FROM memories WHERE id = ?").run(id)
  }

  async deleteCascade(id: string): Promise<void> {
    const children = this.db.prepare("SELECT id FROM memories WHERE parent_id = ?").all(id) as { id: string }[]
    for (const child of children) {
      await this.deleteCascade(child.id)
    }
    await this.delete(id)
  }

  async search(query: SearchQuery): Promise<{ memory: Memory; score: number }[]> {
    const stmt = this.db.prepare(`
      SELECT m.*, bm25(memories_fts) as score FROM memories m
      JOIN memories_fts ON m.rowid = memories_fts.rowid
      WHERE memories_fts MATCH ? ORDER BY score DESC LIMIT ?
    `)
    const rows = stmt.all(query.query, query.limit * 2) as any[]
    let results = rows.map((row) => ({
      memory: this.fromRow(row),
      score: Math.max(0, Math.min(1, 1 / (1 + Math.abs(row.score ?? 0)))),
    }))

    if (query.categories && query.categories.length > 0) {
      results = results.filter((r) => query.categories!.includes(r.memory.category))
    }

    return results.slice(0, query.limit)
  }

  async list(filter: ListFilter): Promise<PaginatedResult<Memory>> {
    const conditions: string[] = ["1=1"]
    const params: any[] = []

    if (filter.category) {
      conditions.push("category = ?")
      params.push(filter.category)
    }

    if (filter.tags && filter.tags.length > 0) {
      conditions.push("tags LIKE ?")
      params.push(`%"${filter.tags[0]}"%`)
    }

    if (filter.keys && filter.keys.length > 0) {
      const placeholders = filter.keys.map(() => "?").join(",")
      conditions.push(`key IN (${placeholders})`)
      params.push(...filter.keys)
    }

    const columnMap: Record<string, string> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      accessCount: "access_count",
    }
    const sortColumn = columnMap[filter.sortBy] ?? filter.sortBy
    const whereClause = conditions.join(" AND ")
    const orderClause = `${sortColumn} ${filter.sortOrder.toUpperCase()}`

    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM memories WHERE ${whereClause}`)
    const countResult = countStmt.get(...params) as { count: number }

    const stmt = this.db.prepare(`SELECT * FROM memories WHERE ${whereClause} ORDER BY ${orderClause} LIMIT ? OFFSET ?`)
    const rows = stmt.all(...params, filter.limit, filter.offset) as any[]

    return {
      items: rows.map((row) => this.fromRow(row)),
      total: countResult.count,
      hasMore: filter.offset + filter.limit < countResult.count,
    }
  }

  async updateAccess(id: string): Promise<void> {
    this.db
      .prepare("UPDATE memories SET access_count = access_count + 1, last_accessed_at = ? WHERE id = ?")
      .run(new Date().toISOString(), id)
  }

  async getByProject(projectPath: string): Promise<Memory[]> {
    const stmt = this.db.prepare("SELECT * FROM memories WHERE project_path = ? ORDER BY updated_at DESC")
    return (stmt.all(projectPath) as any[]).map((row) => this.fromRow(row))
  }

  async clearProject(projectPath: string): Promise<void> {
    this.db.prepare("DELETE FROM memories WHERE project_path = ?").run(projectPath)
  }

  private fromRow(row: any): Memory {
    return {
      id: row.id,
      key: row.key,
      title: row.title,
      content: row.content,
      summary: row.summary ?? undefined,
      category: row.category as MemoryCategory,
      priority: row.priority ?? "medium",
      tags: JSON.parse(row.tags ?? "[]"),
      projectPath: row.project_path,
      filePath: row.file_path ?? undefined,
      sessionId: row.session_id ?? undefined,
      parentId: row.parent_id ?? undefined,
      relatedIds: JSON.parse(row.related_ids ?? "[]"),
      metadata: JSON.parse(row.metadata ?? "{}"),
      embedding: row.embedding ? Array.from(new Float32Array(row.embedding)) : undefined,
      accessCount: row.access_count ?? 0,
      lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    }
  }
}
