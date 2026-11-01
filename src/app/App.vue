<template>
  <div class="h-full w-full flex flex-col font-sans select-none antialiased bg-white dark:bg-graphite text-graphite-900 dark:text-white">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUIStore } from '@/presentation/stores/uiStore';
import { App as CapApp } from '@capacitor/app';
import { useRouter } from 'vue-router';

const uiStore = useUIStore();
const router = useRouter();

onMounted(() => {
  // Apply initial theme
  uiStore.applyThemeClass(uiStore.theme);

  // Listen to Android hardware back button
  try {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (uiStore.isAppLocked) {
        CapApp.exitApp();
        return;
      }
      if (canGoBack) {
        router.back();
      } else {
        // Double press or exit when on root screen
        CapApp.exitApp();
      }
    });
  } catch {
    // In browser dev mode, Capacitor plugins are gracefully skipped
  }
});
</script>
