<script setup>
import { ref, watch } from 'vue'
import { guessProvider, connectMailbox } from '../api.js'

const emit = defineEmits(['done', 'cancel'])

const slug = ref('')
const email = ref('')
const serverImap = ref('')
const portImap = ref(993)
const serverSmtp = ref('')
const portSmtp = ref(465)
const appPassword = ref('')

const guess = ref(null)
const guessLoading = ref(false)
const submitting = ref(false)
const error = ref('')

let lastEmail = ''
async function tryGuess() {
  if (email.value === lastEmail || !email.value.includes('@')) return
  lastEmail = email.value
  guessLoading.value = true
  try {
    const r = await guessProvider(email.value)
    guess.value = r
    if (r.matched) {
      serverImap.value = r.imap_host; portImap.value = r.imap_port
      serverSmtp.value = r.smtp_host; portSmtp.value = r.smtp_port
    }
  } catch {} finally { guessLoading.value = false }
}

watch(email, () => { setTimeout(tryGuess, 400) })

async function submit() {
  error.value = ''
  if (!slug.value || !email.value || !appPassword.value || !serverImap.value || !serverSmtp.value) {
    error.value = '4 件都得填: 昵称 / 邮箱 / 服务器 / 应用密码'
    return
  }
  submitting.value = true
  try {
    const r = await connectMailbox({
      slug: slug.value, email: email.value,
      server_imap: serverImap.value, port_imap: portImap.value,
      server_smtp: serverSmtp.value, port_smtp: portSmtp.value,
      app_password: appPassword.value,
    })
    emit('done', r)
  } catch (e) {
    error.value = e.message || '连接失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-3 p-4" data-testid="account-form">
    <div>
      <label class="block text-xs text-muted-foreground mb-1">昵称 (slug · 你自己看的)</label>
      <input v-model="slug" placeholder="例: work / personal / client-a"
             class="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
             data-testid="acc-slug" required>
    </div>

    <div>
      <label class="block text-xs text-muted-foreground mb-1">邮箱地址</label>
      <input v-model="email" type="email" placeholder="you@example.com"
             class="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
             data-testid="acc-email" required>
      <p v-if="guess?.matched" class="text-xs text-muted-foreground mt-1">
        识别为 {{ guess.name }} · server / port 已自动填
      </p>
      <p v-else-if="guess && !guess.matched" class="text-xs text-muted-foreground mt-1">
        服务商未识别 ({{ guess.domain }}) · 请手动填 server / port
      </p>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <div class="col-span-2">
        <label class="block text-xs text-muted-foreground mb-1">IMAP server (收)</label>
        <input v-model="serverImap" placeholder="imap.gmail.com"
               class="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" required>
      </div>
      <div>
        <label class="block text-xs text-muted-foreground mb-1">port</label>
        <input v-model.number="portImap" type="number"
               class="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <div class="col-span-2">
        <label class="block text-xs text-muted-foreground mb-1">SMTP server (发)</label>
        <input v-model="serverSmtp" placeholder="smtp.gmail.com"
               class="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" required>
      </div>
      <div>
        <label class="block text-xs text-muted-foreground mb-1">port</label>
        <input v-model.number="portSmtp" type="number"
               class="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
      </div>
    </div>

    <div>
      <label class="block text-xs text-muted-foreground mb-1">应用专用密码 (不是主密码)</label>
      <input v-model="appPassword" type="password" placeholder="主密码会被拒 · 强制应用密码"
             class="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
             data-testid="acc-app-password" required>
      <p v-if="guess?.matched" class="text-xs text-muted-foreground mt-1">
        {{ guess.app_password_help }}
        <a v-if="guess.app_password_url" :href="guess.app_password_url" target="_blank"
           class="underline">→ 直接跳转</a>
      </p>
    </div>

    <p v-if="error" class="text-sm text-destructive" data-testid="acc-error">{{ error }}</p>

    <div class="flex gap-2 pt-2">
      <button type="submit" :disabled="submitting"
              class="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm disabled:opacity-50"
              data-testid="acc-submit">
        {{ submitting ? '验证中…' : '挂上来' }}
      </button>
      <button type="button" @click="emit('cancel')"
              class="px-4 py-2 border border-border rounded-md text-sm">
        取消
      </button>
    </div>

    <p class="text-xs text-muted-foreground pt-2 border-t border-border">
      🔒 应用密码 Fernet 加密存 · 你随时可在邮箱后台 revoke · 我立刻看不到。
    </p>
  </form>
</template>
