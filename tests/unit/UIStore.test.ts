import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUIStore } from '@/presentation/stores/uiStore';

describe('UI Store (Transient UI State)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('manages theme changes', () => {
    const store = useUIStore();
    expect(store.theme).toBe('system');

    store.setTheme('dark');
    expect(store.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    store.setTheme('light');
    expect(store.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('manages app lock state', () => {
    const store = useUIStore();
    expect(store.isAppLocked).toBe(false);

    store.lockApp();
    expect(store.isAppLocked).toBe(true);

    store.unlockApp();
    expect(store.isAppLocked).toBe(false);
  });

  it('enqueues and dismisses toast notifications', () => {
    const store = useUIStore();
    expect(store.toasts.length).toBe(0);

    store.showToast({
      type: 'success',
      title: 'موفق',
      message: 'عملیات با موفقیت انجام شد'
    });

    expect(store.toasts.length).toBe(1);
    const id = store.toasts[0].id;

    store.dismissToast(id);
    expect(store.toasts.length).toBe(0);
  });
});
