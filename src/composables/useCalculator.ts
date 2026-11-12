import { computed, onMounted, reactive, ref, watch } from 'vue';
import type {
  CalculationMode,
  CalculatorParams,
  CryptoAssetId,
  RateHistoryKey,
  RateHistoryMap,
} from '../types/calculator';
import { compareRoutes, CRYPTO_ASSETS, DEFAULT_CALCULATOR_PARAMS } from '../utils/calculator';

const STORAGE_KEY = 'zarub_calc_params_v4';
const THEME_STORAGE_KEY = 'zarub_calc_theme_v1';
const RATE_HISTORY_STORAGE_KEY = 'zarub_calc_rate_history_v2';

const MAX_HISTORY_PER_KEY = 30;

function createInitialRateHistory(): RateHistoryMap {
  return {
    zarubUsdRate: [],
    whitebirdUsdtRate: [],
    whitebirdTrxRubRate: [],
    whitebirdGramRubRate: [],
    zarubTrxUsdRate: [],
    zarubGramUsdRate: [],
  };
}

export function useCalculator() {
  const params = reactive<CalculatorParams>({ ...DEFAULT_CALCULATOR_PARAMS });
  const isDark = ref<boolean>(false);
  const rateHistory = reactive<RateHistoryMap>(createInitialRateHistory());

  const summary = computed(() => compareRoutes(params));

  const cryptoOptions = computed(() => Object.values(CRYPTO_ASSETS));

  function persistRateHistory() {
    try {
      localStorage.setItem(RATE_HISTORY_STORAGE_KEY, JSON.stringify(rateHistory));
    } catch {
      // Игнорируем ошибки записи в localStorage
    }
  }

  function recordRateHistory(
    key: RateHistoryKey,
    rawValue: number | null | undefined,
    force = false,
  ) {
    const cleanValue = Number(rawValue);
    if (!Number.isFinite(cleanValue) || cleanValue <= 0) return;

    const list = rateHistory[key];
    const lastEntry = list.length > 0 ? list[list.length - 1] : null;
    if (!force && lastEntry && Math.abs(lastEntry.value - cleanValue) < 0.0001) {
      return;
    }

    list.push({
      id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      value: cleanValue,
      timestamp: new Date().toISOString(),
    });

    if (list.length > MAX_HISTORY_PER_KEY) {
      list.splice(0, list.length - MAX_HISTORY_PER_KEY);
    }

    persistRateHistory();
  }

  function deleteRateHistoryEntry(key: RateHistoryKey, entryId: string) {
    const list = rateHistory[key];
    const index = list.findIndex((item) => item.id === entryId);
    if (index !== -1) {
      list.splice(index, 1);
      persistRateHistory();
    }
  }

  function selectRateFromHistory(key: RateHistoryKey, value: number) {
    if (!Number.isFinite(value) || value <= 0) return;
    params[key] = value;
  }

  function applyThemeToDom(dark: boolean) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value;
    applyThemeToDom(isDark.value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark.value ? 'dark' : 'light');
    } catch {
      // Игнорируем ошибки доступа к localStorage
    }
  }

  function setMode(newMode: CalculationMode) {
    if (params.mode === newMode) return;
    const currentSummary = summary.value;

    if (newMode === 'budget_rub' && params.mode !== 'budget_rub') {
      if (currentSummary.whitebird.totalRub > 0) {
        params.inputValue = currentSummary.whitebird.totalRub;
      } else if (currentSummary.sbp.totalRub > 0) {
        params.inputValue = currentSummary.sbp.totalRub;
      } else {
        params.inputValue = 10000;
      }
    } else if (newMode === 'card_usd' && params.mode === 'budget_rub') {
      if (currentSummary.whitebird.finalCardUsd > 0) {
        params.inputValue = currentSummary.whitebird.finalCardUsd;
      } else if (currentSummary.sbp.finalCardUsd > 0) {
        params.inputValue = currentSummary.sbp.finalCardUsd;
      } else {
        params.inputValue = 100;
      }
    } else if (newMode === 'wallet_usd' && params.mode === 'budget_rub') {
      if (currentSummary.whitebird.walletBalanceUsd > 0) {
        params.inputValue = currentSummary.whitebird.walletBalanceUsd;
      } else if (currentSummary.sbp.walletBalanceUsd > 0) {
        params.inputValue = currentSummary.sbp.walletBalanceUsd;
      } else {
        params.inputValue = 100;
      }
    }

    params.mode = newMode;
  }

  function setCryptoAsset(assetId: CryptoAssetId) {
    const meta = CRYPTO_ASSETS[assetId];
    if (!meta) return;
    params.cryptoAsset = assetId;
    params.zarubCryptoFeePercent = meta.zarubFeePercent;
    params.zarubCryptoMinFeeUsd = meta.zarubMinFeeUsd;
    params.whitebirdFeePercent = meta.defaultWhitebirdFeePercent;
    params.whitebirdNetworkFeeUsdt = meta.defaultNetworkFeeCrypto;
  }

  function resetToDefaults() {
    Object.assign(params, DEFAULT_CALCULATOR_PARAMS);
  }

  onMounted(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        isDark.value = savedTheme === 'dark';
      } else if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ) {
        isDark.value = true;
      }
      applyThemeToDom(isDark.value);

      const savedParams = localStorage.getItem(STORAGE_KEY);
      if (savedParams) {
        const parsed = JSON.parse(savedParams) as Partial<CalculatorParams>;
        if (parsed.cryptoAsset && !(parsed.cryptoAsset in CRYPTO_ASSETS)) {
          parsed.cryptoAsset = 'GRAM';
        }
        Object.assign(params, DEFAULT_CALCULATOR_PARAMS, parsed);
      }

      const savedHistory = localStorage.getItem(RATE_HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as Partial<RateHistoryMap>;
        const keys: RateHistoryKey[] = [
          'zarubUsdRate',
          'whitebirdUsdtRate',
          'whitebirdTrxRubRate',
          'whitebirdGramRubRate',
          'zarubTrxUsdRate',
          'zarubGramUsdRate',
        ];
        for (const k of keys) {
          if (Array.isArray(parsedHistory[k])) {
            rateHistory[k] = parsedHistory[k];
          }
        }
      } else {
        persistRateHistory();
      }
    } catch {
      applyThemeToDom(isDark.value);
    }
  });

  watch(
    () => ({ ...params }),
    (newParams) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newParams));
      } catch {
        // Игнорируем ошибки записи
      }
    },
    { deep: true },
  );

  return {
    params,
    summary,
    cryptoOptions,
    isDark,
    rateHistory,
    toggleTheme,
    setMode,
    setCryptoAsset,
    resetToDefaults,
    recordRateHistory,
    deleteRateHistoryEntry,
    selectRateFromHistory,
  };
}
