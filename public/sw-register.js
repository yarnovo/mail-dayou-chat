// PWA service worker 注册 · 各 chat 仓 main.js 引用
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[pwa] sw registered:', reg.scope))
      .catch(err => console.warn('[pwa] sw register failed:', err))
  })
}
