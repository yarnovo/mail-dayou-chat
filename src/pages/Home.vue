<script setup>
import { ref, onMounted } from 'vue'
import { ChatPage } from '@akong/ui'
import AccountForm from '../components/AccountForm.vue'
import { listAccounts, listInbox, readMail, draftMail, sendDraft, BACKEND_READY, userId } from '../api.js'

let nextId = 1

const accounts = ref([])
const currentSlug = ref('')
const view = ref('chat')  // 'chat' | 'add-account' | 'inbox' | 'read' | 'draft'
const inbox = ref([])
const currentMsg = ref(null)
const draft = ref({ to: '', subject: '', body: '' })
const sentDraftId = ref(null)
const loading = ref(false)
const error = ref('')

const messages = ref([
  { id: nextId++, role: 'agent', content: '你好 · 我是阿空大邮 · 邮箱管理大师。\n\n我帮你管你自己的邮箱 · **永远不替你拍 · 永远不自动回信 · 永远不删信**。\n\n点上方"挂邮箱"开始 · 4 件信息我就能拉收件箱了。' },
])

function now() { return new Date().toTimeString().slice(0, 5) }

function pushMsg(role, content) {
  messages.value.push({ id: nextId++, role, content, timestamp: now() })
}

async function refreshAccounts() {
  try {
    accounts.value = await listAccounts()
    if (!currentSlug.value && accounts.value.length) currentSlug.value = accounts.value[0].slug
  } catch (e) { error.value = e.message }
}

async function loadInbox() {
  if (!currentSlug.value) return
  loading.value = true; error.value = ''
  try {
    pushMsg('agent', `拉 ${currentSlug.value} 收件箱 · 最近 20 封…`)
    inbox.value = await listInbox({ slug: currentSlug.value, limit: 20 })
    pushMsg('agent', `${inbox.value.length} 封 · 点列表里看单封`)
    view.value = 'inbox'
  } catch (e) {
    error.value = e.message
    pushMsg('agent', '出错: ' + e.message)
  } finally { loading.value = false }
}

async function openMail(uid) {
  loading.value = true
  try {
    currentMsg.value = await readMail({ slug: currentSlug.value, uid })
    view.value = 'read'
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

function startDraft(replyTo = null) {
  draft.value = {
    to: replyTo?.headers?.From || '',
    subject: replyTo ? 'Re: ' + (replyTo.headers.Subject || '') : '',
    body: '',
    in_reply_to: replyTo?.headers?.['Message-ID'] || null,
  }
  sentDraftId.value = null
  view.value = 'draft'
}

async function saveDraft() {
  loading.value = true; error.value = ''
  try {
    const r = await draftMail({
      slug: currentSlug.value,
      to: draft.value.to, subject: draft.value.subject,
      body: draft.value.body, in_reply_to: draft.value.in_reply_to,
    })
    sentDraftId.value = r.draft_id
    pushMsg('agent', `草稿存好 (id=${r.draft_id}) · 你扫一眼 · 点"真发"我才发`)
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

async function reallySend() {
  if (!sentDraftId.value) return
  loading.value = true; error.value = ''
  try {
    const r = await sendDraft(sentDraftId.value)
    pushMsg('agent', `已发 · Message-ID ${r.msg_id}`)
    view.value = 'chat'; currentMsg.value = null
  } catch (e) { error.value = e.message; pushMsg('agent', '发送失败: ' + e.message) } finally { loading.value = false }
}

function onAccountAdded(r) {
  refreshAccounts()
  pushMsg('agent', `${r.slug} (${r.email}) 挂好了 · 点上方"收件箱"看`)
  view.value = 'chat'
}

function onSendChat(text) {
  pushMsg('user', text)
  // v0.1 没接 LLM tool calling · 用户文本暂只 echo · v0.2 接 qwen-plus tool calling
  setTimeout(() => pushMsg('agent', '收到 · v0.1 还没接自然语言路由 · 你点上方按钮操作 (挂邮箱 / 收件箱 / 写信)'), 400)
}

onMounted(refreshAccounts)
</script>

<template>
  <!-- 整页固定 viewport · 不加 overflow · 让各 view 自己管 -->
  <div class="h-screen w-screen flex flex-col bg-background">
    <!-- 顶栏 · 全局账号切换 + 导航 · 固定不滚 -->
    <header class="shrink-0 flex items-center gap-2 px-3 py-2 bg-card border-b border-border" data-testid="topbar">
      <span class="text-sm font-semibold">阿空大邮</span>
      <select v-if="accounts.length" v-model="currentSlug"
              class="text-xs border border-border rounded px-2 py-1 bg-background"
              data-testid="acc-switch">
        <option v-for="a in accounts" :key="a.slug" :value="a.slug">{{ a.slug }} ({{ a.email }})</option>
      </select>
      <span v-else class="text-xs text-muted-foreground">还没挂邮箱</span>
      <div class="flex-1"></div>
      <button @click="view='add-account'" class="text-xs text-primary hover:underline" data-testid="btn-add-account">+ 挂邮箱</button>
      <button v-if="accounts.length" @click="loadInbox" :disabled="loading"
              class="text-xs text-primary hover:underline" data-testid="btn-inbox">收件箱</button>
      <button v-if="accounts.length" @click="() => startDraft()"
              class="text-xs text-primary hover:underline" data-testid="btn-new-mail">写信</button>
    </header>

    <!-- 主区域 · 各 view 占满 + 自管布局 -->
    <main class="flex-1 min-h-0 flex flex-col">
      <!-- chat 默认: ChatPage 自己 flex-col + sticky bottom input -->
      <ChatPage
        v-if="view === 'chat'"
        title=""
        subtitle=""
        :messages="messages"
        :input-disabled="!BACKEND_READY"
        @send="onSendChat"
        @back="() => {}"
        @settings="() => {}"
        class="h-full"
      >
        <template #avatar><div class="w-full h-full flex items-center justify-center">📬</div></template>
      </ChatPage>

      <!-- 挂邮箱表单 · 内层 scroll -->
      <div v-else-if="view === 'add-account'" class="flex-1 overflow-y-auto">
        <AccountForm @done="onAccountAdded" @cancel="view='chat'" />
      </div>

      <!-- 收件箱列表 · 内层 scroll -->
      <div v-else-if="view === 'inbox'" class="flex-1 overflow-y-auto divide-y divide-border" data-testid="inbox-list">
        <button v-for="m in inbox" :key="m.uid" @click="openMail(m.uid)"
                class="w-full text-left px-4 py-3 hover:bg-muted active:bg-accent">
          <div class="flex items-baseline gap-2">
            <span class="font-medium text-sm truncate flex-1">{{ m.from }}</span>
            <span class="text-xs text-muted-foreground shrink-0">{{ m.date.slice(0, 16) }}</span>
          </div>
          <div class="text-sm text-muted-foreground truncate mt-1">{{ m.subject }}</div>
        </button>
        <p v-if="!inbox.length" class="p-8 text-center text-sm text-muted-foreground">收件箱空</p>
      </div>

      <!-- 单封详情 · 内层 scroll -->
      <div v-else-if="view === 'read' && currentMsg" class="flex-1 overflow-y-auto p-4 space-y-3" data-testid="mail-detail">
        <button @click="view='inbox'" class="text-xs text-primary hover:underline">← 返回</button>
        <div class="space-y-1 pb-3 border-b border-border">
          <div class="text-xs text-muted-foreground">From: {{ currentMsg.headers.From }}</div>
          <div class="text-xs text-muted-foreground">To: {{ currentMsg.headers.To }}</div>
          <div class="text-sm font-medium">{{ currentMsg.headers.Subject }}</div>
          <div class="text-xs text-muted-foreground">{{ currentMsg.headers.Date }}</div>
        </div>
        <pre class="whitespace-pre-wrap text-sm font-sans">{{ currentMsg.body_plain || '(无文本正文)' }}</pre>
        <button @click="startDraft(currentMsg)"
                class="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm" data-testid="btn-reply">
          回这封
        </button>
      </div>

      <!-- 写信 / 起草 · 内层 scroll -->
      <form v-else-if="view === 'draft'" @submit.prevent="saveDraft"
            class="flex-1 overflow-y-auto space-y-3 p-4" data-testid="draft-form">
        <button type="button" @click="view='chat'" class="text-xs text-primary hover:underline">← 取消</button>
        <input v-model="draft.to" type="email" placeholder="to: 收件人邮箱" required
               class="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
        <input v-model="draft.subject" placeholder="subject: 主题" required
               class="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
        <textarea v-model="draft.body" rows="10" placeholder="正文…" required
                  class="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"></textarea>
        <div v-if="!sentDraftId">
          <button type="submit" :disabled="loading"
                  class="w-full bg-secondary text-secondary-foreground py-2 rounded-md text-sm">
            {{ loading ? '存中…' : '存草稿 (不发)' }}
          </button>
        </div>
        <div v-else class="space-y-2">
          <p class="text-sm text-muted-foreground">草稿 #{{ sentDraftId }} 已存 · 扫一眼内容 · 真发?</p>
          <button type="button" @click="reallySend" :disabled="loading"
                  class="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm" data-testid="btn-really-send">
            {{ loading ? '发中…' : '真发 · SMTP' }}
          </button>
        </div>
      </form>
    </main>

    <!-- 底部 · 错误 + user_id 元信息 (统一格式 · 不混进对话) -->
    <footer class="shrink-0 px-3 py-1 text-[10px] text-muted-foreground bg-card border-t border-border flex justify-between items-center">
      <span>uid: {{ userId().slice(0, 16) }}…</span>
      <span v-if="error" class="text-destructive">⚠ {{ error }}</span>
    </footer>
  </div>
</template>
