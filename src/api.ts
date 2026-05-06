// dayou-agent · /api/chat (LLM tool calling · 全对话 · 老板 5-6 拍 · 不要表单)

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

export interface ChatMsg {
  role: "user" | "assistant" | "system"
  content: string
}

export interface ChatResp {
  reply: string
  used_tools: { name: string; args: unknown; result: unknown }[]
}

export async function chat(messages: ChatMsg[]): Promise<ChatResp> {
  if (!BACKEND_READY) {
    throw Object.assign(new Error("agent 后端建设中 · v0.1 UI 预览版"), { kind: "backend_not_ready" })
  }
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-User-ID": getOrCreateUserId() },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { detail?: string }
    throw new Error(detail.detail || `HTTP ${res.status}`)
  }
  return res.json() as Promise<ChatResp>
}
