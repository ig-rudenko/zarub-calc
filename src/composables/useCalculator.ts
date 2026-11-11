import { computed, onMounted, reactive, ref, watch } from 'vue';
import type {
  CalculationMode,
  CalculatorParams,
  CryptoAssetId,
  RateHistoryKey,
  RateHistoryMap,
} from '../types/calculator';
import { compareRoutes, CRYPTO_ASSETS, DEFAULT_CALCULATOR_PARAMS } from '../utils/calculator';

const STORAGE_KEY = 'zarub_calc_params_v3';
const THEME_STORAGE_KEY = 'zarub_calc_theme_v1';
const RATE_HISTORY_STORAGE_KEY = 'zarub_calc_rate_history_v1';

const MAX_HISTORY_PER_KEY = 30;

function createInitialRateHistory(): RateHistoryMap {
  const nowIso = new Date().toISOString();
  return {
    zarubUsdRate: [
      { id: 'init-zarub-usd', value: DEFAULT_CALCULATOR_PARAMS.zarubUsdRate, timestamp: nowIso },
    ],
    whitebirdUsdtRate: [
      {
        id: 'init-wb-usdt',
        value: DEFAULT_CALCULATOR_PARAMS.whitebirdUsdtRate,
        timestamp: nowIso,
      },
    ],
    zarubTrxUsdRate: [
      {
        id: 'init-zarub-trx',
        value: DEFAULT_CALCULATOR_PARAMS.zarubTrxUsdRate,
        timestamp: nowIso,
      },
    ],
    zarubGramUsdRate: [
      {
        id: 'init-zarub-gram',
        value: DEFAULT_CALCULATOR_PARAMS.zarubGramUsdRate,
        timestamp: nowIso,
      },
    ],
  };
}

export function useCalculator() {
  const params = reactive<CalculatorParams>({ ...DEFAULT_CALCULATOR_PARAMS });
  const isDark = ref<boolean>(false);
  const isLoadingRate = ref<boolean>(false);
  const rateSourceNote = ref<string>('');
  const lastUpdatedTime = ref<string>('');
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

  function recordRateHistory(key: RateHistoryKey, rawValue: number, force = false) {
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
      params.inputValue =
        currentSummary.whitebird.totalRub > 0 ? currentSummary.whitebird.totalRub : 9013.92;
    } else if (newMode === 'card_usd' && params.mode === 'budget_rub') {
      params.inputValue =
        currentSummary.whitebird.finalCardUsd > 0 ? currentSummary.whitebird.finalCardUsd : 100;
    } else if (newMode === 'wallet_usd' && params.mode === 'budget_rub') {
      params.inputValue =
        currentSummary.whitebird.walletBalanceUsd > 0
          ? currentSummary.whitebird.walletBalanceUsd
          : 100;
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
    rateSourceNote.value = '';
  }

  async function fetchLiveUsdtRate() {
    if (isLoadingRate.value) return;
    isLoadingRate.value = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=rub',
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as { tether?: { rub?: number } };
      const liveRub = data?.tether?.rub;

      if (typeof liveRub === 'number' && liveRub > 30 && liveRub < 300) {
        const roundedRate = Number(liveRub.toFixed(2));
        params.whitebirdUsdtRate = roundedRate;
        recordRateHistory('whitebirdUsdtRate', roundedRate);
        const now = new Date();
        lastUpdatedTime.value = now.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        });
        rateSourceNote.value = `Рыночный курс USDT/RUB обновлён в ${lastUpdatedTime.value}`;
      } else {
        throw new Error('Invalid rate payload');
      }
    } catch {
      rateSourceNote.value =
        'Прямой API Whitebird требует авторизации — введите актуальный курс вручную';
    } finally {
      isLoadingRate.value = false;
    }
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
        // Проверяем, что сохранённый cryptoAsset входит в актуальный список
        if (parsed.cryptoAsset && !(parsed.cryptoAsset in CRYPTO_ASSETS)) {
          parsed.cryptoAsset = 'USDT_TRC20';
        }
        Object.assign(params, DEFAULT_CALCULATOR_PARAMS, parsed);
      }

      const savedHistory = localStorage.getItem(RATE_HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as Partial<RateHistoryMap>;
        const keys: RateHistoryKey[] = [
          'zarubUsdRate',
          'whitebirdUsdtRate',
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
    isLoadingRate,
    rateSourceNote,
    lastUpdatedTime,
    rateHistory,
    toggleTheme,
    setMode,
    setCryptoAsset,
    resetToDefaults,
    fetchLiveUsdtRate,
    recordRateHistory,
    deleteRateHistoryEntry,
    selectRateFromHistory,
  };
}
