<script setup>
import { ref } from 'vue'
import { ChatPage } from '@akong/ui'
import AvatarGrid from '../components/AvatarGrid.vue'
import { generateAvatars, BACKEND_READY, STYLES, DEFAULT_STYLE } from '../api.js'

let nextId = 1
const messages = ref([
  { id: nextId++, role: 'agent', content: '你好 · 我是阿空大邮 · 我帮你出几张专属头像。\n\n选个风格 (顶栏可换) · 然后跟我说想要的样子: 场景 / 气质 / 颜色 / 戴不戴眼镜...\n\n默认是**豆包风** (圆润 3D mascot 黏土质感 · 跟阿空品牌"圆润不卷"调性一致)。' },
])

const generating = ref(false)
const style = ref(DEFAULT_STYLE)

async function send(text) {
  messages.value.push({ id: nextId++, role: 'user', content: text, timestamp: now() })
  generating.value = true
  const styleName = STYLES.find(s => s.slug === style.value)?.name || style.value
  messages.value.push({ id: nextId++, role: 'agent', content: `正在出 4 张${styleName} · 大约 10 秒…`, timestamp: now() })
  try {
    const { urls, model } = await generateAvatars({ prompt: text, style: style.value, n: 4 })
    messages.value.pop()
    messages.value.push({ id: nextId++, role: 'agent', content: '', avatarUrls: urls, model, timestamp: now() })
    messages.value.push({ id: nextId++, role: 'agent', content: `挑一张点开看大图。要换风格直接顶栏选 · 要重出告诉我哪里不对 (如"眼睛太大" / "颜色偏冷")。`, timestamp: now() })
  } catch (e) {
    messages.value.pop()
    messages.value.push({ id: nextId++, role: 'system', content: `出错: ${e.message}` })
  } finally {
    generating.value = false
  }
}

function now() { return new Date().toTimeString().slice(0, 5) }
</script>

<template>
  <div class="max-w-md mx-auto h-screen bg-akong-paper flex flex-col">
    <!-- 风格 chips · 顶栏 -->
    <div class="flex gap-2 overflow-x-auto px-3 py-2 bg-white border-b border-akong-border whitespace-nowrap" data-testid="style-chips">
      <span class="text-xs text-akong-muted shrink-0 self-center">风格</span>
      <button
        v-for="s in STYLES"
        :key="s.slug"
        @click="style = s.slug"
        :class="[
          'shrink-0 px-3 py-1 rounded-full text-xs transition-colors border',
          style === s.slug
            ? 'bg-akong-accent text-white border-akong-accent'
            : 'bg-white text-akong-ink border-akong-border hover:border-akong-accent/50',
        ]"
        :data-testid="`chip-${s.slug}`"
        :title="s.desc"
      >
        {{ s.name }}
      </button>
    </div>

    <div class="flex-1 min-h-0">
      <ChatPage
        title="阿空大邮"
        :subtitle="generating ? '出图中…' : `当前: ${STYLES.find(s => s.slug === style)?.name}`"
        :online="!generating"
        :messages="messages.filter(m => !m.avatarUrls)"
        :input-disabled="generating || !BACKEND_READY"
        @send="send"
        @back="() => alert('back · demo')"
        @settings="() => alert('settings · demo')"
      >
        <template #avatar>
          <div class="w-full h-full flex items-center justify-center text-akong-accent">🖼️</div>
        </template>

        <template #after-messages>
          <template v-for="m in messages" :key="m.id">
            <AvatarGrid v-if="m.avatarUrls" :urls="m.avatarUrls" />
          </template>
        </template>
      </ChatPage>
    </div>
  </div>
</template>
