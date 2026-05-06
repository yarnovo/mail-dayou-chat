import * as React from "react"
import { ChatPage, type Message } from "@akong/ui-react"
import { chat, BACKEND_READY, userId, type ChatMsg } from "./api"

const WELCOME = `你好 · 我是阿空大邮 · 邮箱管理大师。

你把邮箱挂上来 (Gmail · 企业邮 · Outlook · 163 都支持) · 我帮你: 摘要收件箱 · 起草回信 · 写新信 · 整理。

发信前我都给你看草稿 · 你说"发"我才发。绝不自动回 · 绝不删信。

跟我说说 · 你想先挂哪个邮箱? 或者先聊聊你今天的邮件烦恼。`

export default function App() {
  const idRef = React.useRef(1)
  const nextId = () => idRef.current++
  const now = () => new Date().toTimeString().slice(0, 5)

  // localStorage 持久化 · 跨刷新保留 (per uid)
  const STORAGE_KEY = `dayou.chat.${userId()}`

  function loadStored(): { messages: Message[]; history: ChatMsg[] } {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const d = JSON.parse(raw) as { messages: Message[]; history: ChatMsg[]; nextId: number }
        idRef.current = d.nextId || 1
        return { messages: d.messages, history: d.history }
      }
    } catch {}
    return {
      messages: [{ id: 0, role: "agent", content: WELCOME }],
      history: [],
    }
  }
  const stored = loadStored()

  const [messages, setMessages] = React.useState<Message[]>(stored.messages)
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState("")

  // 跟 backend 保持的对话历史 (跟 OpenAI / qwen 同 schema)
  const historyRef = React.useRef<ChatMsg[]>(stored.history)

  // 每次 messages 变 · 写 localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        messages,
        history: historyRef.current,
        nextId: idRef.current,
      }))
    } catch {}
  }, [messages])

  async function onSend(text: string) {
    setError("")
    setMessages((ms) => [...ms, { id: nextId(), role: "user", content: text, timestamp: now() }])
    historyRef.current.push({ role: "user", content: text })
    setSending(true)
    try {
      const r = await chat(historyRef.current)
      historyRef.current.push({ role: "assistant", content: r.reply })
      setMessages((ms) => [...ms, { id: nextId(), role: "agent", content: r.reply, timestamp: now() }])
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      setError(m)
      setMessages((ms) => [...ms, { id: nextId(), role: "agent", content: "出错: " + m, timestamp: now() }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <main className="flex-1 min-h-0 flex flex-col">
        <ChatPage
          title="阿空大邮"
          subtitle="邮箱管理大师"
          online={!sending}
          messages={messages}
          inputDisabled={sending || !BACKEND_READY}
          onSend={onSend}
          onBack={() => {}}
          onSettings={() => {}}
          avatarFallback={<span className="text-base">📬</span>}
          avatarColor="hsl(220 30% 25%)"
        />
      </main>
      <footer className="shrink-0 px-3 py-1 text-[10px] text-muted-foreground bg-card border-t border-border flex justify-between items-center">
        <span>uid: {userId().slice(0, 16)}…</span>
        {error && <span className="text-destructive">⚠ {error.slice(0, 50)}</span>}
        {!BACKEND_READY && <span className="text-muted-foreground">backend 待部署</span>}
      </footer>
    </div>
  )
}
