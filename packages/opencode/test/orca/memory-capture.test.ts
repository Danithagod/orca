import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import os from "os"
import fs from "fs/promises"
import { MemoryEngine } from "../../src/orca/memory"
import { Config } from "../../src/orca/config"
import { ContextHooks } from "../../src/orca/memory/context-hooks"

describe("Memory Capture Flow", () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), "orca-memory-capture-test-" + Math.random().toString(36).slice(2))
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

  describe("ContextHooks.onToolComplete", () => {
    test("captures memory from successful edit tool call", async () => {
      const sessionId = "test-session-edit"
      ContextHooks.enable(sessionId)

      await ContextHooks.onToolComplete({
        sessionId,
        toolName: "edit",
        input: { filePath: "/test/file.ts", oldString: "old", newString: "new" },
        output: "File updated successfully",
        success: true,
      })

      const result = await MemoryEngine.recall({ key: "file-change:/test/file.ts", includeRelated: false })
      expect(result).not.toBeNull()
      expect(result?.memory.title).toContain("File modified")
      expect(result?.memory.metadata?.filePath).toBe("/test/file.ts")

      ContextHooks.disable(sessionId)
    })

    test("captures memory from successful write tool call", async () => {
      const sessionId = "test-session-write"
      ContextHooks.enable(sessionId)

      await ContextHooks.onToolComplete({
        sessionId,
        toolName: "write",
        input: { filePath: "/test/newfile.ts", content: "test content" },
        output: "File written successfully",
        success: true,
      })

      const result = await MemoryEngine.recall({ key: "file-change:/test/newfile.ts", includeRelated: false })
      expect(result).not.toBeNull()
      expect(result?.memory.metadata?.filePath).toBe("/test/newfile.ts")

      ContextHooks.disable(sessionId)
    })

    test("captures memory from bash tool for significant commands", async () => {
      const sessionId = "test-session-bash"
      ContextHooks.enable(sessionId)

      await ContextHooks.onToolComplete({
        sessionId,
        toolName: "bash",
        input: { command: "bun run build" },
        output: "Build completed successfully",
        success: true,
      })

      const result = await MemoryEngine.recall({ key: "command:bun run build", includeRelated: false })
      expect(result).not.toBeNull()
      expect(result?.memory.content).toContain("bun run build")

      ContextHooks.disable(sessionId)
    })

    test("ignores bash commands that are not significant", async () => {
      const sessionId = "test-session-bash-ignore"
      ContextHooks.enable(sessionId)

      await ContextHooks.onToolComplete({
        sessionId,
        toolName: "bash",
        input: { command: "echo hello" },
        output: "hello",
        success: true,
      })

      const result = await MemoryEngine.recall({ key: "command:echo hello", includeRelated: false })
      expect(result).toBeNull()

      ContextHooks.disable(sessionId)
    })

    test("captures memory from read tool for config files", async () => {
      const sessionId = "test-session-read"
      ContextHooks.enable(sessionId)

      await ContextHooks.onToolComplete({
        sessionId,
        toolName: "read",
        input: { filePath: "/test/package.json" },
        output: '{ "name": "test" }',
        success: true,
      })

      const result = await MemoryEngine.recall({ key: "config-read:/test/package.json", includeRelated: false })
      expect(result).not.toBeNull()
      expect(result?.memory.title).toContain("Config read")

      ContextHooks.disable(sessionId)
    })

    test("does not capture when context hooks disabled", async () => {
      const sessionId = "test-session-disabled"
      ContextHooks.disable(sessionId)

      await ContextHooks.onToolComplete({
        sessionId,
        toolName: "edit",
        input: { filePath: "/test/disabled.ts", oldString: "old", newString: "new" },
        output: "File updated",
        success: true,
      })

      const result = await MemoryEngine.recall({ key: "file-change:/test/disabled.ts", includeRelated: false })
      expect(result).toBeNull()
    })

    test("does not capture from failed tool calls", async () => {
      const sessionId = "test-session-failed"
      ContextHooks.enable(sessionId)

      await ContextHooks.onToolComplete({
        sessionId,
        toolName: "edit",
        input: { filePath: "/test/failed.ts", oldString: "old", newString: "new" },
        output: "Error: File not found",
        success: false,
      })

      const result = await MemoryEngine.recall({ key: "file-change:/test/failed.ts", includeRelated: false })
      expect(result).toBeNull()

      ContextHooks.disable(sessionId)
    })

    test("does not capture from non-config file reads", async () => {
      const sessionId = "test-session-nonconfig"
      ContextHooks.enable(sessionId)

      await ContextHooks.onToolComplete({
        sessionId,
        toolName: "read",
        input: { filePath: "/src/utils/helper.ts" },
        output: "export const helper = () => {}",
        success: true,
      })

      const result = await MemoryEngine.recall({ key: "config-read:/src/utils/helper.ts", includeRelated: false })
      expect(result).toBeNull()

      ContextHooks.disable(sessionId)
    })
  })

  describe("captureRules", () => {
    test("can add custom capture rule", async () => {
      const sessionId = "test-session-custom"
      const customRule = {
        toolName: "custom",
        shouldCapture: (ctx: { success: boolean }) => ctx.success,
        extractMemory: (ctx: { input: { data: string } }) => ({
          key: `custom:${ctx.input.data}`,
          title: "Custom memory",
          content: ctx.input.data,
          category: "context" as const,
        }),
      }

      ContextHooks.addRule(customRule)
      ContextHooks.enable(sessionId)

      await ContextHooks.onToolComplete({
        sessionId,
        toolName: "custom",
        input: { data: "custom test data" },
        output: "OK",
        success: true,
      })

      const result = await MemoryEngine.recall({ key: "custom:custom test data", includeRelated: false })
      expect(result).not.toBeNull()
      expect(result?.memory.key).toBe("custom:custom test data")

      ContextHooks.removeRule("custom")
      ContextHooks.disable(sessionId)
    })
  })

  describe("MemoryEngine integration", () => {
    test("stores and retrieves memories by key", async () => {
      await MemoryEngine.store({
        key: "test-store-key",
        title: "Test Memory",
        content: "This is a test memory",
        category: "context",
      })

      const result = await MemoryEngine.recall({ key: "test-store-key", includeRelated: false })
      expect(result).not.toBeNull()
      expect(result?.memory.title).toBe("Test Memory")
    })

    test("lists memories with filters", async () => {
      await MemoryEngine.store({
        key: "list-test-1",
        title: "List Test 1",
        content: "Content 1",
        category: "context",
      })
      await MemoryEngine.store({
        key: "list-test-2",
        title: "List Test 2",
        content: "Content 2",
        category: "pattern",
      })

      const result = await MemoryEngine.list({
        limit: 10,
        offset: 0,
        sortBy: "createdAt",
        sortOrder: "desc",
        category: "context",
      })

      expect(result.items.some((m) => m.key === "list-test-1")).toBe(true)
      expect(result.items.some((m) => m.key === "list-test-2")).toBe(false)
    })

    test("searches memories by content", async () => {
      await MemoryEngine.store({
        key: "search-test",
        title: "TypeScript Patterns",
        content: "Use TypeScript for type safety",
        category: "pattern",
      })

      const results = await MemoryEngine.search({
        query: "TypeScript",
        limit: 10,
        minScore: 0,
        includeContent: true,
      })

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].memory.title).toContain("TypeScript")
    })
  })
})
