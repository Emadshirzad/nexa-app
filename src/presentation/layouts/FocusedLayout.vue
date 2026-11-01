<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-graphite-950 text-graphite-900 dark:text-gray-100 overflow-hidden">
    <ToastContainer />

    <main class="flex-1 overflow-y-auto overscroll-y-contain">
      <div class="max-w-md mx-auto min-h-full flex flex-col">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import ToastContainer from '@/presentation/components/common/ToastContainer.vue';
</script>
