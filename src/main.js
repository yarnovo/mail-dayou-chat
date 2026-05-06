import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import '@akong/ui/styles/shadcn.css'
import './style.css'

// PWA service worker 注册 (akong-pwa)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[pwa] sw registered:', reg.scope))
      .catch(err => console.warn('[pwa] sw register failed:', err))
  })
}

createApp(App).use(router).mount('#app')
