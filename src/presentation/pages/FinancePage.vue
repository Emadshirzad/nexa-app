<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="امور مالی و صندوق" subtitle="دفتر کل نقدینگی و هزینه‌ها" :show-back="true">
      <template #actions>
        <button
          type="button"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="هزینه جدید"
        >
          <Plus class="w-5 h-5" />
        </button>
      </template>
    </AppHeader>

    <div class="p-4 space-y-4 flex-1">
      <!-- Cash Balance Hero Card -->
      <div class="bg-gradient-to-br from-graphite-900 to-graphite-800 text-white rounded-3xl p-5 shadow-sm border border-graphite-700">
        <div class="text-xs text-graphite-300 mb-1">موجودی نقدی صندوق</div>
        <div class="text-2xl font-black tracking-tight text-white">
          ۰ <span class="text-sm font-normal text-emerald-400">تومان</span>
        </div>
        <div class="text-[11px] text-gray-400 mt-2 flex items-center justify-between border-t border-graphite-700/60 pt-2">
          <span>وضعیت دفتر صندوق: متوازن</span>
          <span class="text-emerald-400">۰ تراکنش</span>
        </div>
      </div>

      <div class="flex-1 flex flex-col items-center justify-center py-8 text-center text-gray-400">
        <Wallet class="w-8 h-8 mx-auto opacity-40 mb-2" />
        <p class="text-xs">هیچ تراکنش مالی برای نمایش وجود ندارد.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { Wallet, Plus } from 'lucide-vue-next';
</script>
