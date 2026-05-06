// dayou-agent 后端 (multi-user · X-User-ID 自动带 anon-uuid)

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

async function api<T = unknown>(
  path: string,
  { method = "GET", body = null }: { method?: string; body?: unknown } = {},
): Promise<T> {
  if (!BACKEND_READY) {
    throw Object.assign(new Error("agent 后端建设中 · v0.1 UI 预览"), { kind: "backend_not_ready" })
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-User-ID": getOrCreateUserId() },
    body: body ? JSON.stringify(body) : null,
  })
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { detail?: string }
    throw new Error(detail.detail || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export interface ProviderGuess {
  matched: boolean
  name?: string
  imap_host?: string; imap_port?: number
  smtp_host?: string; smtp_port?: number
  app_password_help?: string
  app_password_url?: string
  domain?: string; hint?: string
}

export interface Account {
  slug: string; email: string
  server_imap: string; server_smtp: string; created_at: number
}

export interface MailHeader {
  uid: string; msg_id: string; from: string; subject: string
  date: string; flags: string[]; size: number
}

export interface MailContent {
  uid: string
  headers: { From: string; To: string; Cc: string; Subject: string; Date: string; "Message-ID": string }
  body_plain: string; body_html: string
  attachments: { filename: string; content_type: string; size: number }[]
}

export interface DraftResp {
  draft_id: number
  preview: { to: string; cc: string | null; subject: string; body: string }
  hint: string
}

export const guessProvider = (email: string) =>
  api<ProviderGuess>(`/api/providers/guess?email=${encodeURIComponent(email)}`)

export const connectMailbox = (req: {
  slug: string; email: string
  server_imap: string; port_imap: number
  server_smtp: string; port_smtp: number
  app_password: string
}) => api<{ ok: boolean; slug: string; email: string }>("/api/mailbox/connect", { method: "POST", body: req })

export const listAccounts = () => api<Account[]>("/api/mailbox/accounts")
export const deleteAccount = (slug: string) =>
  api<{ ok: boolean }>(`/api/mailbox/account?slug=${encodeURIComponent(slug)}`, { method: "DELETE" })

export const listInbox = (req: { slug: string; limit?: number; unread_only?: boolean; since?: string }) =>
  api<MailHeader[]>("/api/mailbox/list", { method: "POST", body: req })

export const readMail = (req: { slug: string; uid: string }) =>
  api<MailContent>("/api/mailbox/read", { method: "POST", body: req })

export const draftMail = (req: {
  slug: string; to: string; cc?: string | null
  subject: string; body: string; in_reply_to?: string | null
}) => api<DraftResp>("/api/mailbox/draft", { method: "POST", body: req })

export const sendDraft = (draftId: number) =>
  api<{ ok: boolean; msg_id: string; sent_at: number }>("/api/mailbox/send", {
    method: "POST",
    body: { draft_id: draftId, user_confirmed: true },
  })
