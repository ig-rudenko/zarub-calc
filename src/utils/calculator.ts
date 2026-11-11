import type {
  CalculatorParams,
  ComparisonSummary,
  CryptoAssetId,
  CryptoAssetOption,
  SbpRouteResult,
  WhitebirdRouteResult,
} from '../types/calculator';

export const CRYPTO_ASSETS: Record<CryptoAssetId, CryptoAssetOption> = {
  USDT_TRC20: {
    id: 'USDT_TRC20',
    symbol: 'USDT',
    label: 'USDT · TRC-20',
    name: 'Tether USDT (TRC-20)',
    network: 'Сеть TRON (TRC‑20)',
    zarubFeePercent: 3,
    zarubMinFeeUsd: 1,
    defaultWhitebirdFeePercent: 2.5,
    defaultNetworkFeeCrypto: 2.16763,
  },
  USDT_TON: {
    id: 'USDT_TON',
    symbol: 'USDT',
    label: 'USDT · TON',
    name: 'Tether USDT (TON)',
    network: 'Сеть TON',
    zarubFeePercent: 5,
    zarubMinFeeUsd: 1,
    defaultWhitebirdFeePercent: 3.2,
    defaultNetworkFeeCrypto: 0,
  },
  TRX: {
    id: 'TRX',
    symbol: 'TRX',
    label: 'TRX · TRON',
    name: 'TRON (TRX)',
    network: 'Сеть TRON',
    zarubFeePercent: 3,
    zarubMinFeeUsd: 1,
    defaultWhitebirdFeePercent: 3.2,
    defaultNetworkFeeCrypto: 0.263,
  },
  GRAM: {
    id: 'GRAM',
    symbol: 'GRAM',
    label: 'GRAM · TON',
    name: 'GRAM',
    network: 'Сеть TON',
    zarubFeePercent: 3,
    zarubMinFeeUsd: 1,
    defaultWhitebirdFeePercent: 2.5,
    defaultNetworkFeeCrypto: 0,
  },
};

export const DEFAULT_CALCULATOR_PARAMS: CalculatorParams = {
  mode: 'card_usd',
  inputValue: 100,
  zarubUsdRate: 101.5,
  zarubSbpFeePercent: 7,
  zarubSbpMinFeeRub: 1,
  whitebirdUsdtRate: 82.37,
  whitebirdFeePercent: 2.5,
  whitebirdNetworkFeeUsdt: 0,
  cryptoAsset: 'GRAM',
  zarubTrxUsdRate: 0.28,
  zarubGramUsdRate: 0.84,
  zarubCryptoFeePercent: 3,
  zarubCryptoMinFeeUsd: 1,
  zarubCardTransferFeePercent: 1.5,
};

/** Эталонный пример пользователя из ТЗ для Whitebird.io (9 013.92 ₽ -> 104.53 USDT) */
export const WHITEBIRD_REFERENCE_EXAMPLE: Partial<CalculatorParams> = {
  mode: 'budget_rub',
  inputValue: 9013.92,
  zarubUsdRate: 101.5,
  zarubSbpFeePercent: 7,
  zarubSbpMinFeeRub: 1,
  whitebirdUsdtRate: 82.37,
  whitebirdFeePercent: 2.5,
  whitebirdNetworkFeeUsdt: 2.16763,
  cryptoAsset: 'USDT_TRC20',
  zarubTrxUsdRate: 0.28,
  zarubGramUsdRate: 0.84,
  zarubCryptoFeePercent: 3,
  zarubCryptoMinFeeUsd: 1,
  zarubCardTransferFeePercent: 1.5,
};

/** Математическое округление до 2 знаков после запятой (центы / копейки) */
function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Округление вверх до 2 знаков после запятой (чтобы при вычете % комиссии на целевом счёте никогда не было недобора в 1 цент) */
function ceil2(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(Number((value * 100).toFixed(6))) / 100;
}

/** Округление вниз до 2 знаков после запятой */
function floor2(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(Number((value * 100).toFixed(6))) / 100;
}

/** Округление до 5 знаков после запятой для сетевых комиссий блокчейна */
function round5(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100000) / 100000;
}

/**
 * Возвращает курс выбранной монеты к доллару внутри zarub.io:
 * - Для USDT (TRC-20 и TON): 1 USDT = 1 $
 * - Для TRX: params.zarubTrxUsdRate (по умолчанию 0.28 $)
 * - Для GRAM: params.zarubGramUsdRate (по умолчанию 0.84 $)
 */
function getCryptoCoinUsdRate(params: CalculatorParams): number {
  if (params.cryptoAsset === 'TRX') {
    return Math.max(0.0001, Number(params.zarubTrxUsdRate) || 0.28);
  }
  if (params.cryptoAsset === 'GRAM') {
    return Math.max(0.0001, Number(params.zarubGramUsdRate) || 0.84);
  }
  return 1;
}

/**
 * Расчёт комиссии zarub.io на пополнение криптовалютой:
 * 3% (или 5% для USDT TON), минимум 1 $, округляется ВСЕГДА в большую сторону до целого доллара.
 * Пример: при пополнении на $67 -> 3% от 67 = 2.01 -> комиссия равна $3.
 */
export function calculateZarubCryptoFee(amountUsd: number, feePercent = 3, minFeeUsd = 1): number {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return 0;
  const rawPercentageFee = Number(((amountUsd * feePercent) / 100).toFixed(6));
  const feeWithMinimum = Math.max(minFeeUsd, rawPercentageFee);
  return Math.ceil(feeWithMinimum);
}

/**
 * Расчёт необходимого баланса кошелька zarub.io для получения целевой суммы `targetCardUsd` на карте Visa.
 * При переводе с кошелька на карту удерживается 1.5% от списываемой с кошелька суммы:
 * B * (1 - 0.015) = C  =>  B = ceil2(C / (1 - 0.015)).
 * Для C = $100.00: 100 / 0.985 = 101.5228... -> $101.53 на кошельке (комиссия $1.53, на карту ровно $100.00).
 */
export function calculateBalanceNeededForCard(
  targetCardUsd: number,
  cardFeePercent = 1.5,
): { walletBalanceUsd: number; cardTransferFeeUsd: number; finalCardUsd: number } {
  if (!Number.isFinite(targetCardUsd) || targetCardUsd <= 0 || cardFeePercent >= 100) {
    return { walletBalanceUsd: 0, cardTransferFeeUsd: 0, finalCardUsd: 0 };
  }
  const finalCardUsd = round2(targetCardUsd);
  const feeRate = Math.max(0, cardFeePercent) / 100;
  const walletBalanceUsd = feeRate > 0 ? ceil2(finalCardUsd / (1 - feeRate)) : finalCardUsd;
  const cardTransferFeeUsd = round2(walletBalanceUsd - finalCardUsd);
  return { walletBalanceUsd, cardTransferFeeUsd, finalCardUsd };
}

/**
 * Прямой расчёт: сколько долларов попадёт на карту Visa с известного баланса кошелька zarub.io (`walletBalanceUsd`)
 * после удержания комиссии 1.5% от суммы на кошельке:
 * Комиссия = ceil2(B * 0.015), на карту = B - Комиссия = floor2(B * (1 - 0.015)).
 * Например: при B = $101.53 -> комиссия $1.53 -> на карту ровно $100.00.
 * При B = $100.00 -> комиссия $1.50 -> на карту ровно $98.50.
 */
export function calculateCardFromBalance(
  walletBalanceUsd: number,
  cardFeePercent = 1.5,
): { walletBalanceUsd: number; cardTransferFeeUsd: number; finalCardUsd: number } {
  if (!Number.isFinite(walletBalanceUsd) || walletBalanceUsd <= 0) {
    return { walletBalanceUsd: 0, cardTransferFeeUsd: 0, finalCardUsd: 0 };
  }
  const cleanBalance = round2(walletBalanceUsd);
  const feeRate = Math.max(0, Math.min(99.99, cardFeePercent)) / 100;
  const cardTransferFeeUsd = ceil2(cleanBalance * feeRate);
  const finalCardUsd = floor2(cleanBalance - cardTransferFeeUsd);
  return {
    walletBalanceUsd: cleanBalance,
    cardTransferFeeUsd,
    finalCardUsd,
  };
}

/**
 * Расчёт прямой конвертации в Whitebird.io из рублей в криптовалюту по СБП.
 * Точно воспроизводит эталонный пример:
 * Продаю 9 013.92 RUB -> Комиссия сервиса 225.35 RUB (2.5%) -> Курс 82.37 -> Сеть 2.16763 USDT -> Получаю 104.53 USDT.
 */
export function calculateWhitebirdFromRub(
  totalRub: number,
  rateRubPerUsdt = 82.37,
  serviceFeePercent = 2.5,
  networkFeeCoins = 2.16763,
  coinUsdRate = 1,
): {
  totalRub: number;
  serviceFeeRub: number;
  rubConverted: number;
  grossUsdt: number;
  networkFeeUsdt: number;
  usdtReceived: number;
} {
  if (!Number.isFinite(totalRub) || totalRub <= 0 || rateRubPerUsdt <= 0 || coinUsdRate <= 0) {
    return {
      totalRub: 0,
      serviceFeeRub: 0,
      rubConverted: 0,
      grossUsdt: 0,
      networkFeeUsdt: 0,
      usdtReceived: 0,
    };
  }
  const cleanRub = round2(totalRub);
  const serviceFeeRub = round2((cleanRub * serviceFeePercent) / 100);
  const rubConverted = round2(cleanRub - serviceFeeRub);
  const coinRateInRub = rateRubPerUsdt * coinUsdRate;
  const grossCoins = rubConverted / coinRateInRub;
  const rawReceivedCoins = grossCoins - networkFeeCoins;
  const coinsReceived = rawReceivedCoins > 0 ? round2(rawReceivedCoins) : 0;

  return {
    totalRub: cleanRub,
    serviceFeeRub,
    rubConverted,
    grossUsdt: round5(grossCoins),
    networkFeeUsdt: coinsReceived > 0 ? networkFeeCoins : 0,
    usdtReceived: coinsReceived,
  };
}

/**
 * Обратный расчёт для Whitebird.io: сколько рублей нужно отдать по СБП,
 * чтобы на внешний адрес zarub.io пришло ровно `targetCoinsReceived` единиц криптовалюты (USDT, TRX или GRAM).
 * Учитывает, что комиссия Whitebird (2.5% или 3.2%) берётся от итоговой суммы в рублях:
 * totalRub * (1 - serviceFeePercent / 100) = rubConverted.
 */
export function calculateWhitebirdRubNeededForUsdt(
  targetCoinsReceived: number,
  rateRubPerUsdt = 82.37,
  serviceFeePercent = 2.5,
  networkFeeCoins = 2.16763,
  coinUsdRate = 1,
): {
  totalRub: number;
  serviceFeeRub: number;
  rubConverted: number;
  grossUsdt: number;
  networkFeeUsdt: number;
  usdtReceived: number;
} {
  if (
    !Number.isFinite(targetCoinsReceived) ||
    targetCoinsReceived <= 0 ||
    rateRubPerUsdt <= 0 ||
    coinUsdRate <= 0 ||
    serviceFeePercent >= 100
  ) {
    return {
      totalRub: 0,
      serviceFeeRub: 0,
      rubConverted: 0,
      grossUsdt: 0,
      networkFeeUsdt: 0,
      usdtReceived: 0,
    };
  }
  const usdtReceived = round2(targetCoinsReceived);
  const grossUsdt = round5(usdtReceived + networkFeeCoins);
  const coinRateInRub = rateRubPerUsdt * coinUsdRate;
  const rubConvertedRaw = grossUsdt * coinRateInRub;
  const totalRub = ceil2(rubConvertedRaw / (1 - serviceFeePercent / 100));
  const serviceFeeRub = round2((totalRub * serviceFeePercent) / 100);
  const rubConverted = round2(totalRub - serviceFeeRub);

  return {
    totalRub,
    serviceFeeRub,
    rubConverted,
    grossUsdt,
    networkFeeUsdt: networkFeeCoins,
    usdtReceived,
  };
}

export function formatNumber(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return '0.00';
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatRub(value: number): string {
  return `${formatNumber(value, 2)} ₽`;
}

export function formatUsd(value: number): string {
  return `$${formatNumber(value, 2)}`;
}

/**
 * Полный расчёт Способа 1 (Zarub.io напрямую через СБП)
 */
export function calculateSbpRoute(params: CalculatorParams): SbpRouteResult {
  const safeInput = Math.max(0, Number(params.inputValue) || 0);
  const zarubRate = Math.max(0.01, Number(params.zarubUsdRate) || 101.5);
  const wbReferenceRate = Math.max(0.01, Number(params.whitebirdUsdtRate) || 82.37);
  const sbpFeePercent = Math.max(0, Math.min(99, Number(params.zarubSbpFeePercent) || 0));
  const sbpMinFeeRub = Math.max(0, Number(params.zarubSbpMinFeeRub) || 0);
  const cardFeePercent = Math.max(0, Number(params.zarubCardTransferFeePercent) || 0);

  let totalRub = 0;
  let baseRubBeforeSbpFee = 0;
  let sbpFeeRub = 0;
  let walletBalanceUsd = 0;
  let cardTransferFeeUsd = 0;
  let finalCardUsd = 0;

  if (safeInput > 0) {
    if (params.mode === 'card_usd') {
      const cardCalc = calculateBalanceNeededForCard(safeInput, cardFeePercent);
      walletBalanceUsd = cardCalc.walletBalanceUsd;
      cardTransferFeeUsd = cardCalc.cardTransferFeeUsd;
      finalCardUsd = cardCalc.finalCardUsd;

      baseRubBeforeSbpFee = round2(walletBalanceUsd * zarubRate);
      sbpFeeRub = Math.max(sbpMinFeeRub, round2((baseRubBeforeSbpFee * sbpFeePercent) / 100));
      totalRub = round2(baseRubBeforeSbpFee + sbpFeeRub);
    } else if (params.mode === 'wallet_usd') {
      const cardCalc = calculateCardFromBalance(safeInput, cardFeePercent);
      walletBalanceUsd = cardCalc.walletBalanceUsd;
      cardTransferFeeUsd = cardCalc.cardTransferFeeUsd;
      finalCardUsd = cardCalc.finalCardUsd;

      baseRubBeforeSbpFee = round2(walletBalanceUsd * zarubRate);
      sbpFeeRub = Math.max(sbpMinFeeRub, round2((baseRubBeforeSbpFee * sbpFeePercent) / 100));
      totalRub = round2(baseRubBeforeSbpFee + sbpFeeRub);
    } else {
      // mode === 'budget_rub'
      totalRub = round2(safeInput);
      const tentativeBaseRub = round2(totalRub / (1 + sbpFeePercent / 100));
      const tentativeFee = round2(totalRub - tentativeBaseRub);
      if (tentativeFee < sbpMinFeeRub) {
        sbpFeeRub = Math.min(totalRub, sbpMinFeeRub);
        baseRubBeforeSbpFee = round2(Math.max(0, totalRub - sbpFeeRub));
      } else {
        sbpFeeRub = tentativeFee;
        baseRubBeforeSbpFee = tentativeBaseRub;
      }
      walletBalanceUsd = floor2(baseRubBeforeSbpFee / zarubRate);
      const cardCalc = calculateCardFromBalance(walletBalanceUsd, cardFeePercent);
      cardTransferFeeUsd = cardCalc.cardTransferFeeUsd;
      finalCardUsd = cardCalc.finalCardUsd;
    }
  }

  const cardFeeInRubAtZarubRate = round2(cardTransferFeeUsd * zarubRate);
  const explicitFeesRub = round2(sbpFeeRub + cardFeeInRubAtZarubRate);
  const usefulValueRub = round2(finalCardUsd * wbReferenceRate);
  const spreadCostRub = Math.max(0, round2(totalRub - explicitFeesRub - usefulValueRub));
  const totalCommissionRubEquivalent = Math.max(0, round2(totalRub - usefulValueRub));

  const totalLossPercent =
    totalRub > 0 ? round2((totalCommissionRubEquivalent / totalRub) * 100) : 0;
  const explicitFeePercentOfTotal = totalRub > 0 ? round2((explicitFeesRub / totalRub) * 100) : 0;

  const effectiveRateRubPerCardUsd = finalCardUsd > 0 ? round2(totalRub / finalCardUsd) : 0;
  const effectiveRateRubPerWalletUsd =
    walletBalanceUsd > 0 ? round2(totalRub / walletBalanceUsd) : 0;

  const steps = [
    {
      id: 'sbp_pay',
      title: 'Оплата по СБП в zarub.io',
      subtitle: `Курс ${formatNumber(zarubRate, 2)} ₽/$ + комиссия СБП ${formatNumber(sbpFeePercent, 1)}% (мин. ${formatNumber(sbpMinFeeRub, 0)} ₽)`,
      amountFormatted: formatRub(totalRub),
      feeFormatted: `Комиссия СБП: ${formatRub(sbpFeeRub)}`,
      copyValue: totalRub.toFixed(2),
    },
    {
      id: 'zarub_wallet',
      title: 'Зачисление на кошелёк Zarub',
      subtitle: `Конвертация ${formatRub(baseRubBeforeSbpFee)} по внутреннему курсу ${formatNumber(zarubRate, 2)} ₽/$`,
      amountFormatted: formatUsd(walletBalanceUsd),
      feeFormatted:
        spreadCostRub > 0
          ? `Курсовая разница: ~${formatRub(spreadCostRub)}`
          : 'Без комиссии за зачисление',
      copyValue: walletBalanceUsd.toFixed(2),
    },
    {
      id: 'visa_card',
      title: 'Перевод с кошелька на карту Visa',
      subtitle: `Удержание фиксированной комиссии ${formatNumber(cardFeePercent, 1)}% при переводе с баланса на карту`,
      amountFormatted: formatUsd(finalCardUsd),
      feeFormatted: `Комиссия карты: ${formatUsd(cardTransferFeeUsd)} (${formatRub(cardFeeInRubAtZarubRate)})`,
      copyValue: finalCardUsd.toFixed(2),
      isHighlight: true,
    },
  ];

  return {
    methodId: 'zarub_sbp',
    title: 'Способ 1 · Напрямую в Zarub по СБП',
    totalRub,
    baseRubBeforeSbpFee,
    sbpFeeRub,
    walletBalanceUsd,
    cardTransferFeeUsd,
    finalCardUsd,
    totalCommissionRubEquivalent,
    explicitFeesRub,
    spreadCostRub,
    usefulValueRub,
    totalLossPercent,
    explicitFeePercentOfTotal,
    effectiveRateRubPerCardUsd,
    effectiveRateRubPerWalletUsd,
    steps,
  };
}

/**
 * Полный расчёт Способа 2 (Через Whitebird.io по СБП -> Криптовалюта на внешний адрес Zarub.io -> Карта Visa)
 */
export function calculateWhitebirdRoute(params: CalculatorParams): WhitebirdRouteResult {
  const safeInput = Math.max(0, Number(params.inputValue) || 0);
  const wbRate = Math.max(0.01, Number(params.whitebirdUsdtRate) || 82.37);
  const wbFeePercent = Math.max(0, Math.min(99, Number(params.whitebirdFeePercent) || 0));
  const networkFeeCoins = Math.max(0, Number(params.whitebirdNetworkFeeUsdt) || 0);
  const zarubCryptoFeePercent = Math.max(0, Number(params.zarubCryptoFeePercent) || 0);
  const zarubCryptoMinFeeUsd = Math.max(0, Number(params.zarubCryptoMinFeeUsd) || 0);
  const cardFeePercent = Math.max(0, Number(params.zarubCardTransferFeePercent) || 0);

  const assetMeta = CRYPTO_ASSETS[params.cryptoAsset] ?? CRYPTO_ASSETS.GRAM;
  const coinUsdRate = getCryptoCoinUsdRate(params);
  const coinRubRate = round2(wbRate * coinUsdRate);

  let totalRub = 0;
  let whitebirdServiceFeeRub = 0;
  let rubConvertedToCrypto = 0;
  let grossUsdtBought = 0;
  let actualNetworkFeeCoins = 0;
  let usdtSentToZarub = 0;
  let usdEquivalentSentToZarub = 0;
  let zarubCryptoFeeUsd = 0;
  let walletBalanceUsd = 0;
  let cardTransferFeeUsd = 0;
  let finalCardUsd = 0;

  if (safeInput > 0) {
    if (params.mode === 'card_usd' || params.mode === 'wallet_usd') {
      const cardCalc =
        params.mode === 'card_usd'
          ? calculateBalanceNeededForCard(safeInput, cardFeePercent)
          : calculateCardFromBalance(safeInput, cardFeePercent);

      walletBalanceUsd = cardCalc.walletBalanceUsd;
      cardTransferFeeUsd = cardCalc.cardTransferFeeUsd;
      finalCardUsd = cardCalc.finalCardUsd;

      // Комиссия Zarub на крипту (3% или 5%, мин. $1, округление вверх до целого доллара)
      zarubCryptoFeeUsd = calculateZarubCryptoFee(
        walletBalanceUsd,
        zarubCryptoFeePercent,
        zarubCryptoMinFeeUsd,
      );
      usdEquivalentSentToZarub = round2(walletBalanceUsd + zarubCryptoFeeUsd);

      // Округляем количество монет вверх (ceil2), чтобы при пересчёте по курсу Zarub не потерять ни одного цента
      usdtSentToZarub =
        coinUsdRate === 1
          ? usdEquivalentSentToZarub
          : ceil2(usdEquivalentSentToZarub / coinUsdRate);

      const wbCalc = calculateWhitebirdRubNeededForUsdt(
        usdtSentToZarub,
        wbRate,
        wbFeePercent,
        networkFeeCoins,
        coinUsdRate,
      );
      totalRub = wbCalc.totalRub;
      whitebirdServiceFeeRub = wbCalc.serviceFeeRub;
      rubConvertedToCrypto = wbCalc.rubConverted;
      grossUsdtBought = wbCalc.grossUsdt;
      actualNetworkFeeCoins = wbCalc.networkFeeUsdt;
    } else {
      // mode === 'budget_rub'
      const wbCalc = calculateWhitebirdFromRub(
        safeInput,
        wbRate,
        wbFeePercent,
        networkFeeCoins,
        coinUsdRate,
      );
      totalRub = wbCalc.totalRub;
      whitebirdServiceFeeRub = wbCalc.serviceFeeRub;
      rubConvertedToCrypto = wbCalc.rubConverted;
      grossUsdtBought = wbCalc.grossUsdt;
      actualNetworkFeeCoins = wbCalc.networkFeeUsdt;
      usdtSentToZarub = wbCalc.usdtReceived;
      usdEquivalentSentToZarub = floor2(usdtSentToZarub * coinUsdRate);

      if (usdEquivalentSentToZarub > zarubCryptoMinFeeUsd) {
        zarubCryptoFeeUsd = calculateZarubCryptoFee(
          usdEquivalentSentToZarub,
          zarubCryptoFeePercent,
          zarubCryptoMinFeeUsd,
        );
        walletBalanceUsd = round2(Math.max(0, usdEquivalentSentToZarub - zarubCryptoFeeUsd));
      } else {
        zarubCryptoFeeUsd = usdEquivalentSentToZarub > 0 ? zarubCryptoMinFeeUsd : 0;
        walletBalanceUsd = 0;
      }

      const cardCalc = calculateCardFromBalance(walletBalanceUsd, cardFeePercent);
      cardTransferFeeUsd = cardCalc.cardTransferFeeUsd;
      finalCardUsd = cardCalc.finalCardUsd;
    }
  }

  const blockchainNetworkFeeRub = round2(actualNetworkFeeCoins * coinUsdRate * wbRate);
  const zarubCryptoFeeRub = round2(zarubCryptoFeeUsd * wbRate);
  const cardTransferFeeRub = round2(cardTransferFeeUsd * wbRate);

  // Полезная ценность полученных на карту долларов по базовому курсу (одинаковая база сравнения со Способом 1)
  const usefulValueRub = round2(finalCardUsd * wbRate);
  const totalCommissionRubEquivalent = Math.max(0, round2(totalRub - usefulValueRub));
  const totalLossPercent =
    totalRub > 0 ? round2((totalCommissionRubEquivalent / totalRub) * 100) : 0;

  const effectiveRateRubPerCardUsd = finalCardUsd > 0 ? round2(totalRub / finalCardUsd) : 0;
  const effectiveRateRubPerWalletUsd =
    walletBalanceUsd > 0 ? round2(totalRub / walletBalanceUsd) : 0;

  const networkFeeDecimals = actualNetworkFeeCoins === 0 ? 0 : actualNetworkFeeCoins < 1 ? 3 : 5;
  const coinRateSubtitle =
    coinUsdRate !== 1
      ? `Курс Zarub: 1 ${assetMeta.symbol} ≈ $${formatNumber(coinUsdRate, 2)} (~${formatNumber(coinRubRate, 2)} ₽) · Комиссия Whitebird ${formatNumber(wbFeePercent, 1)}%`
      : `Курс ${formatNumber(wbRate, 2)} ₽/USDT · Комиссия сервиса ${formatNumber(wbFeePercent, 1)}%`;

  const steps = [
    {
      id: 'wb_sbp',
      title: `Покупка ${assetMeta.symbol} в whitebird.io по СБП`,
      subtitle: coinRateSubtitle,
      amountFormatted: formatRub(totalRub),
      feeFormatted: `Комиссия Whitebird (${formatNumber(wbFeePercent, 1)}%): ${formatRub(whitebirdServiceFeeRub)}`,
      copyValue: totalRub.toFixed(2),
    },
    {
      id: 'wb_network',
      title: `Вывод ${assetMeta.symbol} (${assetMeta.network}) в Zarub`,
      subtitle:
        actualNetworkFeeCoins > 0
          ? `Сетевой сбор блокчейна: ${formatNumber(actualNetworkFeeCoins, networkFeeDecimals)} ${assetMeta.symbol}`
          : `Сетевой сбор блокчейна: 0 ${assetMeta.symbol} (без комиссии сети)`,
      amountFormatted: `${formatNumber(usdtSentToZarub, 2)} ${assetMeta.symbol}`,
      feeFormatted:
        actualNetworkFeeCoins > 0
          ? `Сеть: ${formatNumber(actualNetworkFeeCoins, networkFeeDecimals)} ${assetMeta.symbol} (~${formatRub(blockchainNetworkFeeRub)})`
          : `Сеть: 0 ${assetMeta.symbol} (0,00 ₽)`,
      copyValue: usdtSentToZarub.toFixed(2),
    },
    {
      id: 'zarub_crypto_credit',
      title: 'Зачисление крипты на кошелёк Zarub',
      subtitle: `Комиссия крипто-шлюза ${formatNumber(zarubCryptoFeePercent, 0)}% (мин. $${formatNumber(zarubCryptoMinFeeUsd, 0)}, округление вверх до $1)`,
      amountFormatted: formatUsd(walletBalanceUsd),
      feeFormatted: `Комиссия Zarub: $${zarubCryptoFeeUsd} (~${formatRub(zarubCryptoFeeRub)})`,
      copyValue: walletBalanceUsd.toFixed(2),
    },
    {
      id: 'visa_card_wb',
      title: 'Перевод с кошелька на карту Visa',
      subtitle: `Удержание фиксированной комиссии ${formatNumber(cardFeePercent, 1)}% при переводе с баланса на карту`,
      amountFormatted: formatUsd(finalCardUsd),
      feeFormatted: `Комиссия карты: ${formatUsd(cardTransferFeeUsd)} (~${formatRub(cardTransferFeeRub)})`,
      copyValue: finalCardUsd.toFixed(2),
      isHighlight: true,
    },
  ];

  return {
    methodId: 'whitebird_crypto',
    title: `Способ 2 · Через Whitebird (${assetMeta.label})`,
    totalRub,
    whitebirdServiceFeeRub,
    rubConvertedToCrypto,
    grossUsdtBought,
    blockchainNetworkFeeUsdt: actualNetworkFeeCoins,
    blockchainNetworkFeeRub,
    usdtSentToZarub,
    usdEquivalentSentToZarub,
    zarubCryptoFeeUsd,
    zarubCryptoFeeRub,
    walletBalanceUsd,
    cardTransferFeeUsd,
    cardTransferFeeRub,
    finalCardUsd,
    totalCommissionRubEquivalent,
    usefulValueRub,
    totalLossPercent,
    effectiveRateRubPerCardUsd,
    effectiveRateRubPerWalletUsd,
    steps,
  };
}

/**
 * Сводное сравнение обоих способов с определением победителя и выгоды
 */
export function compareRoutes(params: CalculatorParams): ComparisonSummary {
  const sbp = calculateSbpRoute(params);
  const whitebird = calculateWhitebirdRoute(params);

  if (params.mode === 'budget_rub') {
    const diffCardUsd = round2(whitebird.finalCardUsd - sbp.finalCardUsd);
    const diffWalletUsd = round2(whitebird.walletBalanceUsd - sbp.walletBalanceUsd);

    let cheaperMethod: 'zarub_sbp' | 'whitebird_crypto' | 'equal' = 'equal';
    if (Math.abs(diffCardUsd) >= 0.01) {
      cheaperMethod = diffCardUsd > 0 ? 'whitebird_crypto' : 'zarub_sbp';
    }

    const extraCardUsd = Math.abs(diffCardUsd);
    const extraWalletUsd = Math.abs(diffWalletUsd);
    const referenceRate = params.whitebirdUsdtRate || 82.37;
    const savingsRub = round2(extraCardUsd * referenceRate);
    const minCard = Math.min(sbp.finalCardUsd, whitebird.finalCardUsd);
    const savingsPercent = minCard > 0 ? round2((extraCardUsd / minCard) * 100) : 0;

    return {
      sbp,
      whitebird,
      cheaperMethod,
      savingsRub,
      extraCardUsd,
      extraWalletUsd,
      savingsPercent,
    };
  }

  const diffRub = round2(sbp.totalRub - whitebird.totalRub);
  let cheaperMethod: 'zarub_sbp' | 'whitebird_crypto' | 'equal' = 'equal';
  if (Math.abs(diffRub) >= 0.01) {
    cheaperMethod = diffRub > 0 ? 'whitebird_crypto' : 'zarub_sbp';
  }

  const savingsRub = Math.abs(diffRub);
  const maxRub = Math.max(sbp.totalRub, whitebird.totalRub);
  const savingsPercent = maxRub > 0 ? round2((savingsRub / maxRub) * 100) : 0;

  return {
    sbp,
    whitebird,
    cheaperMethod,
    savingsRub,
    extraCardUsd: 0,
    extraWalletUsd: 0,
    savingsPercent,
  };
}
