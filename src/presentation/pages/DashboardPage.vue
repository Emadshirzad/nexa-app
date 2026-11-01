<template>
  <div class="flex-1 flex flex-col">
    <!-- Screen Header -->
    <AppHeader
      title="نکسا CRM"
      :subtitle="todayJalaliFormatted"
      :show-back="false"
      :show-search="true"
      :show-lock="true"
    />

    <div class="p-4 space-y-5 flex-1">
      <!-- Quick Metric KPI Cards (Today's Overview) -->
      <section class="grid grid-cols-2 gap-3">
        <!-- Today's Sales -->
        <div class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-graphite-400 dark:text-gray-400 mb-2">
            <span class="text-xs font-medium">فروش امروز</span>
            <div class="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald">
              <TrendingUp class="w-4 h-4" />
            </div>
          </div>
          <div class="text-lg font-extrabold text-graphite-900 dark:text-white">
            ۰ <span class="text-xs font-normal text-gray-500">تومان</span>
          </div>
          <div class="text-[11px] text-gray-400 mt-1">۰ فاکتور صادرشده</div>
        </div>

        <!-- Today's Receipts -->
        <div class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-graphite-400 dark:text-gray-400 mb-2">
            <span class="text-xs font-medium">دریافتی نقد</span>
            <div class="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500">
              <Wallet class="w-4 h-4" />
            </div>
          </div>
          <div class="text-lg font-extrabold text-graphite-900 dark:text-white">
            ۰ <span class="text-xs font-normal text-gray-500">تومان</span>
          </div>
          <div class="text-[11px] text-gray-400 mt-1">تراکنش‌های صندوق</div>
        </div>

        <!-- Outstanding Debt -->
        <div class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-graphite-400 dark:text-gray-400 mb-2">
            <span class="text-xs font-medium">مانده طلب معوق</span>
            <div class="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
              <ReceiptText class="w-4 h-4" />
            </div>
          </div>
          <div class="text-lg font-extrabold text-graphite-900 dark:text-white">
            ۰ <span class="text-xs font-normal text-gray-500">تومان</span>
          </div>
          <div class="text-[11px] text-gray-400 mt-1">از کل مشتریان</div>
        </div>

        <!-- Active Leads & Tasks -->
        <div class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-graphite-400 dark:text-gray-400 mb-2">
            <span class="text-xs font-medium">وظایف امروز</span>
            <div class="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500">
              <Clock class="w-4 h-4" />
            </div>
          </div>
          <div class="text-lg font-extrabold text-graphite-900 dark:text-white">
            ۰ <span class="text-xs font-normal text-gray-500">وظیفه</span>
          </div>
          <div class="text-[11px] text-gray-400 mt-1">پیگیری در انتظار</div>
        </div>
      </section>

      <!-- Quick Action Buttons -->
      <section class="space-y-2">
        <h2 class="text-xs font-bold text-graphite-400 dark:text-gray-400 px-1">دسترسی سریع</h2>
        <div class="grid grid-cols-3 gap-2.5">
          <router-link
            to="/invoices/new"
            class="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald text-white shadow-sm hover:bg-emerald-600 active:scale-95 transition-all text-center"
          >
            <PlusCircle class="w-6 h-6 mb-1" />
            <span class="text-xs font-bold">فاکتور جدید</span>
          </router-link>

          <router-link
            to="/customers/new"
            class="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-graphite-800 active:scale-95 transition-all text-center"
          >
            <UserPlus class="w-6 h-6 mb-1 text-emerald" />
            <span class="text-xs font-bold">مشتری جدید</span>
          </router-link>

          <router-link
            to="/products/new"
            class="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-graphite-800 active:scale-95 transition-all text-center"
          >
            <PackagePlus class="w-6 h-6 mb-1 text-blue-500" />
            <span class="text-xs font-bold">محصول جدید</span>
          </router-link>
        </div>
      </section>

      <!-- Today's Tasks & Reminders -->
      <section class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald" />
            <h2 class="text-sm font-bold text-graphite-900 dark:text-white">وظایف و پیگیری‌های امروز</h2>
          </div>
          <router-link to="/tasks" class="text-xs text-emerald hover:underline">مشاهده همه</router-link>
        </div>

        <div class="py-6 text-center text-gray-400 space-y-1">
          <CheckSquare class="w-8 h-8 mx-auto opacity-40 mb-2" />
          <p class="text-xs">هیچ وظیفه‌ای برای امروز ثبت نشده است.</p>
        </div>
      </section>

      <!-- Inventory Low-stock Warnings -->
      <section class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-amber-500" />
            <h2 class="text-sm font-bold text-graphite-900 dark:text-white">هشدار موجودی کالا</h2>
          </div>
          <router-link to="/products" class="text-xs text-emerald hover:underline">انبارداری</router-link>
        </div>

        <div class="py-6 text-center text-gray-400 space-y-1">
          <Package class="w-8 h-8 mx-auto opacity-40 mb-2" />
          <p class="text-xs">همه محصولات در وضعیت موجودی مناسب هستند.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { getTodayJalali, formatJalaliHuman } from '@/shared/utils/jalali';
import {
  TrendingUp,
  Wallet,
  ReceiptText,
  Clock,
  PlusCircle,
  UserPlus,
  PackagePlus,
  CheckCircle2,
  CheckSquare,
  AlertTriangle,
  Package
} from 'lucide-vue-next';

const todayJalaliFormatted = computed(() => {
  return formatJalaliHuman(getTodayJalali());
});
</script>
