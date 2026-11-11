import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  calculateBalanceNeededForCard,
  calculateCardFromBalance,
  calculateSbpRoute,
  calculateWhitebirdFromRub,
  calculateWhitebirdRoute,
  calculateWhitebirdRubNeededForUsdt,
  calculateZarubCryptoFee,
  compareRoutes,
  CRYPTO_ASSETS,
  DEFAULT_CALCULATOR_PARAMS,
  WHITEBIRD_REFERENCE_EXAMPLE,
} from '../src/utils/calculator';
import App from '../src/App.vue';

describe('Zarub.io Crypto Commission Ceiling Rounding (3% or 5%, min $1, always rounded up)', () => {
  it('rounds $67 at 3% ($2.01) up to $3 exactly as specified in prompt', () => {
    expect(calculateZarubCryptoFee(67, 3, 1)).toBe(3);
  });

  it('rounds USDT TON at 5% up to next integer dollar (e.g. $50 -> 5% = $2.50 -> $3)', () => {
    expect(calculateZarubCryptoFee(50, 5, 1)).toBe(3);
    expect(calculateZarubCryptoFee(20, 5, 1)).toBe(1);
    expect(calculateZarubCryptoFee(21, 5, 1)).toBe(2);
  });

  it('enforces minimum $1 fee for small amounts', () => {
    expect(calculateZarubCryptoFee(1, 3, 1)).toBe(1);
    expect(calculateZarubCryptoFee(15, 3, 1)).toBe(1);
    expect(calculateZarubCryptoFee(33.33, 3, 1)).toBe(1);
  });

  it('steps up to $2 as soon as 3% exceeds $1.00', () => {
    expect(calculateZarubCryptoFee(33.34, 3, 1)).toBe(2);
    expect(calculateZarubCryptoFee(50, 3, 1)).toBe(2);
    expect(calculateZarubCryptoFee(66.66, 3, 1)).toBe(2);
  });

  it('keeps exact integer fees when 3% is an exact whole number ($100 -> $3)', () => {
    expect(calculateZarubCryptoFee(100, 3, 1)).toBe(3);
    expect(calculateZarubCryptoFee(200, 3, 1)).toBe(6);
  });

  it('returns 0 for zero or negative amounts', () => {
    expect(calculateZarubCryptoFee(0, 3, 1)).toBe(0);
    expect(calculateZarubCryptoFee(-50, 3, 1)).toBe(0);
  });
});

describe('Whitebird.io Reference Example Verification (9 013.92 RUB -> 104.53 USDT)', () => {
  it('matches all figures from the prompt reference transaction', () => {
    const result = calculateWhitebirdFromRub(9013.92, 82.37, 2.5, 2.16763);
    expect(result.serviceFeeRub).toBe(225.35);
    expect(result.rubConverted).toBe(8788.57);
    expect(result.networkFeeUsdt).toBe(2.16763);
    expect(result.usdtReceived).toBe(104.53);
  });

  it('inverts the calculation accurately from target USDT back to RUB', () => {
    const inverse = calculateWhitebirdRubNeededForUsdt(104.53, 82.37, 2.5, 2.16763);
    expect(inverse.usdtReceived).toBe(104.53);
    expect(inverse.serviceFeeRub).toBe(225.35);
    expect(inverse.totalRub).toBeCloseTo(9014.03, 0);
  });
});

describe('Network-Specific Commissions: USDT (TON), TRX, and GRAM', () => {
  it('calculates USDT via TON network (Zarub 5% ceil, Whitebird 3.2% service, 0 USDT network fee)', () => {
    const meta = CRYPTO_ASSETS.USDT_TON;
    const res = calculateWhitebirdRoute({
      ...DEFAULT_CALCULATOR_PARAMS,
      mode: 'wallet_usd',
      inputValue: 50,
      cryptoAsset: 'USDT_TON',
      zarubCryptoFeePercent: meta.zarubFeePercent,
      whitebirdFeePercent: meta.defaultWhitebirdFeePercent,
      whitebirdNetworkFeeUsdt: meta.defaultNetworkFeeCrypto,
    });

    // 5% от $50 = $2.50 -> округляется вверх до $3
    expect(res.zarubCryptoFeeUsd).toBe(3);
    expect(res.usdtSentToZarub).toBe(53);
    expect(res.blockchainNetworkFeeUsdt).toBe(0);
    expect(res.blockchainNetworkFeeRub).toBe(0);
  });

  it('calculates TRX route (Zarub 3% ceil, 1 TRX = $0.28, Whitebird 3.2% service, 0.263 TRX network fee)', () => {
    const meta = CRYPTO_ASSETS.TRX;
    const res = calculateWhitebirdRoute({
      ...DEFAULT_CALCULATOR_PARAMS,
      mode: 'wallet_usd',
      inputValue: 67,
      cryptoAsset: 'TRX',
      zarubTrxUsdRate: 0.28,
      zarubCryptoFeePercent: meta.zarubFeePercent,
      whitebirdFeePercent: meta.defaultWhitebirdFeePercent,
      whitebirdNetworkFeeUsdt: meta.defaultNetworkFeeCrypto,
    });

    // На баланс $67 -> комиссия Zarub $3 -> нужно отправить $70 эквивалента
    // При 1 TRX = $0.28: $70 / 0.28 = 250 TRX
    expect(res.zarubCryptoFeeUsd).toBe(3);
    expect(res.usdEquivalentSentToZarub).toBe(70);
    expect(res.usdtSentToZarub).toBe(250);
    expect(res.blockchainNetworkFeeUsdt).toBe(0.263);
    expect(res.grossUsdtBought).toBe(250.263);
  });

  it('calculates GRAM route (Zarub 3% ceil, 1 GRAM = $0.84, Whitebird 2.5% service, 0 GRAM network fee)', () => {
    const meta = CRYPTO_ASSETS.GRAM;
    const res = calculateWhitebirdRoute({
      ...DEFAULT_CALCULATOR_PARAMS,
      mode: 'wallet_usd',
      inputValue: 81,
      cryptoAsset: 'GRAM',
      zarubGramUsdRate: 0.84,
      zarubCryptoFeePercent: meta.zarubFeePercent,
      whitebirdFeePercent: meta.defaultWhitebirdFeePercent,
      whitebirdNetworkFeeUsdt: meta.defaultNetworkFeeCrypto,
    });

    // 3% от $81 = 2.43 -> ceil = $3 -> всего $84 эквивалента
    // При 1 GRAM = $0.84: $84 / 0.84 = 100 GRAM
    expect(res.zarubCryptoFeeUsd).toBe(3);
    expect(res.usdEquivalentSentToZarub).toBe(84);
    expect(res.usdtSentToZarub).toBe(100);
    expect(res.blockchainNetworkFeeUsdt).toBe(0);
  });
});

describe('Zarub Balance to Visa Card Transfer (1.5% fixed fee deducted from wallet balance)', () => {
  it('calculates required wallet balance of $101.53 for target $100.00 on Visa card (100 / (1 - 0.015))', () => {
    const res = calculateBalanceNeededForCard(100, 1.5);
    expect(res.finalCardUsd).toBe(100);
    expect(res.walletBalanceUsd).toBe(101.53);
    expect(res.cardTransferFeeUsd).toBe(1.53);
  });

  it('calculates available Visa card USD from known wallet balance ($101.53 -> $100.00, $100.00 -> $98.50)', () => {
    const resFrom10153 = calculateCardFromBalance(101.53, 1.5);
    expect(resFrom10153.walletBalanceUsd).toBe(101.53);
    expect(resFrom10153.cardTransferFeeUsd).toBe(1.53);
    expect(resFrom10153.finalCardUsd).toBe(100);

    const resFrom100 = calculateCardFromBalance(100, 1.5);
    expect(resFrom100.walletBalanceUsd).toBe(100);
    expect(resFrom100.cardTransferFeeUsd).toBe(1.5);
    expect(resFrom100.finalCardUsd).toBe(98.5);
  });
});

describe('Full Route Calculations & Comparison (Method 1 SBP vs Method 2 Whitebird)', () => {
  it('calculates both routes in card_usd mode with USDT_TRC20 and identifies Whitebird as cheaper', () => {
    const comparison = compareRoutes({
      ...DEFAULT_CALCULATOR_PARAMS,
      cryptoAsset: 'USDT_TRC20',
      whitebirdNetworkFeeUsdt: 2.16763,
      mode: 'card_usd',
      inputValue: 100,
    });

    expect(comparison.sbp.finalCardUsd).toBe(100);
    expect(comparison.whitebird.finalCardUsd).toBe(100);
    expect(comparison.sbp.walletBalanceUsd).toBe(101.53);
    expect(comparison.whitebird.walletBalanceUsd).toBe(101.53);
    expect(comparison.whitebird.zarubCryptoFeeUsd).toBe(4);
    expect(comparison.whitebird.usdtSentToZarub).toBe(105.53);
    expect(comparison.cheaperMethod).toBe('whitebird_crypto');
    expect(comparison.savingsRub).toBeGreaterThan(1500);
  });

  it('enforces minimum 1 RUB SBP fee in Method 1 for tiny amounts', () => {
    const sbpTiny = calculateSbpRoute({
      ...DEFAULT_CALCULATOR_PARAMS,
      mode: 'wallet_usd',
      inputValue: 0.05,
    });
    expect(sbpTiny.sbpFeeRub).toBeGreaterThanOrEqual(1);
  });

  it('calculates budget_rub mode using the Whitebird reference preset', () => {
    const comparison = compareRoutes({
      ...DEFAULT_CALCULATOR_PARAMS,
      ...WHITEBIRD_REFERENCE_EXAMPLE,
    });

    expect(comparison.whitebird.totalRub).toBe(9013.92);
    expect(comparison.whitebird.whitebirdServiceFeeRub).toBe(225.35);
    expect(comparison.whitebird.usdtSentToZarub).toBe(104.53);
    expect(comparison.whitebird.zarubCryptoFeeUsd).toBe(4);
    expect(comparison.whitebird.walletBalanceUsd).toBe(100.53);
    expect(comparison.cheaperMethod).toBe('whitebird_crypto');
    expect(comparison.extraCardUsd).toBeGreaterThan(15);
  });

  it('handles zero input gracefully across all modes', () => {
    const zeroResult = compareRoutes({
      ...DEFAULT_CALCULATOR_PARAMS,
      inputValue: 0,
    });
    expect(zeroResult.sbp.totalRub).toBe(0);
    expect(zeroResult.whitebird.totalRub).toBe(0);
    expect(zeroResult.cheaperMethod).toBe('equal');
  });
});

describe('Vue 3 Component Tree Integration & Conditional Coin Rate Inputs', () => {
  it('defaults to GRAM and toggles TRX / USDT rate fields when switching networks', async () => {
    const wrapper = mount(App);
    expect(wrapper.text()).toContain('ZarubCalc');
    expect(wrapper.text()).toContain('Способ 1 · Напрямую в Zarub по СБП');
    expect(wrapper.text()).toContain('Способ 2 · Через Whitebird (GRAM · TON)');

    // По умолчанию выбран GRAM — поле GRAM отображается, а TRX скрыто
    expect(wrapper.find('#zarub-gram-rate-input').exists()).toBe(true);
    expect(wrapper.find('#zarub-trx-rate-input').exists()).toBe(false);

    // Проверяем быстрые кнопки выбора суммы ($10, $20, $50, $100)
    const preset10Btn = wrapper.findAll('button').find((b) => b.text() === '$10');
    expect(preset10Btn).toBeDefined();
    await preset10Btn!.trigger('click');
    expect(wrapper.text()).toContain('$10,00');

    // Переключаем на TRX
    const trxBtn = wrapper.findAll('button').find((b) => b.text().includes('TRX · TRON'));
    expect(trxBtn).toBeDefined();
    await trxBtn!.trigger('click');

    expect(wrapper.find('#zarub-trx-rate-input').exists()).toBe(true);
    expect(wrapper.find('#zarub-gram-rate-input').exists()).toBe(false);

    // Переключаем на USDT TRC-20 — оба дополнительных поля скрыты
    const usdtBtn = wrapper.findAll('button').find((b) => b.text().includes('USDT · TRC-20'));
    expect(usdtBtn).toBeDefined();
    await usdtBtn!.trigger('click');

    expect(wrapper.find('#zarub-trx-rate-input').exists()).toBe(false);
    expect(wrapper.find('#zarub-gram-rate-input').exists()).toBe(false);
  });
});
