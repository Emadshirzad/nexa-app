<template>
  <div ref="rootEl" class="relative" dir="rtl">
    <!-- Trigger styled like other form inputs -->
    <button
      type="button"
      :disabled="disabled"
      @click="toggle"
      class="w-full h-10 px-3 flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-graphite-800 border text-sm focus:outline-none transition-colors disabled:opacity-50"
      :class="open ? 'border-emerald dark:border-emerald' : 'border-gray-200 dark:border-graphite-700'"
    >
      <span class="truncate" :class="modelValue ? 'text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-400 dark:text-gray-500'">
        {{ displayText || placeholder }}
      </span>
      <CalendarDays class="w-4 h-4 ml-auto mr-0 text-gray-400 shrink-0" />
    </button>

    <!-- Panel -->
    <div
      v-if="open"
      class="absolute z-50 mt-1 left-0 w-full min-w-[16rem] rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 shadow-xl shadow-black/5 p-3 text-sm"
      dir="rtl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between gap-1 mb-2">
        <button
          type="button"
          @click="moveMonth(-1)"
          class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-graphite-800 text-graphite-600 dark:text-gray-300 active:scale-95 transition-transform"
          aria-label="ماه قبل"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
        <div class="font-bold text-gray-800 dark:text-gray-100 text-center">
          {{ JALALI_MONTHS[view.jm - 1] }} {{ toPersianDigits(view.jy) }}
        </div>
        <button
          type="button"
          @click="moveMonth(1)"
          class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-graphite-800 text-graphite-600 dark:text-gray-300 active:scale-95 transition-transform"
          aria-label="ماه بعد"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
      </div>

      <!-- Weekday names -->
      <div class="grid grid-cols-7 gap-0.5 mb-1 text-center text-[10px] text-gray-400">
        <span v-for="w in JALALI_WEEKDAYS" :key="w" class="py-1">{{ w }}</span>
      </div>

      <!-- Day grid -->
      <div class="grid grid-cols-7 gap-0.5 text-center">
        <span v-for="i in startOffset" :key="`b-${i}`" class="size-9" />
        <button
          v-for="d in monthLength"
          :key="d"
          type="button"
          @click="selectDay(d)"
          class="size-9 rounded-xl text-xs font-semibold transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95"
          :class="dayClass(d)"
        >
          {{ toPersianDigits(d) }}
        </button>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-graphite-800">
        <button
          type="button"
          @click="pickToday"
          class="px-3 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/70 active:scale-95 transition-all text-xs"
        >
          امروز
        </button>
        <button
          type="button"
          @click="clearValue"
          class="px-3 h-8 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-graphite-800 active:scale-95 transition-all text-xs"
        >
          پاک کردن
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-vue-next';
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS,
  formatJalaliDisplay,
  isoDateToParts,
  jalaaliMonthLength,
  jalaaliToday,
  jalaaliPartsToIso,
  jalaaliWeekStartDay,
  toPersianDigits
} from '@/shared/utils/jalali';

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: 'انتخاب تاریخ',
    disabled: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const rootEl = ref<HTMLElement | null>(null);
const open = ref(false);

const view = ref({ ...jalaaliToday() });

const displayText = computed(() => formatJalaliDisplay(props.modelValue));

const monthLength = computed(() => jalaaliMonthLength(view.value.jy, view.value.jm));
const startOffset = computed(() => jalaaliWeekStartDay(view.value));

function syncViewFromValue() {
  const j = props.modelValue ? isoDateToParts(props.modelValue) : null;
  if (j) view.value = j;
}

watch(open, (o) => {
  if (o) syncViewFromValue();
});
watch(() => props.modelValue, syncViewFromValue, { immediate: true });

function toggle() {
  if (!props.disabled) open.value = !open.value;
}

function moveMonth(delta: number) {
  let jm = view.value.jm + delta;
  let jy = view.value.jy;
  if (jm < 1) {
    jm = 12;
    jy--;
  } else if (jm > 12) {
    jm = 1;
    jy++;
  }
  view.value = { jy, jm, jd: 1 };
}

function selectDay(d: number) {
  emit('update:modelValue', jalaaliPartsToIso({ jy: view.value.jy, jm: view.value.jm, jd: d }));
  open.value = false;
}

function pickToday() {
  const today = jalaaliToday();
  emit('update:modelValue', jalaaliPartsToIso(today));
  view.value = today;
  open.value = false;
}

function clearValue() {
  emit('update:modelValue', null);
  open.value = false;
}

const selectedIso = computed(() => (props.modelValue ? jalaaliPartsToIso(isoDateToParts(props.modelValue)!) : null));

function dayClass(d: number): string {
  const targetIso = jalaaliPartsToIso({ jy: view.value.jy, jm: view.value.jm, jd: d });
  if (props.modelValue && selectedIso.value === targetIso) {
    return 'bg-emerald text-white hover:bg-emerald-600';
  }
  return 'text-gray-700 dark:text-gray-300';
}

function onClickOutside(event: MouseEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(event.target as Node)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>
