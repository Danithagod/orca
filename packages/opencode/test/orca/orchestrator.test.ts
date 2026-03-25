import { describe, expect, test, beforeEach } from "bun:test"
import path from "path"
import os from "os"
import fs from "fs/promises"
import { Orchestrator } from "../../src/orca/orchestrator"

describe("Orchestrator", () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), "orca-orchestrator-test-" + Math.random().toString(36).slice(2))
    await fs.mkdir(tmpDir, { recursive: true })
    await Orchestrator.init({ projectPath: tmpDir })
  })

  describe("registerAgent", () => {
    test("registers an architect agent", async () => {
      const agent = await Orchestrator.registerAgent({ type: "architect" })

      expect(agent.id).toBeDefined()
      expect(agent.type).toBe("architect")
      expect(agent.name).toBe("Architect")
      expect(agent.status).toBe("idle")
      expect(agent.capabilities).toContain("explore")
      expect(agent.capabilities).toContain("read")
      expect(agent.capabilities).toContain("plan")
    })

    test("registers a builder agent", async () => {
      const agent = await Orchestrator.registerAgent({ type: "builder" })

      expect(agent.type).toBe("builder")
      expect(agent.name).toBe("Builder")
      expect(agent.capabilities).toContain("read")
      expect(agent.capabilities).toContain("write")
      expect(agent.capabilities).toContain("execute")
    })

    test("registers a coordinator agent", async () => {
      const agent = await Orchestrator.registerAgent({ type: "coordinator" })

      expect(agent.type).toBe("coordinator")
      expect(agent.capabilities).toContain("plan")
      expect(agent.capabilities).toContain("memory")
    })
  })

  describe("createTask", () => {
    test("creates a task with required fields", async () => {
      const task = await Orchestrator.createTask({
        title: "Test Task",
        description: "A task for testing",
        type: "implement",
        input: { file: "test.ts" },
      })

      expect(task.id).toBeDefined()
      expect(task.title).toBe("Test Task")
      expect(task.type).toBe("implement")
      expect(task.status).toBe("pending")
      expect(task.priority).toBe("medium")
      expect(task.progress).toBe(0)
    })

    test("creates a task with priority", async () => {
      const task = await Orchestrator.createTask({
        title: "High Priority Task",
        description: "Urgent task",
        type: "implement",
        input: {},
        priority: "high",
      })

      expect(task.priority).toBe("high")
    })
  })

  describe("routeTask", () => {
    test("routes explore task to architect", async () => {
      await Orchestrator.registerAgent({ type: "architect" })
      const task = await Orchestrator.createTask({
        title: "Explore Codebase",
        description: "Explore the codebase structure",
        type: "explore",
        input: {},
      })

      const result = await Orchestrator.routeTask({ taskId: task.id })
      expect(result.agentId).toBeDefined()
    })

    test("routes implement task to builder", async () => {
      await Orchestrator.registerAgent({ type: "builder" })
      const task = await Orchestrator.createTask({
        title: "Build Feature",
        description: "Implement a new feature",
        type: "implement",
        input: {},
      })

      const result = await Orchestrator.routeTask({ taskId: task.id })
      expect(result.agentId).toBeDefined()
    })
  })

  describe("executeTask", () => {
    test("executes a task with an agent", async () => {
      const agent = await Orchestrator.registerAgent({ type: "architect" })
      const task = await Orchestrator.createTask({
        title: "Test Execution",
        description: "Test task execution",
        type: "explore",
        input: {},
      })

      const result = await Orchestrator.executeTask({ taskId: task.id, agentId: agent.id })

      expect(result.status).toBe("completed")
      expect(result.taskId).toBe(task.id)
      expect(result.agentId).toBe(agent.id)
    })

    test("auto-routes if no agent specified", async () => {
      await Orchestrator.registerAgent({ type: "tester" })
      const task = await Orchestrator.createTask({
        title: "Auto Routed Task",
        description: "Test auto routing",
        type: "test",
        input: {},
      })

      const result = await Orchestrator.executeTask({ taskId: task.id })
      expect(result.status).toBe("completed")
    })
  })

  describe("getAgent / getAgents", () => {
    test("gets agent by id", async () => {
      const agent = await Orchestrator.registerAgent({ type: "reviewer" })
      const retrieved = await Orchestrator.getAgent({ agentId: agent.id })

      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(agent.id)
      expect(retrieved?.type).toBe("reviewer")
    })

    test("returns null for non-existent agent", async () => {
      const result = await Orchestrator.getAgent({ agentId: "non-existent-id" })
      expect(result).toBeNull()
    })

    test("lists all agents", async () => {
      await Orchestrator.registerAgent({ type: "architect" })
      await Orchestrator.registerAgent({ type: "builder" })

      const agents = await Orchestrator.getAgents({})
      expect(agents.length).toBeGreaterThanOrEqual(2)
    })

    test("filters agents by status", async () => {
      await Orchestrator.registerAgent({ type: "architect" })

      const idleAgents = await Orchestrator.getAgents({ status: "idle" })
      expect(idleAgents.every((a) => a.status === "idle")).toBe(true)
    })
  })

  describe("getTask / getTasks", () => {
    test("gets task by id", async () => {
      const task = await Orchestrator.createTask({
        title: "Get Task Test",
        description: "Test getting task",
        type: "generic",
        input: {},
      })

      const retrieved = await Orchestrator.getTask({ taskId: task.id })
      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(task.id)
    })

    test("lists all tasks", async () => {
      await Orchestrator.createTask({
        title: "Task 1",
        description: "First task",
        type: "generic",
        input: {},
      })
      await Orchestrator.createTask({
        title: "Task 2",
        description: "Second task",
        type: "generic",
        input: {},
      })

      const tasks = await Orchestrator.getTasks({})
      expect(tasks.length).toBeGreaterThanOrEqual(2)
    })
  })
})
