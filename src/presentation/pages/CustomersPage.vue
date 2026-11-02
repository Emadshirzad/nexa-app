<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="مشتریان" subtitle="مدیریت مخاطبین، حساب‌ها و پیگیری‌ها" :show-back="false">
      <template #actions>
        <button
          @click="openCreateModal"
          type="button"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="مشتری جدید"
        >
          <UserPlus class="w-5 h-5" />
        </button>
      </template>
    </AppHeader>

    <div class="p-4 space-y-4 flex-1 flex flex-col">
      <!-- Search & Tag Filter -->
      <div class="space-y-2.5">
        <div class="relative">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="search"
            placeholder="جستجوی نام، تلفن یا شماره همراه..."
            class="w-full h-11 pl-4 pr-10 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-sm focus:outline-none focus:border-emerald dark:focus:border-emerald transition-colors"
          />
          <Search class="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        <!-- Tag Chips -->
        <div v-if="allTags.length > 0" class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            @click="selectTag(null)"
            type="button"
            class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
            :class="selectedTag === null
              ? 'bg-emerald text-white font-bold shadow-sm'
              : 'bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-600 dark:text-gray-400'"
          >
            همه برچسب‌ها
          </button>
          <button
            v-for="tag in allTags"
            :key="tag"
            @click="selectTag(tag)"
            type="button"
            class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
            :class="selectedTag === tag
              ? 'bg-emerald text-white font-bold shadow-sm'
              : 'bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-600 dark:text-gray-400'"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Customer Cards -->
      <div v-if="customers.length > 0" class="space-y-3 flex-1">
        <div
          v-for="customer in customers"
          :key="customer.id"
          @click="openDetailModal(customer)"
          class="bg-white dark:bg-graphite-900 rounded-3xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm cursor-pointer hover:border-emerald/40 active:scale-[0.99] transition-all space-y-3"
        >
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-graphite-900 dark:text-white">{{ customer.name }}</span>
              </div>
              <div class="text-xs text-gray-400 font-mono" dir="ltr">
                {{ customer.mobile }}
              </div>
            </div>

            <!-- Tags -->
            <div v-if="customer.tags.length > 0" class="flex items-center gap-1 flex-wrap justify-end">
              <span
                v-for="t in customer.tags"
                :key="t"
                class="px-2 py-0.5 rounded-md text-[10px] bg-gray-100 dark:bg-graphite-800 text-gray-600 dark:text-gray-300 font-medium"
              >
                {{ t }}
              </span>
            </div>
          </div>

          <!-- Bottom bar: Call, SMS, Debt indicator -->
          <div class="flex items-center justify-between border-t border-gray-100 dark:border-graphite-800/60 pt-3 text-xs">
            <div class="flex items-center gap-2 text-gray-500">
              <span v-if="customer.address" class="truncate max-w-[180px] text-[11px]">{{ customer.address }}</span>
              <span v-else class="text-[11px] text-gray-400">بدون آدرس ثبت‌شده</span>
            </div>

            <div class="flex items-center gap-2">
              <a
                :href="'tel:' + customer.mobile"
                @click.stop
                class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald hover:bg-emerald-100 transition-colors"
                aria-label="تماس تلفنی"
              >
                <Phone class="w-4 h-4" />
              </a>
              <a
                :href="'sms:' + customer.mobile"
                @click.stop
                class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 hover:bg-blue-100 transition-colors"
                aria-label="ارسال پیامک"
              >
                <MessageSquare class="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400">
        <div class="w-16 h-16 rounded-3xl bg-mint dark:bg-graphite-800 flex items-center justify-center text-emerald mb-3">
          <Users class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-graphite-800 dark:text-gray-200">مشتری یافت نشد</h3>
        <p class="text-xs text-gray-400 max-w-xs mt-1 mb-5">
          برای مدیریت فروش، صدور فاکتور و ثبت بدهی‌ها، مشتری خود را اضافه کنید.
        </p>
        <button
          @click="openCreateModal"
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald text-white text-xs font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <UserPlus class="w-4 h-4" />
          افزودن مشتری جدید
        </button>
      </div>
    </div>

    <!-- Create Customer Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div class="bg-white dark:bg-graphite-900 rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl border border-gray-100 dark:border-graphite-800">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-graphite-800 pb-3">
          <h3 class="text-sm font-bold text-graphite-900 dark:text-white">افزودن مشتری جدید</h3>
          <button @click="showCreateModal = false" class="p-1 rounded-lg text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleCreateCustomer" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">نام و نام خانوادگی *</label>
            <input
              v-model="newForm.name"
              type="text"
              required
              placeholder="مثال: علی محمدی"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">شماره همراه (یکتا) *</label>
              <input
                v-model="newForm.mobile"
                type="tel"
                required
                placeholder="09123456789"
                dir="ltr"
                class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-right focus:outline-none focus:border-emerald"
              />
            </div>

            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">تلفن ثابت</label>
              <input
                v-model="newForm.phone"
                type="tel"
                placeholder="021..."
                dir="ltr"
                class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-right focus:outline-none focus:border-emerald"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">برچسب‌ها (با کاما جدا کنید)</label>
            <input
              v-model="tagsInput"
              type="text"
              placeholder="مثال: عمده‌فروش، تهران، نقدی"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">آدرس</label>
            <textarea
              v-model="newForm.address"
              rows="2"
              placeholder="نشانی پستی..."
              class="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald resize-none"
            ></textarea>
          </div>

          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">یادداشت اولیه</label>
            <textarea
              v-model="newForm.notes"
              rows="2"
              placeholder="توضیحات اختیاری..."
              class="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full h-11 rounded-2xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all mt-2 disabled:opacity-50"
          >
            {{ isSubmitting ? 'در حال ثبت...' : 'ثبت مشتری' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Customer Detail Modal -->
    <div v-if="showDetailModal && activeCustomer" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div class="bg-white dark:bg-graphite-900 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-xl border border-gray-100 dark:border-graphite-800">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-graphite-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-graphite-900 dark:text-white">{{ activeCustomer.name }}</h3>
            <p class="text-xs text-gray-400 font-mono mt-0.5" dir="ltr">{{ activeCustomer.mobile }}</p>
          </div>
          <button @click="showDetailModal = false" class="p-1 rounded-lg text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Financial Summary Card -->
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 border border-gray-100 dark:border-graphite-700">
            <span class="text-gray-400 text-[11px]">مجموع خرید:</span>
            <div class="text-sm font-bold text-graphite-900 dark:text-white mt-1">
              {{ financialSummary ? financialSummary.totalPurchases.toLocaleString('en-US') + ' تومان' : '۰ تومان' }}
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 border border-gray-100 dark:border-graphite-700">
            <span class="text-gray-400 text-[11px]">مانده بدهی:</span>
            <div
              class="text-sm font-bold mt-1"
              :class="financialSummary && financialSummary.outstandingDebt > 0 ? 'text-red-500' : 'text-emerald'"
            >
              {{ financialSummary ? financialSummary.outstandingDebt.toLocaleString('en-US') + ' تومان' : '۰ تومان' }}
            </div>
          </div>
        </div>

        <!-- Direct Actions -->
        <div class="grid grid-cols-2 gap-2 pt-2">
          <a
            :href="'tel:' + activeCustomer.mobile"
            class="flex items-center justify-center gap-2 h-11 rounded-2xl bg-emerald text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
          >
            <Phone class="w-4 h-4" />
            تماس تلفنی
          </a>
          <a
            :href="'sms:' + activeCustomer.mobile"
            class="flex items-center justify-center gap-2 h-11 rounded-2xl bg-gray-100 dark:bg-graphite-800 text-graphite-800 dark:text-gray-200 text-xs font-bold active:scale-95 transition-all"
          >
            <MessageSquare class="w-4 h-4 text-emerald" />
            ارسال پیامک
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { useContainer } from '@/presentation/composables/useContainer';
import { useUIStore } from '@/presentation/stores/uiStore';
import type { Customer } from '@/domain/entities/Customer';
import type { CustomerFinancialSummary } from '@/domain/repositories/ICustomerRepository';
import { Users, UserPlus, Search, Phone, MessageSquare, X } from 'lucide-vue-next';

const container = useContainer();
const uiStore = useUIStore();

const customers = shallowRef<Customer[]>([]);
const allTags = ref<string[]>([]);
const searchQuery = ref('');
const selectedTag = ref<string | null>(null);

const showCreateModal = ref(false);
const showDetailModal = ref(false);
const activeCustomer = shallowRef<Customer | null>(null);
const financialSummary = ref<CustomerFinancialSummary | null>(null);
const isSubmitting = ref(false);

const tagsInput = ref('');
const newForm = ref({
  name: '',
  mobile: '',
  phone: '',
  address: '',
  notes: '',
  followUpDate: null as string | null
});

onMounted(async () => {
  await loadData();
});

async function loadData() {
  allTags.value = await container.customerRepo.listTags();
  await handleSearch();
}

async function handleSearch() {
  customers.value = await container.customerRepo.search(
    searchQuery.value,
    selectedTag.value || undefined,
    false
  );
}

function selectTag(tag: string | null) {
  selectedTag.value = tag;
  handleSearch();
}

function openCreateModal() {
  tagsInput.value = '';
  newForm.value = {
    name: '',
    mobile: '',
    phone: '',
    address: '',
    notes: '',
    followUpDate: null
  };
  showCreateModal.value = true;
}

async function handleCreateCustomer() {
  if (!newForm.value.name.trim() || !newForm.value.mobile.trim() || isSubmitting.value) return;

  const tags = tagsInput.value
    .split(/[,،]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  isSubmitting.value = true;
  try {
    const res = await container.createCustomerUseCase.execute({
      name: newForm.value.name,
      mobile: newForm.value.mobile,
      phone: newForm.value.phone || null,
      address: newForm.value.address || null,
      notes: newForm.value.notes || null,
      followUpDate: newForm.value.followUpDate,
      tags
    });

    if (res.success) {
      uiStore.showToast({
        type: 'success',
        message: `مشتری "${res.data.name}" با موفقیت ذخیره شد.`
      });
      showCreateModal.value = false;
      await loadData();
    } else {
      uiStore.showToast({
        type: 'error',
        message: res.error
      });
    }
  } catch (err) {
    uiStore.showToast({
      type: 'error',
      message: 'خطا در ثبت مشتری: ' + String(err)
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function openDetailModal(customer: Customer) {
  activeCustomer.value = customer;
  financialSummary.value = await container.customerRepo.getFinancialSummary(customer.id);
  showDetailModal.value = true;
}
</script>
