<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="گزارش‌ها و آمار" subtitle="تحلیل عملکرد کسب‌وکار" :show-back="true" />

    <div class="p-4 space-y-4 flex-1">
      <div class="grid grid-cols-2 gap-3">
        <div class="p-4 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-100 dark:border-graphite-800">
          <div class="text-xs text-gray-400">فروش ماه جاری</div>
          <div class="text-base font-bold text-graphite-900 dark:text-white mt-1">۰ تومان</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-100 dark:border-graphite-800">
          <div class="text-xs text-gray-400">تعداد فاکتورها</div>
          <div class="text-base font-bold text-graphite-900 dark:text-white mt-1">۰ عدد</div>
        </div>
      </div>

      <div class="flex-1 flex flex-col items-center justify-center py-8 text-center text-gray-400">
        <BarChart3 class="w-8 h-8 mx-auto opacity-40 mb-2" />
        <p class="text-xs">داده‌ای برای تحلیل گزارش‌های ماهانه وجود ندارد.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { BarChart3 } from 'lucide-vue-next';
</script>
