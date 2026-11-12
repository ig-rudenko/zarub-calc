export type CalculationMode = 'card_usd' | 'wallet_usd' | 'budget_rub';

export type CryptoAssetId = 'USDT_TRC20' | 'USDT_TON' | 'TRX' | 'GRAM';

export type RateHistoryKey =
  | 'zarubUsdRate'
  | 'whitebirdUsdtRate'
  | 'whitebirdTrxRubRate'
  | 'whitebirdGramRubRate'
  | 'zarubTrxUsdRate'
  | 'zarubGramUsdRate';

export interface RateHistoryEntry {
  id: string;
  value: number;
  timestamp: string;
}

export type RateHistoryMap = Record<RateHistoryKey, RateHistoryEntry[]>;

export interface CryptoAssetOption {
  id: CryptoAssetId;
  symbol: 'USDT' | 'TRX' | 'GRAM';
  label: string;
  name: string;
  network: string;
  zarubFeePercent: number;
  zarubMinFeeUsd: number;
  defaultWhitebirdFeePercent: number;
  defaultNetworkFeeCrypto: number;
}

export interface CalculatorParams {
  /** Текущий режим расчёта: целевая сумма на карте Visa ($), на кошельке Zarub ($) или бюджет в рублях (₽) */
  mode: CalculationMode;
  /** Значение, введённое пользователем (в $ или в ₽ в зависимости от mode) */
  inputValue: number;
  /** Внутренний курс USD в сервисе zarub.io при оплате по СБП (по умолчанию пусто — null) */
  zarubUsdRate: number | null;
  /** Комиссия zarub.io при оплате по СБП в % (по умолчанию 7%) */
  zarubSbpFeePercent: number;
  /** Минимальная комиссия zarub.io при оплате по СБП в ₽ (по умолчанию 1 ₽) */
  zarubSbpMinFeeRub: number;
  /** Курс покупки 1 USDT в whitebird.io в ₽ (по умолчанию пусто — null) */
  whitebirdUsdtRate: number | null;
  /** Курс покупки 1 TRX в whitebird.io в ₽ (по умолчанию пусто — null) */
  whitebirdTrxRubRate?: number | null;
  /** Курс покупки 1 GRAM в whitebird.io в ₽ (по умолчанию пусто — null) */
  whitebirdGramRubRate?: number | null;
  /** Комиссия сервиса whitebird.io при оплате по СБП в % (2.5% для USDT TRC-20 и GRAM, 3.2% для USDT TON и TRX) */
  whitebirdFeePercent: number;
  /** Комиссия сети блокчейн при выводе из whitebird.io в выбранной монете */
  whitebirdNetworkFeeUsdt: number;
  /** Выбранная криптовалюта / сеть для пополнения zarub.io */
  cryptoAsset: CryptoAssetId;
  /** Внутренний курс 1 TRX в долларах в zarub.io (например 0.28 $, по умолчанию пусто — null) */
  zarubTrxUsdRate: number | null;
  /** Внутренний курс 1 GRAM в долларах в zarub.io (например 0.97 $, по умолчанию пусто — null) */
  zarubGramUsdRate: number | null;
  /** Комиссия zarub.io за пополнение криптой в % (3% для USDT TRC-20, TRX, GRAM; 5% для USDT TON) */
  zarubCryptoFeePercent: number;
  /** Минимальная комиссия zarub.io за пополнение криптой в $ (по умолчанию 1 $) */
  zarubCryptoMinFeeUsd: number;
  /** Фиксированная комированная комиссия zarub.io за перевод с внутреннего баланса на карту Visa в % (по умолчанию 1.5%) */
  zarubCardTransferFeePercent: number;
}

export interface PipelineStep {
  id: string;
  title: string;
  subtitle: string;
  amountFormatted: string;
  feeFormatted?: string;
  copyValue: string;
  isHighlight?: boolean;
}

export interface SbpRouteResult {
  methodId: 'zarub_sbp';
  title: string;
  /** Итоговая сумма к оплате по СБП в рублях */
  totalRub: number;
  /** Сумма до комиссии СБП в рублях (конвертируемая по курсу zarub) */
  baseRubBeforeSbpFee: number;
  /** Комиссия СБП (7%, мин 1 ₽) в рублях */
  sbpFeeRub: number;
  /** Сумма, зачисленная на внутренний баланс (кошелёк) zarub в $ */
  walletBalanceUsd: number;
  /** Комиссия 1.5% за перевод с баланса на карту Visa в $ */
  cardTransferFeeUsd: number;
  /** Чистая сумма, зачисленная на карту Visa в $ */
  finalCardUsd: number;
  /** Общие потери (все комиссии + курсовая разница относительно курса Whitebird/рынка) в рублях */
  totalCommissionRubEquivalent: number;
  /** Прямые сервисные комиссии (СБП 7% + перевод на карту 1.5%) в рублях */
  explicitFeesRub: number;
  /** Переплата за внутренний курс доллара zarub относительно базового курса в рублях */
  spreadCostRub: number;
  /** Полезная стоимость полученных на карту долларов по базовому курсу в рублях */
  usefulValueRub: number;
  /** Доля потерь (комиссии + спред курса) от всей уплаченной суммы в % */
  totalLossPercent: number;
  /** Доля только явных комиссий (СБП 7% + 1.5% карта) от уплаченной суммы в % */
  explicitFeePercentOfTotal: number;
  /** Эффективный курс 1 $ на карте Visa в рублях (totalRub / finalCardUsd) */
  effectiveRateRubPerCardUsd: number;
  /** Эффективный курс 1 $ на кошельке Zarub в рублях (totalRub / walletBalanceUsd) */
  effectiveRateRubPerWalletUsd: number;
  steps: PipelineStep[];
}

export interface WhitebirdRouteResult {
  methodId: 'whitebird_crypto';
  title: string;
  /** Итоговая сумма к оплате в whitebird.io по СБП в рублях */
  totalRub: number;
  /** Комиссия сервиса whitebird.io (2.5% или 3.2%) в рублях */
  whitebirdServiceFeeRub: number;
  /** Рубли после вычета комиссии whitebird.io, идущие в обмен по курсу */
  rubConvertedToCrypto: number;
  /** Купленный объём монеты (USDT / TRX / GRAM) до вычета сетевой комиссии блокчейна */
  grossUsdtBought: number;
  /** Комиссия сети блокчейн в монете (например, 2.16763 USDT или 0.263 TRX) */
  blockchainNetworkFeeUsdt: number;
  /** Комиссия сети блокчейн в пересчёте на рубли */
  blockchainNetworkFeeRub: number;
  /** Чистая сумма монеты (USDT / TRX / GRAM), отправленная из whitebird.io на внешний адрес zarub.io */
  usdtSentToZarub: number;
  /** Эквивалент отправленной крипты в долларах по курсу zarub.io до вычета комиссии zarub */
  usdEquivalentSentToZarub: number;
  /** Комиссия zarub.io на крипту (3% или 5%, мин 1 $, округление вверх до целого доллара) */
  zarubCryptoFeeUsd: number;
  /** Комиссия zarub.io на крипту в пересчёте на рубли */
  zarubCryptoFeeRub: number;
  /** Сумма, зачисленная на внутренний баланс (кошелёк) zarub в $ */
  walletBalanceUsd: number;
  /** Комиссия 1.5% за перевод с баланса на карту Visa в $ */
  cardTransferFeeUsd: number;
  /** Комиссия 1.5% за перевод на карту в пересчёте на рубли */
  cardTransferFeeRub: number;
  /** Чистая сумма, зачисленная на карту Visa в $ */
  finalCardUsd: number;
  /** Суммарные комиссии на всём пути в рублях */
  totalCommissionRubEquivalent: number;
  /** Полезная стоимость полученных на карту долларов по курсу обмена в рублях */
  usefulValueRub: number;
  /** Доля всех комиссий от уплаченной суммы в рублях в % */
  totalLossPercent: number;
  /** Эффективный курс 1 $ на карте Visa в рублях (totalRub / finalCardUsd) */
  effectiveRateRubPerCardUsd: number;
  /** Эффективный курс 1 $ на кошельке Zarub в рублях (totalRub / walletBalanceUsd) */
  effectiveRateRubPerWalletUsd: number;
  steps: PipelineStep[];
}

export interface ComparisonSummary {
  sbp: SbpRouteResult;
  whitebird: WhitebirdRouteResult;
  /** Какой маршрут выгоднее */
  cheaperMethod: 'zarub_sbp' | 'whitebird_crypto' | 'equal';
  /** Экономия в рублях при выборе выгодного маршрута */
  savingsRub: number;
  /** Дополнительная выгода в долларах на карте (актуально для режима budget_rub) */
  extraCardUsd: number;
  /** Дополнительная выгода в долларах на кошельке Zarub (для режима budget_rub) */
  extraWalletUsd: number;
  /** Процент выгоды лучшего способа относительно более дорогого */
  savingsPercent: number;
}
