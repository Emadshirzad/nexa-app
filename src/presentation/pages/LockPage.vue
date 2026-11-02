<template>
  <div class="h-full flex flex-col justify-between p-6 max-w-sm mx-auto select-none">
    <div class="text-center pt-12 space-y-3">
      <div class="w-14 h-14 rounded-3xl bg-emerald/10 text-emerald flex items-center justify-center mx-auto mb-2">
        <Lock class="w-7 h-7" />
      </div>
      <h2 class="text-lg font-bold text-graphite-900 dark:text-white">قفل امنیتی نکسا</h2>
      <p class="text-xs text-gray-400">رمز عبور خود را وارد کنید</p>

      <!-- PIN dots -->
      <div class="flex items-center justify-center gap-3 py-6" dir="ltr">
        <div
          v-for="i in 4"
          :key="i"
          class="w-3.5 h-3.5 rounded-full transition-all duration-200"
          :class="pin.length >= i ? 'bg-emerald scale-110 shadow-sm' : 'bg-gray-200 dark:bg-graphite-800'"
        ></div>
      </div>
    </div>

    <!-- Numeric Keypad -->
    <div class="space-y-3 pb-8" dir="ltr">
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="digit in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
          :key="digit"
          @click="appendDigit(digit)"
          type="button"
          class="h-14 rounded-2xl bg-gray-50 dark:bg-graphite-900 text-lg font-bold text-graphite-900 dark:text-white active:bg-emerald active:text-white active:scale-95 transition-all shadow-sm"
        >
          {{ digit }}
        </button>

        <!-- Biometric trigger -->
        <button
          @click="handleBiometric"
          type="button"
          class="h-14 rounded-2xl bg-gray-50 dark:bg-graphite-900 text-graphite-600 dark:text-gray-300 flex items-center justify-center active:scale-95 transition-all shadow-sm"
          aria-label="احراز هویت بیومتریک"
        >
          <Fingerprint class="w-6 h-6 text-emerald" />
        </button>

        <button
          @click="appendDigit(0)"
          type="button"
          class="h-14 rounded-2xl bg-gray-50 dark:bg-graphite-900 text-lg font-bold text-graphite-900 dark:text-white active:bg-emerald active:text-white active:scale-95 transition-all shadow-sm"
        >
          0
        </button>

        <!-- Backspace -->
        <button
          @click="deleteDigit"
          type="button"
          class="h-14 rounded-2xl bg-gray-50 dark:bg-graphite-900 text-gray-500 flex items-center justify-center active:scale-95 transition-all shadow-sm"
          aria-label="حذف رقم"
        >
          <Delete class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUIStore } from '@/presentation/stores/uiStore';
import { Lock, Fingerprint, Delete } from 'lucide-vue-next';
import { PinSecurityService } from '@/infrastructure/security/PinSecurityService';
import { BiometricSecurityService } from '@/infrastructure/security/BiometricSecurityService';

const router = useRouter();
const uiStore = useUIStore();
const pin = ref('');
const isVerifying = ref(false);

async function appendDigit(digit: number) {
  if (isVerifying.value || pin.value.length >= 6) return;

  pin.value += digit.toString();
  if (pin.value.length >= 4) {
    await verifyPin();
  }
}

function deleteDigit() {
  if (isVerifying.value) return;
  pin.value = pin.value.slice(0, -1);
}

async function verifyPin() {
  isVerifying.value = true;
  try {
    const isSet = await PinSecurityService.isPinSet();
    if (!isSet) {
      // If no PIN set yet, allow entry
      uiStore.unlockApp();
      router.replace('/dashboard');
      return;
    }

    const isValid = await PinSecurityService.verifyPin(pin.value);
    if (isValid) {
      uiStore.unlockApp();
      uiStore.showToast({
        type: 'success',
        message: 'قفل برنامه باز شد.'
      });
      router.replace('/dashboard');
    } else {
      pin.value = '';
      uiStore.showToast({
        type: 'error',
        message: 'رمز عبور وارد شده نادرست است.'
      });
    }
  } catch (err) {
    uiStore.showToast({
      type: 'error',
      message: 'خطا در احراز هویت: ' + String(err)
    });
  } finally {
    isVerifying.value = false;
  }
}

async function handleBiometric() {
  const success = await BiometricSecurityService.authenticate();
  if (success) {
    uiStore.unlockApp();
    uiStore.showToast({
      type: 'success',
      message: 'احراز هویت بیومتریک تأیید شد.'
    });
    router.replace('/dashboard');
  } else {
    uiStore.showToast({
      type: 'warning',
      message: 'احراز هویت بیومتریک ناموفق بود. لطفاً از PIN استفاده کنید.'
    });
  }
}
</script>
