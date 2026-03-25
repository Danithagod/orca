import { z } from "zod"
import path from "path"
import os from "os"

const MemoryBackendConfig = z.object({
  dbPath: z.string(),
  embeddingModel: z.string().optional(),
  vectorDimensions: z.number().optional(),
})
export type MemoryBackendConfig = z.infer<typeof MemoryBackendConfig>

const Mem0BackendConfig = z.object({
  apiKey: z.string().optional(),
  projectId: z.string().optional(),
  baseUrl: z.string().optional(),
})
export type Mem0BackendConfig = z.infer<typeof Mem0BackendConfig>

const LettaBackendConfig = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  agentId: z.string().optional(),
})
export type LettaBackendConfig = z.infer<typeof LettaBackendConfig>

const EmbeddingConfig = z.object({
  provider: z.enum(["openai", "local", "none"]).default("none"),
  model: z.string().optional(),
  dimensions: z.number().optional(),
  apiKey: z.string().optional(),
})
export type EmbeddingConfig = z.infer<typeof EmbeddingConfig>

const OrchestratorConfig = z.object({
  maxAgents: z.number().default(10),
  defaultStrategy: z.enum(["sequential", "parallel", "hierarchical", "collaborative"]).default("sequential"),
  taskTimeout: z.number().default(300000),
  retryAttempts: z.number().default(3),
})
export type OrchestratorConfig = z.infer<typeof OrchestratorConfig>

const OrcaConfig = z.object({
  memory: z.object({
    backend: z.enum(["local", "mem0", "letta"]).default("local"),
    local: MemoryBackendConfig,
    mem0: Mem0BackendConfig.optional(),
    letta: LettaBackendConfig.optional(),
    embedding: EmbeddingConfig.optional(),
  }),
  orchestrator: OrchestratorConfig,
  ui: z.object({
    theme: z.enum(["dark", "light", "blue"]).default("blue"),
    compact: z.boolean().default(false),
    showTimestamps: z.boolean().default(true),
  }),
})
export type OrcaConfig = z.infer<typeof OrcaConfig>

function getDefaultDbPath(): string {
  const homeDir = os.homedir()
  const dataDir = path.join(homeDir, ".local", "share", "kilo", "orca")
  return path.join(dataDir, "memory.db")
}

let currentConfig: OrcaConfig | null = null

function getDefaultConfig(): OrcaConfig {
  return {
    memory: {
      backend: "local",
      local: {
        dbPath: getDefaultDbPath(),
      },
      embedding: {
        provider: "none",
      },
    },
    orchestrator: {
      maxAgents: 10,
      defaultStrategy: "sequential",
      taskTimeout: 300000,
      retryAttempts: 3,
    },
    ui: {
      theme: "blue",
      compact: false,
      showTimestamps: true,
    },
  }
}

export namespace Config {
  export const init = (config?: Partial<OrcaConfig>): OrcaConfig => {
    const defaults = getDefaultConfig()
    currentConfig = {
      memory: {
        ...defaults.memory,
        ...config?.memory,
        local: { ...defaults.memory.local, ...config?.memory?.local },
      },
      orchestrator: { ...defaults.orchestrator, ...config?.orchestrator },
      ui: { ...defaults.ui, ...config?.ui },
    }
    return currentConfig
  }

  export const get = (): OrcaConfig => {
    if (!currentConfig) return getDefaultConfig()
    return currentConfig
  }

  export const getMemoryConfig = () => Config.get().memory
  export const getOrchestratorConfig = () => Config.get().orchestrator
  export const getUiConfig = () => Config.get().ui
  export const getEmbeddingConfig = () => Config.get().memory.embedding ?? { provider: "none" as const }

  export const reset = (): void => {
    currentConfig = null
  }
}
