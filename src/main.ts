import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './app/App.vue';
import { router } from './app/router';
import './styles/main.css';
import { ScreenOrientation } from '@capgo/capacitor-screen-orientation';
import { initializeAppContainer } from './app/providers/container';

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(router);

  // Initialize Clean Architecture DI Container & Database Migrations
  await initializeAppContainer();

  // Lock to portrait orientation on mobile
  try {
    await ScreenOrientation.lock({ orientation: 'portrait' });
  } catch {
    // Graceful fallback for web/desktop browser preview
  }

  app.mount('#app');
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
});
