import * as React from "react"
import { ChatPage, Button, MoreVertical, type Message } from "@akong/ui-react"
import { chat, loadHistory, markTopicBreak, BACKEND_READY, userId, type BackendMessage } from "./api"

const WELCOME = `你好 · 我是阿空大邮 · 邮箱管理大师。

你把邮箱挂上来 (Gmail · 企业邮 · Outlook · 163 都支持) · 我帮你: 摘要收件箱 · 起草回信 · 写新信 · 整理。

发信前我都给你看草稿 · 你说"发"我才发。绝不自动回 · 绝不删信。

跟我说说 · 你想先挂哪个邮箱? 或者先聊聊你今天的邮件烦恼。`

function fmtTime(ts: number) {
  return new Date(ts * 1000).toTimeString().slice(0, 5)
}

function backendToFront(m: BackendMessage): Message {
  const role: Message["role"] = m.role === "user" ? "user" : (m.role === "assistant" ? "agent" : "system")
  return {
    id: m.id,
    role,
    content: m.content,
    timestamp: fmtTime(m.created_at),
  }
}

export default function App() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState("")
  const [menuOpen, setMenuOpen] = React.useState(false)
  const tmpIdRef = React.useRef(-1)

  // WELCOME 作为前端 sentinel · 永远第一条 (不存 backend · 用户每次进都看见 · 不被新消息挤掉)
  const WELCOME_MSG: Message = { id: 0, role: "agent", content: WELCOME, timestamp: new Date().toTimeString().slice(0, 5) }

  // 启动: 拉历史 + WELCOME prepend
  React.useEffect(() => {
    if (!BACKEND_READY) {
      setMessages([WELCOME_MSG])
      return
    }
    loadHistory()
      .then((hist) => {
        setMessages([WELCOME_MSG, ...hist.map(backendToFront)])
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e))
        setMessages([WELCOME_MSG])
      })
  }, [])

  async function onSend(text: string) {
    setError("")
    setMenuOpen(false)
    // 乐观 UI
    const tmpId = tmpIdRef.current--
    setMessages((ms) => [
      ...ms,
      { id: tmpId, role: "user", content: text, timestamp: new Date().toTimeString().slice(0, 5) },
    ])
    setSending(true)
    try {
      await chat(text)
      // 重新拉历史 (拿真实 id + agent reply)
      const hist = await loadHistory()
      setMessages([WELCOME_MSG, ...hist.map(backendToFront)])
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      setError(m)
      setMessages((ms) => [
        ...ms,
        { id: tmpIdRef.current--, role: "agent", content: "出错: " + m, timestamp: new Date().toTimeString().slice(0, 5) },
      ])
    } finally {
      setSending(false)
    }
  }

  async function onTopicBreak() {
    setMenuOpen(false)
    if (!BACKEND_READY) return
    try {
      await markTopicBreak()
      const hist = await loadHistory()
      setMessages([WELCOME_MSG, ...hist.map(backendToFront)])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <main className="flex-1 min-h-0 flex flex-col relative">
        <ChatPage
          title="阿空大邮"
          subtitle="邮箱管理大师"
          online={!sending}
          messages={messages}
          inputDisabled={sending || !BACKEND_READY}
          onSend={onSend}
          onBack={() => {}}
          onSettings={() => setMenuOpen((v) => !v)}
          avatarFallback={<span className="text-base">📬</span>}
          avatarColor="hsl(220 30% 25%)"
        />
        {menuOpen && (
          <div className="absolute right-3 top-14 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-[120px]">
            <button onClick={onTopicBreak} className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted">
              开新话题
            </button>
          </div>
        )}
      </main>
      <footer className="shrink-0 px-3 py-1 text-[10px] text-muted-foreground bg-card border-t border-border flex justify-between items-center">
        <span>uid: {userId().slice(0, 16)}…</span>
        {error && <span className="text-destructive">⚠ {error.slice(0, 50)}</span>}
        {!BACKEND_READY && <span className="text-muted-foreground">backend 待部署</span>}
      </footer>
    </div>
  )
}
