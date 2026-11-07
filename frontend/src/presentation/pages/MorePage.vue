<template>
  <div class="flex-1 flex flex-col">
    <AppHeader
      title="بیشتر"
      subtitle="سایر بخش‌های مدیریتی"
      :show-back="false"
    />

    <div class="p-4 space-y-4 flex-1">
      <div
        class="bg-white dark:bg-graphite-900 rounded-3xl border border-gray-100 dark:border-graphite-800 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-graphite-800"
      >
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-graphite-800 active:bg-gray-100 transition-colors group"
        >
          <div class="flex items-center gap-3.5">
            <div
              class="p-2.5 rounded-2xl transition-colors"
              :class="item.bgClass"
            >
              <component
                :is="item.icon"
                class="w-5 h-5"
                :class="item.textClass"
              />
            </div>
            <div>
              <div class="text-sm font-bold text-graphite-900 dark:text-white">
                {{ item.title }}
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ item.description }}
              </div>
            </div>
          </div>

          <ChevronLeft
            class="w-5 h-5 text-gray-400 group-hover:-translate-x-1 transition-transform"
          />
        </router-link>
      </div>

      <!-- Quick System Info Card -->
      <div
        class="p-4 rounded-2xl bg-mint/50 dark:bg-graphite-900/50 border border-emerald-100 dark:border-graphite-800 text-center"
      >
        <div class="text-xs font-bold text-emerald-800 dark:text-emerald-400">
          Nexa — نگارش ۱.۰.۰
        </div>
        <div class="text-[11px] text-graphite-400 dark:text-gray-400 mt-0.5">
          کاملاً امن و پایدار
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from "@/presentation/components/common/AppHeader.vue";
import {
  Package,
  Boxes,
  UserCheck,
  Wallet,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-vue-next";

const menuItems = [
  {
    title: "محصولات و کالاها",
    description: "تعریف کالاها، قیمت‌گذاری و واحدها",
    path: "/products",
    icon: Package,
    bgClass: "bg-emerald-50 dark:bg-emerald-950/60",
    textClass: "text-emerald",
  },
  {
    title: "انبارداری و موجودی",
    description: "گردش انبار و اصلاحات موجودی",
    path: "/inventory",
    icon: Boxes,
    bgClass: "bg-teal-50 dark:bg-teal-950/60",
    textClass: "text-teal-500",
  },
  {
    title: "سرنخ‌ها و فرصت‌ها",
    description: "پیگیری مشتریان بالقوه و تبدیل به مشتری",
    path: "/leads",
    icon: UserCheck,
    bgClass: "bg-purple-50 dark:bg-purple-950/60",
    textClass: "text-purple-500",
  },
  {
    title: "امور مالی و هزینه‌ها",
    description: "صندوق، هزینه‌های جاری و درآمدهای متفرقه",
    path: "/finance",
    icon: Wallet,
    bgClass: "bg-blue-50 dark:bg-blue-950/60",
    textClass: "text-blue-500",
  },
  {
    title: "گزارش‌های مدیریتی",
    description: "آمار فروش، مطالبات و پرفروش‌ترین‌ها",
    path: "/reports",
    icon: BarChart3,
    bgClass: "bg-amber-50 dark:bg-amber-950/60",
    textClass: "text-amber-500",
  },
  {
    title: "تنظیمات و پشتیبان‌گیری",
    description: "پروفایل کسب‌وکار، قفل امنیتی و خروجی داده",
    path: "/settings",
    icon: Settings,
    bgClass: "bg-gray-100 dark:bg-graphite-800",
    textClass: "text-gray-600 dark:text-gray-300",
  },
];
</script>
