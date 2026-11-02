<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="سرنخ‌های فروش" subtitle="فرصت‌ها و بازاریابی" :show-back="true">
      <template #actions>
        <button
          @click="openCreateModal"
          type="button"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="سرنخ جدید"
        >
          <Plus class="w-5 h-5" />
        </button>
      </template>
    </AppHeader>

    <div class="p-4 space-y-4 flex-1 flex flex-col">
      <!-- Search & Filters -->
      <div class="space-y-2.5">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="جستجوی نام یا شماره سرنخ..."
            class="w-full h-11 pl-4 pr-10 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-sm focus:outline-none focus:border-emerald dark:focus:border-emerald transition-colors"
          />
          <Search class="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            v-for="filter in statusFilters"
            :key="filter.key"
            @click="activeStatus = filter.key"
            type="button"
            class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
            :class="
              activeStatus === filter.key
                ? 'bg-emerald text-white font-bold shadow-sm'
                : 'bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-600 dark:text-gray-400'
            "
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex-1 flex items-center justify-center py-12 text-gray-400">
        <Loader2 class="w-8 h-8 animate-spin text-emerald" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredLeads.length === 0"
        class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400"
      >
        <div
          class="w-16 h-16 rounded-3xl bg-mint dark:bg-graphite-800 flex items-center justify-center text-emerald mb-3"
        >
          <UserCheck class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-graphite-800 dark:text-gray-200">
          {{ leads.length === 0 ? 'سرنخی ثبت نشده است' : 'سرنخی با این مشخصات یافت نشد' }}
        </h3>
        <p class="text-xs text-gray-400 max-w-xs mt-1 mb-5">
          مشتریان احتمالی و پیام‌های ورودی را ثبت و پس از نهایی شدن با یک کلیک به مشتری قطعی تبدیل کنید.
        </p>
        <button
          v-if="leads.length === 0"
          @click="openCreateModal"
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald text-white text-xs font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <Plus class="w-4 h-4" />
          ثبت سرنخ جدید
        </button>
      </div>

      <!-- Leads List -->
      <div v-else class="space-y-3">
        <div
          v-for="lead in filteredLeads"
          :key="lead.id"
          class="p-4 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 shadow-sm space-y-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-graphite-900 dark:text-white">
                {{ lead.name }}
              </span>
              <span
                class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                :class="getStatusBadgeClass(lead.status)"
              >
                {{ getStatusLabel(lead.status) }}
              </span>
            </div>
            <span v-if="lead.followUpDate" class="text-[11px] text-gray-400">
              پیگیری: {{ lead.followUpDate }}
            </span>
          </div>

          <div v-if="lead.description" class="text-xs text-graphite-600 dark:text-gray-400 leading-relaxed">
            {{ lead.description }}
          </div>

          <!-- Contact & Actions row -->
          <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-graphite-800 text-xs">
            <div class="font-mono text-xs text-gray-500">
              {{ lead.mobile }}
            </div>

            <div class="flex items-center gap-1.5">
              <a
                :href="`tel:${lead.mobile}`"
                class="p-2 rounded-xl bg-gray-50 dark:bg-graphite-800 text-graphite-700 dark:text-gray-300 hover:text-emerald"
                title="تماس تلفنی"
              >
                <Phone class="w-4 h-4" />
              </a>
              <a
                :href="`sms:${lead.mobile}`"
                class="p-2 rounded-xl bg-gray-50 dark:bg-graphite-800 text-graphite-700 dark:text-gray-300 hover:text-emerald"
                title="ارسال پیامک"
              >
                <MessageSquare class="w-4 h-4" />
              </a>
              <button
                v-if="!lead.isConverted()"
                @click="openConvertModal(lead)"
                type="button"
                class="px-2.5 py-1.5 rounded-xl bg-mint dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald hover:text-white transition-colors"
              >
                تبدیل به مشتری
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Lead Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm bg-white dark:bg-graphite-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-graphite-800 space-y-3.5"
      >
        <div class="flex items-center justify-between border-b pb-2.5 border-gray-100 dark:border-graphite-800">
          <h3 class="text-sm font-bold text-graphite-900 dark:text-white">
            ثبت سرنخ جدید
          </h3>
          <button @click="showCreateModal = false" type="button" class="text-gray-400">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">نام و نام خانوادگی *</label>
            <input
              v-model="newLead.name"
              type="text"
              placeholder="مثلاً: سارا احمدی"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">شماره همراه *</label>
            <input
              v-model="newLead.mobile"
              type="tel"
              placeholder="09121234567"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">وضعیت پیگیری</label>
            <select
              v-model="newLead.status"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            >
              <option value="new">جدید</option>
              <option value="following_up">در حال پیگیری</option>
              <option value="interested">علاقه‌مند</option>
              <option value="unsuccessful">ناموفق</option>
              <option value="rejected">رد شده</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">تاریخ پیگیری بعدی</label>
            <input
              v-model="newLead.followUpDate"
              type="date"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">یادداشت و جزئیات نیاز</label>
            <textarea
              v-model="newLead.description"
              rows="2"
              placeholder="نیاز مشتری یا نحوه آشنایی..."
              class="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            ></textarea>
          </div>

          <p v-if="createError" class="text-red-500 font-bold text-center">
            {{ createError }}
          </p>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-graphite-800">
          <button
            @click="showCreateModal = false"
            type="button"
            class="flex-1 h-10 rounded-xl border border-gray-200 dark:border-graphite-700 text-xs font-bold"
          >
            انصراف
          </button>
          <button
            @click="submitCreateLead"
            :disabled="isSubmitting"
            type="button"
            class="flex-1 h-10 rounded-xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50"
          >
            {{ isSubmitting ? 'در حال ثبت...' : 'ثبت سرنخ' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Convert Lead Modal -->
    <div
      v-if="showConvertModal && targetConvertLead"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm bg-white dark:bg-graphite-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-graphite-800 space-y-4"
      >
        <h3 class="text-sm font-bold text-graphite-900 dark:text-white">
          تبدیل سرنخ به مشتری قطعی
        </h3>
        <p class="text-xs text-gray-500 leading-relaxed">
          سرنخ «{{ targetConvertLead.name }}» به عنوان مشتری جدید در بانک مشتریان ثبت خواهد شد.
        </p>

        <div class="space-y-2 text-xs">
          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">نشانی / آدرس خریدار</label>
            <input
              v-model="convertAddress"
              type="text"
              placeholder="تهران، ..."
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-graphite-800">
          <button
            @click="showConvertModal = false"
            type="button"
            class="flex-1 h-10 rounded-xl border border-gray-200 dark:border-graphite-700 text-xs font-bold"
          >
            انصراف
          </button>
          <button
            @click="submitConvert"
            type="button"
            class="flex-1 h-10 rounded-xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600"
          >
            تأیید و تبدیل
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  MessageSquare,
  X,
  Loader2
} from 'lucide-vue-next';
import { getAppContainer } from '@/app/providers/container';
import type { Lead, LeadStatus } from '@/domain/entities/Lead';

const route = useRoute();

const searchQuery = ref('');
const activeStatus = ref<'all' | LeadStatus>('all');
const isLoading = ref(true);

const statusFilters = [
  { key: 'all' as const, label: 'همه' },
  { key: 'new' as const, label: 'جدید' },
  { key: 'following_up' as const, label: 'در حال پیگیری' },
  { key: 'interested' as const, label: 'علاقه‌مند' },
  { key: 'converted' as const, label: 'تبدیل‌شده' },
  { key: 'unsuccessful' as const, label: 'ناموفق' },
  { key: 'rejected' as const, label: 'رد شده' }
];

const leads = shallowRef<Lead[]>([]);

// Modals
const showCreateModal = ref(false);
const isSubmitting = ref(false);
const createError = ref('');
const newLead = ref<{
  name: string;
  mobile: string;
  status: LeadStatus;
  description: string;
  followUpDate: string;
}>({
  name: '',
  mobile: '',
  status: 'new',
  description: '',
  followUpDate: ''
});

const showConvertModal = ref(false);
const targetConvertLead = shallowRef<Lead | null>(null);
const convertAddress = ref('');

async function checkRoute() {
  if (route.params.id) {
    const leadId = route.params.id as string;
    const found = leads.value.find((l) => l.id === leadId);
    if (found) {
      searchQuery.value = found.name;
    }
  }
}

async function loadLeads() {
  isLoading.value = true;
  try {
    const container = getAppContainer();
    leads.value = await container.leadRepo.listAll();
    await checkRoute();
  } catch (err) {
    console.error('Error loading leads:', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadLeads();
});

watch(
  () => route.fullPath,
  async () => {
    await checkRoute();
  }
);

const filteredLeads = computed(() => {
  return leads.value.filter((lead) => {
    if (activeStatus.value !== 'all' && lead.status !== activeStatus.value) {
      return false;
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchMobile = lead.mobile.includes(q);
      return matchName || matchMobile;
    }
    return true;
  });
});

function getStatusLabel(status: LeadStatus): string {
  const map: Record<LeadStatus, string> = {
    new: 'جدید',
    following_up: 'در حال پیگیری',
    interested: 'علاقه‌مند',
    converted: 'تبدیل‌شده',
    unsuccessful: 'ناموفق',
    rejected: 'رد شده'
  };
  return map[status] || status;
}

function getStatusBadgeClass(status: LeadStatus): string {
  switch (status) {
    case 'converted':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400';
    case 'interested':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400';
    case 'following_up':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400';
    case 'new':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

function openCreateModal() {
  newLead.value = {
    name: '',
    mobile: '',
    status: 'new',
    description: '',
    followUpDate: ''
  };
  createError.value = '';
  showCreateModal.value = true;
}

async function submitCreateLead() {
  createError.value = '';
  isSubmitting.value = true;
  try {
    const container = getAppContainer();
    const res = await container.createLeadUseCase.execute({
      name: newLead.value.name,
      mobile: newLead.value.mobile,
      status: newLead.value.status,
      description: newLead.value.description,
      followUpDate: newLead.value.followUpDate || undefined
    });

    if (!res.success) {
      createError.value = res.error;
      return;
    }

    showCreateModal.value = false;
    await loadLeads();
  } catch (err) {
    createError.value = String(err);
  } finally {
    isSubmitting.value = false;
  }
}

function openConvertModal(lead: Lead) {
  targetConvertLead.value = lead;
  convertAddress.value = '';
  showConvertModal.value = true;
}

async function submitConvert() {
  if (!targetConvertLead.value) return;
  const container = getAppContainer();
  const res = await container.convertLeadToCustomerUseCase.execute({
    leadId: targetConvertLead.value.id,
    address: convertAddress.value || undefined
  });

  if (res.success) {
    showConvertModal.value = false;
    await loadLeads();
  }
}
</script>
