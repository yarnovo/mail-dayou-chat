// dayou-agent · /api/chat (LLM tool calling · 全对话 · backend 持久化历史 + 自动压缩)
// 老板 5-7 拍 · 单一持续会话 · 没"新建对话" · 用户可"开新话题"

const API_BASE = (import.meta.env.VITE_API_BASE as string) || ""
export const BACKEND_READY = !!API_BASE

function getOrCreateUserId(): string {
  let id = localStorage.getItem("dayou.user_id")
  if (!id) {
    id = "anon-" + crypto.randomUUID().replace(/-/g, "")
    localStorage.setItem("dayou.user_id", id)
  }
  return id
}
export const userId = (): string => getOrCreateUserId()

export interface BackendMessage {
  id: number
  role: "user" | "assistant" | "system"
  content: string
  topic_break: boolean
  created_at: number
}

export interface ChatResp {
  reply: string
  used_tools: { name: string; args: unknown; result: unknown }[]
}

async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BACKEND_READY) throw Object.assign(new Error("agent 后端建设中"), { kind: "backend_not_ready" })
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": getOrCreateUserId(),
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { detail?: string }
    throw new Error(detail.detail || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const chat = (text: string) =>
  api<ChatResp>("/api/chat", { method: "POST", body: JSON.stringify({ text }) })

export const loadHistory = () =>
  api<BackendMessage[]>("/api/chat/history")

export const markTopicBreak = () =>
  api<{ ok: boolean; marker_id: number }>("/api/chat/topic-break", { method: "POST" })
