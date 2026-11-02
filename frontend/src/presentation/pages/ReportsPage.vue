<template>
  <div class="flex-1 flex flex-col pb-8">
    <AppHeader title="گزارش‌ها و آمار" subtitle="تحلیل عملکرد، فروش و حسابداری" :show-back="true" />

    <div class="p-4 space-y-4 flex-1">
      <!-- Tabs Navigation -->
      <div class="flex p-1 bg-gray-100 dark:bg-graphite-900 rounded-2xl border border-gray-200 dark:border-graphite-800">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          type="button"
          class="flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center"
          :class="activeTab === tab.id
            ? 'bg-white dark:bg-graphite-800 text-emerald shadow-sm'
            : 'text-gray-500 hover:text-graphite-800 dark:hover:text-gray-200'"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="py-16 text-center text-gray-400 text-xs">
        در حال آماده‌سازی گزارش‌ها...
      </div>

      <!-- TAB 1: Monthly Sales Trends -->
      <div v-else-if="activeTab === 'trends'" class="space-y-4">
        <!-- Monthly Aggregate KPI -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-4 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-100 dark:border-graphite-800 shadow-sm">
            <div class="text-xs text-gray-400">کل فروش دوره‌ها</div>
            <div class="text-base font-extrabold text-graphite-900 dark:text-white mt-1">
              {{ formatMoney(totalPeriodSales) }} <span class="text-xs font-normal text-gray-500">تومان</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-100 dark:border-graphite-800 shadow-sm">
            <div class="text-xs text-gray-400">کل وصولی نقدی</div>
            <div class="text-base font-extrabold text-emerald mt-1">
              {{ formatMoney(totalPeriodCollected) }} <span class="text-xs font-normal text-gray-500">تومان</span>
            </div>
          </div>
        </div>

        <h3 class="text-xs font-bold text-gray-400 px-1">روند ماهانه فروش و وصولی</h3>

        <div v-if="salesTrends.length > 0" class="space-y-2.5">
          <div
            v-for="trend in salesTrends"
            :key="trend.monthKey"
            class="p-4 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-100 dark:border-graphite-800 shadow-sm space-y-3"
          >
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-extrabold text-graphite-900 dark:text-white">
                  {{ trend.jalaliLabel }}
                </span>
                <span class="text-[11px] text-gray-400 mr-2">({{ trend.invoiceCount }} فاکتور)</span>
              </div>
              <span class="text-xs font-bold text-graphite-900 dark:text-white">
                {{ formatMoney(trend.totalSales) }} تومان
              </span>
            </div>

            <!-- Progress bar of collection -->
            <div class="space-y-1">
              <div class="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                <span>وصول‌شده: {{ formatMoney(trend.totalCollected) }} تومان</span>
                <span>{{ calculateCollectionPercent(trend.totalSales, trend.totalCollected) }}%</span>
              </div>
              <div class="w-full h-2 rounded-full bg-gray-100 dark:bg-graphite-800 overflow-hidden">
                <div
                  class="h-full bg-emerald rounded-full transition-all duration-500"
                  :style="{ width: `${calculateCollectionPercent(trend.totalSales, trend.totalCollected)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="py-12 text-center text-gray-400 space-y-1">
          <BarChart3 class="w-8 h-8 mx-auto opacity-40 mb-2" />
          <p class="text-xs">داده‌ای برای تحلیل گزارش‌های فروش ثبت نشده است.</p>
        </div>
      </div>

      <!-- TAB 2: Top Selling Products -->
      <div v-else-if="activeTab === 'products'" class="space-y-3">
        <div v-if="topSellingProducts.length > 0" class="space-y-2.5">
          <div
            v-for="(prod, idx) in topSellingProducts"
            :key="prod.productId + '-' + idx"
            class="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-100 dark:border-graphite-800 shadow-sm"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                :class="idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-amber-50 text-amber-900' : 'bg-gray-100 dark:bg-graphite-800 text-gray-500'"
              >
                {{ idx + 1 }}
              </div>
              <div>
                <div class="text-xs font-bold text-graphite-900 dark:text-white">
                  {{ prod.productName }}
                </div>
                <div class="text-[11px] text-gray-400 mt-0.5">
                  تعداد فروش: {{ (prod.totalQuantityScaled / 1000).toLocaleString('en-US') }} {{ prod.unit }}
                </div>
              </div>
            </div>

            <div class="text-left">
              <div class="text-xs font-extrabold text-graphite-900 dark:text-white">
                {{ formatMoney(prod.totalRevenue) }} تومان
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">درآمد ناخالص</div>
            </div>
          </div>
        </div>

        <div v-else class="py-12 text-center text-gray-400 space-y-1">
          <Package class="w-8 h-8 mx-auto opacity-40 mb-2" />
          <p class="text-xs">هنوز هیچ محصولی در فاکتورهای فروش ثبت نشده است.</p>
        </div>
      </div>

      <!-- TAB 3: Debtors Ledger -->
      <div v-else-if="activeTab === 'debtors'" class="space-y-3">
        <!-- Total Debt Header Card -->
        <div class="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
          <div class="text-xs text-rose-600 dark:text-rose-400 font-medium">مجموع طلب‌های معوق</div>
          <div class="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
            {{ formatMoney(totalDebtorsDebt) }} تومان
          </div>
          <div class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            تعداد مشتریان بدهکار: {{ debtorsLedger.length }} نفر
          </div>
        </div>

        <div v-if="debtorsLedger.length > 0" class="space-y-2.5">
          <div
            v-for="debtor in debtorsLedger"
            :key="debtor.customerId"
            class="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-100 dark:border-graphite-800 shadow-sm flex items-center justify-between"
          >
            <div>
              <div class="text-xs font-bold text-graphite-900 dark:text-white">
                {{ debtor.fullName }}
              </div>
              <div class="text-[11px] text-rose-600 dark:text-rose-400 font-extrabold mt-0.5">
                بدهی: {{ formatMoney(debtor.totalDebt) }} تومان
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">
                موبایل: {{ debtor.mobile }}
              </div>
            </div>

            <!-- Call / SMS Action Buttons -->
            <div class="flex items-center gap-2">
              <a
                :href="`tel:${debtor.mobile}`"
                class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald hover:bg-emerald-100 transition-colors"
                title="تماس تلفنی"
              >
                <Phone class="w-4 h-4" />
              </a>

              <a
                :href="`sms:${debtor.mobile}?body=${encodeURIComponent('با سلام و احترام، جهت هماهنگی و تسویه حساب با شما تماس گرفته شد.')}`"
                class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 hover:bg-blue-100 transition-colors"
                title="ارسال پیامک"
              >
                <MessageSquare class="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div v-else class="py-12 text-center text-gray-400 space-y-1">
          <CheckCircle2 class="w-8 h-8 mx-auto text-emerald opacity-60 mb-2" />
          <p class="text-xs font-medium text-emerald">هیچ بدهی معوقی ثبت نشده است! همه حساب‌ها تسویه هستند.</p>
        </div>
      </div>

      <!-- TAB 4: Low Stock Alert -->
      <div v-else-if="activeTab === 'lowStock'" class="space-y-3">
        <div v-if="lowStockItems.length > 0" class="space-y-2.5">
          <div
            v-for="item in lowStockItems"
            :key="item.productId"
            class="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-amber-200 dark:border-amber-900/50 shadow-sm space-y-2"
          >
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-graphite-900 dark:text-white">
                  {{ item.productName }}
                </span>
                <span class="text-[10px] text-gray-400 mr-2">کد: {{ item.sku }}</span>
              </div>
              <span class="text-xs font-bold text-amber-600 dark:text-amber-400">
                موجودی: {{ (item.currentStockScaled / 1000).toLocaleString('en-US') }} {{ item.unit }}
              </span>
            </div>

            <div class="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-graphite-800">
              <span>حداقل آستانه: {{ (item.minThresholdScaled / 1000).toLocaleString('en-US') }} {{ item.unit }}</span>
              <span class="text-rose-500 font-bold">کسری موجودی: {{ (item.deficitScaled / 1000).toLocaleString('en-US') }} {{ item.unit }}</span>
            </div>
          </div>
        </div>

        <div v-else class="py-12 text-center text-gray-400 space-y-1">
          <CheckCircle2 class="w-8 h-8 mx-auto text-emerald opacity-60 mb-2" />
          <p class="text-xs font-medium text-emerald">موجودی کلیه کالاها در وضعیت مطلوب قرار دارد.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { getAppContainer } from '@/app/providers/container';
import { formatMoney } from '@/shared/formatters/currency';
import type {
  MonthlySalesTrend,
  TopSellingProductReport,
  DebtorReportItem,
  LowStockReportItem
} from '@/domain/repositories/IReportingRepository';
import {
  BarChart3,
  Package,
  CheckCircle2,
  Phone,
  MessageSquare
} from 'lucide-vue-next';

type TabType = 'trends' | 'products' | 'debtors' | 'lowStock';

const tabs: Array<{ id: TabType; name: string }> = [
  { id: 'trends', name: 'روند فروش' },
  { id: 'products', name: 'پرفروش‌ها' },
  { id: 'debtors', name: 'بدهکاران' },
  { id: 'lowStock', name: 'کسری انبار' }
];

const activeTab = ref<TabType>('trends');
const isLoading = ref(true);

const salesTrends = ref<MonthlySalesTrend[]>([]);
const topSellingProducts = ref<TopSellingProductReport[]>([]);
const debtorsLedger = ref<DebtorReportItem[]>([]);
const lowStockItems = ref<LowStockReportItem[]>([]);

const totalPeriodSales = computed(() => {
  return salesTrends.value.reduce((acc, cur) => acc + cur.totalSales, 0);
});

const totalPeriodCollected = computed(() => {
  return salesTrends.value.reduce((acc, cur) => acc + cur.totalCollected, 0);
});

const totalDebtorsDebt = computed(() => {
  return debtorsLedger.value.reduce((acc, cur) => acc + cur.totalDebt, 0);
});

function calculateCollectionPercent(sales: number, collected: number): number {
  if (sales <= 0) return 100;
  return Math.min(100, Math.round((collected / sales) * 100));
}

async function loadReports() {
  isLoading.value = true;
  try {
    const container = getAppContainer();
    const res = await container.getReportsDataUseCase.execute();
    if (res.success) {
      salesTrends.value = res.data.salesTrends;
      topSellingProducts.value = res.data.topSellingProducts;
      debtorsLedger.value = res.data.debtorsLedger;
      lowStockItems.value = res.data.lowStockItems;
    }
  } catch (err) {
    console.error('Failed to load reports', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadReports();
});
</script>
