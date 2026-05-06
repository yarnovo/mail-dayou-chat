// Akong chat service worker · v0.1 占位 (没真离线缓存 · 仅满足 PWA installability)
// chat 必须在线 · 离线缓存意义有限 · v0.2 加静态资源 cache (icons / app shell)

const CACHE_VERSION = 'akong-chat-v0.1'

self.addEventListener('install', (event) => {
  // 立即激活新版本 · 不等老 sw 关闭
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // 接管所有客户端
      self.clients.claim(),
      // 清掉老缓存
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
      ),
    ])
  )
})

// fetch 默认走网络 · v0.2 加 cache-first 策略
self.addEventListener('fetch', () => {})
