<template>
  <header class="bg-white dark:bg-graphite border-b border-gray-100 dark:border-graphite-800 safe-top select-none sticky top-0 z-30">
    <div class="h-14 px-4 flex items-center justify-between">
      <!-- Right Side (RTL Start): Back button or Logo / Title -->
      <div class="flex items-center gap-3">
        <button
          v-if="showBack"
          @click="handleBack"
          type="button"
          class="p-2 -mr-2 rounded-xl text-graphite-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-graphite-800 active:scale-95 transition-transform"
          aria-label="بازگشت"
        >
          <ChevronRight class="w-6 h-6" />
        </button>

        <div>
          <h1 class="text-base font-bold text-graphite-900 dark:text-white leading-tight">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-xs text-graphite-400 dark:text-gray-400">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- Left Side (RTL End): Actions (Search, Lock, etc.) -->
      <div class="flex items-center gap-1">
        <slot name="actions">
          <button
            v-if="showSearch"
            @click="uiStore.toggleSearch()"
            type="button"
            class="p-2 rounded-xl text-graphite-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-graphite-800 active:scale-95 transition-transform"
            aria-label="جستجو"
          >
            <Search class="w-5 h-5" />
          </button>

          <button
            v-if="showLock"
            @click="uiStore.lockApp()"
            type="button"
            class="p-2 rounded-xl text-graphite-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-graphite-800 active:scale-95 transition-transform"
            aria-label="قفل برنامه"
          >
            <Lock class="w-5 h-5 text-gray-500 hover:text-emerald" />
          </button>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ChevronRight, Search, Lock } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useUIStore } from '@/presentation/stores/uiStore';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showLock?: boolean;
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  showBack: false,
  showSearch: true,
  showLock: true
});

const router = useRouter();
const uiStore = useUIStore();

function handleBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/dashboard');
  }
}
</script>
