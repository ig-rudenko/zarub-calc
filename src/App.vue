<script setup lang="ts">
import TopHeader from './components/TopHeader.vue';
import VerdictBanner from './components/VerdictBanner.vue';
import CalculatorControls from './components/CalculatorControls.vue';
import RouteCard from './components/RouteCard.vue';
import FeeBreakdownVisuals from './components/FeeBreakdownVisuals.vue';
import { useCalculator } from './composables/useCalculator';

const {
  params,
  summary,
  cryptoOptions,
  isDark,
  isLoadingRate,
  rateSourceNote,
  rateHistory,
  toggleTheme,
  setMode,
  setCryptoAsset,
  resetToDefaults,
  fetchLiveUsdtRate,
  recordRateHistory,
  deleteRateHistoryEntry,
  selectRateFromHistory,
} = useCalculator();
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors"
  >
    <!-- Верхняя навигационная панель по контракту 3 зон -->
    <TopHeader :is-dark="isDark" @toggle-theme="toggleTheme" />

    <!-- Основной контейнер страницы (1280px max-w-7xl) -->
    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <!-- Заголовок страницы -->
      <div class="space-y-1.5">
        <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Инженерный финансовый калькулятор</span>
          <span aria-hidden="true">·</span>
          <span>RUB → Баланс Zarub.io → Карта Visa</span>
        </div>
        <h1
          class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Расчёт стоимости пополнения карты Visa в zarub.io
        </h1>
      </div>

      <!-- Сводный вердикт выгоды -->
      <VerdictBanner :summary="summary" :mode="params.mode" />

      <!-- Панель управления суммой, режимом, курсами и их историей -->
      <CalculatorControls
        :params="params"
        :crypto-options="cryptoOptions"
        :is-loading-rate="isLoadingRate"
        :rate-source-note="rateSourceNote"
        :rate-history="rateHistory"
        @set-mode="setMode"
        @set-crypto-asset="setCryptoAsset"
        @fetch-live-rate="fetchLiveUsdtRate"
        @reset-defaults="resetToDefaults"
        @record-rate="recordRateHistory"
        @delete-rate-entry="deleteRateHistoryEntry"
        @select-rate-value="selectRateFromHistory"
      />

      <!-- Сравнение двух маршрутов бок о бок -->
      <section id="routes" aria-label="Детальное сравнение маршрутов перевода">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <RouteCard
            :title="summary.sbp.title"
            subtitle="Прямое пополнение рублями по СБП внутри сервиса"
            :is-winner="summary.cheaperMethod === 'zarub_sbp'"
            :savings-rub="summary.cheaperMethod === 'zarub_sbp' ? summary.savingsRub : 0"
            :total-rub="summary.sbp.totalRub"
            :wallet-balance-usd="summary.sbp.walletBalanceUsd"
            :final-card-usd="summary.sbp.finalCardUsd"
            :total-commission-rub-equivalent="summary.sbp.totalCommissionRubEquivalent"
            :total-loss-percent="summary.sbp.totalLossPercent"
            :effective-rate-rub-per-card-usd="summary.sbp.effectiveRateRubPerCardUsd"
            :effective-rate-rub-per-wallet-usd="summary.sbp.effectiveRateRubPerWalletUsd"
            :steps="summary.sbp.steps"
          />

          <RouteCard
            :title="summary.whitebird.title"
            subtitle="Покупка крипты за рубли по СБП с выводом на внешний адрес Zarub"
            :crypto-asset="params.cryptoAsset"
            :is-winner="summary.cheaperMethod === 'whitebird_crypto'"
            :savings-rub="summary.cheaperMethod === 'whitebird_crypto' ? summary.savingsRub : 0"
            :total-rub="summary.whitebird.totalRub"
            :wallet-balance-usd="summary.whitebird.walletBalanceUsd"
            :final-card-usd="summary.whitebird.finalCardUsd"
            :total-commission-rub-equivalent="summary.whitebird.totalCommissionRubEquivalent"
            :total-loss-percent="summary.whitebird.totalLossPercent"
            :effective-rate-rub-per-card-usd="summary.whitebird.effectiveRateRubPerCardUsd"
            :effective-rate-rub-per-wallet-usd="summary.whitebird.effectiveRateRubPerWalletUsd"
            :steps="summary.whitebird.steps"
          />
        </div>
      </section>

      <!-- Визуализация: Круговые диаграммы (Donut) и линейные шкалы комиссий -->
      <FeeBreakdownVisuals :summary="summary" />
    </main>

    <!-- Спокойный информационный подвал -->
    <footer
      class="mt-10 border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40"
    >
      <div
        class="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400"
      >
        <div>ZarubCalc · Расчёт маршрутов пополнения карты Visa через zarub.io и whitebird.io</div>
        <div class="flex flex-wrap items-center gap-3">
          <span>СБП Zarub: 7% (мин. 1 ₽)</span>
          <span aria-hidden="true">·</span>
          <span>Крипта Zarub: 3% (USDT TON — 5%, мин. $1, ceil)</span>
          <span aria-hidden="true">·</span>
          <span>Вывод на карту Visa: 1.5%</span>
        </div>
      </div>
    </footer>
  </div>
</template>
