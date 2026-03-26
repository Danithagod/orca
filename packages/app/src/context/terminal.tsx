import { createStore, produce } from "solid-js/store"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { batch, createEffect, createMemo, createRoot, on, onCleanup } from "solid-js"
import { useParams } from "@solidjs/router"
import { useGlobalSDK } from "./global-sdk"
import type { Platform } from "./platform"
import { decode64 } from "@/utils/base64"
import { Persist, persisted, removePersisted } from "@/utils/persist"

export type LocalPTY = {
  id: string
  title: string
  titleNumber: number
  status?: "running" | "exited"
  rows?: number
  cols?: number
  buffer?: string
  scrollY?: number
  cursor?: number
}

const WORKSPACE_KEY = "__workspace__"
const MAX_TERMINAL_SESSIONS = 20

export function getWorkspaceTerminalCacheKey(dir: string) {
  return `${dir}:${WORKSPACE_KEY}`
}

export function getLegacyTerminalStorageKeys(dir: string, legacySessionID?: string) {
  if (!legacySessionID) return [`${dir}/terminal.v1`]
  return [`${dir}/terminal/${legacySessionID}.v1`, `${dir}/terminal.v1`]
}

type TerminalSession = ReturnType<typeof createWorkspaceTerminalSession>

type TerminalCacheEntry = {
  value: TerminalSession
  dispose: VoidFunction
}

const caches = new Set<Map<string, TerminalCacheEntry>>()

const trimTerminal = (pty: LocalPTY) => {
  if (!pty.buffer && pty.cursor === undefined && pty.scrollY === undefined) return pty
  return {
    ...pty,
    buffer: undefined,
    cursor: undefined,
    scrollY: undefined,
  }
}

export function clearWorkspaceTerminals(dir: string, sessionIDs?: string[], platform?: Platform) {
  const key = getWorkspaceTerminalCacheKey(dir)
  for (const cache of caches) {
    const entry = cache.get(key)
    entry?.value.clear()
  }

  removePersisted(Persist.workspace(dir, "terminal"), platform)

  const legacy = new Set(getLegacyTerminalStorageKeys(dir))
  for (const id of sessionIDs ?? []) {
    for (const key of getLegacyTerminalStorageKeys(dir, id)) {
      legacy.add(key)
    }
  }
  for (const key of legacy) {
    removePersisted({ key }, platform)
  }
}

function createWorkspaceTerminalSession(
  globalSDK: ReturnType<typeof useGlobalSDK>,
  dir: string,
  legacySessionID?: string,
) {
  const legacy = getLegacyTerminalStorageKeys(dir, legacySessionID)
  const client = globalSDK.createClient({
    directory: dir,
    throwOnError: true,
  })
  const input = new Map<string, string[]>()
  const sub = new Map<string, Set<(data: string) => void>>()

  const numberFromTitle = (title: string) => {
    const match = title.match(/^Terminal (\d+)$/)
    if (!match) return
    const value = Number(match[1])
    if (!Number.isFinite(value) || value <= 0) return
    return value
  }

  const [store, setStore, _, ready] = persisted(
    Persist.workspace(dir, "terminal", legacy),
    createStore<{
      active?: string
      all: LocalPTY[]
    }>({
      all: [],
    }),
  )

  const pickNextTerminalNumber = () => {
    const existingTitleNumbers = new Set(
      store.all.flatMap((pty) => {
        const direct = Number.isFinite(pty.titleNumber) && pty.titleNumber > 0 ? pty.titleNumber : undefined
        if (direct !== undefined) return [direct]
        const parsed = numberFromTitle(pty.title)
        if (parsed === undefined) return []
        return [parsed]
      }),
    )

    return (
      Array.from({ length: existingTitleNumbers.size + 1 }, (_, index) => index + 1).find(
        (number) => !existingTitleNumbers.has(number),
      ) ?? 1
    )
  }

  const removeExited = (id: string) => {
    const all = store.all
    const index = all.findIndex((x) => x.id === id)
    if (index === -1) return
    input.delete(id)
    sub.delete(id)
    setStore("all", index, (pty) => {
      if (pty.status === "exited") return pty
      return { ...pty, status: "exited" }
    })
  }

  const unsub = globalSDK.event.on(dir, (event) => {
    if (event.type !== "pty.exited") return
    removeExited(event.properties.id)
  })
  onCleanup(unsub)

  const meta = { migrated: false }

  createEffect(() => {
    if (!ready()) return
    if (meta.migrated) return
    meta.migrated = true

    setStore("all", (all) => {
      const next = all.map((pty) => {
        const direct = Number.isFinite(pty.titleNumber) && pty.titleNumber > 0 ? pty.titleNumber : undefined
        const status = pty.status ?? "running"
        if (direct !== undefined && pty.status === status) return pty
        const parsed = numberFromTitle(pty.title)
        if (parsed === undefined) {
          if (pty.status === status) return pty
          return { ...pty, status }
        }
        return { ...pty, titleNumber: parsed, status }
      })
      if (next.every((pty, index) => pty === all[index])) return all
      return next
    })
  })

  const write = (id: string, data: string) => {
    if (!data) return
    const set = sub.get(id)
    if (set && set.size > 0) {
      for (const item of set) item(data)
      return
    }
    const next = input.get(id) ?? []
    next.push(data)
    input.set(id, next)
  }

  const subscribe = (id: string, fn: (data: string) => void) => {
    const set = sub.get(id) ?? new Set<(data: string) => void>()
    set.add(fn)
    sub.set(id, set)

    const queued = input.get(id)
    if (queued?.length) {
      input.delete(id)
      for (const item of queued) fn(item)
    }

    return () => {
      const current = sub.get(id)
      if (!current) return
      current.delete(fn)
      if (current.size > 0) return
      sub.delete(id)
    }
  }

  const attach = (pty: { id: string; title?: string; status?: LocalPTY["status"] }) => {
    const index = store.all.findIndex((item) => item.id === pty.id)
    if (index >= 0) {
      setStore("all", index, (item) => ({
        ...item,
        title: pty.title ?? item.title,
        status: pty.status ?? item.status ?? "running",
      }))
      setStore("active", pty.id)
      return pty.id
    }

    const title = pty.title ?? "Terminal"
    const titleNumber = numberFromTitle(title) ?? pickNextTerminalNumber()
    setStore("all", store.all.length, {
      id: pty.id,
      title,
      titleNumber,
      status: pty.status ?? "running",
    })
    setStore("active", pty.id)
    return pty.id
  }

  return {
    ready,
    all: createMemo(() => store.all),
    active: createMemo(() => store.active),
    clear() {
      input.clear()
      sub.clear()
      batch(() => {
        setStore("active", undefined)
        setStore("all", [])
      })
    },
    new() {
      const nextNumber = pickNextTerminalNumber()

      return client.pty
        .create({ title: `Terminal ${nextNumber}` })
        .then((pty: { data?: { id?: string; title?: string; status?: LocalPTY["status"] } }) => {
          const id = pty.data?.id
          if (!id) return
          const newTerminal = {
            id,
            title: pty.data?.title ?? "Terminal",
            titleNumber: nextNumber,
            status: pty.data?.status ?? "running",
          }
          setStore("all", store.all.length, newTerminal)
          setStore("active", id)
          return id
        })
        .catch((error: unknown) => {
          console.error("Failed to create terminal", error)
          return undefined
        })
    },
    attach,
    update(pty: Partial<LocalPTY> & { id: string }) {
      const index = store.all.findIndex((x) => x.id === pty.id)
      const previous = index >= 0 ? store.all[index] : undefined
      if (index >= 0) {
        setStore("all", index, (item) => ({ ...item, ...pty }))
      }
      client.pty
        .update({
          ptyID: pty.id,
          title: pty.title,
          size: pty.cols && pty.rows ? { rows: pty.rows, cols: pty.cols } : undefined,
        })
        .catch((error: unknown) => {
          if (previous) {
            const currentIndex = store.all.findIndex((item) => item.id === pty.id)
            if (currentIndex >= 0) setStore("all", currentIndex, previous)
          }
          console.error("Failed to update terminal", error)
        })
    },
    trim(id: string) {
      const index = store.all.findIndex((x) => x.id === id)
      if (index === -1) return
      setStore("all", index, (pty) => trimTerminal(pty))
    },
    trimAll() {
      setStore("all", (all) => {
        const next = all.map(trimTerminal)
        if (next.every((pty, index) => pty === all[index])) return all
        return next
      })
    },
    async clone(id: string) {
      const index = store.all.findIndex((x) => x.id === id)
      const pty = store.all[index]
      if (!pty) return
      const clone = await client.pty
        .create({
          title: pty.title,
        })
        .catch((error: unknown) => {
          console.error("Failed to clone terminal", error)
          return undefined
        })
      if (!clone?.data) return
      input.delete(pty.id)
      sub.delete(pty.id)

      const active = store.active === pty.id

      batch(() => {
        setStore("all", index, {
          id: clone.data.id,
          title: clone.data.title ?? pty.title,
          titleNumber: pty.titleNumber,
          status: clone.data.status ?? "running",
          // New PTY process, so start clean.
          buffer: undefined,
          cursor: undefined,
          scrollY: undefined,
          rows: undefined,
          cols: undefined,
        })
        if (active) {
          setStore("active", clone.data.id)
        }
      })
    },
    open(id: string) {
      setStore("active", id)
    },
    next() {
      const index = store.all.findIndex((x) => x.id === store.active)
      if (index === -1) return
      const nextIndex = (index + 1) % store.all.length
      setStore("active", store.all[nextIndex]?.id)
    },
    previous() {
      const index = store.all.findIndex((x) => x.id === store.active)
      if (index === -1) return
      const prevIndex = index === 0 ? store.all.length - 1 : index - 1
      setStore("active", store.all[prevIndex]?.id)
    },
    async close(id: string) {
      const index = store.all.findIndex((f) => f.id === id)
      if (index !== -1) {
        batch(() => {
          if (store.active === id) {
            const next = index > 0 ? store.all[index - 1]?.id : store.all[1]?.id
            setStore("active", next)
          }
          setStore(
            "all",
            produce((all) => {
              all.splice(index, 1)
            }),
          )
        })
      }

      input.delete(id)
      sub.delete(id)

      await client.pty.remove({ ptyID: id }).catch((error: unknown) => {
        console.error("Failed to close terminal", error)
      })
    },
    move(id: string, to: number) {
      const index = store.all.findIndex((f) => f.id === id)
      if (index === -1) return
      setStore(
        "all",
        produce((all) => {
          all.splice(to, 0, all.splice(index, 1)[0])
        }),
      )
    },
    write,
    subscribe,
  }
}

export const { use: useTerminal, provider: TerminalProvider } = createSimpleContext({
  name: "Terminal",
  gate: false,
  init: () => {
    const globalSDK = useGlobalSDK()
    const params = useParams()
    const cache = new Map<string, TerminalCacheEntry>()
    const raw = createMemo(() => decode64(params.dir))
    const [route, setRoute] = createStore({ resolved: "" })

    caches.add(cache)
    onCleanup(() => caches.delete(cache))

    const disposeAll = () => {
      for (const entry of cache.values()) {
        entry.dispose()
      }
      cache.clear()
    }

    onCleanup(disposeAll)

    const prune = () => {
      while (cache.size > MAX_TERMINAL_SESSIONS) {
        const first = cache.keys().next().value
        if (!first) return
        const entry = cache.get(first)
        entry?.dispose()
        cache.delete(first)
      }
    }

    createEffect(() => {
      const dir = raw()
      if (!params.dir || !dir) {
        if (!route.resolved) return
        setRoute("resolved", "")
        return
      }

      const current = params.dir
      globalSDK
        .createClient({
          directory: dir,
          throwOnError: true,
        })
        .path.get()
        .then((x) => {
          if (params.dir !== current) return
          setRoute("resolved", x.data?.directory ?? dir)
        })
        .catch(() => {
          if (params.dir !== current) return
          setRoute("resolved", dir)
        })
    })

    const loadWorkspace = (dir: string, legacySessionID?: string) => {
      const key = getWorkspaceTerminalCacheKey(dir)
      const existing = cache.get(key)
      if (existing) {
        cache.delete(key)
        cache.set(key, existing)
        return existing.value
      }

      const entry = createRoot((dispose) => ({
        value: createWorkspaceTerminalSession(globalSDK, dir, legacySessionID),
        dispose,
      }))

      cache.set(key, entry)
      prune()
      return entry.value
    }

    let workspace: ReturnType<typeof loadWorkspace> | undefined
    let currentDir: string | undefined
    let currentId: string | undefined

    const getWorkspace = () => {
      const dir = route.resolved
      if (!dir) return
      if (workspace && currentDir === dir && currentId === params.id) {
        return workspace
      }
      if (dir) {
        currentDir = dir
        currentId = params.id
      }
      workspace = loadWorkspace(dir, params.id)
      return workspace
    }

    createEffect(
      on(
        () => ({ dir: route.resolved, id: params.id }),
        (next, prev) => {
          if (!prev?.dir) return
          if (next.dir === prev.dir && next.id === prev.id) return
          if (next.dir === prev.dir && next.id) return
          loadWorkspace(prev.dir, prev.id).trimAll()
        },
        { defer: true },
      ),
    )

    return {
      directory: () => route.resolved,
      ready: () => getWorkspace()?.ready() ?? false,
      all: () => getWorkspace()?.all() ?? [],
      active: () => getWorkspace()?.active(),
      new: () => getWorkspace()?.new(),
      attach: (pty: { id: string; title?: string; status?: LocalPTY["status"] }) => getWorkspace()?.attach(pty),
      write: (id: string, data: string) => getWorkspace()?.write(id, data),
      subscribe: (id: string, fn: (data: string) => void) => getWorkspace()?.subscribe(id, fn),
      update: (pty: Partial<LocalPTY> & { id: string }) => getWorkspace()?.update(pty),
      trim: (id: string) => getWorkspace()?.trim(id),
      trimAll: () => getWorkspace()?.trimAll(),
      clone: (id: string) => getWorkspace()?.clone(id),
      open: (id: string) => getWorkspace()?.open(id),
      close: (id: string) => getWorkspace()?.close(id),
      move: (id: string, to: number) => getWorkspace()?.move(id, to),
      next: () => getWorkspace()?.next(),
      previous: () => getWorkspace()?.previous(),
    }
  },
})
