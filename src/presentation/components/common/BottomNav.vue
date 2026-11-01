<template>
  <nav class="bg-white/95 dark:bg-graphite/95 backdrop-blur-md border-t border-gray-100 dark:border-graphite-800 safe-bottom fixed bottom-0 inset-x-0 z-30 select-none">
    <div class="h-16 max-w-md mx-auto px-2 flex items-center justify-around">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex-1 flex flex-col items-center justify-center py-1 group relative transition-colors"
        :class="isActive(item.path) ? 'text-emerald dark:text-emerald-400 font-bold' : 'text-graphite-400 dark:text-gray-400 hover:text-graphite-700 dark:hover:text-gray-200'"
      >
        <!-- Icon with active pill effect -->
        <div
          class="relative px-3 py-1 rounded-full transition-all duration-200"
          :class="isActive(item.path) ? 'bg-mint dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 scale-105' : ''"
        >
          <component :is="item.icon" class="w-5 h-5 transition-transform group-active:scale-90" />
        </div>

        <!-- Label -->
        <span class="text-[11px] mt-0.5 tracking-tight">
          {{ item.label }}
        </span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { LayoutDashboard, Users, Receipt, CheckSquare, MoreHorizontal } from 'lucide-vue-next';

const route = useRoute();

interface NavItem {
  label: string;
  path: string;
  icon: unknown;
}

const navItems: NavItem[] = [
  { label: 'خانه', path: '/dashboard', icon: LayoutDashboard },
  { label: 'مشتریان', path: '/customers', icon: Users },
  { label: 'فاکتورها', path: '/invoices', icon: Receipt },
  { label: 'وظایف', path: '/tasks', icon: CheckSquare },
  { label: 'بیشتر', path: '/more', icon: MoreHorizontal }
];

function isActive(path: string): boolean {
  if (path === '/dashboard') {
    return route.path === '/dashboard';
  }
  return route.path.startsWith(path);
}
</script>
