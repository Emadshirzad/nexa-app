<template>
  <div class="flex-1 flex flex-col">
    <AppHeader title="وظایف و پیگیری‌ها" subtitle="برنامه‌ریزی روزانه و یادآوری‌ها" :show-back="false">
      <template #actions>
        <button
          @click="openCreateModal"
          type="button"
          class="p-2 rounded-xl text-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-95 transition-transform"
          aria-label="وظیفه جدید"
        >
          <Plus class="w-5 h-5" />
        </button>
      </template>
    </AppHeader>

    <div class="p-4 space-y-4 flex-1 flex flex-col">
      <!-- Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          type="button"
          class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5"
          :class="
            activeTab === tab.key
              ? 'bg-emerald text-white font-bold shadow-sm'
              : 'bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 text-graphite-600 dark:text-gray-400'
          "
        >
          {{ tab.label }}
          <span
            v-if="getTabCount(tab.key) > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px]"
            :class="activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-graphite-800 text-gray-500'"
          >
            {{ getTabCount(tab.key) }}
          </span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex-1 flex items-center justify-center py-12 text-gray-400">
        <Loader2 class="w-8 h-8 animate-spin text-emerald" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredTasks.length === 0"
        class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400"
      >
        <div
          class="w-16 h-16 rounded-3xl bg-mint dark:bg-graphite-800 flex items-center justify-center text-emerald mb-3"
        >
          <CheckSquare class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-graphite-800 dark:text-gray-200">
          {{ tasks.length === 0 ? 'وظیفه‌ای ثبت نشده است' : 'در این بخش وظیفه‌ای وجود ندارد' }}
        </h3>
        <p class="text-xs text-gray-400 max-w-xs mt-1 mb-5">
          برنامه‌ریزی تماس‌ها، موعد تحویل کالا و جلسات کاری خود را با اعلان یادآور تنظیم کنید.
        </p>
        <button
          v-if="tasks.length === 0"
          @click="openCreateModal"
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald text-white text-xs font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <Plus class="w-4 h-4" />
          ثبت اولین وظیفه
        </button>
      </div>

      <!-- Tasks List -->
      <div v-else class="space-y-2.5">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-800 shadow-sm flex items-start gap-3 transition-all"
          :class="{ 'opacity-60 bg-gray-50 dark:bg-graphite-900/60': task.isCompleted() }"
        >
          <!-- 1-Tap Toggle Checkbox -->
          <button
            @click="toggleTaskComplete(task)"
            type="button"
            class="mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors"
            :class="
              task.isCompleted()
                ? 'bg-emerald border-emerald text-white'
                : 'border-gray-300 dark:border-graphite-700 hover:border-emerald'
            "
          >
            <Check v-if="task.isCompleted()" class="w-4 h-4" />
          </button>

          <!-- Content -->
          <div class="flex-1 space-y-1">
            <div class="flex items-center justify-between">
              <span
                class="font-bold text-sm text-graphite-900 dark:text-white"
                :class="{ 'line-through text-gray-400': task.isCompleted() }"
              >
                {{ task.title }}
              </span>
              <span
                v-if="task.isUrgent()"
                class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
              >
                فوری
              </span>
            </div>

            <p
              v-if="task.description"
              class="text-xs text-graphite-600 dark:text-gray-400 leading-relaxed"
            >
              {{ task.description }}
            </p>

            <div class="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
              <span class="flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" />
                موعد: {{ formatJalaliHuman(toJalaliString(task.dueDate)) }}
              </span>
              <span
                v-if="!task.isCompleted() && isTaskOverdue(task.dueDate)"
                class="text-red-500 font-bold"
              >
                (معوق شده)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm bg-white dark:bg-graphite-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-graphite-800 space-y-3.5"
      >
        <div class="flex items-center justify-between border-b pb-2.5 border-gray-100 dark:border-graphite-800">
          <h3 class="text-sm font-bold text-graphite-900 dark:text-white">
            ثبت وظیفه جدید
          </h3>
          <button @click="showCreateModal = false" type="button" class="text-gray-400">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">عنوان وظیفه *</label>
            <input
              v-model="newTask.title"
              type="text"
              placeholder="مثلاً: ارسال نمونه قهوه برای مشتری"
              class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 focus:outline-none focus:border-emerald"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">موعد انجام *</label>
              <PersianDatePicker v-model="newTask.dueDate" placeholder="انتخاب تاریخ انجام" />
            </div>
            <div>
              <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">اولویت</label>
              <AppSelect
                v-model="newTask.priority"
                :options="[
                  { value: 'normal', label: 'عادی' },
                  { value: 'urgent', label: 'فوری ⚠️' }
                ]"
              />
            </div>
          </div>

          <div>
            <label class="block font-semibold mb-1 text-graphite-700 dark:text-gray-300">توضیحات</label>
            <textarea
              v-model="newTask.description"
              rows="2"
              placeholder="نکات تکمیلی و هماهنگی..."
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
            @click="submitCreateTask"
            :disabled="isSubmitting"
            type="button"
            class="flex-1 h-10 rounded-xl bg-emerald text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50"
          >
            {{ isSubmitting ? 'در حال ثبت...' : 'ثبت وظیفه' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted } from 'vue';
import AppHeader from '@/presentation/components/common/AppHeader.vue';
import PersianDatePicker from '@/presentation/components/common/PersianDatePicker.vue';
import AppSelect from '@/presentation/components/common/AppSelect.vue';
import {
  CheckSquare,
  Plus,
  Check,
  Clock,
  X,
  Loader2
} from 'lucide-vue-next';
import { getAppContainer } from '@/app/providers/container';
import type { Task, TaskPriority } from '@/domain/entities/Task';
import { toJalaliString, formatJalaliHuman } from '@/shared/utils/jalali';

const activeTab = ref<'today' | 'upcoming' | 'overdue' | 'completed' | 'all'>('today');
const isLoading = ref(true);

const tabs = [
  { key: 'today' as const, label: 'امروز' },
  { key: 'overdue' as const, label: 'معوق' },
  { key: 'upcoming' as const, label: 'آینده' },
  { key: 'completed' as const, label: 'انجام‌شده' },
  { key: 'all' as const, label: 'همه' }
];

const tasks = shallowRef<Task[]>([]);

const showCreateModal = ref(false);
const isSubmitting = ref(false);
const createError = ref('');

const newTask = ref<{
  title: string;
  description: string;
  dueDate: string | null;
  priority: TaskPriority;
}>({
  title: '',
  description: '',
  dueDate: new Date().toISOString().slice(0, 10),
  priority: 'normal'
});

async function loadTasks() {
  isLoading.value = true;
  try {
    const container = getAppContainer();
    tasks.value = await container.taskRepo.listAll();
  } catch (err) {
    console.error('Error loading tasks:', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadTasks();
});

const todayDateStr = computed(() => new Date().toISOString().slice(0, 10));

function isTaskOverdue(dueDate: string): boolean {
  return dueDate.slice(0, 10) < todayDateStr.value;
}

const filteredTasks = computed(() => {
  const today = todayDateStr.value;

  switch (activeTab.value) {
    case 'today':
      return tasks.value.filter(
        (t) => !t.isCompleted() && t.dueDate.slice(0, 10) === today
      );
    case 'overdue':
      return tasks.value.filter(
        (t) => !t.isCompleted() && t.dueDate.slice(0, 10) < today
      );
    case 'upcoming':
      return tasks.value.filter(
        (t) => !t.isCompleted() && t.dueDate.slice(0, 10) > today
      );
    case 'completed':
      return tasks.value.filter((t) => t.isCompleted());
    case 'all':
    default:
      return tasks.value;
  }
});

function getTabCount(tabKey: string): number {
  const today = todayDateStr.value;
  switch (tabKey) {
    case 'today':
      return tasks.value.filter(
        (t) => !t.isCompleted() && t.dueDate.slice(0, 10) === today
      ).length;
    case 'overdue':
      return tasks.value.filter(
        (t) => !t.isCompleted() && t.dueDate.slice(0, 10) < today
      ).length;
    case 'upcoming':
      return tasks.value.filter(
        (t) => !t.isCompleted() && t.dueDate.slice(0, 10) > today
      ).length;
    case 'completed':
      return tasks.value.filter((t) => t.isCompleted()).length;
    default:
      return 0;
  }
}

async function toggleTaskComplete(task: Task) {
  const container = getAppContainer();
  if (task.isCompleted()) {
    task.reopen();
    await container.taskRepo.save(task);
  } else {
    await container.completeTaskUseCase.execute({ id: task.id });
  }
  await loadTasks();
}

function openCreateModal() {
  newTask.value = {
    title: '',
    description: '',
    dueDate: new Date().toISOString().slice(0, 10),
    priority: 'normal'
  };
  createError.value = '';
  showCreateModal.value = true;
}

async function submitCreateTask() {
  createError.value = '';
  isSubmitting.value = true;
  try {
    const container = getAppContainer();
    const res = await container.createTaskUseCase.execute({
      title: newTask.value.title,
      description: newTask.value.description,
      dueDate: newTask.value.dueDate || '',
      priority: newTask.value.priority
    });

    if (!res.success) {
      createError.value = res.error;
      return;
    }

    showCreateModal.value = false;
    await loadTasks();
  } catch (err) {
    createError.value = String(err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
