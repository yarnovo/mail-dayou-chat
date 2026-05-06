// dayou-agent 后端调用 · POST /api/avatars/generate

const API_BASE = import.meta.env.VITE_API_BASE || ''
const BACKEND_READY = !!API_BASE

// 5 风格预设 · 跟 dayou-agent STYLE_PROMPTS 一致 (subagent 5-6 调研)
export const STYLES = [
  { slug: 'doubao',     name: '豆包风',   desc: '圆润 3D mascot · 黏土 · 蓝白调' },
  { slug: 'flat',       name: '扁平',     desc: '几何 · 纯色 · dribbble 风' },
  { slug: 'claymation', name: '黏土',     desc: 'Aardman 风 · 手作橡皮泥' },
  { slug: 'anime',      name: '二次元',   desc: '日漫 · 大眼 · cel-shading' },
  { slug: 'realistic',  name: '写实',     desc: '85mm 人像 · 切 plus 模型 (慢)' },
]
export const DEFAULT_STYLE = 'doubao'

export async function generateAvatars({ prompt, style = DEFAULT_STYLE, n = 4, size = '1024*1024' }) {
  if (!BACKEND_READY) {
    throw Object.assign(new Error('agent 后端建设中 · 当前是 v0.1 UI 预览版'), { kind: 'backend_not_ready' })
  }
  const res = await fetch(`${API_BASE}/api/avatars/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style, n, size }),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new Error(detail.detail || `HTTP ${res.status}`)
  }
  return res.json()  // { urls, model, style, n }
}

export { BACKEND_READY }
