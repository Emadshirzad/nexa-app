<template>
  <div class="flex-1 flex flex-col pb-8">
    <AppHeader title="تنظیمات" subtitle="شخصی‌سازی، پشتیبان‌گیری و پایگاه داده" :show-back="true" />

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

      <!-- Backup & Restore (.nxbak) -->
      <section class="bg-white dark:bg-graphite-900 rounded-3xl p-4 border border-gray-100 dark:border-graphite-800 space-y-3">
        <h3 class="text-xs font-bold text-graphite-400 dark:text-gray-400">پشتیبان‌گیری و بازیابی (.nxbak)</h3>
        <p class="text-[11px] text-gray-500">
          پشتیبان‌گیری رمزگذاری‌شده با الگوریتم پیشرفته AES-256 و کلید ۱۰۰,۰۰۰ مرحله‌ای جهت انتقال امن به دستگاه دیگر.
        </p>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="openBackupModal"
            type="button"
            class="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald border border-emerald-100 dark:border-emerald-900/40 text-xs font-bold flex flex-col items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors"
          >
            <ShieldCheck class="w-5 h-5" />
            <span>تهیه فایل پشتیبان</span>
          </button>

          <button
            @click="triggerRestoreFilePicker"
            type="button"
            class="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 text-xs font-bold flex flex-col items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
          >
            <RotateCcw class="w-5 h-5" />
            <span>بازیابی اطلاعات</span>
          </button>
        </div>

        <input
          ref="backupFileInputRef"
          type="file"
          accept=".nxbak,application/json"
          class="hidden"
          @change="handleBackupFileSelected"
        />
      </section>

      <!-- CSV Data Import / Export -->
      <section class="bg-white dark:bg-graphite-900 rounded-3xl p-4 border border-gray-100 dark:border-graphite-800 space-y-3">
        <h3 class="text-xs font-bold text-graphite-400 dark:text-gray-400">ورود و خروج اکسل (CSV)</h3>

        <div class="space-y-2">
          <!-- Customers CSV -->
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-graphite-900 dark:text-white">مشتریان</div>
              <div class="text-[10px] text-gray-400 mt-0.5">خروجی اکسل یا ورود از فایل</div>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                @click="exportCustomersCsv"
                type="button"
                class="px-2.5 py-1.5 rounded-xl bg-white dark:bg-graphite-700 text-graphite-800 dark:text-gray-200 border border-gray-200 dark:border-graphite-600 text-xs font-medium hover:border-emerald"
              >
                خروجی
              </button>
              <button
                @click="triggerImportCustomersCsv"
                type="button"
                class="px-2.5 py-1.5 rounded-xl bg-emerald text-white text-xs font-medium hover:bg-emerald-600"
              >
                ورود داده
              </button>
            </div>
          </div>

          <!-- Products CSV -->
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-graphite-900 dark:text-white">محصولات و کالاها</div>
              <div class="text-[10px] text-gray-400 mt-0.5">خروجی اکسل یا ورود از فایل</div>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                @click="exportProductsCsv"
                type="button"
                class="px-2.5 py-1.5 rounded-xl bg-white dark:bg-graphite-700 text-graphite-800 dark:text-gray-200 border border-gray-200 dark:border-graphite-600 text-xs font-medium hover:border-emerald"
              >
                خروجی
              </button>
              <button
                @click="triggerImportProductsCsv"
                type="button"
                class="px-2.5 py-1.5 rounded-xl bg-emerald text-white text-xs font-medium hover:bg-emerald-600"
              >
                ورود داده
              </button>
            </div>
          </div>
        </div>

        <input
          ref="customersCsvInputRef"
          type="file"
          accept=".csv,text/csv"
          class="hidden"
          @change="handleCustomersCsvSelected"
        />
        <input
          ref="productsCsvInputRef"
          type="file"
          accept=".csv,text/csv"
          class="hidden"
          @change="handleProductsCsvSelected"
        />
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

    <!-- Passphrase Modal for Backup -->
    <div
      v-if="showBackupModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm"
    >
      <div class="bg-white dark:bg-graphite-900 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-gray-100 dark:border-graphite-800">
        <h3 class="text-sm font-bold text-graphite-900 dark:text-white">رمزگذاری فایل پشتیبان</h3>
        <p class="text-xs text-gray-500">
          لطفاً یک رمز عبور قوی (حداقل ۴ نویسه) برای رمزگذاری فایل پشتیبان انتخاب کنید.
        </p>

        <input
          v-model="backupPassphrase"
          type="password"
          placeholder="رمز عبور فایل پشتیبان..."
          class="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
        />

        <div class="flex items-center gap-2 pt-2">
          <button
            @click="showBackupModal = false"
            type="button"
            class="flex-1 h-10 rounded-xl bg-gray-100 dark:bg-graphite-800 text-xs font-bold text-gray-600 dark:text-gray-300"
          >
            انصراف
          </button>
          <button
            @click="performCreateBackup"
            type="button"
            :disabled="backupPassphrase.length < 4 || isProcessingBackup"
            class="flex-1 h-10 rounded-xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50"
          >
            {{ isProcessingBackup ? 'در حال رمزگذاری...' : 'تأیید و ذخیره' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Passphrase Modal for Restore -->
    <div
      v-if="showRestoreModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm"
    >
      <div class="bg-white dark:bg-graphite-900 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 dark:border-rose-900/40">
        <h3 class="text-sm font-bold text-rose-600 dark:text-rose-400">بازیابی اطلاعات پایگاه داده</h3>
        <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          <strong class="text-rose-500">هشدار مهم:</strong> بازیابی فایل پشتیبان، کلیه داده‌های فعلی را با داده‌های موجود در فایل جایگزین خواهد کرد.
        </p>

        <input
          v-model="restorePassphrase"
          type="password"
          placeholder="رمز عبور فایل پشتیبان را وارد کنید..."
          class="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
        />

        <div class="flex items-center gap-2 pt-2">
          <button
            @click="cancelRestore"
            type="button"
            class="flex-1 h-10 rounded-xl bg-gray-100 dark:bg-graphite-800 text-xs font-bold text-gray-600 dark:text-gray-300"
          >
            انصراف
          </button>
          <button
            @click="performRestore"
            type="button"
            :disabled="!restorePassphrase || isProcessingRestore"
            class="flex-1 h-10 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
          >
            {{ isProcessingRestore ? 'در حال بازیابی...' : 'بازیابی داده‌ها' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { useUIStore, AppTheme } from '@/presentation/stores/uiStore';
import { useContainer } from '@/presentation/composables/useContainer';
import type { BusinessProfile } from '@/domain/entities/BusinessProfile';
import {
  Sun,
  Moon,
  Laptop,
  Lock,
  ShieldCheck,
  RotateCcw
} from 'lucide-vue-next';

const uiStore = useUIStore();
const container = useContainer();

const businessProfile = ref<BusinessProfile | null>(null);
const isEditingProfile = ref(false);
const editName = ref('');
const editPhone = ref('');
const editDescription = ref('');

// Backup / Restore State
const showBackupModal = ref(false);
const backupPassphrase = ref('');
const isProcessingBackup = ref(false);

const showRestoreModal = ref(false);
const restorePassphrase = ref('');
const pendingRestoreContent = ref('');
const isProcessingRestore = ref(false);

const backupFileInputRef = ref<HTMLInputElement | null>(null);
const customersCsvInputRef = ref<HTMLInputElement | null>(null);
const productsCsvInputRef = ref<HTMLInputElement | null>(null);

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

// Download Helper
function downloadFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Backup Functions
function openBackupModal() {
  backupPassphrase.value = '';
  showBackupModal.value = true;
}

async function performCreateBackup() {
  if (backupPassphrase.value.length < 4) return;
  isProcessingBackup.value = true;
  try {
    const backupString = await container.backupService.createBackup(backupPassphrase.value);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    downloadFile(backupString, `nexa_backup_${dateStr}.nxbak`, 'application/json');
    showBackupModal.value = false;
    uiStore.showToast({
      type: 'success',
      message: 'فایل پشتیبان رمزگذاری‌شده با موفقیت دانلود شد.'
    });
  } catch (err) {
    uiStore.showToast({
      type: 'error',
      message: err instanceof Error ? err.message : 'خطا در ایجاد فایل پشتیبان'
    });
  } finally {
    isProcessingBackup.value = false;
  }
}

// Restore Functions
function triggerRestoreFilePicker() {
  if (backupFileInputRef.value) {
    backupFileInputRef.value.value = '';
    backupFileInputRef.value.click();
  }
}

function handleBackupFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    pendingRestoreContent.value = String(e.target?.result || '');
    restorePassphrase.value = '';
    showRestoreModal.value = true;
  };
  reader.readAsText(file);
}

function cancelRestore() {
  showRestoreModal.value = false;
  pendingRestoreContent.value = '';
  restorePassphrase.value = '';
}

async function performRestore() {
  if (!restorePassphrase.value || !pendingRestoreContent.value) return;
  isProcessingRestore.value = true;
  try {
    const res = await container.backupService.restoreBackup(
      pendingRestoreContent.value,
      restorePassphrase.value
    );
    if (res.success) {
      showRestoreModal.value = false;
      uiStore.showToast({
        type: 'success',
        message: `بازیابی با موفقیت انجام شد (${res.data.restoredRows} رکورد بازیابی گردید).`
      });
      await loadProfile();
    } else {
      uiStore.showToast({
        type: 'error',
        message: res.error.message
      });
    }
  } catch (err) {
    uiStore.showToast({
      type: 'error',
      message: err instanceof Error ? err.message : 'خطای ناشناخته در بازیابی اطلاعات'
    });
  } finally {
    isProcessingRestore.value = false;
  }
}

// CSV Handlers
async function exportCustomersCsv() {
  try {
    const csv = await container.csvService.exportCustomers();
    downloadFile(csv, 'nexa_customers.csv', 'text/csv;charset=utf-8');
    uiStore.showToast({
      type: 'success',
      message: 'فایل اکسل مشتریان با موفقیت دانلود شد.'
    });
  } catch {
    uiStore.showToast({
      type: 'error',
      message: 'خطا در صدور فایل اکسل مشتریان'
    });
  }
}

function triggerImportCustomersCsv() {
  if (customersCsvInputRef.value) {
    customersCsvInputRef.value.value = '';
    customersCsvInputRef.value.click();
  }
}

function handleCustomersCsvSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const text = String(e.target?.result || '');
    try {
      const res = await container.csvService.importCustomers(text);
      if (res.errors.length > 0) {
        uiStore.showToast({
          type: 'warning',
          message: `${res.imported} مشتری افزوده شد. (${res.errors.length} خطا: ${res.errors[0]})`
        });
      } else {
        uiStore.showToast({
          type: 'success',
          message: `${res.imported} مشتری با موفقیت وارد شدند (${res.skipped} تکراری).`
        });
      }
    } catch {
      uiStore.showToast({
        type: 'error',
        message: 'خطا در خواندن فایل اکسل مشتریان'
      });
    }
  };
  reader.readAsText(file);
}

async function exportProductsCsv() {
  try {
    const csv = await container.csvService.exportProducts();
    downloadFile(csv, 'nexa_products.csv', 'text/csv;charset=utf-8');
    uiStore.showToast({
      type: 'success',
      message: 'فایل اکسل کالاها با موفقیت دانلود شد.'
    });
  } catch {
    uiStore.showToast({
      type: 'error',
      message: 'خطا در صدور فایل اکسل محصولات'
    });
  }
}

function triggerImportProductsCsv() {
  if (productsCsvInputRef.value) {
    productsCsvInputRef.value.value = '';
    productsCsvInputRef.value.click();
  }
}

function handleProductsCsvSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const text = String(e.target?.result || '');
    try {
      const res = await container.csvService.importProducts(text);
      if (res.errors.length > 0) {
        uiStore.showToast({
          type: 'warning',
          message: `${res.imported} کالا افزوده شد. (${res.errors.length} خطا: ${res.errors[0]})`
        });
      } else {
        uiStore.showToast({
          type: 'success',
          message: `${res.imported} کالا با موفقیت وارد شدند (${res.skipped} تکراری).`
        });
      }
    } catch {
      uiStore.showToast({
        type: 'error',
        message: 'خطا در خواندن فایل اکسل کالاها'
      });
    }
  };
  reader.readAsText(file);
}
</script>
