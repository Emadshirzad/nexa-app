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

  it('manages font size preferences', () => {
    const store = useUIStore();
    expect(store.fontSize).toBe('normal');

    store.setFontSize('small');
    expect(store.fontSize).toBe('small');
    expect(document.documentElement.style.fontSize).toBe('14px');

    store.setFontSize('large');
    expect(store.fontSize).toBe('large');
    expect(document.documentElement.style.fontSize).toBe('17px');

    store.setFontSize('normal');
    expect(store.fontSize).toBe('normal');
    expect(document.documentElement.style.fontSize).toBe('15px');
  });
});
