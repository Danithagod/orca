import type { Memory, MemoryCategory } from "../types"

export interface SearchQuery {
  query: string
  categories?: MemoryCategory[]
  tags?: string[]
  limit: number
  minScore: number
}

export interface ListFilter {
  category?: MemoryCategory
  tags?: string[]
  keys?: string[]
  limit: number
  offset: number
  sortBy: "createdAt" | "updatedAt" | "accessCount"
  sortOrder: "asc" | "desc"
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  hasMore: boolean
}

export interface MemoryBackend {
  init(): Promise<void>
  create(memory: Memory): Promise<Memory>
  get(id: string): Promise<Memory | null>
  getByKey(key: string): Promise<Memory | null>
  getMany(ids: string[]): Promise<Memory[]>
  update(id: string, updates: Partial<Memory>): Promise<Memory>
  delete(id: string): Promise<void>
  deleteCascade(id: string): Promise<void>
  search(query: SearchQuery): Promise<{ memory: Memory; score: number }[]>
  list(filter: ListFilter): Promise<PaginatedResult<Memory>>
  updateAccess(id: string): Promise<void>
  getByProject(projectPath: string): Promise<Memory[]>
  clearProject(projectPath: string): Promise<void>
}
