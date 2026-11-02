<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="محصولات و کالاها" subtitle="مدیریت کالا، قیمت و انبار" :show-back="true">
      <template #actions>
        <button
          @click="openCreateModal"
          type="button"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="افزودن محصول جدید"
        >
          <Plus class="w-5 h-5" />
        </button>
      </template>
    </AppHeader>

    <div class="p-4 space-y-4 flex-1 flex flex-col">
      <!-- Search & Category Filters -->
      <div class="space-y-2.5">
        <div class="relative">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="search"
            placeholder="جستجوی نام کالا یا کد SKU..."
            class="w-full h-11 pl-4 pr-10 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-sm focus:outline-none focus:border-emerald dark:focus:border-emerald transition-colors"
          />
          <Search class="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        <!-- Category Chips -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            @click="selectCategory(null)"
            type="button"
            class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
            :class="selectedCategoryId === null
              ? 'bg-emerald text-white font-bold shadow-sm'
              : 'bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-600 dark:text-gray-400'"
          >
            همه
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="selectCategory(cat.id)"
            type="button"
            class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
            :class="selectedCategoryId === cat.id
              ? 'bg-emerald text-white font-bold shadow-sm'
              : 'bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-600 dark:text-gray-400'"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Product List -->
      <div v-if="products.length > 0" class="space-y-3 flex-1">
        <div
          v-for="product in products"
          :key="product.id"
          class="bg-white dark:bg-graphite-900 rounded-3xl p-4 border border-gray-100 dark:border-graphite-800 shadow-sm flex flex-col justify-between space-y-3"
        >
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-graphite-900 dark:text-white">{{ product.name }}</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] bg-gray-100 dark:bg-graphite-800 text-gray-500 font-mono">
                  {{ product.sku }}
                </span>
              </div>
              <div class="text-xs text-gray-400">
                واحد: {{ unitLabels[product.unit] || product.unit }}
              </div>
            </div>

            <!-- Price -->
            <div class="text-right">
              <div class="text-sm font-black text-emerald">
                {{ product.sellingPrice.format() }}
              </div>
            </div>
          </div>

          <!-- Stock Level & Actions -->
          <div class="flex items-center justify-between border-t border-gray-100 dark:border-graphite-800/60 pt-3">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">موجودی:</span>
              <span
                class="text-xs font-bold px-2 py-0.5 rounded-lg"
                :class="product.isLowStock()
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 font-bold'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'"
              >
                {{ product.stockQuantity.format(unitLabels[product.unit]) }}
              </span>
              <span v-if="product.isLowStock()" class="text-[10px] text-red-500">
                (کمتر از حداقل {{ product.minStockThreshold.format() }})
              </span>
            </div>

            <div class="flex items-center gap-1">
              <button
                @click="openAdjustModal(product)"
                type="button"
                class="px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-graphite-800 hover:bg-gray-100 dark:hover:bg-graphite-700 text-xs text-graphite-700 dark:text-gray-300 font-medium"
              >
                اصلاح موجودی
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400">
        <div class="w-16 h-16 rounded-3xl bg-mint dark:bg-graphite-800 flex items-center justify-center text-emerald mb-3">
          <Package class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-graphite-800 dark:text-gray-200">کالایی یافت نشد</h3>
        <p class="text-xs text-gray-400 max-w-xs mt-1 mb-5">
          کالاها و خدمات خود را با تعیین واحد، قیمت فروش و موجودی اولیه تعریف کنید.
        </p>
        <button
          @click="openCreateModal"
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald text-white text-xs font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <Plus class="w-4 h-4" />
          افزودن اولین محصول
        </button>
      </div>
    </div>

    <!-- Create Product Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div class="bg-white dark:bg-graphite-900 rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl border border-gray-100 dark:border-graphite-800">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-graphite-800 pb-3">
          <h3 class="text-sm font-bold text-graphite-900 dark:text-white">تعریف محصول جدید</h3>
          <button @click="closeCreateModal" class="p-1 rounded-lg text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleCreateProduct" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">نام کالا یا خدمت *</label>
            <input
              v-model="newForm.name"
              type="text"
              required
              placeholder="مثال: کابل شبکه Cat6"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">کد کالا (SKU)</label>
              <input
                v-model="newForm.sku"
                type="text"
                placeholder="تولید خودکار"
                dir="ltr"
                class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-right focus:outline-none focus:border-emerald"
              />
            </div>

            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">واحد شمارش</label>
              <select
                v-model="newForm.unit"
                class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
              >
                <option v-for="(label, val) in unitLabels" :key="val" :value="val">
                  {{ label }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">قیمت فروش (تومان) *</label>
            <input
              v-model.number="newForm.sellingPrice"
              type="number"
              min="0"
              required
              placeholder="0"
              dir="ltr"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-right focus:outline-none focus:border-emerald font-bold"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">موجودی اولیه</label>
              <input
                v-model.number="newForm.initialStock"
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                dir="ltr"
                class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-right focus:outline-none focus:border-emerald"
              />
            </div>

            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">حداقل نقطه سفارش</label>
              <input
                v-model.number="newForm.minStockThreshold"
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                dir="ltr"
                class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-right focus:outline-none focus:border-emerald"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full h-11 rounded-2xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all mt-2 disabled:opacity-50"
          >
            {{ isSubmitting ? 'در حال ثبت...' : 'ثبت محصول' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Adjust Stock Modal -->
    <div v-if="showAdjustModal && selectedProduct" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div class="bg-white dark:bg-graphite-900 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-xl border border-gray-100 dark:border-graphite-800">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-graphite-800 pb-3">
          <div>
            <h3 class="text-sm font-bold text-graphite-900 dark:text-white">اصلاح موجودی انبار</h3>
            <p class="text-[11px] text-gray-400 mt-0.5">{{ selectedProduct.name }} (موجودی فعلی: {{ selectedProduct.stockQuantity.format() }})</p>
          </div>
          <button @click="closeAdjustModal" class="p-1 rounded-lg text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleAdjustStock" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">نوع عملیات</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="adjustType = 'addition'"
                class="p-2.5 rounded-xl border text-center font-bold transition-all"
                :class="adjustType === 'addition' ? 'bg-emerald text-white border-emerald' : 'bg-gray-50 dark:bg-graphite-800 border-gray-200 dark:border-graphite-700 text-gray-600 dark:text-gray-400'"
              >
                + ورود / افزایش
              </button>
              <button
                type="button"
                @click="adjustType = 'deduction'"
                class="p-2.5 rounded-xl border text-center font-bold transition-all"
                :class="adjustType === 'deduction' ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 dark:bg-graphite-800 border-gray-200 dark:border-graphite-700 text-gray-600 dark:text-gray-400'"
              >
                - خروج / کاهش
              </button>
            </div>
          </div>

          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">تعداد / مقدار تغییر *</label>
            <input
              v-model.number="adjustQty"
              type="number"
              step="0.001"
              min="0.001"
              required
              placeholder="0"
              dir="ltr"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 text-right focus:outline-none focus:border-emerald font-bold"
            />
          </div>

          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">دلیل تغییر موجودی (الزامی) *</label>
            <input
              v-model="adjustReason"
              type="text"
              required
              placeholder="مثال: خرید فاکتور جدید، انبارگردانی، ضایعات..."
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full h-11 rounded-2xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all mt-2 disabled:opacity-50"
          >
            {{ isSubmitting ? 'در حال اعمال...' : 'ثبت گردش انبار' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import { useContainer } from '@/presentation/composables/useContainer';
import { useUIStore } from '@/presentation/stores/uiStore';
import type { Product, ProductUnit } from '@/domain/entities/Product';
import type { Category } from '@/domain/entities/Category';
import type { UUID } from '@/shared/types/common';
import { Package, Plus, Search, X } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const container = useContainer();
const uiStore = useUIStore();

const products = shallowRef<Product[]>([]);
const categories = shallowRef<Category[]>([]);
const searchQuery = ref('');
const selectedCategoryId = ref<UUID | null>(null);

const showCreateModal = ref(false);
const showAdjustModal = ref(false);
const selectedProduct = shallowRef<Product | null>(null);
const isSubmitting = ref(false);

const unitLabels: Record<string, string> = {
  piece: 'عدد',
  package: 'بسته',
  kilogram: 'کیلوگرم',
  gram: 'گرم',
  meter: 'متر',
  liter: 'لیتر',
  box: 'جعبه',
  carton: 'کارتن'
};

const newForm = ref({
  name: '',
  sku: '',
  categoryId: null as string | null,
  unit: 'piece' as ProductUnit,
  sellingPrice: 0,
  initialStock: 0,
  minStockThreshold: 0
});

const adjustType = ref<'addition' | 'deduction'>('addition');
const adjustQty = ref(1);
const adjustReason = ref('');

function closeCreateModal() {
  showCreateModal.value = false;
  if (route.name === 'product-new') {
    router.replace({ name: 'products' });
  }
}

function closeAdjustModal() {
  showAdjustModal.value = false;
  selectedProduct.value = null;
  if (route.params.id) {
    router.replace({ name: 'products' });
  }
}

async function checkRoute() {
  if (route.name === 'product-new') {
    openCreateModal();
  } else if (route.params.id) {
    const prodId = route.params.id as string;
    const found = await container.productRepo.findById(prodId as any);
    if (found) {
      openAdjustModal(found);
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

async function loadData() {
  categories.value = await container.categoryRepo.listAll();
  await handleSearch();
}

async function handleSearch() {
  products.value = await container.productRepo.search(
    searchQuery.value,
    selectedCategoryId.value,
    false
  );
}

function selectCategory(id: UUID | null) {
  selectedCategoryId.value = id;
  handleSearch();
}

function openCreateModal() {
  newForm.value = {
    name: '',
    sku: '',
    categoryId: selectedCategoryId.value,
    unit: 'piece',
    sellingPrice: 0,
    initialStock: 0,
    minStockThreshold: 0
  };
  showCreateModal.value = true;
}

async function handleCreateProduct() {
  if (!newForm.value.name.trim() || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    const res = await container.createProductUseCase.execute({
      name: newForm.value.name,
      sku: newForm.value.sku || undefined,
      categoryId: newForm.value.categoryId,
      unit: newForm.value.unit,
      sellingPrice: newForm.value.sellingPrice,
      initialStock: newForm.value.initialStock,
      minStockThreshold: newForm.value.minStockThreshold
    });

    if (res.success) {
      uiStore.showToast({
        type: 'success',
        message: `کالای "${res.data.name}" با موفقیت ذخیره شد.`
      });
      showCreateModal.value = false;
      await handleSearch();
    } else {
      uiStore.showToast({
        type: 'error',
        message: res.error
      });
    }
  } catch (err) {
    uiStore.showToast({
      type: 'error',
      message: 'خطا در ثبت کالا: ' + String(err)
    });
  } finally {
    isSubmitting.value = false;
  }
}

function openAdjustModal(product: Product) {
  selectedProduct.value = product;
  adjustType.value = 'addition';
  adjustQty.value = 1;
  adjustReason.value = '';
  showAdjustModal.value = true;
}

async function handleAdjustStock() {
  if (!selectedProduct.value || !adjustReason.value.trim() || isSubmitting.value) return;

  const delta = adjustType.value === 'addition' ? adjustQty.value : -adjustQty.value;

  isSubmitting.value = true;
  try {
    const res = await container.adjustStockUseCase.execute({
      productId: selectedProduct.value.id,
      quantityChange: delta,
      movementType: adjustType.value,
      reason: adjustReason.value.trim(),
      allowNegativeConfirmation: false
    });

    if (res.success) {
      uiStore.showToast({
        type: 'success',
        message: 'موجودی کالا با موفقیت به‌روزرسانی شد.'
      });
      showAdjustModal.value = false;
      await handleSearch();
    } else {
      uiStore.showToast({
        type: 'error',
        message: res.error
      });
    }
  } catch (err) {
    uiStore.showToast({
      type: 'error',
      message: 'خطا در ثبت تغییر موجودی: ' + String(err)
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>
