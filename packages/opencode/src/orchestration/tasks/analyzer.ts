import type { Task, TaskAnalysis, TaskType } from "./index"
import type { AgentCapability } from "../types"
import { setTaskAnalysis } from "./index"

const TASK_KEYWORDS: Record<TaskType, string[]> = {
  explore: [
    "find",
    "search",
    "explore",
    "discover",
    "understand",
    "analyze codebase",
    "locate",
    "where is",
    "how does",
  ],
  implement: ["create", "implement", "build", "write", "add", "make", "develop", "generate", "new file", "modify"],
  test: ["test", "spec", "validate", "verify", "check", "ensure", "coverage", "unit test", "integration test"],
  review: ["review", "refactor", "improve", "optimize", "security", "performance", "quality", "check"],
  generic: [],
}

type ComplexityLevel = "low" | "medium" | "high" | "very_high"

const COMPLEXITY_INDICATORS: Record<TaskType, { keywords: string[]; complexity: ComplexityLevel }[]> = {
  explore: [
    { keywords: ["multiple", "various", "several", "all"], complexity: "high" },
    { keywords: ["thorough", "comprehensive", "complete", "full"], complexity: "high" },
    { keywords: ["quick", "simple", "single", "one"], complexity: "low" },
  ],
  implement: [
    { keywords: ["complex", "multiple files", "many", "several components"], complexity: "high" },
    { keywords: ["simple", "single", "one file", "straightforward"], complexity: "low" },
    { keywords: ["medium", "moderate", "standard"], complexity: "medium" },
  ],
  test: [
    { keywords: ["full", "complete", "comprehensive", "all cases"], complexity: "high" },
    { keywords: ["basic", "simple", "happy path", "single"], complexity: "low" },
  ],
  review: [
    { keywords: ["security", "performance", "architecture", "design patterns"], complexity: "high" },
    { keywords: ["quick", "simple", "style", "formatting"], complexity: "low" },
  ],
  generic: [
    { keywords: ["complex", "difficult", "challenging"], complexity: "high" },
    { keywords: ["simple", "easy", "straightforward"], complexity: "low" },
  ],
}

const CAPABILITY_MAP: Record<TaskType, { capability: AgentCapability; level: "primary" | "secondary" }[]> = {
  explore: [
    { capability: "explore", level: "primary" },
    { capability: "read", level: "primary" },
  ],
  implement: [
    { capability: "write", level: "primary" },
    { capability: "edit", level: "primary" },
    { capability: "read", level: "secondary" },
  ],
  test: [
    { capability: "test", level: "primary" },
    { capability: "execute", level: "primary" },
    { capability: "write", level: "secondary" },
  ],
  review: [
    { capability: "review", level: "primary" },
    { capability: "read", level: "primary" },
    { capability: "explore", level: "secondary" },
  ],
  generic: [
    { capability: "read", level: "primary" },
    { capability: "write", level: "secondary" },
  ],
}

const DURATION_ESTIMATES: Record<TaskType, Record<ComplexityLevel, number>> = {
  explore: { low: 10000, medium: 30000, high: 60000, very_high: 90000 },
  implement: { low: 30000, medium: 90000, high: 180000, very_high: 240000 },
  test: { low: 20000, medium: 60000, high: 120000, very_high: 180000 },
  review: { low: 15000, medium: 45000, high: 90000, very_high: 120000 },
  generic: { low: 10000, medium: 30000, high: 60000, very_high: 90000 },
}

export function classifyTaskType(description: string): { type: TaskType; confidence: number } {
  const lowerDesc = description.toLowerCase()

  let bestMatch: TaskType = "generic"
  let highestScore = 0

  for (const [taskType, keywords] of Object.entries(TASK_KEYWORDS)) {
    if (taskType === "generic") continue

    let score = 0
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        score += 1
      }
    }

    if (score > highestScore) {
      highestScore = score
      bestMatch = taskType as TaskType
    }
  }

  const confidence = highestScore > 0 ? Math.min(highestScore / 3, 1.0) : 0.5

  return { type: bestMatch, confidence }
}

export function estimateComplexity(
  taskType: TaskType,
  description: string,
  context: Record<string, unknown>,
): ComplexityLevel {
  const lowerDesc = description.toLowerCase()

  const indicators = COMPLEXITY_INDICATORS[taskType]

  for (const indicator of indicators) {
    for (const keyword of indicator.keywords) {
      if (lowerDesc.includes(keyword)) {
        return indicator.complexity
      }
    }
  }

  if (lowerDesc.length > 500) return "high"
  if (lowerDesc.length > 200) return "medium"
  return "low"
}

export function getRequiredCapabilities(taskType: TaskType): AgentCapability[] {
  const mapped = CAPABILITY_MAP[taskType]
  return [...new Set(mapped.map((m) => m.capability))]
}

export function estimateDuration(taskType: TaskType, complexity: ComplexityLevel): number {
  const estimates = DURATION_ESTIMATES[taskType]
  return estimates[complexity]
}

export function analyzeTask(task: Task): TaskAnalysis {
  const { type, confidence: typeConfidence } = classifyTaskType(task.description)
  const complexity = estimateComplexity(task.type, task.description, task.context)
  const capabilities = getRequiredCapabilities(type)
  const duration = estimateDuration(type, complexity)

  const recommendedAgentType = mapTypeToAgentType(type)

  const analysis: TaskAnalysis = {
    taskId: task.id,
    classifiedType: type,
    estimatedComplexity: complexity,
    requiredCapabilities: capabilities,
    estimatedDuration: duration,
    dependencies: task.dependencies,
    recommendedAgentType,
    confidence: typeConfidence,
  }

  setTaskAnalysis(analysis)
  return analysis
}

function mapTypeToAgentType(taskType: TaskType): string | undefined {
  const mapping: Record<TaskType, string | undefined> = {
    explore: "architect",
    implement: "builder",
    test: "tester",
    review: "reviewer",
    generic: undefined,
  }
  return mapping[taskType]
}

export const TaskAnalyzer = {
  classify(description: string): { type: TaskType; confidence: number } {
    return classifyTaskType(description)
  },

  complexity(taskType: TaskType, description: string, context: Record<string, unknown>): ComplexityLevel {
    return estimateComplexity(taskType, description, context)
  },

  capabilities(taskType: TaskType): AgentCapability[] {
    return getRequiredCapabilities(taskType)
  },

  duration(taskType: TaskType, complexity: ComplexityLevel): number {
    return estimateDuration(taskType, complexity)
  },

  analyze(task: Task): TaskAnalysis {
    return analyzeTask(task)
  },

  reanalysis(task: Task): TaskAnalysis {
    return analyzeTask(task)
  },
}
