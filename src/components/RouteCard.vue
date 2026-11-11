<script setup lang="ts">
import { ref } from 'vue';
import { Check, Copy, ArrowDown } from 'lucide-vue-next';
import type { CryptoAssetId, PipelineStep } from '../types/calculator';
import { formatNumber, formatRub, formatUsd } from '../utils/calculator';
import CryptoNetworkIcon from './CryptoNetworkIcon.vue';
import WhitebirdIcon from './WhitebirdIcon.vue';

defineProps<{
  title: string;
  subtitle: string;
  cryptoAsset?: CryptoAssetId;
  isWinner: boolean;
  savingsRub: number;
  totalRub: number;
  walletBalanceUsd: number;
  finalCardUsd: number;
  totalCommissionRubEquivalent: number;
  totalLossPercent: number;
  effectiveRateRubPerCardUsd: number;
  effectiveRateRubPerWalletUsd: number;
  steps: PipelineStep[];
}>();

const copiedStepId = ref<string | null>(null);

async function copyAmount(stepId: string, rawValue: string) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(rawValue);
    }
    copiedStepId.value = stepId;
    setTimeout(() => {
      if (copiedStepId.value === stepId) {
        copiedStepId.value = null;
      }
    }, 1600);
  } catch {
    copiedStepId.value = null;
  }
}
</script>

<template>
  <article
    class="rounded-xl border transition-colors p-5 sm:p-6 flex flex-col justify-between"
    :class="
      isWinner
        ? 'border-emerald-500/80 dark:border-emerald-500/70 bg-white dark:bg-slate-900'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
    "
  >
    <div>
      <!-- Заголовок маршрута и статус выгоды (чистый текст без капсульных бейджей) -->
      <div
        class="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800"
      >
        <div>
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{{ subtitle }}</span>
            <template v-if="isWinner && savingsRub > 0">
              <span aria-hidden="true">·</span>
              <span class="font-semibold text-emerald-600 dark:text-emerald-400">
                Выгоднее на {{ formatRub(savingsRub) }}
              </span>
            </template>
          </div>
          <h3
            class="mt-1 flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            <template v-if="cryptoAsset">
              <WhitebirdIcon size-class="h-5 w-5" />
              <CryptoNetworkIcon :asset-id="cryptoAsset" size-class="h-5 w-5" />
            </template>
            <span>{{ title }}</span>
          </h3>
        </div>
      </div>

      <!-- Главные итоговые цифры маршрута -->
      <div
        class="py-4 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div>
          <div class="text-xs text-slate-500 dark:text-slate-400">К оплате по факту</div>
          <div
            class="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100"
          >
            {{ formatRub(totalRub) }}
          </div>
        </div>

        <div>
          <div class="text-xs text-slate-500 dark:text-slate-400">На кошельке Zarub</div>
          <div
            class="mt-1 font-mono text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400"
          >
            {{ formatUsd(walletBalanceUsd) }}
          </div>
        </div>

        <div>
          <div class="text-xs text-slate-500 dark:text-slate-400">Чистыми на карте Visa</div>
          <div
            class="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
          >
            {{ formatUsd(finalCardUsd) }}
          </div>
        </div>
      </div>

      <!-- Пошаговый конвейер расчёта всех комиссий -->
      <div class="py-4">
        <div class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
          Пошаговая цепочка перевода и удержаний
        </div>

        <div class="divide-y divide-slate-200/80 dark:divide-slate-800/80">
          <div v-for="(step, idx) in steps" :key="step.id" class="py-3 first:pt-0 last:pb-0">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                    0{{ idx + 1 }}.
                  </span>
                  <span
                    class="text-sm font-medium"
                    :class="
                      step.isHighlight
                        ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'text-slate-900 dark:text-slate-100'
                    "
                  >
                    {{ step.title }}
                  </span>
                </div>
                <p class="pl-6 text-xs text-slate-500 dark:text-slate-400">
                  {{ step.subtitle }}
                </p>
                <p
                  v-if="step.feeFormatted"
                  class="pl-6 font-mono text-xs tabular-nums text-amber-700 dark:text-amber-400"
                >
                  {{ step.feeFormatted }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span
                  class="font-mono text-sm font-semibold tabular-nums"
                  :class="
                    step.isHighlight
                      ? 'text-emerald-600 dark:text-emerald-400 text-base font-bold'
                      : 'text-slate-900 dark:text-slate-100'
                  "
                >
                  {{ step.amountFormatted }}
                </span>

                <button
                  type="button"
                  :aria-label="`Скопировать сумму ${step.copyValue}`"
                  class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  @click="copyAmount(step.id, step.copyValue)"
                >
                  <Check
                    v-if="copiedStepId === step.id"
                    class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                  />
                  <Copy v-else class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div
              v-if="idx < steps.length - 1"
              class="pl-6 pt-2 flex items-center gap-1.5 text-slate-300 dark:text-slate-700"
              aria-hidden="true"
            >
              <ArrowDown class="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Подвал карточки: Суммарные потери и эффективный курс -->
    <div class="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
      <div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
        <span>Всего на комиссии и курсовую разницу:</span>
        <span class="font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400">
          {{ formatRub(totalCommissionRubEquivalent) }} ({{ formatNumber(totalLossPercent, 1) }}%)
        </span>
      </div>

      <div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
        <span>Реальный курс 1 $ на кошельке / на карте Visa:</span>
        <span class="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {{ formatNumber(effectiveRateRubPerWalletUsd, 2) }} ₽ ·
          {{ formatNumber(effectiveRateRubPerCardUsd, 2) }} ₽
        </span>
      </div>
    </div>
  </article>
</template>
