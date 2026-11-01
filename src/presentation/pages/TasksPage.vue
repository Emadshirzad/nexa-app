<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="وظایف و پیگیری‌ها" subtitle="برنامه‌ریزی و یادآوری‌ها" :show-back="false">
      <template #actions>
        <button
          type="button"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="وظیفه جدید"
        >
          <Plus class="w-5 h-5" />
        </button>
      </template>
    </AppHeader>

    <div class="p-4 space-y-4 flex-1 flex flex-col">
      <!-- Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          type="button"
          class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
          :class="activeTab === tab.key
            ? 'bg-emerald text-white font-bold shadow-sm'
            : 'bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-600 dark:text-gray-400'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Empty State -->
      <div class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400">
        <div class="w-16 h-16 rounded-3xl bg-mint dark:bg-graphite-800 flex items-center justify-center text-emerald mb-3">
          <CheckSquare class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-graphite-800 dark:text-gray-200">وظیفه‌ای وجود ندارد</h3>
        <p class="text-xs text-gray-400 max-w-xs mt-1 mb-5">
          وظایف کاری، موعدهای تماس و سررسید پیگیری مشتریان را اینجا مدیریت کنید.
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald text-white text-xs font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <Plus class="w-4 h-4" />
          ثبت وظیفه جدید
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { CheckSquare, Plus } from 'lucide-vue-next';

const activeTab = ref<'today' | 'upcoming' | 'overdue' | 'completed'>('today');

const tabs = [
  { key: 'today' as const, label: 'امروز' },
  { key: 'upcoming' as const, label: 'پیش‌رو' },
  { key: 'overdue' as const, label: 'معوق' },
  { key: 'completed' as const, label: 'انجام‌شده' }
];
</script>
