<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="تنظیمات" subtitle="شخصی‌سازی و پیکربندی" :show-back="true" />

    <div class="p-4 space-y-4 flex-1">
      <!-- Theme Selection -->
      <section class="bg-white dark:bg-graphite-900 rounded-3xl p-4 border border-gray-100 dark:border-graphite-800 space-y-3">
        <h3 class="text-xs font-bold text-graphite-400 dark:text-gray-400">پوسته ظاهری برنامه</h3>
        <div class="grid grid-cols-3 gap-2 text-xs">
          <button
            v-for="mode in themeOptions"
            :key="mode.key"
            @click="uiStore.setTheme(mode.key)"
            type="button"
            class="p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all"
            :class="uiStore.theme === mode.key
              ? 'bg-emerald text-white font-bold shadow-sm'
              : 'bg-gray-50 dark:bg-graphite-800 text-graphite-700 dark:text-gray-300'"
          >
            <component :is="mode.icon" class="w-4 h-4" />
            <span>{{ mode.label }}</span>
          </button>
        </div>
      </section>

      <!-- Business Profile & Details -->
      <section class="bg-white dark:bg-graphite-900 rounded-3xl p-4 border border-gray-100 dark:border-graphite-800 space-y-3">
        <h3 class="text-xs font-bold text-graphite-400 dark:text-gray-400">اطلاعات کسب‌وکار</h3>
        <div class="text-xs text-graphite-700 dark:text-gray-300 space-y-2">
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-graphite-800">
            <span class="text-gray-400">نام تجاری:</span>
            <span class="font-bold">نکسا CRM</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-graphite-800">
            <span class="text-gray-400">تقویم پیش‌فرض:</span>
            <span>شمسی (هجری خورشیدی)</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-gray-400">واحد پول:</span>
            <span>تومان (Toman)</span>
          </div>
        </div>
      </section>

      <!-- Security & App Lock -->
      <section class="bg-white dark:bg-graphite-900 rounded-3xl p-4 border border-gray-100 dark:border-graphite-800 space-y-3">
        <h3 class="text-xs font-bold text-graphite-400 dark:text-gray-400">امنیت و قفل برنامه</h3>
        <button
          @click="uiStore.lockApp()"
          type="button"
          class="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 text-xs font-bold hover:bg-gray-100 dark:hover:bg-graphite-700 transition-colors"
        >
          <div class="flex items-center gap-2">
            <Lock class="w-4 h-4 text-emerald" />
            <span>قفل کردن فوری برنامه</span>
          </div>
          <span class="text-gray-400">ورود با PIN</span>
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { useUIStore, AppTheme } from '@/presentation/stores/uiStore';
import { Sun, Moon, Laptop, Lock } from 'lucide-vue-next';

const uiStore = useUIStore();

const themeOptions = [
  { key: 'system' as AppTheme, label: 'سیستم', icon: Laptop },
  { key: 'light' as AppTheme, label: 'روشن', icon: Sun },
  { key: 'dark' as AppTheme, label: 'تاریک', icon: Moon }
];
</script>
