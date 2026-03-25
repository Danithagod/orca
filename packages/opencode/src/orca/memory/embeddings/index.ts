import { z } from "zod"

export const EmbedderConfig = z.object({
  provider: z.enum(["openai", "local", "none"]),
  model: z.string().optional(),
  dimensions: z.number().optional(),
  apiKey: z.string().optional(),
})
export type EmbedderConfig = z.infer<typeof EmbedderConfig>

export interface EmbeddingResult {
  embedding: number[]
  dimensions: number
  model: string
  usage?: {
    promptTokens: number
    totalTokens: number
  }
}

export interface Embedder {
  embed(text: string): Promise<EmbeddingResult>
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>
  getDimensions(): number
  getModel(): string
}

export namespace EmbedderFactory {
  export async function create(config: EmbedderConfig): Promise<Embedder> {
    switch (config.provider) {
      case "openai":
        return new OpenAIEmbedder(config)
      case "local":
        return new LocalEmbedder(config)
      case "none":
      default:
        return new NoOpEmbedder()
    }
  }
}

class NoOpEmbedder implements Embedder {
  async embed(_text: string): Promise<EmbeddingResult> {
    return { embedding: [], dimensions: 0, model: "none" }
  }
  async embedBatch(_texts: string[]): Promise<EmbeddingResult[]> {
    return []
  }
  getDimensions(): number {
    return 0
  }
  getModel(): string {
    return "none"
  }
}

class OpenAIEmbedder implements Embedder {
  private model: string
  private dimensions: number
  private apiKey?: string

  constructor(config: EmbedderConfig) {
    this.model = config.model ?? "text-embedding-3-small"
    this.dimensions = config.dimensions ?? 1536
    this.apiKey = config.apiKey ?? process.env.OPENAI_API_KEY
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.apiKey) throw new Error("OpenAI API key required")

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: this.model,
        dimensions: this.dimensions,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI embedding failed: ${error}`)
    }

    const data = await response.json()
    const embedding = data.data[0].embedding

    return {
      embedding,
      dimensions: embedding.length,
      model: this.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        totalTokens: data.usage.total_tokens,
      },
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.apiKey) throw new Error("OpenAI API key required")

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
        dimensions: this.dimensions,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI embedding failed: ${error}`)
    }

    const data = await response.json()
    return data.data.map((item: any) => ({
      embedding: item.embedding,
      dimensions: item.embedding.length,
      model: this.model,
    }))
  }

  getDimensions(): number {
    return this.dimensions
  }

  getModel(): string {
    return this.model
  }
}

class LocalEmbedder implements Embedder {
  private model: string
  private dimensions: number

  constructor(config: EmbedderConfig) {
    this.model = config.model ?? "all-MiniLM-L6-v2"
    this.dimensions = config.dimensions ?? 384
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const embedding = this.generateHashEmbedding(text)
    return {
      embedding,
      dimensions: this.dimensions,
      model: this.model,
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return texts.map((text) => ({
      embedding: this.generateHashEmbedding(text),
      dimensions: this.dimensions,
      model: this.model,
    }))
  }

  getDimensions(): number {
    return this.dimensions
  }

  getModel(): string {
    return this.model
  }

  private generateHashEmbedding(text: string): number[] {
    const embedding: number[] = []
    const seed = this.hashCode(text)
    let state = seed

    for (let i = 0; i < this.dimensions; i++) {
      state = this.xorshift(state)
      embedding.push((state % 10000) / 10000 - 0.5)
    }

    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0))
    return embedding.map((v) => v / magnitude)
  }

  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash
  }

  private xorshift(state: number): number {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return state
  }
}
