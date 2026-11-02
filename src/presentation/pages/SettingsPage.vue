<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="تنظیمات" subtitle="شخصی‌سازی و پیکربندی" :show-back="true" />

    <div class="p-4 space-y-4 flex-1">
      <!-- Theme Selection -->
      <section class="bg-white dark:bg-graphite-900 rounded-3xl p-4 border border-gray-100 dark:border-graphite-800 space-y-3">
        <h3 class="text-xs font-bold text-graphite-400 dark:text-gray-400">پوسته ظاهری برنامه</h3>
        <div class="grid grid-cols-3 gap-2 text-xs">
          <button
            v-for="mode in themeOptions"
            :key="mode.key"
            @click="handleThemeChange(mode.key)"
            type="button"
            class="p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all"
            :class="uiStore.theme === mode.key
              ? 'bg-emerald text-white font-bold shadow-sm'
              : 'bg-gray-50 dark:bg-graphite-800 text-graphite-700 dark:text-gray-300'"
          >
            <component :is="mode.icon" class="w-4 h-4" />
            <span>{{ mode.label }}</span>
          </button>
        </div>
      </section>

      <!-- Business Profile & Details -->
      <section class="bg-white dark:bg-graphite-900 rounded-3xl p-4 border border-gray-100 dark:border-graphite-800 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-graphite-400 dark:text-gray-400">اطلاعات کسب‌وکار</h3>
          <button
            @click="isEditingProfile = !isEditingProfile"
            class="text-xs text-emerald font-bold hover:underline"
          >
            {{ isEditingProfile ? 'انصراف' : 'ویرایش' }}
          </button>
        </div>

        <!-- View Mode -->
        <div v-if="!isEditingProfile" class="text-xs text-graphite-700 dark:text-gray-300 space-y-2">
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-graphite-800">
            <span class="text-gray-400">نام تجاری:</span>
            <span class="font-bold">{{ businessProfile?.name || 'تعریف نشده' }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-graphite-800">
            <span class="text-gray-400">شماره تماس:</span>
            <span dir="ltr">{{ businessProfile?.phone || 'تعریف نشده' }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-graphite-800">
            <span class="text-gray-400">تقویم پیش‌فرض:</span>
            <span>شمسی (هجری خورشیدی)</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-gray-400">واحد پول:</span>
            <span>تومان (Toman)</span>
          </div>
        </div>

        <!-- Edit Form -->
        <form v-else @submit.prevent="handleSaveProfile" class="space-y-3 pt-1">
          <div>
            <label class="block text-[11px] font-bold text-gray-500 mb-1">نام تجاری *</label>
            <input
              v-model="editName"
              type="text"
              required
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 mb-1">شماره تماس</label>
            <input
              v-model="editPhone"
              type="tel"
              dir="ltr"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs text-right focus:outline-none focus:border-emerald"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 mb-1">توضیحات</label>
            <textarea
              v-model="editDescription"
              rows="2"
              class="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald resize-none"
            ></textarea>
          </div>
          <button
            type="submit"
            class="w-full h-10 rounded-xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all"
          >
            ذخیره تغییرات
          </button>
        </form>
      </section>

      <!-- Security & App Lock -->
      <section class="bg-white dark:bg-graphite-900 rounded-3xl p-4 border border-gray-100 dark:border-graphite-800 space-y-3">
        <h3 class="text-xs font-bold text-graphite-400 dark:text-gray-400">امنیت و قفل برنامه</h3>

        <div class="space-y-2">
          <button
            @click="uiStore.lockApp()"
            type="button"
            class="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 text-xs font-bold hover:bg-gray-100 dark:hover:bg-graphite-700 transition-colors"
          >
            <div class="flex items-center gap-2">
              <Lock class="w-4 h-4 text-emerald" />
              <span>قفل کردن فوری برنامه</span>
            </div>
            <span class="text-gray-400">ورود با PIN</span>
          </button>

          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 flex items-center justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-300">قفل خودکار پس از عدم فعالیت:</span>
            <span class="font-bold text-emerald">۱۵ دقیقه</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { useUIStore, AppTheme } from '@/presentation/stores/uiStore';
import { useContainer } from '@/presentation/composables/useContainer';
import type { BusinessProfile } from '@/domain/entities/BusinessProfile';
import { Sun, Moon, Laptop, Lock } from 'lucide-vue-next';

const uiStore = useUIStore();
const container = useContainer();

const businessProfile = ref<BusinessProfile | null>(null);
const isEditingProfile = ref(false);
const editName = ref('');
const editPhone = ref('');
const editDescription = ref('');

const themeOptions = [
  { key: 'system' as AppTheme, label: 'سیستم', icon: Laptop },
  { key: 'light' as AppTheme, label: 'روشن', icon: Sun },
  { key: 'dark' as AppTheme, label: 'تاریک', icon: Moon }
];

onMounted(async () => {
  await loadProfile();
});

async function loadProfile() {
  try {
    businessProfile.value = await container.getBusinessProfileUseCase.execute();
    if (businessProfile.value) {
      editName.value = businessProfile.value.name;
      editPhone.value = businessProfile.value.phone || '';
      editDescription.value = businessProfile.value.description || '';
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

async function handleThemeChange(theme: AppTheme) {
  uiStore.setTheme(theme);
  await container.settingsRepo.set('theme', theme);
}

async function handleSaveProfile() {
  if (!editName.value.trim()) return;

  const res = await container.setupBusinessProfileUseCase.execute({
    name: editName.value.trim(),
    phone: editPhone.value.trim() || undefined,
    description: editDescription.value.trim() || undefined
  });

  if (res.success) {
    businessProfile.value = res.data;
    isEditingProfile.value = false;
    uiStore.showToast({
      type: 'success',
      message: 'اطلاعات کسب‌وکار با موفقیت به‌روزرسانی شد.'
    });
  } else {
    uiStore.showToast({
      type: 'error',
      message: res.error
    });
  }
}
</script>
