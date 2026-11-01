<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="سرنخ‌ها" subtitle="فرصت‌ها و بازاریابی" :show-back="true">
      <template #actions>
        <button
          type="button"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="سرنخ جدید"
        >
          <Plus class="w-5 h-5" />
        </button>
      </template>
    </AppHeader>

    <div class="p-4 space-y-4 flex-1 flex flex-col">
      <div class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400">
        <div class="w-16 h-16 rounded-3xl bg-mint dark:bg-graphite-800 flex items-center justify-center text-emerald mb-3">
          <UserCheck class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-graphite-800 dark:text-gray-200">سرنخی ثبت نشده است</h3>
        <p class="text-xs text-gray-400 max-w-xs mt-1 mb-5">
          مشتریان احتمالی و پیام‌های ورودی را ثبت و پس از نهایی شدن با یک کلیک به مشتری تبدیل کنید.
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald text-white text-xs font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <Plus class="w-4 h-4" />
          ثبت سرنخ جدید
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { UserCheck, Plus } from 'lucide-vue-next';
</script>
