import { ChatShell } from "@akong/chat-shell"

const WELCOME = `你好 · 我是阿空大邮 · 邮箱管理大师。

你把邮箱挂上来 (Gmail · 企业邮 · Outlook · 163 都支持) · 我帮你: 摘要收件箱 · 起草回信 · 写新信 · 整理。

发信前我都给你看草稿 · 你说"发"我才发。绝不自动回 · 绝不删信。

跟我说说 · 你想先挂哪个邮箱? 或者先聊聊你今天的邮件烦恼。`

export default function App() {
  return (
    <ChatShell
      title="阿空大邮"
      subtitle="邮箱管理大师"
      welcome={WELCOME}
      avatarFallback={<span className="text-base">📬</span>}
      avatarColor="hsl(220 30% 25%)"
      apiOpts={{ storagePrefix: "dayou" }}
    />
  )
}
