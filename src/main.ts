import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './app/App.vue';
import { router } from './app/router';
import './styles/main.css';
import { ScreenOrientation } from '@capgo/capacitor-screen-orientation';

async function bootstrap() {
  try {
    const app = createApp(App);
    const pinia = createPinia();

    app.use(pinia);
    app.use(router);

    // Lock to portrait orientation on mobile
    try {
      await ScreenOrientation.lock({ orientation: 'portrait' });
    } catch {
      // Graceful fallback for web/desktop browser preview
    }

    app.mount('#app');
  } catch (err) {
    console.error('Fatal bootstrap error:', err);
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; padding:24px; text-align:center; font-family:sans-serif; direction:rtl; background:#17212B; color:white;">
          <h2 style="margin:0 0 8px 0; font-size:18px; font-weight:bold;">خطا در راه‌اندازی برنامه</h2>
          <p style="margin:0 0 24px 0; font-size:13px; color:#94a3b8; max-width:280px; line-height:1.6;">${err instanceof Error ? err.message : String(err)}</p>
          <button onclick="window.location.reload()" style="background:#10B981; color:white; border:none; padding:12px 24px; border-radius:12px; font-weight:bold; cursor:pointer; font-size:14px;">تلاش مجدد</button>
        </div>
      `;
    }
  }
}

bootstrap();
