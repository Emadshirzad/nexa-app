<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="فاکتورها" subtitle="مدیریت فروش و صورتحساب‌ها" :show-back="false">
      <template #actions>
        <button
          @click="openCreateModal"
          type="button"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="صدور فاکتور جدید"
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
            placeholder="جستجوی شماره فاکتور یا مشتری..."
            class="w-full h-11 pl-4 pr-10 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-sm focus:outline-none focus:border-emerald dark:focus:border-emerald transition-colors"
          />
          <Search class="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            v-for="filter in filterOptions"
            :key="filter.key"
            @click="activeFilter = filter.key"
            type="button"
            class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
            :class="
              activeFilter === filter.key
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
        v-else-if="filteredInvoices.length === 0"
        class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400"
      >
        <div
          class="w-16 h-16 rounded-3xl bg-mint dark:bg-graphite-800 flex items-center justify-center text-emerald mb-3"
        >
          <Receipt class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-graphite-800 dark:text-gray-200">
          {{ invoices.length === 0 ? 'هنوز فاکتوری صادر نشده است' : 'فاکتوری با این مشخصات یافت نشد' }}
        </h3>
        <p class="text-xs text-gray-400 max-w-xs mt-1 mb-5">
          اولین فاکتور فروش رسمی خود را در کمتر از ۱ دقیقه صادر کرده و فایل PDF آن را چاپ یا تحویل مشتری دهید.
        </p>
        <button
          v-if="invoices.length === 0"
          @click="openCreateModal"
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald text-white text-xs font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <Plus class="w-4 h-4" />
          صدور اولین فاکتور
        </button>
      </div>

      <!-- Invoice Cards List -->
      <div v-else class="space-y-3">
        <div
          v-for="invoice in filteredInvoices"
          :key="invoice.id"
          @click="openDetailModal(invoice)"
          class="p-4 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 shadow-sm hover:border-emerald transition-all cursor-pointer"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-sm text-graphite-900 dark:text-white">
                {{ invoice.invoiceNumber }}
              </span>
              <span
                v-if="invoice.status === 'cancelled'"
                class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
              >
                باطله
              </span>
              <span
                v-else-if="invoice.outstandingDebt.value === 0"
                class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              >
                تسویه کامل
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
              >
                مانده بدهی: {{ invoice.outstandingDebt.format() }}
              </span>
            </div>
            <span class="text-xs text-gray-400">
              {{ formatJalaliHuman(toJalaliString(invoice.invoiceDate)) }}
            </span>
          </div>

          <div class="flex items-center justify-between text-xs text-graphite-600 dark:text-gray-400">
            <div>
              خریدار:
              <strong class="text-graphite-800 dark:text-gray-200">
                {{ getCustomerName(invoice.customerId) }}
              </strong>
            </div>
            <div>
              مبلغ:
              <strong class="text-emerald font-bold text-sm">
                {{ invoice.finalAmount.format() }}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Invoice Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-graphite-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-graphite-800 space-y-4 my-auto max-h-[92vh] flex flex-col"
      >
        <div class="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-graphite-800">
          <h3 class="text-base font-bold text-graphite-900 dark:text-white flex items-center gap-2">
            <Receipt class="w-5 h-5 text-emerald" />
            صدور فاکتور جدید
          </h3>
          <button
            @click="closeCreateModal"
            type="button"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="overflow-y-auto space-y-4 flex-1 pr-1 pl-1">
          <!-- Customer Selection & Date -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-graphite-700 dark:text-gray-300 mb-1">
                انتخاب مشتری
              </label>
              <select
                v-model="newInvoice.customerId"
                class="w-full h-11 px-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
              >
                <option :value="null">مشتری عمومی / نقدی</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.mobile }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-graphite-700 dark:text-gray-300 mb-1">
                تاریخ فاکتور
              </label>
              <input
                v-model="newInvoice.invoiceDate"
                type="date"
                class="w-full h-11 px-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
              />
            </div>
          </div>

          <!-- Items Section -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-graphite-800 dark:text-gray-200">
                اقلام فاکتور ({{ newInvoice.items.length }})
              </label>
              <button
                @click="addItemRow"
                type="button"
                class="inline-flex items-center gap-1 text-xs font-bold text-emerald hover:underline"
              >
                <Plus class="w-3.5 h-3.5" />
                افزودن قلم
              </button>
            </div>

            <div
              v-for="(item, idx) in newInvoice.items"
              :key="idx"
              class="p-3 rounded-2xl bg-gray-50 dark:bg-graphite-800/80 border border-gray-200 dark:border-graphite-700 space-y-2.5"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-graphite-500">ردیف {{ idx + 1 }}</span>
                <button
                  v-if="newInvoice.items.length > 1"
                  @click="removeItemRow(idx)"
                  type="button"
                  class="text-red-500 hover:text-red-700 text-xs"
                >
                  حذف
                </button>
              </div>

              <!-- Product selector or manual name -->
              <div>
                <select
                  @change="onProductSelect(idx, $event)"
                  class="w-full h-10 px-3 rounded-xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
                >
                  <option value="">-- انتخاب از کاتالوگ یا وارد کردن دستی --</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">
                    {{ p.name }} - {{ p.sellingPrice.format() }} (موجودی: {{ p.stockQuantity.toDecimal() }})
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <input
                    v-model="item.name"
                    type="text"
                    placeholder="نام کالا / خدمات"
                    class="w-full h-9 px-3 rounded-xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
                  />
                </div>
                <div class="flex items-center gap-1.5">
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="تعداد"
                    class="w-full h-9 px-3 rounded-xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
                  />
                  <span class="text-xs text-gray-500 whitespace-nowrap">{{ item.unitLabel }}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <input
                    v-model.number="item.unitPrice"
                    type="number"
                    min="0"
                    placeholder="قیمت واحد (تومان)"
                    class="w-full h-9 px-3 rounded-xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
                  />
                </div>
                <div>
                  <input
                    v-model.number="item.discount"
                    type="number"
                    min="0"
                    placeholder="تخفیف (تومان)"
                    class="w-full h-9 px-3 rounded-xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
                  />
                </div>
              </div>

              <div class="text-left text-xs font-bold text-graphite-700 dark:text-gray-300">
                جمع ردیف: {{ calculateLineTotal(item).toLocaleString() }} تومان
              </div>
            </div>
          </div>

          <!-- Invoice Discount & Notes -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-graphite-800">
            <div>
              <label class="block text-xs font-semibold text-graphite-700 dark:text-gray-300 mb-1">
                تخفیف کلی فاکتور (تومان)
              </label>
              <input
                v-model.number="newInvoice.invoiceDiscount"
                type="number"
                min="0"
                class="w-full h-11 px-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-graphite-700 dark:text-gray-300 mb-1">
                توضیحات و شرایط
              </label>
              <input
                v-model="newInvoice.notes"
                type="text"
                placeholder="مثلاً: تسویه نقدی ظرف ۳ روز"
                class="w-full h-11 px-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
              />
            </div>
          </div>

          <!-- Upfront Payment Option -->
          <div class="p-3 rounded-2xl bg-mint/50 dark:bg-graphite-800 border border-emerald/20 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-emerald-800 dark:text-emerald-400">دریافت نقدی / پیش‌پرداخت</span>
              <input
                v-model="hasUpfrontPayment"
                type="checkbox"
                class="w-4 h-4 text-emerald rounded border-gray-300 focus:ring-emerald"
              />
            </div>

            <div v-if="hasUpfrontPayment" class="grid grid-cols-2 gap-2 pt-1">
              <div>
                <input
                  v-model.number="upfrontAmount"
                  type="number"
                  min="0"
                  placeholder="مبلغ پرداختی (تومان)"
                  class="w-full h-9 px-3 rounded-xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
                />
              </div>
              <div>
                <select
                  v-model="upfrontMethod"
                  class="w-full h-9 px-2 rounded-xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
                >
                  <option value="cash">نقدی</option>
                  <option value="card_transfer">کارت به کارت</option>
                  <option value="pos">دستگاه پوز</option>
                  <option value="bank_transfer">حواله پایا/ساتنا</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Summary calculation -->
          <div class="p-3 rounded-2xl bg-gray-100 dark:bg-graphite-800 text-xs space-y-1.5">
            <div class="flex justify-between text-gray-500">
              <span>جمع اقلام:</span>
              <span>{{ computedSubtotal.toLocaleString() }} تومان</span>
            </div>
            <div class="flex justify-between text-red-500">
              <span>مجموع تخفیف:</span>
              <span>- {{ computedDiscount.toLocaleString() }} تومان</span>
            </div>
            <div class="flex justify-between font-bold text-emerald text-sm border-t pt-1 border-gray-200 dark:border-graphite-700">
              <span>مبلغ نهایی فاکتور:</span>
              <span>{{ computedFinalAmount.toLocaleString() }} تومان</span>
            </div>
          </div>

          <p v-if="createError" class="text-xs text-red-500 text-center font-bold">
            {{ createError }}
          </p>
        </div>

        <div class="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-graphite-800">
          <button
            @click="closeCreateModal"
            type="button"
            class="flex-1 h-11 rounded-2xl border border-gray-200 dark:border-graphite-700 text-xs font-bold text-graphite-700 dark:text-gray-300"
          >
            انصراف
          </button>
          <button
            @click="submitCreateInvoice"
            :disabled="isSubmitting"
            type="button"
            class="flex-1 h-11 rounded-2xl bg-emerald text-white text-xs font-bold shadow-md hover:bg-emerald-600 disabled:opacity-50 transition-all"
          >
            <span v-if="isSubmitting">در حال صدور...</span>
            <span v-else>صدور رسمی فاکتور</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Invoice Detail & PDF Action Modal -->
    <div
      v-if="selectedInvoice"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-graphite-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-graphite-800 space-y-4 my-auto max-h-[92vh] flex flex-col"
      >
        <div class="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-graphite-800">
          <div>
            <h3 class="text-base font-bold text-graphite-900 dark:text-white flex items-center gap-2">
              فاکتور {{ selectedInvoice.invoiceNumber }}
            </h3>
            <span class="text-xs text-gray-400">
              {{ formatJalaliHuman(toJalaliString(selectedInvoice.invoiceDate)) }}
            </span>
          </div>
          <button
            @click="closeDetailModal"
            type="button"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="overflow-y-auto space-y-3.5 flex-1 pr-1 pl-1 text-xs">
          <!-- Buyer Info -->
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-graphite-800 space-y-1">
            <div>
              خریدار:
              <strong class="text-graphite-900 dark:text-white">
                {{ getCustomerName(selectedInvoice.customerId) }}
              </strong>
            </div>
            <div v-if="selectedInvoice.status === 'cancelled'" class="text-red-500 font-bold">
              وضعیت: ابطال‌شده ({{ selectedInvoice.cancellationReason }})
            </div>
          </div>

          <!-- Items list -->
          <div class="border rounded-2xl border-gray-200 dark:border-graphite-700 overflow-hidden">
            <table class="w-full text-right border-collapse">
              <thead class="bg-graphite-800 text-white text-[11px]">
                <tr>
                  <th class="p-2">شرح کالا</th>
                  <th class="p-2 text-center">مقدار</th>
                  <th class="p-2 text-left">مبلغ کل</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-graphite-800">
                <tr v-for="it in selectedInvoice.items" :key="it.id">
                  <td class="p-2">
                    <div class="font-bold">{{ it.productNameSnapshot }}</div>
                    <div class="text-[10px] text-gray-400">{{ it.unitPriceSnapshot.format() }}</div>
                  </td>
                  <td class="p-2 text-center">{{ it.quantity.toDecimal() }} {{ it.unitSnapshot }}</td>
                  <td class="p-2 text-left font-bold text-emerald">{{ it.lineTotal.format() }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Financial summary -->
          <div class="p-3 rounded-2xl bg-mint/40 dark:bg-graphite-800 space-y-1 text-xs">
            <div class="flex justify-between">
              <span>مبلغ کل:</span>
              <span class="font-bold">{{ selectedInvoice.finalAmount.format() }}</span>
            </div>
            <div class="flex justify-between">
              <span>پرداخت‌شده:</span>
              <span class="text-emerald font-bold">{{ selectedInvoice.paidAmount.format() }}</span>
            </div>
            <div
              v-if="selectedInvoice.outstandingDebt.value > 0"
              class="flex justify-between font-bold text-red-500 border-t pt-1 border-gray-200 dark:border-graphite-700"
            >
              <span>مانده بدهی:</span>
              <span>{{ selectedInvoice.outstandingDebt.format() }}</span>
            </div>
          </div>

          <!-- Action buttons: Print PDF & Share -->
          <div class="grid grid-cols-2 gap-2 pt-2">
            <button
              @click="printPdf(selectedInvoice)"
              type="button"
              class="h-11 rounded-2xl bg-graphite-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-graphite-700 transition-colors"
            >
              <Printer class="w-4 h-4" />
              چاپ / خروجی PDF
            </button>
            <button
              @click="shareInvoice(selectedInvoice)"
              type="button"
              class="h-11 rounded-2xl bg-mint text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Share2 class="w-4 h-4" />
              اشتراک‌گذاری
            </button>
          </div>

          <!-- Payment recording button (if debt remains) -->
          <div v-if="selectedInvoice.status !== 'cancelled' && selectedInvoice.outstandingDebt.value > 0">
            <button
              @click="openPaymentModal(selectedInvoice)"
              type="button"
              class="w-full h-10 rounded-2xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
            >
              ثبت دریافت مبلغ / تسویه بدهی
            </button>
          </div>

          <!-- Cancel Invoice button -->
          <div v-if="selectedInvoice.status !== 'cancelled'" class="border-t pt-3 border-gray-100 dark:border-graphite-800">
            <button
              @click="openCancelModal(selectedInvoice)"
              type="button"
              class="w-full text-center text-xs text-red-500 hover:text-red-700 font-bold py-1"
            >
              ابطال این فاکتور (بازگشت به انبار)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Record Payment Modal -->
    <div
      v-if="showPaymentModal && paymentTargetInvoice"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm bg-white dark:bg-graphite-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-graphite-800 space-y-4"
      >
        <h3 class="text-sm font-bold text-graphite-900 dark:text-white">
          ثبت دریافت وجه برای فاکتور {{ paymentTargetInvoice.invoiceNumber }}
        </h3>
        <p class="text-xs text-gray-400">
          مانده بدهی فعلی: {{ paymentTargetInvoice.outstandingDebt.format() }}
        </p>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-graphite-700 dark:text-gray-300 mb-1">
              مبلغ پرداختی (تومان)
            </label>
            <input
              v-model.number="paymentAmount"
              type="number"
              min="1"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-graphite-700 dark:text-gray-300 mb-1">
              روش پرداخت
            </label>
            <select
              v-model="paymentMethod"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-emerald"
            >
              <option value="cash">نقدی</option>
              <option value="card_transfer">کارت به کارت</option>
              <option value="pos">دستگاه پوز</option>
              <option value="bank_transfer">حواله پایا/ساتنا</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button
            @click="showPaymentModal = false"
            type="button"
            class="flex-1 h-10 rounded-xl border border-gray-200 dark:border-graphite-700 text-xs font-bold"
          >
            انصراف
          </button>
          <button
            @click="submitPayment"
            type="button"
            class="flex-1 h-10 rounded-xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600"
          >
            ثبت دریافت
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div
      v-if="showCancelModal && cancelTargetInvoice"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm bg-white dark:bg-graphite-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-graphite-800 space-y-4"
      >
        <h3 class="text-sm font-bold text-red-600 flex items-center gap-2">
          <AlertTriangle class="w-5 h-5" />
          تأیید ابطال فاکتور
        </h3>
        <p class="text-xs text-graphite-600 dark:text-gray-300 leading-relaxed">
          با ابطال این فاکتور، تمام اقلام آن به موجودی انبار بازگردانده شده و وضعیت فاکتور به باطله تغییر می‌کند.
        </p>

        <div>
          <label class="block text-xs font-semibold text-graphite-700 dark:text-gray-300 mb-1">
            دلیل ابطال (الزامی)
          </label>
          <input
            v-model="cancelReason"
            type="text"
            placeholder="مثلاً: انصراف خریدار یا اشتباه در صدور"
            class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-xs focus:outline-none focus:border-red-500"
          />
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button
            @click="showCancelModal = false"
            type="button"
            class="flex-1 h-10 rounded-xl border border-gray-200 dark:border-graphite-700 text-xs font-bold"
          >
            انصراف
          </button>
          <button
            @click="submitCancel"
            :disabled="!cancelReason.trim()"
            type="button"
            class="flex-1 h-10 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
          >
            ابطال نهایی فاکتور
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import {
  Receipt,
  Plus,
  Search,
  X,
  Printer,
  Share2,
  AlertTriangle,
  Loader2
} from 'lucide-vue-next';
import { getAppContainer } from '@/app/providers/container';
import type { Invoice } from '@/domain/entities/Invoice';
import type { Customer } from '@/domain/entities/Customer';
import type { Product } from '@/domain/entities/Product';
import type { BusinessProfile } from '@/domain/entities/BusinessProfile';
import { InvoicePdfGenerator } from '@/infrastructure/pdf/InvoicePdfGenerator';
import { toJalaliString, formatJalaliHuman } from '@/shared/utils/jalali';
import { getUnitLabel } from '@/shared/constants/units';

const route = useRoute();
const router = useRouter();

const searchQuery = ref('');
const activeFilter = ref<'all' | 'issued' | 'cancelled' | 'debt'>('all');
const isLoading = ref(true);

const filterOptions = [
  { key: 'all' as const, label: 'همه فاکتورها' },
  { key: 'issued' as const, label: 'صادرشده' },
  { key: 'debt' as const, label: 'دارای بدهی' },
  { key: 'cancelled' as const, label: 'ابطال‌شده' }
];

const invoices = shallowRef<Invoice[]>([]);
const customers = shallowRef<Customer[]>([]);
const products = shallowRef<Product[]>([]);
let businessProfile: BusinessProfile | null = null;

// Modal states
const showCreateModal = ref(false);
const isSubmitting = ref(false);
const createError = ref('');
const selectedInvoice = shallowRef<Invoice | null>(null);

const showPaymentModal = ref(false);
const paymentTargetInvoice = shallowRef<Invoice | null>(null);
const paymentAmount = ref(0);
const paymentMethod = ref<'cash' | 'card_transfer' | 'pos' | 'bank_transfer'>('cash');

const showCancelModal = ref(false);
const cancelTargetInvoice = shallowRef<Invoice | null>(null);
const cancelReason = ref('');

// New invoice draft
interface DraftItem {
  productId?: string;
  name: string;
  sku: string;
  unit: string;
  unitLabel: string;
  unitPrice: number;
  quantity: number;
  discount: number;
}

const newInvoice = ref<{
  customerId: string | null;
  invoiceDate: string;
  items: DraftItem[];
  invoiceDiscount: number;
  notes: string;
}>({
  customerId: null,
  invoiceDate: new Date().toISOString().slice(0, 10),
  items: [],
  invoiceDiscount: 0,
  notes: ''
});

const hasUpfrontPayment = ref(false);
const upfrontAmount = ref(0);
const upfrontMethod = ref<'cash' | 'card_transfer' | 'pos' | 'bank_transfer'>('cash');

async function loadData() {
  isLoading.value = true;
  try {
    const container = getAppContainer();
    const [invList, custList, prodList, profRes] = await Promise.all([
      container.invoiceRepo.listAll(100),
      container.customerRepo.listAll(),
      container.productRepo.listAll(),
      container.getBusinessProfileUseCase.execute()
    ]);
    invoices.value = invList;
    customers.value = custList;
    products.value = prodList;
    if (profRes) {
      businessProfile = profRes;
    }
  } catch (err) {
    console.error('Error loading invoices data:', err);
  } finally {
    isLoading.value = false;
  }
}

function closeCreateModal() {
  showCreateModal.value = false;
  if (route.name === 'invoice-new') {
    router.replace({ name: 'invoices' });
  }
}

function closeDetailModal() {
  selectedInvoice.value = null;
  if (route.params.id) {
    router.replace({ name: 'invoices' });
  }
}

async function checkRoute() {
  if (route.name === 'invoice-new') {
    openCreateModal();
  } else if (route.params.id) {
    const invId = route.params.id as string;
    const container = getAppContainer();
    const found = await container.invoiceRepo.findById(invId as any);
    if (found) {
      selectedInvoice.value = found;
    }
  }
}

onMounted(async () => {
  await loadData();
  await checkRoute();
});

watch(
  () => route.fullPath,
  async () => {
    await checkRoute();
  }
);

const filteredInvoices = computed(() => {
  return invoices.value.filter((inv) => {
    // Filter by tab
    if (activeFilter.value === 'issued' && inv.status !== 'issued') return false;
    if (activeFilter.value === 'cancelled' && inv.status !== 'cancelled') return false;
    if (activeFilter.value === 'debt' && (inv.status === 'cancelled' || inv.outstandingDebt.value === 0)) return false;

    // Filter by search
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase();
      const matchNumber = inv.invoiceNumber.toLowerCase().includes(q);
      const custName = getCustomerName(inv.customerId).toLowerCase();
      const matchCustomer = custName.includes(q);
      return matchNumber || matchCustomer;
    }

    return true;
  });
});

function getCustomerName(customerId?: string | null): string {
  if (!customerId) return 'مشتری عمومی / نقدی';
  const c = customers.value.find((cust) => cust.id === customerId);
  return c ? c.name : 'مشتری عمومی';
}

function openCreateModal() {
  newInvoice.value = {
    customerId: null,
    invoiceDate: new Date().toISOString().slice(0, 10),
    items: [
      {
        name: '',
        sku: '',
        unit: 'piece',
        unitLabel: 'عدد',
        unitPrice: 0,
        quantity: 1,
        discount: 0
      }
    ],
    invoiceDiscount: 0,
    notes: ''
  };
  hasUpfrontPayment.value = false;
  upfrontAmount.value = 0;
  createError.value = '';
  showCreateModal.value = true;
}

function addItemRow() {
  newInvoice.value.items.push({
    name: '',
    sku: '',
    unit: 'piece',
    unitLabel: 'عدد',
    unitPrice: 0,
    quantity: 1,
    discount: 0
  });
}

function removeItemRow(index: number) {
  newInvoice.value.items.splice(index, 1);
}

function onProductSelect(index: number, event: Event) {
  const prodId = (event.target as HTMLSelectElement).value;
  if (!prodId) return;
  const prod = products.value.find((p) => p.id === prodId);
  if (prod) {
    newInvoice.value.items[index] = {
      productId: prod.id,
      name: prod.name,
      sku: prod.sku,
      unit: prod.unit,
      unitLabel: getUnitLabel(prod.unit),
      unitPrice: prod.sellingPrice.value,
      quantity: 1,
      discount: 0
    };
  }
}

function calculateLineTotal(item: DraftItem): number {
  const gross = Math.round(item.unitPrice * item.quantity);
  return Math.max(0, gross - (item.discount || 0));
}

const computedSubtotal = computed(() => {
  return newInvoice.value.items.reduce((sum, it) => sum + Math.round(it.unitPrice * it.quantity), 0);
});

const computedDiscount = computed(() => {
  const itemDisc = newInvoice.value.items.reduce((sum, it) => sum + (it.discount || 0), 0);
  return itemDisc + (newInvoice.value.invoiceDiscount || 0);
});

const computedFinalAmount = computed(() => {
  return Math.max(0, computedSubtotal.value - computedDiscount.value);
});

async function submitCreateInvoice() {
  createError.value = '';
  isSubmitting.value = true;
  try {
    const container = getAppContainer();
    const res = await container.createInvoiceUseCase.execute({
      customerId: newInvoice.value.customerId,
      invoiceDate: newInvoice.value.invoiceDate,
      items: newInvoice.value.items.map((it) => ({
        productId: it.productId,
        name: it.name,
        sku: it.sku,
        unit: it.unit,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        discount: it.discount
      })),
      invoiceDiscount: newInvoice.value.invoiceDiscount,
      notes: newInvoice.value.notes,
      upfrontPayment:
        hasUpfrontPayment.value && upfrontAmount.value > 0
          ? {
              amount: upfrontAmount.value,
              paymentMethod: upfrontMethod.value
            }
          : undefined
    });

    if (!res.success) {
      createError.value = res.error;
      return;
    }

    showCreateModal.value = false;
    await loadData();
  } catch (err) {
    createError.value = String(err);
  } finally {
    isSubmitting.value = false;
  }
}

function openDetailModal(invoice: Invoice) {
  selectedInvoice.value = invoice;
}

function printPdf(invoice: Invoice) {
  if (!businessProfile) return;
  const customer = customers.value.find((c) => c.id === invoice.customerId) || null;
  InvoicePdfGenerator.print(invoice, businessProfile, customer);
}

function shareInvoice(invoice: Invoice) {
  if (!businessProfile) return;
  const customer = customers.value.find((c) => c.id === invoice.customerId) || null;
  InvoicePdfGenerator.shareSummary(invoice, businessProfile, customer);
}

function openPaymentModal(invoice: Invoice) {
  paymentTargetInvoice.value = invoice;
  paymentAmount.value = invoice.outstandingDebt.value;
  paymentMethod.value = 'cash';
  showPaymentModal.value = true;
}

async function submitPayment() {
  if (!paymentTargetInvoice.value || paymentAmount.value <= 0) return;
  const container = getAppContainer();
  const res = await container.recordInvoicePaymentUseCase.execute({
    invoiceId: paymentTargetInvoice.value.id,
    amount: paymentAmount.value,
    paymentMethod: paymentMethod.value,
    paymentDate: new Date().toISOString().slice(0, 10)
  });

  if (res.success) {
    showPaymentModal.value = false;
    selectedInvoice.value = null;
    await loadData();
  }
}

function openCancelModal(invoice: Invoice) {
  cancelTargetInvoice.value = invoice;
  cancelReason.value = '';
  showCancelModal.value = true;
}

async function submitCancel() {
  if (!cancelTargetInvoice.value || !cancelReason.value.trim()) return;
  const container = getAppContainer();
  const res = await container.cancelInvoiceUseCase.execute({
    invoiceId: cancelTargetInvoice.value.id,
    reason: cancelReason.value.trim()
  });

  if (res.success) {
    showCancelModal.value = false;
    selectedInvoice.value = null;
    await loadData();
  }
}
</script>
