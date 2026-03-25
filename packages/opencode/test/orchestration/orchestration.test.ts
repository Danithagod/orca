import { test, expect, beforeEach } from "bun:test"
import { OrchestrationAgents } from "../../src/orchestration/agents"
import { TaskSystem } from "../../src/orchestration/tasks"
import { TaskAnalyzer } from "../../src/orchestration/tasks/analyzer"
import { AgentSelector } from "../../src/orchestration/selector"
import { StateManagement } from "../../src/orchestration/state"

beforeEach(async () => {
  await OrchestrationAgents.clear()
  TaskSystem.clear()
})

test("OrchestrationAgents - spawn creates agent with correct defaults", async () => {
  const architect = await OrchestrationAgents.spawn("architect")

  expect(architect.id).toBeDefined()
  expect(architect.type).toBe("architect")
  expect(architect.name).toBe("Architect")
  expect(architect.status).toBe("idle")
  expect(architect.capabilities).toHaveLength(4)
  expect(architect.capabilities.some((c) => c.name === "explore")).toBe(true)
  expect(architect.capabilities.some((c) => c.name === "plan")).toBe(true)
  expect(architect.metrics.tasksCompleted).toBe(0)
  expect(architect.metrics.successRate).toBe(1.0)
})

test("OrchestrationAgents - spawn all agent types", async () => {
  const types = ["architect", "builder", "tester", "reviewer", "memory-keeper", "orchestrator"] as const

  for (const type of types) {
    const agent = await OrchestrationAgents.spawn(type)
    expect(agent.type).toBe(type)
    expect(agent.status).toBe("idle")
  }
})

test("OrchestrationAgents - spawn with custom config", async () => {
  const agent = await OrchestrationAgents.spawn("builder", {
    name: "CustomBuilder",
    description: "Custom builder for testing",
  })

  expect(agent.name).toBe("CustomBuilder")
  expect(agent.type).toBe("builder")
})

test("OrchestrationAgents - list returns all spawned agents", async () => {
  await OrchestrationAgents.spawn("architect")
  await OrchestrationAgents.spawn("builder")
  await OrchestrationAgents.spawn("tester")

  const agents = await OrchestrationAgents.list()
  expect(agents).toHaveLength(3)
})

test("OrchestrationAgents - update metrics", async () => {
  const agent = await OrchestrationAgents.spawn("builder")

  await OrchestrationAgents.updateMetrics(agent.id, 1000, true)
  const updated = await OrchestrationAgents.get(agent.id)

  expect(updated?.metrics.tasksCompleted).toBe(1)
  expect(updated?.metrics.tasksFailed).toBe(0)
  expect(updated?.metrics.totalDuration).toBe(1000)
  expect(updated?.metrics.averageDuration).toBe(1000)
  expect(updated?.metrics.successRate).toBe(1.0)
})

test("OrchestrationAgents - update metrics with failure", async () => {
  const agent = await OrchestrationAgents.spawn("tester")

  await OrchestrationAgents.updateMetrics(agent.id, 500, true)
  await OrchestrationAgents.updateMetrics(agent.id, 500, false)

  const updated = await OrchestrationAgents.get(agent.id)
  expect(updated?.metrics.tasksCompleted).toBe(2)
  expect(updated?.metrics.tasksFailed).toBe(1)
  expect(updated?.metrics.successRate).toBe(0.5)
})

test("OrchestrationAgents - update status", async () => {
  const agent = await OrchestrationAgents.spawn("architect")

  await OrchestrationAgents.updateStatus(agent.id, "active", "task-123")
  const updated = await OrchestrationAgents.get(agent.id)

  expect(updated?.status).toBe("active")
  expect(updated?.currentTaskId).toBe("task-123")
})

test("TaskSystem - create task with defaults", () => {
  const task = TaskSystem.create({
    title: "Test Task",
    description: "A test task",
  })

  expect(task.id).toBeDefined()
  expect(task.title).toBe("Test Task")
  expect(task.description).toBe("A test task")
  expect(task.type).toBe("generic")
  expect(task.status).toBe("pending")
  expect(task.priority).toBe("medium")
  expect(task.progress).toBe(0)
  expect(task.attempts).toBe(0)
  expect(task.maxAttempts).toBe(3)
})

test("TaskSystem - create task with all options", () => {
  const task = TaskSystem.create({
    title: "Full Task",
    description: "Task with all options",
    type: "implement",
    priority: "critical",
    dependencies: ["dep1", "dep2"],
    input: { key: "value" },
    maxAttempts: 5,
  })

  expect(task.type).toBe("implement")
  expect(task.priority).toBe("critical")
  expect(task.dependencies).toEqual(["dep1", "dep2"])
  expect(task.input).toEqual({ key: "value" })
  expect(task.maxAttempts).toBe(5)
})

test("TaskSystem - assign and complete task", () => {
  const task = TaskSystem.create({
    title: "Task to Assign",
    description: "Will be assigned",
  })

  const assigned = TaskSystem.assign(task.id, "agent-123")
  expect(assigned?.assignedAgentId).toBe("agent-123")
  expect(assigned?.status).toBe("queued")

  const completed = TaskSystem.complete(task.id, { result: "success" })
  expect(completed?.status).toBe("completed")
  expect(completed?.progress).toBe(100)
  expect(completed?.result).toEqual({ result: "success" })
})

test("TaskSystem - fail task respects max attempts", () => {
  const task = TaskSystem.create({
    title: "Failable Task",
    description: "Will fail multiple times",
    maxAttempts: 2,
  })

  const firstFail = TaskSystem.fail(task.id, "First error")
  expect(firstFail?.status).toBe("pending")
  expect(firstFail?.attempts).toBe(1)
  expect(firstFail?.error).toBe("First error")

  const secondFail = TaskSystem.fail(task.id, "Second error")
  expect(secondFail?.status).toBe("failed")
  expect(secondFail?.attempts).toBe(2)
})

test("TaskSystem - cancel task", () => {
  const task = TaskSystem.create({
    title: "Cancelable Task",
    description: "Can be cancelled",
  })

  TaskSystem.update(task.id, { status: "running" })
  const cancelled = TaskSystem.cancel(task.id)

  expect(cancelled?.status).toBe("cancelled")
  expect(cancelled?.duration).toBeDefined()
})

test("TaskSystem - pending tasks sorted by priority", () => {
  TaskSystem.create({ title: "Low", description: "low", priority: "low" })
  TaskSystem.create({ title: "Critical", description: "critical", priority: "critical" })
  TaskSystem.create({ title: "Medium", description: "medium", priority: "medium" })

  const pending = TaskSystem.pending()
  expect(pending[0].priority).toBe("critical")
  expect(pending[1].priority).toBe("medium")
  expect(pending[2].priority).toBe("low")
})

test("TaskSystem - executable tasks respect dependencies", () => {
  const task1 = TaskSystem.create({ title: "Task 1", description: "First" })
  const task2 = TaskSystem.create({
    title: "Task 2",
    description: "Depends on Task 1",
    dependencies: [task1.id],
  })

  const executable = TaskSystem.executable()
  expect(executable.some((t) => t.id === task1.id)).toBe(true)
  expect(executable.some((t) => t.id === task2.id)).toBe(false)

  TaskSystem.complete(task1.id, { done: true })

  const executableAfter = TaskSystem.executable()
  expect(executableAfter.some((t) => t.id === task2.id)).toBe(true)
})

test("TaskAnalyzer - analyze task", () => {
  const task = TaskSystem.create({
    title: "Implement login feature",
    description: "Create authentication system",
    type: "implement",
  })

  const analysis = TaskAnalyzer.analyze(task)

  expect(analysis.taskId).toBe(task.id)
  expect(analysis.classifiedType).toBe("implement")
  expect(analysis.requiredCapabilities).toContain("write")
  expect(analysis.requiredCapabilities).toContain("edit")
  expect(analysis.requiredCapabilities).toContain("read")
  expect(["low", "medium", "high", "very_high"]).toContain(analysis.estimatedComplexity)
  expect(analysis.estimatedDuration).toBeGreaterThan(0)
  expect(analysis.confidence).toBeGreaterThan(0)
  expect(analysis.confidence).toBeLessThanOrEqual(1)
})

test("TaskAnalyzer - explore task requires explore capability", () => {
  const task = TaskSystem.create({
    title: "Explore codebase",
    description: "Understand project structure",
    type: "explore",
  })

  const analysis = TaskAnalyzer.analyze(task)

  expect(analysis.classifiedType).toBe("explore")
  expect(analysis.requiredCapabilities).toContain("explore")
  expect(analysis.requiredCapabilities).toContain("read")
})

test("TaskAnalyzer - review task requires review capability", () => {
  const task = TaskSystem.create({
    title: "Review PR changes",
    description: "Code review for pull request",
    type: "review",
  })

  const analysis = TaskAnalyzer.analyze(task)

  expect(analysis.classifiedType).toBe("review")
  expect(analysis.requiredCapabilities).toContain("review")
})

test("AgentSelector - score agents for task", async () => {
  const builder = await OrchestrationAgents.spawn("builder")
  const architect = await OrchestrationAgents.spawn("architect")
  const tester = await OrchestrationAgents.spawn("tester")

  const task = TaskSystem.create({
    title: "Build new feature",
    description: "Implement a feature",
    type: "implement",
  })

  const analysis = TaskAnalyzer.analyze(task)

  const builderScore = AgentSelector.score(builder, analysis)
  expect(builderScore.agentType).toBe("builder")
  expect(builderScore.totalScore).toBeGreaterThan(0)

  const architectScore = AgentSelector.score(architect, analysis)
  expect(architectScore.totalScore).toBeGreaterThan(0)

  const testerScore = AgentSelector.score(tester, analysis)
  expect(testerScore.totalScore).toBeGreaterThan(0)
})

test("AgentSelector - best agent selected", async () => {
  await OrchestrationAgents.spawn("architect")
  const builder = await OrchestrationAgents.spawn("builder")
  await OrchestrationAgents.spawn("tester")

  const task = TaskSystem.create({
    title: "Write code",
    description: "Implement features",
    type: "implement",
  })

  const analysis = TaskAnalyzer.analyze(task)
  const best = await AgentSelector.best(analysis)

  expect(best).toBeDefined()
  expect(best?.agentType).toBe("builder")
})

test("StateManagement - start and check heartbeat", async () => {
  const agent = await OrchestrationAgents.spawn("architect")

  await StateManagement.startHeartbeat(agent.id)

  const health = await StateManagement.health(agent.id)
  expect(health.status).toBe("healthy")
  expect(health.agentId).toBe(agent.id)
})

test("StateManagement - current state reflects agents", async () => {
  await OrchestrationAgents.spawn("architect")
  await OrchestrationAgents.spawn("builder")

  const task = TaskSystem.create({ title: "Task 1", description: "desc" })

  const state = await StateManagement.current()

  expect(state.agents.total).toBe(2)
  expect(state.agents.idle).toBe(2)
  expect(state.tasks.total).toBe(1)
  expect(state.tasks.pending).toBe(1)
})

test("cyclic dependency detection", () => {
  const task1 = TaskSystem.create({ title: "Task 1", description: "First" })
  const task2 = TaskSystem.create({ title: "Task 2", description: "Second", dependencies: [task1.id] })

  expect(TaskSystem.hasCycles(task2.id, [task1.id])).toBe(false)

  expect(TaskSystem.hasCycles(task1.id, [task2.id])).toBe(true)
})

test("dependency graph generation", () => {
  const task1 = TaskSystem.create({ title: "Task 1", description: "First" })
  const task2 = TaskSystem.create({ title: "Task 2", description: "Second", dependencies: [task1.id] })

  const graph = TaskSystem.dependencyGraph()

  expect(graph.get(task1.id)).toEqual([])
  expect(graph.get(task2.id)).toEqual([task1.id])
})
