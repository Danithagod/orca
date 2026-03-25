import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import path from "path"
import os from "os"
import fs from "fs/promises"
import { Orchestrator } from "../../src/orca/orchestrator"
import { MemoryEngine } from "../../src/orca/memory"
import { Config } from "../../src/orca/config"
import { AgentType, TaskType } from "../../src/orca/types"

describe("Orchestrator E2E", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), "orca-e2e-test-" + Math.random().toString(36).slice(2))
    await fs.mkdir(tempDir, { recursive: true })
    const dbPath = path.join(tempDir, "memory.db")
    Config.init({
      memory: {
        backend: "local",
        local: { dbPath },
      },
      orchestrator: { maxAgents: 10, defaultStrategy: "sequential", taskTimeout: 300000, retryAttempts: 3 },
      ui: { theme: "blue", compact: false, showTimestamps: true },
    })
    await Orchestrator.init({ projectPath: tempDir })
    await MemoryEngine.init({ projectPath: tempDir })
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    Config.reset()
  })

  describe("agent lifecycle", () => {
    test("should spawn and track agents", async () => {
      const agent = await Orchestrator.registerAgent({ type: "architect" })

      expect(agent.id).toBeDefined()
      expect(agent.type).toBe("architect")
      expect(agent.status).toBe("idle")
      expect(agent.capabilities).toContain("explore")
      expect(agent.capabilities).toContain("read")

      const retrieved = await Orchestrator.getAgent({ agentId: agent.id })
      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(agent.id)
    })

    test("should list agents by type", async () => {
      await Orchestrator.registerAgent({ type: "architect" })
      await Orchestrator.registerAgent({ type: "builder" })
      await Orchestrator.registerAgent({ type: "tester" })

      const allAgents = await Orchestrator.getAgents({})
      expect(allAgents.length).toBe(3)

      const builders = await Orchestrator.getAgents({ type: "builder" })
      expect(builders.length).toBe(1)
      expect(builders[0].type).toBe("builder")

      const idleAgents = await Orchestrator.getAgents({ status: "idle" })
      expect(idleAgents.length).toBe(3)
    })

    test("should accept valid agent types", async () => {
      const agent = await Orchestrator.registerAgent({ type: "architect" })
      expect(agent.type).toBe("architect")

      const agent2 = await Orchestrator.registerAgent({ type: "builder" })
      expect(agent2.type).toBe("builder")
    })
  })

  describe("task lifecycle", () => {
    test("should create and track tasks", async () => {
      const task = await Orchestrator.createTask({
        title: "Test Task",
        description: "A test task for validation",
        type: "explore",
        input: { target: "src/" },
      })

      expect(task.id).toBeDefined()
      expect(task.title).toBe("Test Task")
      expect(task.type).toBe("explore")
      expect(task.status).toBe("pending")

      const retrieved = await Orchestrator.getTask({ taskId: task.id })
      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(task.id)
    })

    test("should list tasks by status", async () => {
      await Orchestrator.createTask({
        title: "Task 1",
        description: "First task",
        type: "explore",
        input: {},
      })
      await Orchestrator.createTask({
        title: "Task 2",
        description: "Second task",
        type: "implement",
        input: {},
      })

      const allTasks = await Orchestrator.getTasks({})
      expect(allTasks.length).toBe(2)

      const exploreTasks = await Orchestrator.getTasks({ type: "explore" })
      expect(exploreTasks.length).toBe(1)
    })

    test("should route tasks to appropriate agents", async () => {
      await Orchestrator.registerAgent({ type: "architect" })
      await Orchestrator.registerAgent({ type: "builder" })

      const exploreTask = await Orchestrator.createTask({
        title: "Explore codebase",
        description: "Find all TypeScript files",
        type: "explore",
        input: { pattern: "**/*.ts" },
      })

      const route = await Orchestrator.routeTask({ taskId: exploreTask.id })

      expect(route.task).toBe(exploreTask.id)
      expect(route.agentId).toBeDefined()

      const architect = await Orchestrator.getAgent({ agentId: route.agentId })
      expect(architect?.type).toBe("architect")
    })

    test("should auto-spawn agents when routing", async () => {
      const task = await Orchestrator.createTask({
        title: "Auto-spawn test",
        description: "Testing auto-spawn",
        type: "implement",
        input: {},
      })

      const agentsBefore = await Orchestrator.getAgents({})
      expect(agentsBefore.length).toBe(0)

      const route = await Orchestrator.routeTask({ taskId: task.id })

      expect(route.agentId).toBeDefined()

      const agentsAfter = await Orchestrator.getAgents({})
      expect(agentsAfter.length).toBe(1)
      expect(agentsAfter[0].type).toBe("builder")
    })
  })

  describe("task execution", () => {
    test("should run task through start/complete cycle", async () => {
      const agent = await Orchestrator.registerAgent({ type: "tester" })
      const task = await Orchestrator.createTask({
        title: "Test cycle",
        description: "Testing task cycle",
        type: "test",
        input: {},
      })

      await Orchestrator.startTask({ taskId: task.id, agentId: agent.id })

      const runningTask = await Orchestrator.getTask({ taskId: task.id })
      expect(runningTask?.status).toBe("running")
      expect(runningTask?.assignedAgent).toBe(agent.id)

      const runningAgent = await Orchestrator.getAgent({ agentId: agent.id })
      expect(runningAgent?.status).toBe("active")
      expect(runningAgent?.currentTask).toBe(task.id)

      await Orchestrator.completeTask({
        taskId: task.id,
        result: { success: true, tests: 10 },
      })

      const completedTask = await Orchestrator.getTask({ taskId: task.id })
      expect(completedTask?.status).toBe("completed")
      expect(completedTask?.progress).toBe(100)
      expect(completedTask?.result).toEqual({ success: true, tests: 10 })

      const completedAgent = await Orchestrator.getAgent({ agentId: agent.id })
      expect(completedAgent?.status).toBe("idle")
      expect(completedAgent?.tasksCompleted).toBe(1)
    })

    test("should cancel running tasks", async () => {
      const agent = await Orchestrator.registerAgent({ type: "reviewer" })
      const task = await Orchestrator.createTask({
        title: "Cancel test",
        description: "Testing cancellation",
        type: "review",
        input: {},
      })

      await Orchestrator.startTask({ taskId: task.id, agentId: agent.id })
      await Orchestrator.cancelTask({ taskId: task.id })

      const cancelledTask = await Orchestrator.getTask({ taskId: task.id })
      expect(cancelledTask?.status).toBe("failed")
      expect(cancelledTask?.error).toBe("Cancelled")

      const freeAgent = await Orchestrator.getAgent({ agentId: agent.id })
      expect(freeAgent?.status).toBe("idle")
    })
  })

  describe("task dependencies", () => {
    test("should track task dependencies", async () => {
      const task1 = await Orchestrator.createTask({
        title: "First task",
        description: "Independent task",
        type: "explore",
        input: {},
      })

      const task2 = await Orchestrator.createTask({
        title: "Second task",
        description: "Depends on first",
        type: "implement",
        input: {},
        dependencies: [task1.id],
      })

      expect(task2.dependencies).toContain(task1.id)
    })
  })

  describe("subagent type mapping", () => {
    test("should map agent types to subagent types", async () => {
      const mappings: Array<{ agentType: AgentType; expected: string }> = [
        { agentType: "architect", expected: "explore" },
        { agentType: "builder", expected: "code" },
        { agentType: "tester", expected: "code" },
        { agentType: "reviewer", expected: "code" },
        { agentType: "memory-keeper", expected: "code" },
        { agentType: "coordinator", expected: "general" },
      ]

      for (const { agentType, expected } of mappings) {
        const subagentType = await Orchestrator.getSubagentType({ agentType })
        expect(subagentType).toBe(expected)
      }
    })
  })
})

describe("Memory Integration", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), "orca-memory-e2e-" + Math.random().toString(36).slice(2))
    await fs.mkdir(tempDir, { recursive: true })
    const dbPath = path.join(tempDir, "memory.db")
    Config.init({
      memory: {
        backend: "local",
        local: { dbPath },
      },
      orchestrator: { maxAgents: 10, defaultStrategy: "sequential", taskTimeout: 300000, retryAttempts: 3 },
      ui: { theme: "blue", compact: false, showTimestamps: true },
    })
    await MemoryEngine.init({ projectPath: tempDir })
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    Config.reset()
  })

  test("should store and recall memories", async () => {
    await MemoryEngine.store({
      key: "test-pattern-1",
      title: "Test Pattern",
      content: "This is a test pattern for validation",
      category: "pattern",
    })

    const recalled = await MemoryEngine.recall({ key: "test-pattern-1", includeRelated: false })
    expect(recalled).not.toBeNull()
    expect(recalled?.memory.title).toBe("Test Pattern")
  })

  test("should search memories", async () => {
    await MemoryEngine.store({
      key: "decision-1",
      title: "Use TypeScript",
      content: "Decided to use TypeScript for type safety",
      category: "decision",
    })
    await MemoryEngine.store({
      key: "decision-2",
      title: "Use Bun runtime",
      content: "Decided to use Bun for faster execution",
      category: "decision",
    })

    const results = await MemoryEngine.search({
      query: "TypeScript",
      categories: ["decision"],
      limit: 10,
      minScore: 0.1,
      includeContent: true,
    })

    expect(results.length).toBeGreaterThanOrEqual(1)
    const decisionResults = results.filter((r) => r.memory.category === "decision")
    expect(decisionResults.length).toBeGreaterThanOrEqual(1)
  })

  test("should list memories with filters", async () => {
    await MemoryEngine.store({
      key: "list-test-1",
      title: "First memory",
      content: "Content 1",
      category: "context",
    })
    await MemoryEngine.store({
      key: "list-test-2",
      title: "Second memory",
      content: "Content 2",
      category: "context",
    })

    const all = await MemoryEngine.list({
      category: "context",
      limit: 10,
      offset: 0,
      sortBy: "createdAt",
      sortOrder: "desc",
    })

    expect(all.items.length).toBeGreaterThanOrEqual(2)
    expect(all.total).toBeGreaterThanOrEqual(2)
  })

  test("should list memories by keys", async () => {
    await MemoryEngine.store({
      key: "key-lookup-1",
      title: "Key lookup test 1",
      content: "Content",
      category: "lesson",
    })
    await MemoryEngine.store({
      key: "key-lookup-2",
      title: "Key lookup test 2",
      content: "Content",
      category: "lesson",
    })
    await MemoryEngine.store({
      key: "key-lookup-3",
      title: "Not included",
      content: "Content",
      category: "lesson",
    })

    const filtered = await MemoryEngine.list({
      keys: ["key-lookup-1", "key-lookup-2"],
      limit: 10,
      offset: 0,
      sortBy: "createdAt",
      sortOrder: "desc",
    })

    expect(filtered.items.length).toBe(2)
    const keys = filtered.items.map((m) => m.key)
    expect(keys).toContain("key-lookup-1")
    expect(keys).toContain("key-lookup-2")
    expect(keys).not.toContain("key-lookup-3")
  })

  test("should update memory access count", async () => {
    await MemoryEngine.store({
      key: "access-test",
      title: "Access count test",
      content: "Testing access count",
      category: "pattern",
    })

    const before = await MemoryEngine.recall({ key: "access-test", includeRelated: false })
    expect(before?.memory.accessCount).toBe(0)

    await MemoryEngine.recall({ key: "access-test", includeRelated: false })

    const after = await MemoryEngine.get({ id: before!.memory.id })
    expect(after?.accessCount).toBe(2)
  })

  test("should delete memories", async () => {
    await MemoryEngine.store({
      key: "delete-test",
      title: "To be deleted",
      content: "This will be deleted",
      category: "todo",
    })

    const before = await MemoryEngine.recall({ key: "delete-test", includeRelated: false })
    expect(before).not.toBeNull()

    await MemoryEngine.delete_({ id: before!.memory.id, cascade: false })

    const after = await MemoryEngine.recall({ key: "delete-test", includeRelated: false })
    expect(after).toBeNull()
  })
})
