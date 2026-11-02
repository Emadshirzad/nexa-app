<template>
  <transition name="fade">
    <div
      v-if="uiStore.isSearchOpen"
      class="fixed inset-0 z-50 flex flex-col bg-graphite-950/70 backdrop-blur-sm"
      @click.self="closeSearch"
    >
      <div class="bg-white dark:bg-graphite-900 border-b border-gray-200 dark:border-graphite-800 shadow-xl max-w-lg w-full mx-auto safe-top">
        <!-- Search Input Header -->
        <div class="p-3 flex items-center gap-2">
          <div class="relative flex-1">
            <Search class="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              @input="onSearchInput"
              type="text"
              placeholder="جستجو در مشتریان، محصولات، فاکتورها، سرنخ‌ها و وظایف..."
              class="w-full pr-10 pl-9 py-2.5 rounded-xl bg-gray-100 dark:bg-graphite-800 text-graphite-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''; results = []"
              type="button"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <button
            @click="closeSearch"
            type="button"
            class="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-graphite-900 dark:hover:text-white"
          >
            بستن
          </button>
        </div>
      </div>

      <!-- Search Results Body -->
      <div class="flex-1 overflow-y-auto max-w-lg w-full mx-auto p-3 space-y-2">
        <div v-if="isLoading" class="py-12 text-center text-gray-400 text-xs">
          در حال جستجو...
        </div>

        <div v-else-if="searchQuery.trim().length === 0" class="py-12 text-center text-gray-400 text-xs">
          نام، شماره تماس، کد کالا یا شماره فاکتور را برای جستجو وارد کنید.
        </div>

        <div v-else-if="results.length === 0" class="py-12 text-center text-gray-400 text-xs">
          هیچ موردی مطابق با «{{ searchQuery }}» یافت نشد.
        </div>

        <div v-else class="space-y-1.5">
          <div
            v-for="item in results"
            :key="item.type + '-' + item.id"
            @click="handleSelect(item.route)"
            class="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-graphite-900 border border-gray-100 dark:border-graphite-800 hover:bg-gray-50 dark:hover:bg-graphite-800 cursor-pointer transition-all active:scale-[0.99]"
          >
            <div class="flex items-center gap-3 overflow-hidden">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                :class="getTypeBadgeClasses(item.type)"
              >
                <component :is="getTypeIcon(item.type)" class="w-4 h-4" />
              </div>
              <div class="truncate">
                <div class="text-sm font-semibold text-graphite-900 dark:text-white truncate">
                  {{ item.title }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {{ item.subtitle }}
                </div>
              </div>
            </div>

            <span
              class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 mr-2"
              :class="getTypePillClasses(item.type)"
            >
              {{ item.badge }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useUIStore } from '@/presentation/stores/uiStore';
import { getAppContainer } from '@/app/providers/container';
import type { GlobalSearchResult } from '@/domain/repositories/IReportingRepository';
import {
  Search,
  X,
  Users,
  Package,
  FileText,
  Target,
  CheckSquare
} from 'lucide-vue-next';

const uiStore = useUIStore();
const router = useRouter();

const searchQuery = ref('');
const results = ref<GlobalSearchResult[]>([]);
const isLoading = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  () => uiStore.isSearchOpen,
  (open) => {
    if (open) {
      searchQuery.value = '';
      results.value = [];
      nextTick(() => {
        searchInputRef.value?.focus();
      });
    }
  }
);

function closeSearch() {
  uiStore.isSearchOpen = false;
}

function onSearchInput() {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  if (!searchQuery.value.trim()) {
    results.value = [];
    return;
  }

  debounceTimeout = setTimeout(async () => {
    isLoading.value = true;
    try {
      const container = getAppContainer();
      const res = await container.globalSearchUseCase.execute(searchQuery.value);
      if (res.success) {
        results.value = res.data;
      }
    } catch {
      // Graceful error handling
    } finally {
      isLoading.value = false;
    }
  }, 200);
}

function handleSelect(route: string) {
  closeSearch();
  router.push(route);
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'customer':
      return Users;
    case 'product':
      return Package;
    case 'invoice':
      return FileText;
    case 'lead':
      return Target;
    case 'task':
      return CheckSquare;
    default:
      return Search;
  }
}

function getTypeBadgeClasses(type: string) {
  switch (type) {
    case 'customer':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400';
    case 'product':
      return 'bg-emerald-50 text-emerald dark:bg-emerald-950 dark:text-emerald-400';
    case 'invoice':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400';
    case 'lead':
      return 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400';
    case 'task':
      return 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
  }
}

function getTypePillClasses(type: string) {
  switch (type) {
    case 'customer':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    case 'product':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300';
    case 'invoice':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';
    case 'lead':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
    case 'task':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
