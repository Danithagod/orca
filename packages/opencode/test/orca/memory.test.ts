import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import os from "os"
import fs from "fs/promises"
import { MemoryEngine } from "../../src/orca/memory"
import { Config } from "../../src/orca/config"

describe("MemoryEngine", () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), "orca-memory-test-" + Math.random().toString(36).slice(2))
    await fs.mkdir(tmpDir, { recursive: true })
    const dbPath = path.join(tmpDir, "memory.db")
    Config.init({
      memory: {
        backend: "local",
        local: { dbPath },
      },
      orchestrator: { maxAgents: 10, defaultStrategy: "sequential", taskTimeout: 300000, retryAttempts: 3 },
      ui: { theme: "blue", compact: false, showTimestamps: true },
    })
    await MemoryEngine.init({ projectPath: tmpDir })
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    Config.reset()
  })

  describe("store", () => {
    test("stores a memory with required fields", async () => {
      const memory = await MemoryEngine.store({
        key: "test-pattern",
        title: "Test Pattern",
        content: "This is a test pattern for unit testing",
        category: "pattern",
      })

      expect(memory.id).toBeDefined()
      expect(memory.key).toBe("test-pattern")
      expect(memory.title).toBe("Test Pattern")
      expect(memory.category).toBe("pattern")
      expect(memory.createdAt).toBeInstanceOf(Date)
    })

    test("stores a memory with optional fields", async () => {
      const memory = await MemoryEngine.store({
        key: "test-decision",
        title: "Test Decision",
        content: "Decision to use SQLite for storage",
        category: "decision",
        priority: "high",
        tags: ["architecture", "storage"],
        metadata: { reason: "performance" },
      })

      expect(memory.priority).toBe("high")
      expect(memory.tags).toEqual(["architecture", "storage"])
      expect(memory.metadata).toEqual({ reason: "performance" })
    })
  })

  describe("recall", () => {
    test("recalls a memory by key", async () => {
      await MemoryEngine.store({
        key: "recall-test",
        title: "Recall Test",
        content: "Content for recall test",
        category: "context",
      })

      const result = await MemoryEngine.recall({ key: "recall-test", includeRelated: false })
      expect(result).not.toBeNull()
      expect(result?.memory.key).toBe("recall-test")
      expect(result?.memory.title).toBe("Recall Test")
    })

    test("returns null for non-existent key", async () => {
      const result = await MemoryEngine.recall({ key: "non-existent", includeRelated: false })
      expect(result).toBeNull()
    })
  })

  describe("search", () => {
    test("searches memories by content", async () => {
      await MemoryEngine.store({
        key: "search-1",
        title: "TypeScript Patterns",
        content: "Use TypeScript for type safety",
        category: "pattern",
      })
      await MemoryEngine.store({
        key: "search-2",
        title: "React Patterns",
        content: "Use React hooks for state management",
        category: "pattern",
      })

      const results = await MemoryEngine.search({
        query: "TypeScript",
        limit: 10,
        minScore: 0,
        includeContent: true,
      })

      expect(results.length).toBeGreaterThan(0)
    })

    test("filters by category", async () => {
      await MemoryEngine.store({
        key: "cat-test-1",
        title: "Error Pattern",
        content: "Handle errors gracefully",
        category: "error",
      })
      await MemoryEngine.store({
        key: "cat-test-2",
        title: "Todo Pattern",
        content: "Remember to handle errors",
        category: "todo",
      })

      const results = await MemoryEngine.search({
        query: "errors",
        categories: ["error"],
        limit: 10,
        minScore: 0,
        includeContent: true,
      })

      expect(results.every((r) => r.memory.category === "error")).toBe(true)
    })
  })

  describe("list", () => {
    test("lists memories with pagination", async () => {
      for (let i = 0; i < 5; i++) {
        await MemoryEngine.store({
          key: `list-test-${i}`,
          title: `List Test ${i}`,
          content: `Content ${i}`,
          category: "context",
        })
      }

      const result = await MemoryEngine.list({ limit: 3, offset: 0, sortBy: "createdAt", sortOrder: "desc" })
      expect(result.items.length).toBeLessThanOrEqual(3)
      expect(result.total).toBeGreaterThanOrEqual(5)
    })
  })

  describe("update", () => {
    test("updates memory content", async () => {
      const memory = await MemoryEngine.store({
        key: "update-test",
        title: "Original Title",
        content: "Original content",
        category: "context",
      })

      const updated = await MemoryEngine.update({
        id: memory.id,
        updates: { content: "Updated content", title: "Updated Title" },
      })

      expect(updated.content).toBe("Updated content")
      expect(updated.title).toBe("Updated Title")
    })
  })

  describe("delete_", () => {
    test("deletes a memory", async () => {
      const memory = await MemoryEngine.store({
        key: "delete-test",
        title: "Delete Test",
        content: "To be deleted",
        category: "context",
      })

      await MemoryEngine.delete_({ id: memory.id, cascade: false })

      const result = await MemoryEngine.get({ id: memory.id })
      expect(result).toBeNull()
    })
  })
})
