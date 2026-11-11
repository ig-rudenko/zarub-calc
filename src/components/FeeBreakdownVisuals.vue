<script setup lang="ts">
import { computed } from 'vue';
import type { ComparisonSummary } from '../types/calculator';
import { formatNumber, formatRub } from '../utils/calculator';

const props = defineProps<{
  summary: ComparisonSummary;
}>();

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const sbpSegments = computed(() => {
  const total = props.summary.sbp.totalRub;
  if (total <= 0) {
    return {
      usefulPct: 0,
      explicitFeePct: 0,
      spreadPct: 0,
      usefulDash: `0 ${CIRCUMFERENCE}`,
      explicitFeeDash: `0 ${CIRCUMFERENCE}`,
      explicitFeeOffset: 0,
      spreadDash: `0 ${CIRCUMFERENCE}`,
      spreadOffset: 0,
    };
  }
  const usefulPct = Math.max(0, Math.min(100, (props.summary.sbp.usefulValueRub / total) * 100));
  const explicitFeePct = Math.max(
    0,
    Math.min(100 - usefulPct, (props.summary.sbp.explicitFeesRub / total) * 100),
  );
  const spreadPct = Math.max(0, 100 - usefulPct - explicitFeePct);

  const usefulLen = (usefulPct / 100) * CIRCUMFERENCE;
  const explicitFeeLen = (explicitFeePct / 100) * CIRCUMFERENCE;
  const spreadLen = (spreadPct / 100) * CIRCUMFERENCE;

  return {
    usefulPct,
    explicitFeePct,
    spreadPct,
    usefulDash: `${usefulLen} ${CIRCUMFERENCE}`,
    explicitFeeDash: `${explicitFeeLen} ${CIRCUMFERENCE}`,
    explicitFeeOffset: -usefulLen,
    spreadDash: `${spreadLen} ${CIRCUMFERENCE}`,
    spreadOffset: -(usefulLen + explicitFeeLen),
  };
});

const wbSegments = computed(() => {
  const total = props.summary.whitebird.totalRub;
  if (total <= 0) {
    return {
      usefulPct: 0,
      wbFeePct: 0,
      networkFeePct: 0,
      zarubFeePct: 0,
      usefulDash: `0 ${CIRCUMFERENCE}`,
      wbFeeDash: `0 ${CIRCUMFERENCE}`,
      wbFeeOffset: 0,
      networkAndZarubDash: `0 ${CIRCUMFERENCE}`,
      networkAndZarubOffset: 0,
    };
  }
  const wb = props.summary.whitebird;
  const usefulPct = Math.max(0, Math.min(100, (wb.usefulValueRub / total) * 100));
  const wbFeePct = Math.max(
    0,
    Math.min(100 - usefulPct, (wb.whitebirdServiceFeeRub / total) * 100),
  );
  const networkFeePct = Math.max(0, (wb.blockchainNetworkFeeRub / total) * 100);
  const zarubFeePct = Math.max(0, ((wb.zarubCryptoFeeRub + wb.cardTransferFeeRub) / total) * 100);
  const networkAndZarubPct = Math.max(0, 100 - usefulPct - wbFeePct);

  const usefulLen = (usefulPct / 100) * CIRCUMFERENCE;
  const wbFeeLen = (wbFeePct / 100) * CIRCUMFERENCE;
  const networkAndZarubLen = (networkAndZarubPct / 100) * CIRCUMFERENCE;

  return {
    usefulPct,
    wbFeePct,
    networkFeePct,
    zarubFeePct,
    usefulDash: `${usefulLen} ${CIRCUMFERENCE}`,
    wbFeeDash: `${wbFeeLen} ${CIRCUMFERENCE}`,
    wbFeeOffset: -usefulLen,
    networkAndZarubDash: `${networkAndZarubLen} ${CIRCUMFERENCE}`,
    networkAndZarubOffset: -(usefulLen + wbFeeLen),
  };
});
</script>

<template>
  <section
    id="visual-breakdown"
    aria-label="Визуализация структуры комиссий"
    class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6"
  >
    <div class="pb-5 border-b border-slate-200 dark:border-slate-800">
      <h2 class="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
        02. Диаграмма распределения средств и потерь на комиссиях
      </h2>
      <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        Наглядное соотношение полезной суммы, доходящей до карты Visa, и суммарных издержек каждого
        способа
      </p>
    </div>

    <!-- Круговые диаграммы (Donut) + Линейные шкалы для обоих вариантов -->
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Визуализация Способа 1 (Zarub СБП) -->
      <div class="space-y-5">
        <div class="flex items-center gap-5">
          <!-- Кольцевая SVG диаграмма с 3 сегментами: Зелёный (полезная), Оранжевый (комиссии СБП + карта), Красный (переплата за курс) -->
          <div class="relative h-32 w-32 shrink-0">
            <svg class="h-full w-full -rotate-90" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                :r="RADIUS"
                fill="none"
                stroke="currentColor"
                stroke-width="14"
                class="text-slate-100 dark:text-slate-800"
              />
              <!-- Зелёный: полезная ценность на карте -->
              <circle
                cx="70"
                cy="70"
                :r="RADIUS"
                fill="none"
                stroke="currentColor"
                stroke-width="14"
                :stroke-dasharray="sbpSegments.usefulDash"
                stroke-dashoffset="0"
                class="text-emerald-500 transition-all duration-200"
              />
              <!-- Оранжевый: комиссии СБП (7%) + карта (1.5%) -->
              <circle
                cx="70"
                cy="70"
                :r="RADIUS"
                fill="none"
                stroke="currentColor"
                stroke-width="14"
                :stroke-dasharray="sbpSegments.explicitFeeDash"
                :stroke-dashoffset="sbpSegments.explicitFeeOffset"
                class="text-amber-500 transition-all duration-200"
              />
              <!-- Красный: переплата за внутренний курс USD -->
              <circle
                cx="70"
                cy="70"
                :r="RADIUS"
                fill="none"
                stroke="currentColor"
                stroke-width="14"
                :stroke-dasharray="sbpSegments.spreadDash"
                :stroke-dashoffset="sbpSegments.spreadOffset"
                class="text-rose-500 transition-all duration-200"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span class="text-[11px] text-slate-500 dark:text-slate-400">Потери</span>
              <span
                class="font-mono text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400"
              >
                {{ formatNumber(summary.sbp.totalLossPercent, 1) }}%
              </span>
            </div>
          </div>

          <div class="space-y-1.5 text-xs">
            <div class="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              Способ 1 · Zarub СБП напрямую
            </div>
            <div class="text-slate-600 dark:text-slate-400">
              Полезная ценность на карте:
              <span
                class="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
              >
                {{ formatRub(summary.sbp.usefulValueRub) }} ({{
                  formatNumber(sbpSegments.usefulPct, 1)
                }}%)
              </span>
            </div>
            <div class="text-slate-600 dark:text-slate-400">
              Комиссии СБП (7%) + карта (1.5%):
              <span class="font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                {{ formatRub(summary.sbp.explicitFeesRub) }} ({{
                  formatNumber(sbpSegments.explicitFeePct, 1)
                }}%)
              </span>
            </div>
            <div class="text-slate-600 dark:text-slate-400">
              Переплата за внутренний курс USD:
              <span class="font-mono font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                {{ formatRub(summary.sbp.spreadCostRub) }} ({{
                  formatNumber(sbpSegments.spreadPct, 1)
                }}%)
              </span>
            </div>
          </div>
        </div>

        <!-- Линейная полоса структуры расходов Способа 1 -->
        <div class="space-y-1.5">
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Линейная шкала удержаний (Способ 1)</span>
            <span class="font-mono tabular-nums">Итого: {{ formatRub(summary.sbp.totalRub) }}</span>
          </div>
          <div class="h-3.5 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800 flex">
            <div
              class="bg-emerald-500 h-full transition-all duration-200"
              :style="{ width: `${sbpSegments.usefulPct}%` }"
              title="Полезная сумма на карте Visa"
            />
            <div
              class="bg-amber-500 h-full transition-all duration-200"
              :style="{ width: `${sbpSegments.explicitFeePct}%` }"
              title="Прямые комиссии СБП 7% + 1.5% карта"
            />
            <div
              class="bg-rose-500 h-full transition-all duration-200"
              :style="{ width: `${sbpSegments.spreadPct}%` }"
              title="Курсовая разница внутреннего курса Zarub"
            />
          </div>
        </div>
      </div>

      <!-- Визуализация Способа 2 (Whitebird.io + Крипта) -->
      <div class="space-y-5">
        <div class="flex items-center gap-5">
          <!-- Кольцевая SVG диаграмма с 3 сегментами: Зелёный (полезная), Оранжевый (комиссия Whitebird), Синий (сеть блокчейна + Zarub) -->
          <div class="relative h-32 w-32 shrink-0">
            <svg class="h-full w-full -rotate-90" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                :r="RADIUS"
                fill="none"
                stroke="currentColor"
                stroke-width="14"
                class="text-slate-100 dark:text-slate-800"
              />
              <!-- Зелёный: полезная ценность на карте -->
              <circle
                cx="70"
                cy="70"
                :r="RADIUS"
                fill="none"
                stroke="currentColor"
                stroke-width="14"
                :stroke-dasharray="wbSegments.usefulDash"
                stroke-dashoffset="0"
                class="text-emerald-500 transition-all duration-200"
              />
              <!-- Оранжевый: комиссия сервиса Whitebird (2.5%) -->
              <circle
                cx="70"
                cy="70"
                :r="RADIUS"
                fill="none"
                stroke="currentColor"
                stroke-width="14"
                :stroke-dasharray="wbSegments.wbFeeDash"
                :stroke-dashoffset="wbSegments.wbFeeOffset"
                class="text-amber-500 transition-all duration-200"
              />
              <!-- Синий: сеть блокчейна + Zarub (3% ceil + 1.5%) -->
              <circle
                cx="70"
                cy="70"
                :r="RADIUS"
                fill="none"
                stroke="currentColor"
                stroke-width="14"
                :stroke-dasharray="wbSegments.networkAndZarubDash"
                :stroke-dashoffset="wbSegments.networkAndZarubOffset"
                class="text-blue-500 transition-all duration-200"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span class="text-[11px] text-slate-500 dark:text-slate-400">Комиссии</span>
              <span
                class="font-mono text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400"
              >
                {{ formatNumber(summary.whitebird.totalLossPercent, 1) }}%
              </span>
            </div>
          </div>

          <div class="space-y-1.5 text-xs">
            <div class="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              Способ 2 · Через Whitebird.io (Крипта)
            </div>
            <div class="text-slate-600 dark:text-slate-400">
              Полезная ценность на карте:
              <span
                class="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
              >
                {{ formatRub(summary.whitebird.usefulValueRub) }} ({{
                  formatNumber(wbSegments.usefulPct, 1)
                }}%)
              </span>
            </div>
            <div class="text-slate-600 dark:text-slate-400">
              Комиссия сервиса Whitebird (2.5%):
              <span class="font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                {{ formatRub(summary.whitebird.whitebirdServiceFeeRub) }} ({{
                  formatNumber(wbSegments.wbFeePct, 1)
                }}%)
              </span>
            </div>
            <div class="text-slate-600 dark:text-slate-400">
              Сеть блокчейна + Zarub (крипта + 1.5% карта):
              <span class="font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                {{
                  formatRub(
                    Math.max(
                      0,
                      summary.whitebird.totalCommissionRubEquivalent -
                        summary.whitebird.whitebirdServiceFeeRub,
                    ),
                  )
                }}
                ({{
                  formatNumber(Math.max(0, 100 - wbSegments.usefulPct - wbSegments.wbFeePct), 1)
                }}%)
              </span>
            </div>
          </div>
        </div>

        <!-- Линейная полоса структуры расходов Способа 2 -->
        <div class="space-y-1.5">
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Линейная шкала удержаний (Способ 2)</span>
            <span class="font-mono tabular-nums"
              >Итого: {{ formatRub(summary.whitebird.totalRub) }}</span
            >
          </div>
          <div class="h-3.5 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800 flex">
            <div
              class="bg-emerald-500 h-full transition-all duration-200"
              :style="{ width: `${wbSegments.usefulPct}%` }"
              title="Полезная сумма на карте Visa"
            />
            <div
              class="bg-amber-500 h-full transition-all duration-200"
              :style="{ width: `${wbSegments.wbFeePct}%` }"
              title="Комиссия сервиса Whitebird"
            />
            <div
              class="bg-blue-500 h-full transition-all duration-200"
              :style="{
                width: `${Math.max(0, 100 - wbSegments.usefulPct - wbSegments.wbFeePct)}%`,
              }"
              title="Сеть блокчейн + комиссии Zarub (крипта + 1.5% карта)"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
