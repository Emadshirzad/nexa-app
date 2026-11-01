<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="فاکتورها" subtitle="فروش و صدور صورتحساب" :show-back="false">
      <template #actions>
        <router-link
          to="/invoices/new"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="فاکتور جدید"
        >
          <Plus class="w-5 h-5" />
        </router-link>
      </template>
    </AppHeader>

    <div class="p-4 space-y-4 flex-1 flex flex-col">
      <!-- Search & Status Filter Tabs -->
      <div class="space-y-2.5">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="جستجوی شماره فاکتور یا مشتری..."
            class="w-full h-11 pl-4 pr-10 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-sm focus:outline-none focus:border-emerald dark:focus:border-emerald transition-colors"
          />
          <Search class="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        <!-- Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            v-for="filter in filters"
            :key="filter.key"
            @click="activeFilter = filter.key"
            type="button"
            class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
            :class="activeFilter === filter.key
              ? 'bg-emerald text-white font-bold shadow-sm'
              : 'bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-600 dark:text-gray-400'"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400">
        <div class="w-16 h-16 rounded-3xl bg-mint dark:bg-graphite-800 flex items-center justify-center text-emerald mb-3">
          <Receipt class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-graphite-800 dark:text-gray-200">هنوز فاکتوری صادر نشده است</h3>
        <p class="text-xs text-gray-400 max-w-xs mt-1 mb-5">
          اولین فاکتور فروش رسمی خود را در کمتر از ۱ دقیقه صادر کرده و فایل PDF آن را تحویل مشتری دهید.
        </p>
        <router-link
          to="/invoices/new"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald text-white text-xs font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <Plus class="w-4 h-4" />
          صدور اولین فاکتور
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { Receipt, Plus, Search } from 'lucide-vue-next';

const searchQuery = ref('');
const activeFilter = ref<'all' | 'issued' | 'cancelled'>('all');

const filters = [
  { key: 'all' as const, label: 'همه فاکتورها' },
  { key: 'issued' as const, label: 'صادرشده' },
  { key: 'cancelled' as const, label: 'ابطال‌شده' }
];
</script>
