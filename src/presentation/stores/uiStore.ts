import { defineStore } from 'pinia';
import { ref } from 'vue';

export type AppTheme = 'system' | 'light' | 'dark';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

export const useUIStore = defineStore('ui', () => {
  const theme = ref<AppTheme>('system');
  const isAppLocked = ref<boolean>(false);
  const isSearchOpen = ref<boolean>(false);
  const toasts = ref<ToastMessage[]>([]);
  const isGlobalLoading = ref<boolean>(false);

  function setTheme(newTheme: AppTheme) {
    theme.value = newTheme;
    applyThemeClass(newTheme);
  }

  function applyThemeClass(currentTheme: AppTheme) {
    const root = document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else if (currentTheme === 'light') {
      root.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  function showToast(toast: Omit<ToastMessage, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 3500;
    const newToast: ToastMessage = { ...toast, id };
    toasts.value.push(newToast);

    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  function dismissToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function lockApp() {
    isAppLocked.value = true;
  }

  function unlockApp() {
    isAppLocked.value = false;
  }

  function toggleSearch() {
    isSearchOpen.value = !isSearchOpen.value;
  }

  return {
    theme,
    isAppLocked,
    isSearchOpen,
    toasts,
    isGlobalLoading,
    setTheme,
    applyThemeClass,
    showToast,
    dismissToast,
    lockApp,
    unlockApp,
    toggleSearch
  };
});
