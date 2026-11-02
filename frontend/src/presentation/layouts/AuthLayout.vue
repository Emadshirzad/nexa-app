<template>
  <div class="h-full flex flex-col bg-white dark:bg-graphite text-graphite-900 dark:text-white overflow-hidden">
    <ToastContainer />
    <main class="flex-1 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import ToastContainer from '@/presentation/components/common/ToastContainer.vue';
</script>
