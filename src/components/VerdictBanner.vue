<script setup lang="ts">
import { CheckCircle2, Scale } from 'lucide-vue-next';
import type { CalculationMode, ComparisonSummary } from '../types/calculator';
import { formatNumber, formatRub, formatUsd } from '../utils/calculator';

defineProps<{
  summary: ComparisonSummary;
  mode: CalculationMode;
}>();
</script>

<template>
  <section
    aria-label="Итоговое сравнение выгоды"
    class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6"
  >
    <div class="space-y-2">
      <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Сравнение двух способов пополнения карты Visa в zarub.io</span>
        <span aria-hidden="true">·</span>
        <span>Учтена комиссия 1.5% за вывод с баланса на карту</span>
      </div>

      <div v-if="summary.cheaperMethod !== 'equal'" class="flex items-start gap-3 pt-1">
        <CheckCircle2 class="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            <template v-if="summary.cheaperMethod === 'whitebird_crypto'">
              Через Whitebird.io (Крипта) выгоднее на
              <span class="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {{ formatRub(summary.savingsRub) }}
              </span>
            </template>
            <template v-else>
              Напрямую через СБП в Zarub выгоднее на
              <span class="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {{ formatRub(summary.savingsRub) }}
              </span>
            </template>
            <span
              class="ml-1.5 font-mono tabular-nums text-base font-semibold text-slate-500 dark:text-slate-400"
            >
              ({{ formatNumber(summary.savingsPercent, 1) }}%)
            </span>
          </h2>

          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
            <template v-if="mode === 'budget_rub'">
              При бюджете
              <span class="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                {{ formatRub(summary.whitebird.totalRub) }}
              </span>
              вы получите на карту Visa на
              <span
                class="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400"
              >
                {{ formatUsd(summary.extraCardUsd) }}
              </span>
              больше ({{ formatUsd(summary.whitebird.finalCardUsd) }} против
              {{ formatUsd(summary.sbp.finalCardUsd) }}).
            </template>
            <template v-else>
              Чтобы получить
              <span class="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                {{ formatUsd(summary.whitebird.finalCardUsd) }}
              </span>
              на карту Visa ({{ formatUsd(summary.whitebird.walletBalanceUsd) }} на кошельке Zarub),
              вы заплатите
              <span
                class="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400"
              >
                {{
                  formatRub(
                    summary.cheaperMethod === 'whitebird_crypto'
                      ? summary.whitebird.totalRub
                      : summary.sbp.totalRub,
                  )
                }}
              </span>
              вместо
              <span class="font-mono tabular-nums text-slate-500 dark:text-slate-400 line-through">
                {{
                  formatRub(
                    summary.cheaperMethod === 'whitebird_crypto'
                      ? summary.sbp.totalRub
                      : summary.whitebird.totalRub,
                  )
                }}
              </span>
              .
            </template>
          </p>
        </div>
      </div>

      <div v-else class="flex items-center gap-3 pt-1">
        <Scale class="h-6 w-6 text-slate-400 shrink-0" />
        <h2 class="font-display text-lg font-semibold text-slate-700 dark:text-slate-300">
          Введите сумму пополнения для расчёта и сравнения маршрутов
        </h2>
      </div>
    </div>
  </section>
</template>
