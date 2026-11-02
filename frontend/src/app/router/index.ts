import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { useUIStore } from '@/presentation/stores/uiStore';
import { getAppContainer } from '@/app/providers/container';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach(async (to, _from, next) => {
  const uiStore = useUIStore();

  // 1. If app is marked locked, redirect to /lock
  if (uiStore.isAppLocked && to.name !== 'lock') {
    next({ name: 'lock' });
    return;
  }

  // 2. Check if onboarding is needed in SQLite database
  try {
    const container = getAppContainer();
    const hasProfile = await container.profileRepo.hasProfile();

    if (!hasProfile && to.name !== 'onboarding') {
      if (_from && _from.name === 'onboarding') {
        // Save claimed success but profile is not persisted; surface it instead of a silent bounce.
        uiStore.showToast({
          type: 'error',
          message: 'خطا در ذخیره‌سازی داده: پروفایل ذخیره نشد. لطفاً دوباره تلاش کنید.'
        });
      }
      next({ name: 'onboarding' });
      return;
    }
    if (hasProfile && to.name === 'onboarding') {
      next({ name: 'dashboard' });
      return;
    }
  } catch (err) {
    // Container might still be bootstrapping; log for visibility.
    console.error('Router guard: profile check failed, allowing navigation.', err);
  }

  next();
});
