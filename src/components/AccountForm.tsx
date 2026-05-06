/**
 * 挂邮箱表单 · 用户输入 4 件 (slug + email + server + app_password)
 * 自动 guess provider (gmail/outlook/qq/163/...) 填默认 server/port
 */
import * as React from "react"
import { Button, Input } from "@akong/ui-react"
import { guessProvider, connectMailbox, type ProviderGuess } from "../api"

interface Props {
  onDone: (r: { slug: string; email: string }) => void
  onCancel: () => void
}

export function AccountForm({ onDone, onCancel }: Props) {
  const [slug, setSlug] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [serverImap, setServerImap] = React.useState("")
  const [portImap, setPortImap] = React.useState(993)
  const [serverSmtp, setServerSmtp] = React.useState("")
  const [portSmtp, setPortSmtp] = React.useState(465)
  const [appPassword, setAppPassword] = React.useState("")
  const [guess, setGuess] = React.useState<ProviderGuess | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (!email.includes("@")) return
    const t = setTimeout(async () => {
      try {
        const r = await guessProvider(email)
        setGuess(r)
        if (r.matched) {
          setServerImap(r.imap_host!); setPortImap(r.imap_port!)
          setServerSmtp(r.smtp_host!); setPortSmtp(r.smtp_port!)
        }
      } catch {}
    }, 400)
    return () => clearTimeout(t)
  }, [email])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!slug || !email || !appPassword || !serverImap || !serverSmtp) {
      setError("4 件都得填: 昵称 / 邮箱 / 服务器 / 应用密码")
      return
    }
    setSubmitting(true)
    try {
      const r = await connectMailbox({
        slug, email, server_imap: serverImap, port_imap: portImap,
        server_smtp: serverSmtp, port_smtp: portSmtp, app_password: appPassword,
      })
      onDone(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : "连接失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-4" data-testid="account-form">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">昵称 (slug · 你自己看的)</label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="例: work / personal / client-a" data-testid="acc-slug" required />
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">邮箱地址</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" data-testid="acc-email" required />
        {guess?.matched && <p className="text-xs text-muted-foreground mt-1">识别为 {guess.name} · server / port 已自动填</p>}
        {guess && !guess.matched && <p className="text-xs text-muted-foreground mt-1">服务商未识别 ({guess.domain}) · 请手动填</p>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">IMAP server (收)</label>
          <Input value={serverImap} onChange={(e) => setServerImap(e.target.value)} placeholder="imap.gmail.com" required />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">port</label>
          <Input type="number" value={portImap} onChange={(e) => setPortImap(+e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">SMTP server (发)</label>
          <Input value={serverSmtp} onChange={(e) => setServerSmtp(e.target.value)} placeholder="smtp.gmail.com" required />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">port</label>
          <Input type="number" value={portSmtp} onChange={(e) => setPortSmtp(+e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">应用专用密码 (不是主密码)</label>
        <Input type="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} placeholder="主密码会被拒 · 强制应用密码" data-testid="acc-app-password" required />
        {guess?.matched && (
          <p className="text-xs text-muted-foreground mt-1">
            {guess.app_password_help}
            {guess.app_password_url && <> <a href={guess.app_password_url} target="_blank" className="underline">→ 直接跳转</a></>}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive" data-testid="acc-error">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={submitting} className="flex-1" data-testid="acc-submit">
          {submitting ? "验证中…" : "挂上来"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
      </div>

      <p className="text-xs text-muted-foreground pt-2 border-t border-border">
        🔒 应用密码 Fernet 加密存 · 你随时可在邮箱后台 revoke · 我立刻看不到。
      </p>
    </form>
  )
}
