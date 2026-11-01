<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="محصولات" subtitle="کاتالوگ کالا و خدمات" :show-back="true">
      <template #actions>
        <button
          type="button"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="محصول جدید"
        >
          <Plus class="w-5 h-5" />
        </button>
      </template>
    </AppHeader>

    <div class="p-4 space-y-4 flex-1 flex flex-col">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="جستجوی نام کالا یا کد SKU..."
          class="w-full h-11 pl-4 pr-10 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-sm focus:outline-none focus:border-emerald dark:focus:border-emerald transition-colors"
        />
        <Search class="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
      </div>

      <div class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400">
        <div class="w-16 h-16 rounded-3xl bg-mint dark:bg-graphite-800 flex items-center justify-center text-emerald mb-3">
          <Package class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-graphite-800 dark:text-gray-200">هنوز محصولی ثبت نشده است</h3>
        <p class="text-xs text-gray-400 max-w-xs mt-1 mb-5">
          کالاها و خدمات خود را با تعیین واحد، قیمت فروش و موجودی اولیه تعریف کنید.
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald text-white text-xs font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <Plus class="w-4 h-4" />
          افزودن اولین محصول
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { Package, Plus, Search } from 'lucide-vue-next';

const searchQuery = ref('');
</script>
