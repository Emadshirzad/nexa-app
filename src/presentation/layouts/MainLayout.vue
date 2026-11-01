<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-graphite-950 text-graphite-900 dark:text-gray-100 overflow-hidden">
    <ToastContainer />

    <!-- Main Scrollable Screen Content -->
    <main class="flex-1 overflow-y-auto pb-20 overscroll-y-contain">
      <div class="max-w-md mx-auto min-h-full flex flex-col">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Persistent 5-Section Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import BottomNav from '@/presentation/components/common/BottomNav.vue';
import ToastContainer from '@/presentation/components/common/ToastContainer.vue';
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
