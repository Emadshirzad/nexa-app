<template>
  <div class="flex-1 flex flex-col pb-6">
    <!-- Screen Header -->
    <AppHeader
      title="نکسا"
      :subtitle="todayJalaliFormatted"
      :show-back="false"
      :show-search="true"
      :show-lock="true"
    />

    <div class="p-4 space-y-5 flex-1">
      <!-- Quick Metric KPI Cards (Today's Overview) -->
      <section class="grid grid-cols-2 gap-3">
        <!-- Today's Sales -->
        <div
          class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm flex flex-col justify-between"
        >
          <div
            class="flex items-center justify-between text-graphite-400 dark:text-gray-400 mb-2"
          >
            <span class="text-xs font-medium">فروش امروز</span>
            <div
              class="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald"
            >
              <TrendingUp class="w-4 h-4" />
            </div>
          </div>
          <div class="text-lg font-extrabold text-graphite-900 dark:text-white">
            {{ formatMoney(metrics?.todaySales) }}
            <span class="text-xs font-normal text-gray-500">تومان</span>
          </div>
          <div class="text-[11px] text-gray-400 mt-1">
            {{ metrics?.todaySalesCount ?? 0 }} فاکتور صادرشده
          </div>
        </div>

        <!-- Today's Receipts -->
        <div
          class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm flex flex-col justify-between"
        >
          <div
            class="flex items-center justify-between text-graphite-400 dark:text-gray-400 mb-2"
          >
            <span class="text-xs font-medium">دریافتی نقد امروز</span>
            <div
              class="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500"
            >
              <Wallet class="w-4 h-4" />
            </div>
          </div>
          <div class="text-lg font-extrabold text-graphite-900 dark:text-white">
            {{ formatMoney(metrics?.todayReceipts) }}
            <span class="text-xs font-normal text-gray-500">تومان</span>
          </div>
          <div class="text-[11px] text-gray-400 mt-1">
            صندوق: {{ formatMoney(metrics?.cashBalance) }} تومان
          </div>
        </div>

        <!-- Outstanding Debt -->
        <div
          class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm flex flex-col justify-between"
        >
          <div
            class="flex items-center justify-between text-graphite-400 dark:text-gray-400 mb-2"
          >
            <span class="text-xs font-medium">مانده طلب معوق</span>
            <div
              class="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500"
            >
              <ReceiptText class="w-4 h-4" />
            </div>
          </div>
          <div class="text-lg font-extrabold text-graphite-900 dark:text-white">
            {{ formatMoney(metrics?.totalOutstandingDebt) }}
            <span class="text-xs font-normal text-gray-500">تومان</span>
          </div>
          <div class="text-[11px] text-gray-400 mt-1">از کل مشتریان</div>
        </div>

        <!-- Pending Tasks Today -->
        <div
          class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm flex flex-col justify-between"
        >
          <div
            class="flex items-center justify-between text-graphite-400 dark:text-gray-400 mb-2"
          >
            <span class="text-xs font-medium">وظایف در انتظار</span>
            <div
              class="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500"
            >
              <Clock class="w-4 h-4" />
            </div>
          </div>
          <div class="text-lg font-extrabold text-graphite-900 dark:text-white">
            {{ metrics?.pendingTasksTodayCount ?? 0 }}
            <span class="text-xs font-normal text-gray-500">وظیفه</span>
          </div>
          <div class="text-[11px] text-gray-400 mt-1">موعد امروز و معوق</div>
        </div>
      </section>

      <!-- Quick Action Buttons -->
      <section class="space-y-2">
        <h2 class="text-xs font-bold text-graphite-400 dark:text-gray-400 px-1">
          دسترسی سریع
        </h2>
        <div class="grid grid-cols-3 gap-2.5">
          <router-link
            to="/invoices/new"
            class="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald text-white shadow-sm hover:bg-emerald-600 active:scale-95 transition-all text-center"
          >
            <PlusCircle class="w-6 h-6 mb-1" />
            <span class="text-xs font-bold">فاکتور جدید</span>
          </router-link>

          <router-link
            to="/customers/new"
            class="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-graphite-800 active:scale-95 transition-all text-center"
          >
            <UserPlus class="w-6 h-6 mb-1 text-emerald" />
            <span class="text-xs font-bold">مشتری جدید</span>
          </router-link>

          <router-link
            to="/products/new"
            class="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-graphite-800 active:scale-95 transition-all text-center"
          >
            <PackagePlus class="w-6 h-6 mb-1 text-blue-500" />
            <span class="text-xs font-bold">محصول جدید</span>
          </router-link>
        </div>
      </section>

      <!-- Today's Tasks & Reminders -->
      <section
        class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald" />
            <h2 class="text-sm font-bold text-graphite-900 dark:text-white">
              وظایف و پیگیری‌های امروز
            </h2>
          </div>
          <router-link
            to="/tasks"
            class="text-xs text-emerald hover:underline font-medium"
            >مشاهده همه</router-link
          >
        </div>

        <div v-if="metrics && metrics.todayTasks.length > 0" class="space-y-2">
          <div
            v-for="task in metrics.todayTasks"
            :key="task.id"
            class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-100 dark:border-graphite-700/50"
          >
            <div class="flex items-center gap-2.5">
              <button
                @click="toggleTaskComplete(task.id)"
                type="button"
                class="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                :class="
                  task.isCompleted
                    ? 'bg-emerald border-emerald text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-emerald'
                "
              >
                <Check v-if="task.isCompleted" class="w-3.5 h-3.5" />
              </button>
              <div>
                <div
                  class="text-xs font-semibold text-graphite-900 dark:text-white"
                >
                  {{ task.title }}
                </div>
                <div class="text-[10px] text-gray-400 mt-0.5">
                  موعد: {{ task.dueDate }}
                </div>
              </div>
            </div>

            <span
              v-if="task.priority === 'urgent'"
              class="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
            >
              فوری
            </span>
          </div>
        </div>

        <div v-else class="py-6 text-center text-gray-400 space-y-1">
          <CheckSquare class="w-8 h-8 mx-auto opacity-40 mb-2" />
          <p class="text-xs">هیچ وظیفه‌ای برای امروز ثبت نشده است.</p>
        </div>
      </section>

      <!-- Recent Invoices Widget -->
      <section
        class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-blue-500" />
            <h2 class="text-sm font-bold text-graphite-900 dark:text-white">
              آخرین فاکتورها
            </h2>
          </div>
          <router-link
            to="/invoices"
            class="text-xs text-emerald hover:underline font-medium"
            >مشاهده همه</router-link
          >
        </div>

        <div
          v-if="metrics && metrics.recentInvoices.length > 0"
          class="space-y-2"
        >
          <router-link
            v-for="inv in metrics.recentInvoices"
            :key="inv.id"
            :to="`/invoices/${inv.id}`"
            class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-100 dark:border-graphite-700/50 hover:bg-gray-100 dark:hover:bg-graphite-750 transition-colors"
          >
            <div>
              <div class="text-xs font-bold text-graphite-900 dark:text-white">
                فاکتور {{ inv.invoiceNumber }}
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">
                {{ inv.customerName }}
              </div>
            </div>

            <div class="text-left">
              <div
                class="text-xs font-extrabold text-graphite-900 dark:text-white"
              >
                {{ formatMoney(inv.totalAmount) }} تومان
              </div>
              <span
                class="text-[9px] px-1.5 py-0.5 rounded font-medium inline-block mt-0.5"
                :class="getStatusClasses(inv.status)"
              >
                {{ getStatusLabel(inv.status) }}
              </span>
            </div>
          </router-link>
        </div>

        <div v-else class="py-6 text-center text-gray-400 space-y-1">
          <FileText class="w-8 h-8 mx-auto opacity-40 mb-2" />
          <p class="text-xs">هنوز فاکتوری صادر نشده است.</p>
        </div>
      </section>

      <!-- Inventory Low-stock Warnings -->
      <section
        class="bg-white dark:bg-graphite-900 rounded-2xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-amber-500" />
            <h2 class="text-sm font-bold text-graphite-900 dark:text-white">
              هشدار موجودی کالا
            </h2>
          </div>
          <router-link
            to="/products"
            class="text-xs text-emerald hover:underline font-medium"
            >انبارداری</router-link
          >
        </div>

        <div v-if="lowStockItems.length > 0" class="space-y-2">
          <div
            v-for="item in lowStockItems.slice(0, 4)"
            :key="item.productId"
            class="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40"
          >
            <div>
              <div class="text-xs font-bold text-graphite-900 dark:text-white">
                {{ item.productName }}
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">
                کد: {{ item.sku }} | حداقل نیاز:
                {{ (item.minThresholdScaled / 1000).toLocaleString("en-US") }}
                {{ item.unit }}
              </div>
            </div>

            <div class="text-left">
              <span
                class="text-xs font-bold text-amber-600 dark:text-amber-400"
              >
                موجودی:
                {{ (item.currentStockScaled / 1000).toLocaleString("en-US") }}
                {{ item.unit }}
              </span>
              <div class="text-[10px] text-rose-500 font-medium mt-0.5">
                کسری: {{ (item.deficitScaled / 1000).toLocaleString("en-US") }}
                {{ item.unit }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="py-6 text-center text-gray-400 space-y-1">
          <Package class="w-8 h-8 mx-auto opacity-40 mb-2" />
          <p class="text-xs">همه محصولات در وضعیت موجودی مناسب هستند.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import AppHeader from "@/presentation/components/common/AppHeader.vue";
import { getTodayJalali, formatJalaliHuman } from "@/shared/utils/jalali";
import { formatMoney } from "@/shared/formatters/currency";
import { getAppContainer } from "@/app/providers/container";
import { useUIStore } from "@/presentation/stores/uiStore";
import type {
  DashboardMetrics,
  LowStockReportItem,
} from "@/domain/repositories/IReportingRepository";
import {
  TrendingUp,
  Wallet,
  ReceiptText,
  Clock,
  PlusCircle,
  UserPlus,
  PackagePlus,
  CheckCircle2,
  CheckSquare,
  AlertTriangle,
  Package,
  FileText,
  Check,
} from "lucide-vue-next";

const uiStore = useUIStore();
const metrics = ref<DashboardMetrics | null>(null);
const lowStockItems = ref<LowStockReportItem[]>([]);

const todayJalaliFormatted = computed(() => {
  return formatJalaliHuman(getTodayJalali());
});

async function loadData() {
  try {
    const container = getAppContainer();
    const res = await container.getDashboardMetricsUseCase.execute();
    if (res.success) {
      metrics.value = res.data;
    }
    const lowStock = await container.reportingRepo.getLowStockReport();
    lowStockItems.value = lowStock;
  } catch (err) {
    console.error("Failed to load dashboard metrics", err);
  }
}

async function toggleTaskComplete(taskId: string) {
  try {
    const container = getAppContainer();
    const res = await container.completeTaskUseCase.execute({ id: taskId });
    if (res.success) {
      uiStore.showToast({
        type: "success",
        message: "وظیفه با موفقیت تکمیل شد.",
      });
      await loadData();
    }
  } catch {
    uiStore.showToast({
      type: "error",
      message: "خطا در ثبت وضعیت وظیفه",
    });
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "issued":
      return "صادرشده";
    case "paid":
      return "پرداخت‌شده";
    case "cancelled":
      return "ابطال‌شده";
    default:
      return "پیش‌نویس";
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "issued":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300";
    case "paid":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300";
    case "cancelled":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

onMounted(() => {
  loadData();
});
</script>
