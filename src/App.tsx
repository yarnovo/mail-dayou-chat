import * as React from "react"
import { Plus, Inbox, PenLine, ArrowLeft } from "@akong/ui-react"
import { ChatPage, Button, Input, Textarea, type Message } from "@akong/ui-react"
import { AccountForm } from "./components/AccountForm"
import {
  listAccounts, listInbox, readMail, draftMail, sendDraft,
  BACKEND_READY, userId, type Account, type MailHeader, type MailContent,
} from "./api"

type View = "chat" | "add-account" | "inbox" | "read" | "draft"

export default function App() {
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [currentSlug, setCurrentSlug] = React.useState("")
  const [view, setView] = React.useState<View>("chat")
  const [inbox, setInbox] = React.useState<MailHeader[]>([])
  const [currentMsg, setCurrentMsg] = React.useState<MailContent | null>(null)
  const [draft, setDraft] = React.useState({ to: "", subject: "", body: "", in_reply_to: null as string | null })
  const [sentDraftId, setSentDraftId] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const idRef = React.useRef(1)
  const nextId = () => idRef.current++

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 0, role: "agent",
      content: '你好 · 我是阿空大邮 · 邮箱管理大师。\n\n我帮你管你自己的邮箱 · **永远不替你拍 · 永远不自动回信 · 永远不删信**。\n\n点上方"挂邮箱"开始 · 4 件信息我就能拉收件箱了。',
    },
  ])

  function pushMsg(role: Message["role"], content: string) {
    setMessages((ms) => [...ms, { id: nextId(), role, content, timestamp: now() }])
  }

  function now() { return new Date().toTimeString().slice(0, 5) }

  async function refreshAccounts() {
    try {
      const a = await listAccounts()
      setAccounts(a)
      if (!currentSlug && a.length) setCurrentSlug(a[0].slug)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }

  async function loadInbox() {
    if (!currentSlug) return
    setLoading(true); setError("")
    try {
      pushMsg("agent", `拉 ${currentSlug} 收件箱 · 最近 20 封…`)
      const r = await listInbox({ slug: currentSlug, limit: 20 })
      setInbox(r)
      pushMsg("agent", `${r.length} 封 · 点列表里看单封`)
      setView("inbox")
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      setError(m); pushMsg("agent", "出错: " + m)
    } finally { setLoading(false) }
  }

  async function openMail(uid: string) {
    setLoading(true)
    try {
      const r = await readMail({ slug: currentSlug, uid })
      setCurrentMsg(r); setView("read")
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  function startDraft(replyTo: MailContent | null = null) {
    setDraft({
      to: replyTo?.headers.From || "",
      subject: replyTo ? "Re: " + (replyTo.headers.Subject || "") : "",
      body: "",
      in_reply_to: replyTo?.headers["Message-ID"] || null,
    })
    setSentDraftId(null); setView("draft")
  }

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      const r = await draftMail({ slug: currentSlug, to: draft.to, subject: draft.subject, body: draft.body, in_reply_to: draft.in_reply_to })
      setSentDraftId(r.draft_id)
      pushMsg("agent", `草稿存好 (id=${r.draft_id}) · 你扫一眼 · 点"真发"我才发`)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  async function reallySend() {
    if (!sentDraftId) return
    setLoading(true); setError("")
    try {
      const r = await sendDraft(sentDraftId)
      pushMsg("agent", `已发 · Message-ID ${r.msg_id}`)
      setView("chat"); setCurrentMsg(null)
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      setError(m); pushMsg("agent", "发送失败: " + m)
    } finally { setLoading(false) }
  }

  function onAccountAdded(r: { slug: string; email: string }) {
    refreshAccounts()
    pushMsg("agent", `${r.slug} (${r.email}) 挂好了 · 点上方"收件箱"看`)
    setView("chat")
  }

  function onSendChat(text: string) {
    pushMsg("user", text)
    setTimeout(() => pushMsg("agent", "收到 · v0.1 还没接自然语言路由 · 你点上方按钮操作 (挂邮箱 / 收件箱 / 写信)"), 400)
  }

  React.useEffect(() => { refreshAccounts() }, [])

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <header className="shrink-0 flex items-center gap-2 px-3 py-2 bg-card border-b border-border" data-testid="topbar">
        <span className="text-sm font-semibold">阿空大邮</span>
        {accounts.length > 0 ? (
          <select value={currentSlug} onChange={(e) => setCurrentSlug(e.target.value)}
                  className="text-xs border border-border rounded px-2 py-1 bg-background" data-testid="acc-switch">
            {accounts.map((a) => <option key={a.slug} value={a.slug}>{a.slug} ({a.email})</option>)}
          </select>
        ) : <span className="text-xs text-muted-foreground">还没挂邮箱</span>}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setView("add-account")} data-testid="btn-add-account">
          <Plus className="size-3" />挂邮箱
        </Button>
        {accounts.length > 0 && <Button variant="ghost" size="sm" disabled={loading} onClick={loadInbox} data-testid="btn-inbox">
          <Inbox className="size-3" />收件箱
        </Button>}
        {accounts.length > 0 && <Button variant="ghost" size="sm" onClick={() => startDraft()} data-testid="btn-new-mail">
          <PenLine className="size-3" />写信
        </Button>}
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        {view === "chat" && (
          <ChatPage
            title="阿空大邮"
            subtitle="邮箱管理大师"
            messages={messages}
            inputDisabled={!BACKEND_READY}
            onSend={onSendChat}
            onBack={() => {}}
            onSettings={() => {}}
            avatarFallback={<span className="text-base">📬</span>}
            avatarColor="hsl(220 30% 25%)"
          />
        )}

        {view === "add-account" && (
          <div className="flex-1 overflow-y-auto">
            <AccountForm onDone={onAccountAdded} onCancel={() => setView("chat")} />
          </div>
        )}

        {view === "inbox" && (
          <div className="flex-1 overflow-y-auto divide-y divide-border" data-testid="inbox-list">
            {inbox.map((m) => (
              <button key={m.uid} onClick={() => openMail(m.uid)}
                      className="w-full text-left px-4 py-3 hover:bg-muted active:bg-accent">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm truncate flex-1">{m.from}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{m.date.slice(0, 16)}</span>
                </div>
                <div className="text-sm text-muted-foreground truncate mt-1">{m.subject}</div>
              </button>
            ))}
            {!inbox.length && <p className="p-8 text-center text-sm text-muted-foreground">收件箱空</p>}
          </div>
        )}

        {view === "read" && currentMsg && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="mail-detail">
            <Button variant="ghost" size="sm" onClick={() => setView("inbox")}><ArrowLeft className="size-3" />返回</Button>
            <div className="space-y-1 pb-3 border-b border-border">
              <div className="text-xs text-muted-foreground">From: {currentMsg.headers.From}</div>
              <div className="text-xs text-muted-foreground">To: {currentMsg.headers.To}</div>
              <div className="text-sm font-medium">{currentMsg.headers.Subject}</div>
              <div className="text-xs text-muted-foreground">{currentMsg.headers.Date}</div>
            </div>
            <pre className="whitespace-pre-wrap text-sm font-sans">{currentMsg.body_plain || "(无文本正文)"}</pre>
            <Button onClick={() => startDraft(currentMsg)} className="w-full" data-testid="btn-reply">回这封</Button>
          </div>
        )}

        {view === "draft" && (
          <form onSubmit={saveDraft} className="flex-1 overflow-y-auto space-y-3 p-4" data-testid="draft-form">
            <Button type="button" variant="ghost" size="sm" onClick={() => setView("chat")}><ArrowLeft className="size-3" />取消</Button>
            <Input type="email" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} placeholder="to: 收件人" required />
            <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="subject" required />
            <Textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={10} placeholder="正文…" required />
            {!sentDraftId ? (
              <Button type="submit" disabled={loading} variant="secondary" className="w-full">
                {loading ? "存中…" : "存草稿 (不发)"}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">草稿 #{sentDraftId} 已存 · 扫一眼 · 真发?</p>
                <Button type="button" onClick={reallySend} disabled={loading} className="w-full" data-testid="btn-really-send">
                  {loading ? "发中…" : "真发 · SMTP"}
                </Button>
              </div>
            )}
          </form>
        )}
      </main>

      <footer className="shrink-0 px-3 py-1 text-[10px] text-muted-foreground bg-card border-t border-border flex justify-between items-center">
        <span>uid: {userId().slice(0, 16)}…</span>
        {error && <span className="text-destructive">⚠ {error}</span>}
      </footer>
    </div>
  )
}
