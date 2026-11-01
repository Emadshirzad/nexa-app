import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { useUIStore } from '@/presentation/stores/uiStore';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach((to, _from, next) => {
  const uiStore = useUIStore();

  // If app is marked locked, redirect to /lock
  if (uiStore.isAppLocked && to.name !== 'lock') {
    next({ name: 'lock' });
    return;
  }

  // Check if first-launch onboarding is needed
  const profile = localStorage.getItem('nexa_business_profile');
  if (!profile && to.name !== 'onboarding') {
    next({ name: 'onboarding' });
    return;
  }

  next();
});
