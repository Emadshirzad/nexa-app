<template>
  <div class="min-h-full flex flex-col justify-between p-6 max-w-md mx-auto">
    <div class="space-y-6 pt-8">
      <!-- App Brand Logo & Welcome -->
      <div class="text-center space-y-2">
        <div class="w-16 h-16 rounded-3xl bg-emerald text-white flex items-center justify-center mx-auto shadow-md shadow-emerald/20">
          <Building2 class="w-8 h-8" />
        </div>
        <h1 class="text-xl font-black text-graphite-900 dark:text-white">به نکسا CRM خوش آمدید</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          برای شروع کار، اطلاعات کسب‌وکار خود را تکمیل کنید.
        </p>
      </div>

      <!-- Form Inputs -->
      <form @submit.prevent="handleSubmit" class="space-y-4 pt-4">
        <div>
          <label class="block text-xs font-bold text-graphite-700 dark:text-gray-300 mb-1.5">
            نام کسب‌وکار یا فروشگاه <span class="text-red-500">*</span>
          </label>
          <input
            v-model="businessName"
            type="text"
            required
            placeholder="مثال: بازرگانی پارس"
            class="w-full h-12 px-4 rounded-2xl bg-gray-50 dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-sm focus:outline-none focus:border-emerald"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-graphite-700 dark:text-gray-300 mb-1.5">
            شماره همراه یا تلفن تماس
          </label>
          <input
            v-model="phoneNumber"
            type="tel"
            placeholder="09123456789"
            dir="ltr"
            class="w-full h-12 px-4 rounded-2xl bg-gray-50 dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-sm text-right focus:outline-none focus:border-emerald"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-graphite-700 dark:text-gray-300 mb-1.5">
            آدرس یا توضیحات (اختیاری)
          </label>
          <textarea
            v-model="description"
            rows="2"
            placeholder="آدرس، شناسه یا توضیحات تکمیلی برای درج در فاکتور..."
            class="w-full p-4 rounded-2xl bg-gray-50 dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-sm focus:outline-none focus:border-emerald resize-none"
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full h-12 rounded-2xl bg-emerald text-white text-sm font-bold shadow-md shadow-emerald/20 hover:bg-emerald-600 active:scale-95 transition-all mt-4 disabled:opacity-50"
        >
          {{ isSubmitting ? 'در حال ثبت...' : 'ورود به برنامه' }}
        </button>
      </form>
    </div>

    <!-- Security Footnote -->
    <div class="text-center text-[11px] text-gray-400 pb-4">
      ۱۰۰٪ داده‌ها در حافظه داخلی گوشی شما ذخیره شده و هیچ وابستگی به اینترنت ندارد.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Building2 } from 'lucide-vue-next';
import { useUIStore } from '@/presentation/stores/uiStore';
import { useContainer } from '@/presentation/composables/useContainer';

const router = useRouter();
const uiStore = useUIStore();
const container = useContainer();

const businessName = ref('');
const phoneNumber = ref('');
const description = ref('');
const isSubmitting = ref(false);

async function handleSubmit() {
  if (!businessName.value.trim() || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    const result = await container.setupBusinessProfileUseCase.execute({
      name: businessName.value.trim(),
      phone: phoneNumber.value.trim() || undefined,
      description: description.value.trim() || undefined
    });

    if (result.success) {
      uiStore.showToast({
        type: 'success',
        title: 'پروفایل ایجاد شد',
        message: `پروفایل ${result.data.name} با موفقیت در پایگاه داده ذخیره شد.`
      });
      router.replace('/dashboard');
    } else {
      uiStore.showToast({
        type: 'error',
        message: result.error
      });
    }
  } catch (err) {
    uiStore.showToast({
      type: 'error',
      message: 'خطا در ثبت پروفایل: ' + String(err)
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>
