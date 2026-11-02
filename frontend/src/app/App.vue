<template>
  <div
    class="h-full w-full flex flex-col font-sans select-none antialiased bg-white dark:bg-graphite text-graphite-900 dark:text-white"
  >
    <!-- Initializing State -->
    <div
      v-if="isInitializing"
      class="h-full w-full flex flex-col items-center justify-center p-6 bg-graphite-950 text-white text-center"
    >
      <div
        class="w-16 h-16 rounded-3xl bg-emerald/10 border border-emerald/30 flex items-center justify-center mb-4 text-emerald"
      >
        <Loader2 class="w-8 h-8 animate-spin" />
      </div>
      <h1 class="text-xl font-bold tracking-tight">نکسا</h1>
      <p class="text-xs text-gray-400 mt-1.5">در حال بارگذاری پایگاه داده...</p>
    </div>

    <!-- Initialization Error State -->
    <div
      v-else-if="initError"
      class="h-full w-full flex flex-col items-center justify-center p-6 bg-graphite-950 text-white text-center"
    >
      <div
        class="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-500"
      >
        <AlertTriangle class="w-8 h-8" />
      </div>
      <h2 class="text-base font-bold text-white">خطا در راه‌اندازی برنامه</h2>
      <p class="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed" dir="rtl">
        {{ initError }}
      </p>
      <button
        @click="startInitialization"
        type="button"
        class="mt-6 px-6 py-2.5 rounded-2xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all shadow-sm"
      >
        تلاش مجدد
      </button>
    </div>

    <!-- Ready App -->
    <template v-else>
      <router-view />
      <ToastContainer />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useUIStore } from "@/presentation/stores/uiStore";
import { useRouter } from "vue-router";
import { initializeAppContainer } from "@/app/providers/container";
import { Loader2, AlertTriangle } from "lucide-vue-next";
import ToastContainer from "@/presentation/components/common/ToastContainer.vue";

const uiStore = useUIStore();
const router = useRouter();

const isInitializing = ref(true);
const initError = ref<string | null>(null);

async function startInitialization() {
  isInitializing.value = true;
  initError.value = null;

  try {
    const container = await initializeAppContainer();
    const hasProfile = await container.profileRepo.hasProfile();

    if (!hasProfile && router.currentRoute.value.name !== "onboarding") {
      await router.replace({ name: "onboarding" });
    }
  } catch (err) {
    console.error("Failed to initialize container:", err);
    initError.value = err instanceof Error ? err.message : String(err);
  } finally {
    isInitializing.value = false;
  }
}

onMounted(() => {
  // Apply initial theme
  uiStore.applyThemeClass(uiStore.theme);

  startInitialization();
});
</script>
