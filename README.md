# mail-dayou-chat

阿空大邮 (邮箱管理大师) chat 前端 · Vue 3.5 + Vite 8 + Tailwind 4 + `@akong/ui` 统一组件库。

## 老板视角

- prod: https://chat.dayou.mail.agentaily.com (待 setup.sh)
- staging: https://staging.chat.dayou.mail.agentaily.com

## 跑 dev

```bash
pnpm install        # 走 file: link 装 @akong/ui (需先 clone akong-ui 同级)
pnpm dev            # http://localhost:5173 · proxy /api → api.dayou.mail
```

## 部署

```bash
# 一次性 bootstrap (建 OSS + DNS + cert)
bash scripts/setup.sh

# 日常
bash scripts/deploy-oss.sh prod
```

## 业务流

1. 用户进 chat.dayou.mail → onboarding (挂第一个邮箱 · 4 件信息)
2. 用户提交 → `POST /api/mailbox/connect` 验通过 → 存 vault
3. 用户问"今早有啥邮件" → `POST /api/mailbox/list` → InboxList 组件展示
4. 用户点单封 → `POST /api/mailbox/read` → 显示原文 + 中文摘要 + 行动项
5. 用户说"回他下周二开会" → `POST /api/mailbox/draft` → 显示草稿 → 用户改 → 点"发" → `POST /api/mailbox/send`

## 上下游

- 上游 API: `mail-dayou-agent` (`api.dayou.mail.agentaily.com`)
- 共享 UI: `@akong/ui` (统一组件库 · ChatPage / MessageBubble / Icon / 等)
- 行业: 邮箱托管 (跟 xiaoxi · xiaoqiao · xiaoyan · dayan · xiaohua · xiaozhi · xiaoke 平行)

## v0.1 范围

- ✅ onboarding (挂第一个邮箱)
- ✅ 收件箱列表
- ✅ 单封原文 + 摘要
- ✅ 起草 / 真发 (强制 user_confirmed)
- ❌ 多账号切换 (v0.2)
- ❌ 自然语言搜信 (v0.2)
- ❌ OAuth (Gmail / Outlook · v0.2)
- ❌ 计费 (v0.3)
