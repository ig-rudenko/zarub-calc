<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  CreditCard,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Wallet,
  Banknote,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next';
import type {
  CalculationMode,
  CalculatorParams,
  CryptoAssetId,
  CryptoAssetOption,
  RateHistoryKey,
  RateHistoryMap,
} from '../types/calculator';
import { CRYPTO_ASSETS, formatNumber } from '../utils/calculator';
import CryptoNetworkIcon from './CryptoNetworkIcon.vue';
import WhitebirdIcon from './WhitebirdIcon.vue';
import RateHistoryPopover from './RateHistoryPopover.vue';

const props = defineProps<{
  params: CalculatorParams;
  cryptoOptions: CryptoAssetOption[];
  isLoadingRate: boolean;
  rateSourceNote: string;
  rateHistory: RateHistoryMap;
}>();

const emit = defineEmits<{
  setMode: [mode: CalculationMode];
  setCryptoAsset: [assetId: CryptoAssetId];
  fetchLiveRate: [];
  resetDefaults: [];
  recordRate: [key: RateHistoryKey, value: number, force?: boolean];
  deleteRateEntry: [key: RateHistoryKey, id: string];
  selectRateValue: [key: RateHistoryKey, value: number];
}>();

const showAdvancedFees = ref(false);

const activeCryptoMeta = computed(
  () => CRYPTO_ASSETS[props.params.cryptoAsset] ?? CRYPTO_ASSETS.USDT_TRC20,
);

const hasExtraCoinRate = computed(
  () => props.params.cryptoAsset === 'TRX' || props.params.cryptoAsset === 'GRAM',
);

const quickAmounts = computed(() => {
  if (props.params.mode === 'budget_rub') {
    return [
      { label: '3 000 ₽', value: 3000 },
      { label: '5 000 ₽', value: 5000 },
      { label: '9 013,92 ₽', value: 9013.92 },
      { label: '15 000 ₽', value: 15000 },
      { label: '30 000 ₽', value: 30000 },
    ];
  }
  return [
    { label: '$10', value: 10 },
    { label: '$20', value: 20 },
    { label: '$50', value: 50 },
    { label: '$100', value: 100 },
  ];
});

const inputUnitLabel = computed(() => (props.params.mode === 'budget_rub' ? '₽' : '$'));

const inputLabelText = computed(() => {
  if (props.params.mode === 'card_usd') {
    return 'Сумма зачисления на карту Visa ($)';
  }
  if (props.params.mode === 'wallet_usd') {
    return 'Сумма на балансе Zarub ($)';
  }
  return 'Ваш бюджет к оплате по СБП (₽)';
});
</script>

<template>
  <section
    id="calculator"
    aria-label="Параметры расчёта перевода"
    class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6"
  >
    <!-- Верхняя часть: 3-позиционный переключатель режима -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800"
    >
      <div>
        <h2 class="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
          01. Параметры пополнения и курсы обмена
        </h2>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Выберите, от какой суммы отталкиваться: чистыми на карте Visa, на кошельке Zarub или от
          суммы в рублях
        </p>
      </div>

      <!-- Segmented control для выбора режима -->
      <div
        role="tablist"
        aria-label="Режим расчёта суммы"
        class="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 p-1"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="params.mode === 'card_usd'"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          :class="
            params.mode === 'card_usd'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          "
          @click="emit('setMode', 'card_usd')"
        >
          <CreditCard class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>На карту Visa ($)</span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="params.mode === 'wallet_usd'"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          :class="
            params.mode === 'wallet_usd'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          "
          @click="emit('setMode', 'wallet_usd')"
        >
          <Wallet class="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>На баланс Zarub ($)</span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="params.mode === 'budget_rub'"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          :class="
            params.mode === 'budget_rub'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          "
          @click="emit('setMode', 'budget_rub')"
        >
          <Banknote class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span>Бюджет в рублях (₽)</span>
        </button>
      </div>
    </div>

    <!-- Выровненная по одной горизонтали сетка полей ввода -->
    <div
      class="mt-5 grid grid-cols-1 gap-5 items-start"
      :class="hasExtraCoinRate ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'"
    >
      <!-- Колонка 1: Поле ввода целевой суммы -->
      <div class="flex flex-col">
        <div class="flex h-7 items-center justify-between gap-2 mb-2">
          <label
            for="target-amount-input"
            class="text-xs font-medium text-slate-700 dark:text-slate-300 truncate"
          >
            {{ inputLabelText }}
          </label>
        </div>

        <div class="relative">
          <input
            id="target-amount-input"
            v-model.number="params.inputValue"
            type="number"
            min="0"
            step="any"
            class="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 pr-10 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
          />
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 font-mono text-sm font-semibold text-slate-400"
          >
            {{ inputUnitLabel }}
          </span>
        </div>

        <!-- Быстрые пресеты суммы -->
        <div class="mt-2.5 flex min-h-6 flex-wrap items-center gap-1.5">
          <span class="text-xs text-slate-400 dark:text-slate-500 mr-0.5">Быстро:</span>
          <button
            v-for="preset in quickAmounts"
            :key="preset.value"
            type="button"
            class="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 font-mono text-xs font-medium tabular-nums text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            @click="params.inputValue = preset.value"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Колонка 2: Курс доллара в zarub.io (СБП) -->
      <div class="flex flex-col">
        <div class="flex h-7 items-center justify-between gap-2 mb-2">
          <label
            for="zarub-usd-rate-input"
            class="text-xs font-medium text-slate-700 dark:text-slate-300 truncate"
          >
            Курс 1 USD в Zarub.io (СБП)
          </label>
          <RateHistoryPopover
            title="Курс 1 USD в Zarub (СБП)"
            unit-label="₽"
            :current-value="params.zarubUsdRate"
            :entries="rateHistory.zarubUsdRate"
            :fraction-digits="2"
            @select-value="(val) => emit('selectRateValue', 'zarubUsdRate', val)"
            @delete-entry="(id) => emit('deleteRateEntry', 'zarubUsdRate', id)"
            @save-current="emit('recordRate', 'zarubUsdRate', params.zarubUsdRate, true)"
          />
        </div>

        <div class="relative">
          <input
            id="zarub-usd-rate-input"
            v-model.number="params.zarubUsdRate"
            type="number"
            min="1"
            step="0.01"
            class="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 pr-14 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
            @change="emit('recordRate', 'zarubUsdRate', params.zarubUsdRate)"
          />
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 font-mono text-xs font-medium text-slate-400"
          >
            ₽ / $
          </span>
        </div>
      </div>

      <!-- Колонка 3: Курс USDT в whitebird.io -->
      <div class="flex flex-col">
        <div class="flex h-7 items-center justify-between gap-2 mb-2">
          <label
            for="whitebird-usdt-rate-input"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 truncate"
          >
            <WhitebirdIcon size-class="h-4 w-4" />
            <span class="truncate">Курс 1 USDT в Whitebird.io</span>
          </label>
          <RateHistoryPopover
            title="Курс 1 USDT в Whitebird"
            unit-label="₽"
            :current-value="params.whitebirdUsdtRate"
            :entries="rateHistory.whitebirdUsdtRate"
            :fraction-digits="2"
            @select-value="(val) => emit('selectRateValue', 'whitebirdUsdtRate', val)"
            @delete-entry="(id) => emit('deleteRateEntry', 'whitebirdUsdtRate', id)"
            @save-current="emit('recordRate', 'whitebirdUsdtRate', params.whitebirdUsdtRate, true)"
          />
        </div>

        <div class="relative">
          <input
            id="whitebird-usdt-rate-input"
            v-model.number="params.whitebirdUsdtRate"
            type="number"
            min="1"
            step="0.01"
            class="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 pr-16 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
            @change="emit('recordRate', 'whitebirdUsdtRate', params.whitebirdUsdtRate)"
          />
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 font-mono text-xs font-medium text-slate-400"
          >
            ₽ / USDT
          </span>
        </div>

        <!-- Нижняя строка под курсом Whitebird (на одном уровне с быстрыми пресетами) -->
        <div class="mt-2.5 flex min-h-6 flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            :disabled="isLoadingRate"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            @click="emit('fetchLiveRate')"
          >
            <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': isLoadingRate }" />
            <span>{{ isLoadingRate ? 'Загрузка курса...' : 'Загрузить биржевой курс' }}</span>
          </button>
          <span v-if="rateSourceNote" class="text-xs text-slate-500 dark:text-slate-400">
            {{ rateSourceNote }}
          </span>
        </div>
      </div>

      <!-- Колонка 4 (условная): Курс 1 TRX или 1 GRAM в Zarub.io — строго на одной линии с остальными полями -->
      <div v-if="params.cryptoAsset === 'TRX'" class="flex flex-col">
        <div class="flex h-7 items-center justify-between gap-2 mb-2">
          <label
            for="zarub-trx-rate-input"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 truncate"
          >
            <CryptoNetworkIcon asset-id="TRX" size-class="h-4 w-4" />
            <span class="truncate">Курс 1 TRX в Zarub.io</span>
          </label>
          <RateHistoryPopover
            title="Курс 1 TRX в Zarub ($)"
            unit-label="$"
            :current-value="params.zarubTrxUsdRate"
            :entries="rateHistory.zarubTrxUsdRate"
            :fraction-digits="3"
            @select-value="(val) => emit('selectRateValue', 'zarubTrxUsdRate', val)"
            @delete-entry="(id) => emit('deleteRateEntry', 'zarubTrxUsdRate', id)"
            @save-current="emit('recordRate', 'zarubTrxUsdRate', params.zarubTrxUsdRate, true)"
          />
        </div>

        <div class="relative">
          <input
            id="zarub-trx-rate-input"
            v-model.number="params.zarubTrxUsdRate"
            type="number"
            min="0.001"
            step="0.01"
            class="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 pr-16 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
            @change="emit('recordRate', 'zarubTrxUsdRate', params.zarubTrxUsdRate)"
          />
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 font-mono text-xs font-medium text-slate-400"
          >
            $ / TRX
          </span>
        </div>
      </div>

      <div v-if="params.cryptoAsset === 'GRAM'" class="flex flex-col">
        <div class="flex h-7 items-center justify-between gap-2 mb-2">
          <label
            for="zarub-gram-rate-input"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 truncate"
          >
            <CryptoNetworkIcon asset-id="GRAM" size-class="h-4 w-4" />
            <span class="truncate">Курс 1 GRAM в Zarub.io</span>
          </label>
          <RateHistoryPopover
            title="Курс 1 GRAM в Zarub ($)"
            unit-label="$"
            :current-value="params.zarubGramUsdRate"
            :entries="rateHistory.zarubGramUsdRate"
            :fraction-digits="3"
            @select-value="(val) => emit('selectRateValue', 'zarubGramUsdRate', val)"
            @delete-entry="(id) => emit('deleteRateEntry', 'zarubGramUsdRate', id)"
            @save-current="emit('recordRate', 'zarubGramUsdRate', params.zarubGramUsdRate, true)"
          />
        </div>

        <div class="relative">
          <input
            id="zarub-gram-rate-input"
            v-model.number="params.zarubGramUsdRate"
            type="number"
            min="0.001"
            step="0.01"
            class="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 pr-20 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
            @change="emit('recordRate', 'zarubGramUsdRate', params.zarubGramUsdRate)"
          />
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 font-mono text-xs font-medium text-slate-400"
          >
            $ / GRAM
          </span>
        </div>
      </div>
    </div>

    <!-- Панель выбора криптовалюты и раскрытия настроек комиссий -->
    <div class="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-medium text-slate-600 dark:text-slate-400 mr-1">
            Криптовалюта для Способа 2:
          </span>
          <div class="inline-flex flex-wrap items-center gap-2">
            <button
              v-for="asset in cryptoOptions"
              :key="asset.id"
              type="button"
              class="inline-flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              :class="
                params.cryptoAsset === asset.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              "
              @click="emit('setCryptoAsset', asset.id)"
            >
              <CryptoNetworkIcon :asset-id="asset.id" size-class="h-5 w-5" />
              <span>{{ asset.label }} · {{ asset.zarubFeePercent }}% Zarub</span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            @click="showAdvancedFees = !showAdvancedFees"
          >
            <SlidersHorizontal class="h-3.5 w-3.5" />
            <span>Настроить комиссии и сеть</span>
            <ChevronUp v-if="showAdvancedFees" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            @click="emit('resetDefaults')"
          >
            <RotateCcw class="h-3.5 w-3.5" />
            <span>Сбросить</span>
          </button>
        </div>
      </div>

      <!-- Ровная информационная строка параметров выбранного крипто-маршрута -->
      <div
        class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400"
      >
        <span>
          Выбран маршрут
          <strong class="font-medium text-slate-700 dark:text-slate-200">{{
            activeCryptoMeta.name
          }}</strong>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Комиссия Zarub:
          <strong class="font-mono tabular-nums text-slate-700 dark:text-slate-200"
            >{{ formatNumber(params.zarubCryptoFeePercent, 0) }}%</strong
          >
          (мин. ${{ formatNumber(params.zarubCryptoMinFeeUsd, 0) }}, округление вверх)
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Сервис Whitebird:
          <strong class="font-mono tabular-nums text-slate-700 dark:text-slate-200"
            >{{ formatNumber(params.whitebirdFeePercent, 1) }}%</strong
          >
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Сеть блокчейн:
          <strong class="font-mono tabular-nums text-slate-700 dark:text-slate-200">
            {{
              params.whitebirdNetworkFeeUsdt > 0
                ? `${formatNumber(params.whitebirdNetworkFeeUsdt, params.whitebirdNetworkFeeUsdt < 1 ? 3 : 5)} ${activeCryptoMeta.symbol}`
                : `0 ${activeCryptoMeta.symbol}`
            }}
          </strong>
        </span>
      </div>
    </div>

    <!-- Раскрывающаяся панель тонкой настройки комиссий -->
    <div
      v-if="showAdvancedFees"
      class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
    >
      <div>
        <label
          for="fee-sbp-percent"
          class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
        >
          Комиссия СБП Zarub (%)
        </label>
        <input
          id="fee-sbp-percent"
          v-model.number="params.zarubSbpFeePercent"
          type="number"
          min="0"
          step="0.1"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label
          for="fee-wb-percent"
          class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
        >
          Комиссия Whitebird (%)
        </label>
        <input
          id="fee-wb-percent"
          v-model.number="params.whitebirdFeePercent"
          type="number"
          min="0"
          step="0.1"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label
          for="fee-wb-network"
          class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
        >
          Сеть блокчейн ({{ activeCryptoMeta.symbol }})
        </label>
        <input
          id="fee-wb-network"
          v-model.number="params.whitebirdNetworkFeeUsdt"
          type="number"
          min="0"
          step="0.00001"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label
          for="fee-zarub-crypto"
          class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
        >
          Крипто-ввод Zarub (%, ceil)
        </label>
        <input
          id="fee-zarub-crypto"
          v-model.number="params.zarubCryptoFeePercent"
          type="number"
          min="0"
          step="0.5"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label
          for="fee-zarub-card"
          class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
        >
          Перевод с баланса на карту (%)
        </label>
        <input
          id="fee-zarub-card"
          v-model.number="params.zarubCardTransferFeePercent"
          type="number"
          min="0"
          step="0.1"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100"
        />
      </div>
    </div>
  </section>
</template>
