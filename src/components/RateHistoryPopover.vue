<script setup lang="ts">
import { computed, ref } from 'vue';
import { History, Plus, Trash2, TrendingDown, TrendingUp, X } from 'lucide-vue-next';
import type { RateHistoryEntry } from '../types/calculator';
import { formatNumber } from '../utils/calculator';

const props = withDefaults(
  defineProps<{
    title: string;
    unitLabel: string;
    currentValue: number | null | undefined;
    entries: RateHistoryEntry[];
    fractionDigits?: number;
  }>(),
  {
    fractionDigits: 4,
  },
);

const emit = defineEmits<{
  selectValue: [value: number];
  deleteEntry: [id: string];
  saveCurrent: [];
}>();

const isOpen = ref(false);

function formatRateValue(val: number): string {
  if (!Number.isFinite(val)) return '0,00';
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: props.fractionDigits,
  }).format(val);
}

/** Список записей от новых к старым с расчётом дельты к предыдущему значению */
const enrichedEntries = computed(() => {
  // entries хранятся в хронологическом порядке (от старых к новым)
  const chronological = props.entries;
  return chronological
    .map((entry, idx) => {
      const prev = idx > 0 ? chronological[idx - 1] : null;
      const delta = prev ? Number((entry.value - prev.value).toFixed(4)) : 0;
      const dateObj = new Date(entry.timestamp);
      const formattedTime = Number.isNaN(dateObj.getTime())
        ? entry.timestamp
        : dateObj.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
      return {
        ...entry,
        delta,
        formattedTime,
      };
    })
    .reverse();
});

/** Координаты для SVG-графика динамики курса */
const chartPoints = computed(() => {
  const list = props.entries;
  if (list.length < 2) return null;

  const values = list.map((e) => e.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const width = 240;
  const height = 48;
  const padX = 8;
  const padY = 8;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  const coords = list.map((entry, i) => {
    const x = padX + (i / (list.length - 1)) * usableW;
    const normalizedY = maxVal === minVal ? 0.5 : (entry.value - minVal) / range;
    const y = padY + usableH - normalizedY * usableH;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), value: entry.value };
  });

  const polyline = coords.map((p) => `${p.x},${p.y}`).join(' ');
  const firstVal = list[0].value;
  const lastVal = list[list.length - 1].value;
  const totalDelta = Number((lastVal - firstVal).toFixed(4));

  return {
    coords,
    polyline,
    minVal,
    maxVal,
    totalDelta,
  };
});

function handlePick(val: number) {
  emit('selectValue', val);
  isOpen.value = false;
}
</script>

<template>
  <div class="relative inline-block">
    <button
      type="button"
      class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      :title="`История и динамика: ${title}`"
      @click="isOpen = !isOpen"
    >
      <History class="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
      <span>История ({{ entries.length }})</span>
    </button>

    <!-- Выпадающее окно истории и динамики курса -->
    <div
      v-if="isOpen"
      class="absolute right-0 z-40 mt-1.5 w-76 sm:w-84 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 shadow-lg space-y-3"
    >
      <div
        class="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800"
      >
        <span class="font-display text-xs font-semibold text-slate-900 dark:text-slate-100">
          {{ title }}
        </span>
        <div class="flex items-center gap-1.5">
          <button
            v-if="typeof currentValue === 'number' && currentValue > 0"
            type="button"
            class="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Сохранить текущее значение в историю"
            @click="emit('saveCurrent')"
          >
            <Plus class="h-3 w-3" />
            <span>Записать {{ formatRateValue(currentValue) }}</span>
          </button>
          <button
            type="button"
            aria-label="Закрыть историю курса"
            class="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            @click="isOpen = false"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <!-- Мини-график динамики (если больше 1 записи) -->
      <div v-if="chartPoints" class="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 space-y-1.5">
        <div
          class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400"
        >
          <span>Динамика ({{ entries.length }} зап.)</span>
          <span
            class="inline-flex items-center gap-0.5 font-mono tabular-nums font-semibold"
            :class="
              chartPoints.totalDelta > 0
                ? 'text-amber-600 dark:text-amber-400'
                : chartPoints.totalDelta < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500'
            "
          >
            <TrendingUp v-if="chartPoints.totalDelta > 0" class="h-3 w-3" />
            <TrendingDown v-else-if="chartPoints.totalDelta < 0" class="h-3 w-3" />
            <span>
              {{ chartPoints.totalDelta > 0 ? '+' : ''
              }}{{ formatNumber(chartPoints.totalDelta, fractionDigits) }} {{ unitLabel }}
            </span>
          </span>
        </div>

        <svg viewBox="0 0 240 48" class="w-full h-12 overflow-visible">
          <polyline
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="chartPoints.polyline"
            class="text-blue-600 dark:text-blue-400"
          />
          <circle
            v-for="(pt, idx) in chartPoints.coords"
            :key="idx"
            :cx="pt.x"
            :cy="pt.y"
            r="3"
            class="fill-blue-600 dark:fill-blue-400"
          />
        </svg>

        <div class="flex justify-between font-mono text-[10px] tabular-nums text-slate-400">
          <span>Мин: {{ formatNumber(chartPoints.minVal, fractionDigits) }}</span>
          <span>Макс: {{ formatNumber(chartPoints.maxVal, fractionDigits) }}</span>
        </div>
      </div>

      <!-- Список сохранённых значений -->
      <div
        v-if="enrichedEntries.length > 0"
        class="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80"
      >
        <div
          v-for="item in enrichedEntries"
          :key="item.id"
          class="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 text-xs"
        >
          <button
            type="button"
            class="flex-1 text-left group flex items-center justify-between pr-2 cursor-pointer"
            @click="handlePick(item.value)"
          >
            <div>
              <span
                class="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              >
                {{ formatNumber(item.value, fractionDigits) }} {{ unitLabel }}
              </span>
              <span
                v-if="item.delta !== 0"
                class="ml-1.5 font-mono text-[11px] tabular-nums"
                :class="
                  item.delta > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                "
              >
                ({{ item.delta > 0 ? '+' : '' }}{{ formatNumber(item.delta, fractionDigits) }})
              </span>
            </div>
            <span class="font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
              {{ item.formattedTime }}
            </span>
          </button>

          <button
            type="button"
            :aria-label="`Удалить значение ${item.value} из истории`"
            class="rounded-md p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
            title="Удалить запись"
            @click.stop="emit('deleteEntry', item.id)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div v-else class="py-3 text-center text-xs text-slate-400 dark:text-slate-500">
        История пуста. Измените курс или нажмите «Записать».
      </div>
    </div>
  </div>
</template>
