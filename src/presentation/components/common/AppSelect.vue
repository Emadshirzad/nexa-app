<template>
  <div ref="rootEl" class="relative" dir="rtl">
    <button
      type="button"
      :disabled="disabled"
      @click="toggle"
      class="w-full h-10 px-3 flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-graphite-800 border text-sm text-right focus:outline-none transition-colors disabled:opacity-50"
      :class="open ? 'border-emerald dark:border-emerald' : 'border-gray-200 dark:border-graphite-700'"
    >
      <span
        class="truncate"
        :class="selected ? 'text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-400 dark:text-gray-500'"
      >
        {{ selected?.label || placeholder }}
      </span>
      <ChevronDown class="w-4 h-4 ml-auto mr-0 text-gray-400 shrink-0 transition-transform" :class="{ 'rotate-180': open }" />
    </button>

    <div
      v-if="open"
      class="absolute z-50 mt-1 left-0 w-full max-h-44 overflow-y-auto rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 shadow-xl shadow-black/5 p-1.5 text-sm"
    >
      <button
        v-for="option in options"
        :key="String(option.value)"
        type="button"
        @click="choose(option.value)"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-right transition-colors hover:bg-gray-100 dark:hover:bg-graphite-800"
        :class="option.value === modelValue ? 'text-emerald font-bold' : 'text-gray-700 dark:text-gray-300'"
      >
        <span class="truncate">{{ option.label }}</span>
        <Check v-if="option.value === modelValue" class="w-4 h-4 mr-auto mr-0 text-emerald shrink-0" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Check, ChevronDown } from 'lucide-vue-next';

interface Option {
  value: string | number | null;
  label: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: 'انتخاب کنید',
    disabled: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void;
}>();

const rootEl = ref<HTMLElement | null>(null);
const open = ref(false);

const selected = computed(() => props.options.find((o) => o.value === props.modelValue));

function toggle() {
  if (!props.disabled) open.value = !open.value;
}

function choose(value: string | number | null) {
  emit('update:modelValue', value);
  open.value = false;
}

function onClickOutside(event: MouseEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(event.target as Node)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>
