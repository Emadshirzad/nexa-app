<template>
  <div class="fixed top-4 inset-x-4 z-50 pointer-events-none flex flex-col items-center gap-2">
    <transition-group
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="-translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        class="pointer-events-auto max-w-sm w-full rounded-2xl p-4 shadow-lg border flex items-center justify-between gap-3 text-sm"
        :class="toastClasses(toast.type)"
      >
        <div class="flex items-center gap-2.5">
          <component :is="toastIcon(toast.type)" class="w-5 h-5 flex-shrink-0" />
          <div>
            <div v-if="toast.title" class="font-bold text-xs mb-0.5">{{ toast.title }}</div>
            <div class="leading-relaxed">{{ toast.message }}</div>
          </div>
        </div>

        <button
          @click="uiStore.dismissToast(toast.id)"
          class="p-1 rounded-lg opacity-70 hover:opacity-100"
          aria-label="بستن"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useUIStore, ToastMessage } from '@/presentation/stores/uiStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next';

const uiStore = useUIStore();

function toastClasses(type: ToastMessage['type']) {
  switch (type) {
    case 'success':
      return 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100';
    case 'error':
      return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100';
    case 'info':
    default:
      return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
  }
}

function toastIcon(type: ToastMessage['type']) {
  switch (type) {
    case 'success':
      return CheckCircle2;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
    default:
      return Info;
  }
}
</script>
