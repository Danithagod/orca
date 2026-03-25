import type {
  Config,
  KiloClient,
  Path,
  PermissionRequest,
  Project,
  ProviderAuthResponse,
  ProviderListResponse,
  QuestionRequest,
  Todo,
} from "@kilocode/sdk/v2/client"
import { showToast } from "@opencode-ai/ui/toast"
import { getFilename } from "@opencode-ai/util/path"
import { retry } from "@opencode-ai/util/retry"
import { batch } from "solid-js"
import { reconcile, type SetStoreFunction, type Store } from "solid-js/store"
import type { State, VcsCache } from "./types"
import { cmp, normalizeProviderList } from "./utils"
import { formatServerError } from "@/utils/server-errors"
import { markStartup, traceStartup } from "@/utils/startup"

type GlobalStore = {
  ready: boolean
  path: Path
  project: Project[]
  session_todo: {
    [sessionID: string]: Todo[]
  }
  provider: ProviderListResponse
  provider_auth: ProviderAuthResponse
  config: Config
  reload: undefined | "pending" | "complete"
}

export async function bootstrapGlobal(input: {
  globalSDK: KiloClient
  connectErrorTitle: string
  connectErrorDescription: string
  requestFailedTitle: string
  translate: (key: string, vars?: Record<string, string | number>) => string
  formatMoreCount: (count: number) => string
  setGlobalStore: SetStoreFunction<GlobalStore>
}) {
  markStartup({
    sdk: input.globalSDK,
    message: "bootstrap.global.start",
  })

  const health = await traceStartup({
    sdk: input.globalSDK,
    message: "bootstrap.global.health",
    fn: () =>
      input.globalSDK.global
        .health()
        .then((x) => x.data)
        .catch(() => undefined),
  })
  if (!health?.healthy) {
    showToast({
      variant: "error",
      title: input.connectErrorTitle,
      description: input.connectErrorDescription,
    })
    input.setGlobalStore("ready", true)
    markStartup({
      sdk: input.globalSDK,
      message: "bootstrap.global.unhealthy",
    })
    return
  }

  const tasks = [
    traceStartup({
      sdk: input.globalSDK,
      message: "bootstrap.global.path",
      fn: () =>
        retry(() =>
          input.globalSDK.path.get().then((x) => {
            input.setGlobalStore("path", x.data!)
          }),
        ),
    }),
    traceStartup({
      sdk: input.globalSDK,
      message: "bootstrap.global.config",
      fn: () =>
        retry(() =>
          input.globalSDK.global.config.get().then((x) => {
            input.setGlobalStore("config", x.data!)
          }),
        ),
    }),
    traceStartup({
      sdk: input.globalSDK,
      message: "bootstrap.global.project.list",
      fn: () =>
        retry(() =>
          input.globalSDK.project.list().then((x) => {
            const projects = (x.data ?? [])
              .filter((p) => !!p?.id)
              .filter((p) => !!p.worktree && !p.worktree.includes("opencode-test"))
              .slice()
              .sort((a, b) => cmp(a.id, b.id))
            input.setGlobalStore("project", projects)
          }),
        ),
    }),
    traceStartup({
      sdk: input.globalSDK,
      message: "bootstrap.global.provider.list",
      fn: () =>
        retry(() =>
          input.globalSDK.provider.list().then((x) => {
            input.setGlobalStore("provider", normalizeProviderList(x.data!))
          }),
        ),
    }),
    traceStartup({
      sdk: input.globalSDK,
      message: "bootstrap.global.provider.auth",
      fn: () =>
        retry(() =>
          input.globalSDK.provider.auth().then((x) => {
            input.setGlobalStore("provider_auth", x.data ?? {})
          }),
        ),
    }),
  ]

  const results = await traceStartup({
    sdk: input.globalSDK,
    message: "bootstrap.global.total",
    extra: { count: tasks.length },
    fn: () => Promise.allSettled(tasks),
  })
  const errors = results.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r) => r.reason)
  if (errors.length) {
    const message = formatServerError(errors[0], input.translate)
    const more = errors.length > 1 ? input.formatMoreCount(errors.length - 1) : ""
    showToast({
      variant: "error",
      title: input.requestFailedTitle,
      description: message + more,
    })
  }
  input.setGlobalStore("ready", true)
  markStartup({
    sdk: input.globalSDK,
    message: "bootstrap.global.ready",
    extra: {
      errors: errors.length,
    },
  })
}

function groupBySession<T extends { id: string; sessionID: string }>(input: T[]) {
  return input.reduce<Record<string, T[]>>((acc, item) => {
    if (!item?.id || !item.sessionID) return acc
    const list = acc[item.sessionID]
    if (list) list.push(item)
    if (!list) acc[item.sessionID] = [item]
    return acc
  }, {})
}

export async function bootstrapDirectory(input: {
  directory: string
  sdk: KiloClient
  store: Store<State>
  setStore: SetStoreFunction<State>
  vcsCache: VcsCache
  loadSessions: (directory: string) => Promise<void> | void
  translate: (key: string, vars?: Record<string, string | number>) => string
}) {
  markStartup({
    sdk: input.sdk,
    message: "bootstrap.directory.start",
    extra: {
      directory: input.directory,
    },
  })
  if (input.store.status !== "complete") input.setStore("status", "loading")

  const blocking = [
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.project.current",
      extra: { directory: input.directory },
      fn: () =>
        retry(() =>
          input.sdk.project.current().then((x) => input.setStore("project", x.data!.id)),
        ),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.provider.list",
      extra: { directory: input.directory },
      fn: () =>
        retry(() =>
          input.sdk.provider.list().then((x) => {
            input.setStore("provider", normalizeProviderList(x.data!))
          }),
        ),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.agent.list",
      extra: { directory: input.directory },
      fn: () =>
        retry(() =>
          input.sdk.app.agents().then((x) => input.setStore("agent", x.data ?? [])),
        ),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.config.get",
      extra: { directory: input.directory },
      fn: () =>
        retry(() =>
          input.sdk.config.get().then((x) => input.setStore("config", x.data!)),
        ),
    }),
  ]

  try {
    await traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.blocking",
      extra: {
        directory: input.directory,
        count: blocking.length,
      },
      fn: () => Promise.all(blocking),
    })
  } catch (err) {
    console.error("Failed to bootstrap instance", err)
    const project = getFilename(input.directory)
    showToast({
      variant: "error",
      title: `Failed to reload ${project}`,
      description: formatServerError(err, input.translate),
    })
    input.setStore("status", "partial")
    return
  }

  if (input.store.status !== "complete") input.setStore("status", "partial")

  const background = [
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.path.get",
      extra: { directory: input.directory },
      fn: () => input.sdk.path.get().then((x) => input.setStore("path", x.data!)),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.command.list",
      extra: { directory: input.directory },
      fn: () => input.sdk.command.list().then((x) => input.setStore("command", x.data ?? [])),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.session.status",
      extra: { directory: input.directory },
      fn: () => input.sdk.session.status().then((x) => input.setStore("session_status", x.data!)),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.session.list",
      extra: { directory: input.directory },
      fn: () => input.loadSessions(input.directory),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.mcp.status",
      extra: { directory: input.directory },
      fn: () => input.sdk.mcp.status().then((x) => input.setStore("mcp", x.data!)),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.lsp.status",
      extra: { directory: input.directory },
      fn: () => input.sdk.lsp.status().then((x) => input.setStore("lsp", x.data!)),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.vcs.get",
      extra: { directory: input.directory },
      fn: () =>
        input.sdk.vcs.get().then((x) => {
          const next = x.data ?? input.store.vcs
          input.setStore("vcs", next)
          if (next?.branch) input.vcsCache.setStore("value", next)
        }),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.permission.list",
      extra: { directory: input.directory },
      fn: () =>
        input.sdk.permission.list().then((x) => {
          const grouped = groupBySession(
            (x.data ?? []).filter((perm): perm is PermissionRequest => !!perm?.id && !!perm.sessionID),
          )
          batch(() => {
            for (const sessionID of Object.keys(input.store.permission)) {
              if (grouped[sessionID]) continue
              input.setStore("permission", sessionID, [])
            }
            for (const [sessionID, permissions] of Object.entries(grouped)) {
              input.setStore(
                "permission",
                sessionID,
                reconcile(
                  permissions.filter((p) => !!p?.id).sort((a, b) => cmp(a.id, b.id)),
                  { key: "id" },
                ),
              )
            }
          })
        }),
    }),
    traceStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.question.list",
      extra: { directory: input.directory },
      fn: () =>
        input.sdk.question.list().then((x) => {
          const grouped = groupBySession((x.data ?? []).filter((q): q is QuestionRequest => !!q?.id && !!q.sessionID))
          batch(() => {
            for (const sessionID of Object.keys(input.store.question)) {
              if (grouped[sessionID]) continue
              input.setStore("question", sessionID, [])
            }
            for (const [sessionID, questions] of Object.entries(grouped)) {
              input.setStore(
                "question",
                sessionID,
                reconcile(
                  questions.filter((q) => !!q?.id).sort((a, b) => cmp(a.id, b.id)),
                  { key: "id" },
                ),
              )
            }
          })
        }),
    }),
  ]

  void traceStartup({
    sdk: input.sdk,
    message: "bootstrap.directory.background",
    extra: {
      directory: input.directory,
      count: background.length,
    },
    fn: () => Promise.all(background),
  }).then(() => {
    input.setStore("status", "complete")
    markStartup({
      sdk: input.sdk,
      message: "bootstrap.directory.ready",
      extra: {
        directory: input.directory,
      },
    })
  })
}
