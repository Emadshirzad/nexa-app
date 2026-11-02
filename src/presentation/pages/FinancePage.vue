<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="امور مالی و صندوق" subtitle="دفتر کل نقدینگی و هزینه‌ها" :show-back="true">
      <template #actions>
        <button
          @click="openExpenseModal"
          type="button"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="هزینه جدید"
        >
          <Plus class="w-5 h-5" />
        </button>
      </template>
    </AppHeader>

    <div class="p-4 space-y-4 flex-1 flex flex-col">
      <!-- Cash Balance Hero Card -->
      <div
        class="bg-gradient-to-br from-graphite-900 to-graphite-800 text-white rounded-3xl p-5 shadow-sm border border-graphite-700 space-y-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-300">موجودی نقدی صندوق</span>
          <span
            class="px-2 py-0.5 rounded-md text-[10px] font-bold"
            :class="cashBalance >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'"
          >
            {{ cashBalance >= 0 ? 'تراز مثبت' : 'کسری نقدینگی' }}
          </span>
        </div>

        <div class="text-2xl font-black tracking-tight" :class="cashBalance >= 0 ? 'text-white' : 'text-red-400'">
          {{ cashBalance.toLocaleString() }} <span class="text-sm font-normal text-emerald-400">تومان</span>
        </div>

        <!-- 3 KPIs in Hero -->
        <div class="grid grid-cols-3 gap-2 pt-2 border-t border-graphite-700/60 text-center">
          <div>
            <div class="text-[10px] text-gray-400">دریافتی فروش</div>
            <div class="text-xs font-bold text-emerald-400 mt-0.5">
              {{ financialSummary?.totalReceipts.format() || '۰' }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-gray-400">سایر درآمدها</div>
            <div class="text-xs font-bold text-blue-400 mt-0.5">
              {{ financialSummary?.totalOtherIncomes.format() || '۰' }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-gray-400">کل هزینه‌ها</div>
            <div class="text-xs font-bold text-red-400 mt-0.5">
              {{ financialSummary?.totalExpenses.format() || '۰' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 gap-2">
        <button
          @click="openExpenseModal"
          type="button"
          class="h-11 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-800 dark:text-gray-200 text-xs font-bold flex items-center justify-center gap-2 hover:border-red-500 transition-colors shadow-sm"
        >
          <ArrowUpRight class="w-4 h-4 text-red-500" />
          ثبت هزینه جدید
        </button>
        <button
          @click="openIncomeModal"
          type="button"
          class="h-11 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-800 dark:text-gray-200 text-xs font-bold flex items-center justify-center gap-2 hover:border-emerald transition-colors shadow-sm"
        >
          <ArrowDownLeft class="w-4 h-4 text-emerald" />
          ثبت درآمد متفرقه
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          type="button"
          class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
          :class="
            activeTab === tab.key
              ? 'bg-emerald text-white font-bold shadow-sm'
              : 'bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-600 dark:text-gray-400'
          "
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex-1 flex items-center justify-center py-12 text-gray-400">
        <Loader2 class="w-8 h-8 animate-spin text-emerald" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="displayItems.length === 0"
        class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400"
      >
        <Wallet class="w-12 h-12 text-gray-300 dark:text-gray-700 mb-2" />
        <p class="text-xs">هیچ تراکنشی در این بخش ثبت نشده است.</p>
      </div>

      <!-- Transactions List -->
      <div v-else class="space-y-2.5">
        <div
          v-for="item in displayItems"
          :key="item.id"
          class="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 shadow-sm flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center"
              :class="item.isInflow ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'"
            >
              <ArrowDownLeft v-if="item.isInflow" class="w-4 h-4" />
              <ArrowUpRight v-else class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-xs text-graphite-900 dark:text-white">
                {{ item.title }}
              </div>
              <div class="text-[10px] text-gray-400">
                {{ formatJalaliHuman(toJalaliString(item.date)) }}
              </div>
            </div>
          </div>

          <div class="text-left">
            <div
              class="font-bold text-xs"
              :class="item.isInflow ? 'text-emerald' : 'text-red-500'"
            >
              {{ item.isInflow ? '+' : '-' }} {{ item.amount.toLocaleString() }} تومان
            </div>
            <div v-if="item.balanceAfter !== undefined" class="text-[10px] text-gray-400">
              مانده: {{ item.balanceAfter.toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Record Expense Modal -->
    <div
      v-if="showExpenseModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm bg-white dark:bg-graphite-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-graphite-800 space-y-3.5"
      >
        <div class="flex items-center justify-between border-b pb-2.5 border-gray-100 dark:border-graphite-800">
          <h3 class="text-sm font-bold text-red-600 flex items-center gap-2">
            <ArrowUpRight class="w-4 h-4" />
            ثبت هزینه جدید
          </h3>
          <button @click="showExpenseModal = false" type="button" class="text-gray-400">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">عنوان یا بابت هزینه *</label>
            <input
              v-model="newExpense.title"
              type="text"
              placeholder="مثلاً: اجاره کارگاه، قبض برق، خرید بسته بندی"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">مبلغ هزینه (تومان) *</label>
            <input
              v-model.number="newExpense.amount"
              type="number"
              min="1"
              placeholder="مثلاً: 250000"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-red-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">تاریخ پرداخت</label>
              <input
                v-model="newExpense.expenseDate"
                type="date"
                class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">روش پرداخت</label>
              <select
                v-model="newExpense.paymentMethod"
                class="w-full h-10 px-2 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-red-500"
              >
                <option value="cash">نقدی</option>
                <option value="card_transfer">کارت به کارت</option>
                <option value="pos">دستگاه پوز</option>
                <option value="bank_transfer">حواله پایا/ساتنا</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">توضیحات تکمیلی</label>
            <input
              v-model="newExpense.description"
              type="text"
              placeholder="شماره فاکتور خرید یا جزئیات..."
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-red-500"
            />
          </div>

          <p v-if="expenseError" class="text-red-500 font-bold text-center">
            {{ expenseError }}
          </p>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-graphite-800">
          <button
            @click="showExpenseModal = false"
            type="button"
            class="flex-1 h-10 rounded-xl border border-gray-200 dark:border-graphite-700 text-xs font-bold"
          >
            انصراف
          </button>
          <button
            @click="submitExpense"
            :disabled="isSubmitting"
            type="button"
            class="flex-1 h-10 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {{ isSubmitting ? 'در حال ثبت...' : 'ثبت هزینه' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Record Other Income Modal -->
    <div
      v-if="showIncomeModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm bg-white dark:bg-graphite-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-graphite-800 space-y-3.5"
      >
        <div class="flex items-center justify-between border-b pb-2.5 border-gray-100 dark:border-graphite-800">
          <h3 class="text-sm font-bold text-emerald flex items-center gap-2">
            <ArrowDownLeft class="w-4 h-4" />
            ثبت درآمد متفرقه
          </h3>
          <button @click="showIncomeModal = false" type="button" class="text-gray-400">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">عنوان درآمد *</label>
            <input
              v-model="newIncome.title"
              type="text"
              placeholder="مثلاً: فروش کارتن، ارائه مشاوره، خدمات متفرقه"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">مبلغ دریافتی (تومان) *</label>
            <input
              v-model.number="newIncome.amount"
              type="number"
              min="1"
              placeholder="مثلاً: 100000"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">تاریخ دریافت</label>
              <input
                v-model="newIncome.incomeDate"
                type="date"
                class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
              />
            </div>
            <div>
              <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">روش دریافت</label>
              <select
                v-model="newIncome.paymentMethod"
                class="w-full h-10 px-2 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
              >
                <option value="cash">نقدی</option>
                <option value="card_transfer">کارت به کارت</option>
                <option value="pos">دستگاه پوز</option>
                <option value="bank_transfer">حواله پایا/ساتنا</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">توضیحات</label>
            <input
              v-model="newIncome.description"
              type="text"
              placeholder="شرح کوتاه..."
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <p v-if="incomeError" class="text-red-500 font-bold text-center">
            {{ incomeError }}
          </p>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-graphite-800">
          <button
            @click="showIncomeModal = false"
            type="button"
            class="flex-1 h-10 rounded-xl border border-gray-200 dark:border-graphite-700 text-xs font-bold"
          >
            انصراف
          </button>
          <button
            @click="submitIncome"
            :disabled="isSubmitting"
            type="button"
            class="flex-1 h-10 rounded-xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50"
          >
            {{ isSubmitting ? 'در حال ثبت...' : 'ثبت درآمد' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted } from 'vue';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Loader2
} from 'lucide-vue-next';
import { getAppContainer } from '@/app/providers/container';
import type { FinancialSummary } from '@/domain/repositories/ICashLedgerRepository';
import type { CashTransaction } from '@/domain/entities/CashTransaction';
import type { Expense } from '@/domain/entities/Expense';
import type { OtherIncome } from '@/domain/entities/OtherIncome';
import { toJalaliString, formatJalaliHuman } from '@/shared/utils/jalali';

const activeTab = ref<'all' | 'expenses' | 'incomes'>('all');
const isLoading = ref(true);

const tabs = [
  { key: 'all' as const, label: 'دفتر کل صندوق' },
  { key: 'expenses' as const, label: 'هزینه‌ها' },
  { key: 'incomes' as const, label: 'سایر درآمدها' }
];

const financialSummary = shallowRef<FinancialSummary | null>(null);
const transactions = shallowRef<CashTransaction[]>([]);
const expenses = shallowRef<Expense[]>([]);
const otherIncomes = shallowRef<OtherIncome[]>([]);

// Modals
const showExpenseModal = ref(false);
const showIncomeModal = ref(false);
const isSubmitting = ref(false);
const expenseError = ref('');
const incomeError = ref('');

const newExpense = ref<{
  title: string;
  amount: number;
  expenseDate: string;
  paymentMethod: 'cash' | 'card_transfer' | 'pos' | 'bank_transfer';
  description: string;
}>({
  title: '',
  amount: 0,
  expenseDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'cash',
  description: ''
});

const newIncome = ref<{
  title: string;
  amount: number;
  incomeDate: string;
  paymentMethod: 'cash' | 'card_transfer' | 'pos' | 'bank_transfer';
  description: string;
}>({
  title: '',
  amount: 0,
  incomeDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'cash',
  description: ''
});

const cashBalance = computed(() => {
  return financialSummary.value?.currentCashBalance.value ?? 0;
});

async function loadFinanceData() {
  isLoading.value = true;
  try {
    const container = getAppContainer();
    const [summary, txList, expList, incList] = await Promise.all([
      container.getFinancialSummaryUseCase.execute(),
      container.cashLedgerRepo.listTransactions(100),
      container.expenseRepo.listExpenses({ limit: 100 }),
      container.expenseRepo.listOtherIncomes({ limit: 100 })
    ]);
    financialSummary.value = summary;
    transactions.value = txList;
    expenses.value = expList;
    otherIncomes.value = incList;
  } catch (err) {
    console.error('Error loading finance data:', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadFinanceData();
});

interface DisplayItem {
  id: string;
  title: string;
  date: string;
  amount: number;
  isInflow: boolean;
  balanceAfter?: number;
}

const displayItems = computed<DisplayItem[]>(() => {
  if (activeTab.value === 'expenses') {
    return expenses.value.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.expenseDate,
      amount: e.amount.value,
      isInflow: false
    }));
  }

  if (activeTab.value === 'incomes') {
    return otherIncomes.value.map((i) => ({
      id: i.id,
      title: i.title,
      date: i.incomeDate,
      amount: i.amount.value,
      isInflow: true
    }));
  }

  return transactions.value.map((tx) => ({
    id: tx.id,
    title: tx.description,
    date: tx.transactionDate,
    amount: Math.abs(tx.amount.value),
    isInflow: tx.isInflow(),
    balanceAfter: tx.balanceAfter.value
  }));
});

function openExpenseModal() {
  newExpense.value = {
    title: '',
    amount: 0,
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'cash',
    description: ''
  };
  expenseError.value = '';
  showExpenseModal.value = true;
}

async function submitExpense() {
  expenseError.value = '';
  isSubmitting.value = true;
  try {
    const container = getAppContainer();
    const res = await container.recordExpenseUseCase.execute({
      title: newExpense.value.title,
      amount: newExpense.value.amount,
      expenseDate: newExpense.value.expenseDate,
      paymentMethod: newExpense.value.paymentMethod,
      description: newExpense.value.description
    });

    if (!res.success) {
      expenseError.value = res.error;
      return;
    }

    showExpenseModal.value = false;
    await loadFinanceData();
  } catch (err) {
    expenseError.value = String(err);
  } finally {
    isSubmitting.value = false;
  }
}

function openIncomeModal() {
  newIncome.value = {
    title: '',
    amount: 0,
    incomeDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'cash',
    description: ''
  };
  incomeError.value = '';
  showIncomeModal.value = true;
}

async function submitIncome() {
  incomeError.value = '';
  isSubmitting.value = true;
  try {
    const container = getAppContainer();
    const res = await container.recordOtherIncomeUseCase.execute({
      title: newIncome.value.title,
      amount: newIncome.value.amount,
      incomeDate: newIncome.value.incomeDate,
      paymentMethod: newIncome.value.paymentMethod,
      description: newIncome.value.description
    });

    if (!res.success) {
      incomeError.value = res.error;
      return;
    }

    showIncomeModal.value = false;
    await loadFinanceData();
  } catch (err) {
    incomeError.value = String(err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
