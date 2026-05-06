// dayou-agent 后端 · multi-user
// 每 request 自动带 X-User-ID (localStorage 存匿名 anon-uuid · v0.2 接 SSO)

const API_BASE = import.meta.env.VITE_API_BASE || ''

export const BACKEND_READY = !!API_BASE

function getOrCreateUserId() {
  let id = localStorage.getItem('dayou.user_id')
  if (!id) {
    id = 'anon-' + crypto.randomUUID().replace(/-/g, '')
    localStorage.setItem('dayou.user_id', id)
  }
  return id
}

async function api(path, { method = 'GET', body = null } = {}) {
  if (!BACKEND_READY) {
    throw Object.assign(new Error('agent 后端建设中 · 当前是 v0.1 UI 预览版'), { kind: 'backend_not_ready' })
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': getOrCreateUserId(),
    },
    body: body ? JSON.stringify(body) : null,
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new Error(detail.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const userId = () => getOrCreateUserId()

export const guessProvider = (email) => api(`/api/providers/guess?email=${encodeURIComponent(email)}`)
export const listProviders = () => api('/api/providers/list')
export const connectMailbox = (req) => api('/api/mailbox/connect', { method: 'POST', body: req })
export const listAccounts = () => api('/api/mailbox/accounts')
export const deleteAccount = (slug) => api(`/api/mailbox/account?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
export const listInbox = (req) => api('/api/mailbox/list', { method: 'POST', body: req })
export const readMail = (req) => api('/api/mailbox/read', { method: 'POST', body: req })
export const draftMail = (req) => api('/api/mailbox/draft', { method: 'POST', body: req })
export const sendDraft = (draftId) => api('/api/mailbox/send', { method: 'POST', body: { draft_id: draftId, user_confirmed: true } })
export const archiveMail = (req) => api('/api/mailbox/archive', { method: 'POST', body: req })
