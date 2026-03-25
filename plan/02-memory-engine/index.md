# Phase 2: Memory Engine

**Duration:** Week 3-4  
**Status:** Not Started  
**Depends on:** Phase 1 (Foundation)

---

## Objectives

- Implement persistent memory system
- Enable context preservation across sessions
- Integrate memory with tool execution
- Support multiple storage backends

---

## Tasks

### 2.1 Memory Backend Interface

- [ ] Define `MemoryBackend` interface
- [ ] Create abstract backend class
- [ ] Implement backend selection logic
- [ ] Add backend switching capability

### 2.2 Local Backend (SQLite)

- [ ] Set up SQLite database schema
- [ ] Implement CRUD operations
- [ ] Add embedding generation (local model)
- [ ] Create vector similarity search
- [ ] Build FTS5 full-text search index
- [ ] Implement memory indexing

### 2.3 mem0 Backend

- [ ] Add mem0 SDK dependency
- [ ] Implement mem0 adapter
- [ ] Map memory schema to mem0 format
- [ ] Handle API authentication
- [ ] Add error handling and retries

### 2.4 Letta Backend (Optional)

- [ ] Add Letta client dependency
- [ ] Implement Letta adapter
- [ ] Map to archival memory format
- [ ] Set up agent configuration
- [ ] Test connection and operations

### 2.5 Memory Engine Core

- [ ] Implement `MemoryEngine.store()`
- [ ] Implement `MemoryEngine.recall()`
- [ ] Implement `MemoryEngine.search()`
- [ ] Implement `MemoryEngine.list()`
- [ ] Implement `MemoryEngine.delete()`
- [ ] Add memory expiration handling

### 2.6 Embedding Integration

- [ ] Create `Embedder` interface
- [ ] Implement OpenAI embedder
- [ ] Implement local embedder (transformers)
- [ ] Add embedding caching
- [ ] Handle embedding errors

### 2.7 Memory Context Hooks

- [ ] Implement `beforeTool` hook
- [ ] Implement `afterTool` hook
- [ ] Implement `onSessionStart` hook
- [ ] Implement `onSessionEnd` hook
- [ ] Add automatic context injection

### 2.8 Memory Commands

- [ ] Implement `/memory recall` command
- [ ] Implement `/memory store` command
- [ ] Implement `/memory list` command
- [ ] Implement `/memory forget` command
- [ ] Add command completion

---

## Deliverables

| Deliverable              | Description                |
| ------------------------ | -------------------------- |
| Memory Backend Interface | Abstract backend API       |
| Local Backend            | SQLite + vector storage    |
| mem0 Backend             | mem0 API integration       |
| Memory Engine            | Core memory operations     |
| Embedding System         | Text embedding generation  |
| Context Hooks            | Automatic memory injection |
| CLI Commands             | Memory management commands |

---

## Database Schema

```sql
-- memories table
CREATE TABLE memories (
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
);

-- indexes
CREATE INDEX idx_memories_key ON memories(key);
CREATE INDEX idx_memories_category ON memories(category);
CREATE INDEX idx_memories_project ON memories(project_path);
CREATE INDEX idx_memories_session ON memories(session_id);

-- full-text search
CREATE VIRTUAL TABLE memories_fts USING fts5(
  content,
  title,
  summary
);
```

---

## Configuration

```json
{
  "memory": {
    "backend": "local",
    "local": {
      "dbPath": ".orca/memory.db",
      "embeddingModel": "all-MiniLM-L6-v2",
      "vectorDimensions": 384
    },
    "mem0": {
      "apiKey": "${MEM0_API_KEY}",
      "projectId": "orca-default"
    },
    "letta": {
      "baseUrl": "http://localhost:8283",
      "agentId": "${LETTA_AGENT_ID}"
    },
    "capture": {
      "autoExtract": true,
      "patterns": true,
      "decisions": true,
      "errors": true
    },
    "retention": {
      "defaultTTL": null,
      "maxAge": "365d",
      "cleanupInterval": "7d"
    }
  }
}
```

---

## Testing

### Unit Tests

- [ ] Memory store/recall operations
- [ ] Search functionality
- [ ] Embedding generation
- [ ] Context injection
- [ ] TTL handling

### Integration Tests

- [ ] SQLite backend operations
- [ ] mem0 API integration
- [ ] Memory lifecycle (create, read, update, delete)
- [ ] Memory search accuracy
- [ ] Persistence across sessions

---

## Success Criteria

- [ ] Can store and retrieve memories
- [ ] Semantic search returns relevant results
- [ ] Memories persist across sessions
- [ ] Context injected before tool calls
- [ ] All backends pass tests
- [ ] Performance: < 100ms for recall, < 500ms for store
