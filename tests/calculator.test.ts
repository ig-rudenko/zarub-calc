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

describe('Network-Specific Commissions & Per-Crypto Whitebird RUB / Zarub USD Rates', () => {
  it('calculates USDT via TON network (Zarub 5% ceil, 1 USDT = $1, Whitebird 83.5859 RUB/USDT, 3.2% service, 0 USDT network fee)', () => {
    const meta = CRYPTO_ASSETS.USDT_TON;
    const res = calculateWhitebirdRoute({
      ...DEFAULT_CALCULATOR_PARAMS,
      mode: 'wallet_usd',
      inputValue: 50,
      cryptoAsset: 'USDT_TON',
      whitebirdUsdtRate: 83.5859,
      zarubCryptoFeePercent: meta.zarubFeePercent,
      whitebirdFeePercent: meta.defaultWhitebirdFeePercent,
      whitebirdNetworkFeeUsdt: meta.defaultNetworkFeeCrypto,
    });

    // 5% от $50 = $2.50 -> округляется вверх до $3
    expect(res.zarubCryptoFeeUsd).toBe(3);
    expect(res.usdtSentToZarub).toBe(53);
    expect(res.blockchainNetworkFeeUsdt).toBe(0);
    expect(res.blockchainNetworkFeeRub).toBe(0);
    // 53 * 83.5859 = 4430.0527 RUB -> / (1 - 0.032) = 4576.5007 -> ceil2 = 4576.51 RUB
    expect(res.totalRub).toBe(4576.51);
  });

  it('calculates TRX route (Zarub 3% ceil, 1 TRX = $0.28 in Zarub, 1 TRX = 26.3881 RUB in Whitebird, 3.2% service, 0.263 TRX network fee)', () => {
    const meta = CRYPTO_ASSETS.TRX;
    const res = calculateWhitebirdRoute({
      ...DEFAULT_CALCULATOR_PARAMS,
      mode: 'wallet_usd',
      inputValue: 67,
      cryptoAsset: 'TRX',
      whitebirdTrxRubRate: 26.3881,
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
    // 250.263 TRX * 26.3881 RUB/TRX = 6603.96507... -> / (1 - 0.032) = 6822.2779... -> ceil2 = 6822.28 RUB
    expect(res.totalRub).toBe(6822.28);
  });

  it('calculates GRAM route (Zarub 3% ceil, 1 GRAM = $0.97 in Zarub, 1 GRAM = 104.6495 RUB in Whitebird, 2.5% service, 0 GRAM network fee)', () => {
    const meta = CRYPTO_ASSETS.GRAM;
    const res = calculateWhitebirdRoute({
      ...DEFAULT_CALCULATOR_PARAMS,
      mode: 'wallet_usd',
      inputValue: 94,
      cryptoAsset: 'GRAM',
      whitebirdGramRubRate: 104.6495,
      zarubGramUsdRate: 0.97,
      zarubCryptoFeePercent: meta.zarubFeePercent,
      whitebirdFeePercent: meta.defaultWhitebirdFeePercent,
      whitebirdNetworkFeeUsdt: meta.defaultNetworkFeeCrypto,
    });

    // 3% от $94 = 2.82 -> ceil = $3 -> всего $97 эквивалента
    // При 1 GRAM = $0.97: $97 / 0.97 = 100 GRAM
    expect(res.zarubCryptoFeeUsd).toBe(3);
    expect(res.usdEquivalentSentToZarub).toBe(97);
    expect(res.usdtSentToZarub).toBe(100);
    expect(res.blockchainNetworkFeeUsdt).toBe(0);
    // 100 GRAM * 104.6495 RUB = 10464.95 RUB -> / (1 - 0.025) = 10733.28205... -> ceil2 = 10733.29 RUB
    expect(res.totalRub).toBe(10733.29);
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
  it('leaves rate fields empty (null) by default and returns 0 until rates are entered', () => {
    expect(DEFAULT_CALCULATOR_PARAMS.zarubUsdRate).toBeNull();
    expect(DEFAULT_CALCULATOR_PARAMS.whitebirdUsdtRate).toBeNull();
    expect(DEFAULT_CALCULATOR_PARAMS.whitebirdTrxRubRate).toBeNull();
    expect(DEFAULT_CALCULATOR_PARAMS.whitebirdGramRubRate).toBeNull();
    expect(DEFAULT_CALCULATOR_PARAMS.zarubTrxUsdRate).toBeNull();
    expect(DEFAULT_CALCULATOR_PARAMS.zarubGramUsdRate).toBeNull();

    const emptyComparison = compareRoutes(DEFAULT_CALCULATOR_PARAMS);
    expect(emptyComparison.sbp.totalRub).toBe(0);
    expect(emptyComparison.whitebird.totalRub).toBe(0);
    expect(emptyComparison.cheaperMethod).toBe('equal');
  });

  it('calculates both routes in card_usd mode with USDT_TRC20 and identifies Whitebird as cheaper', () => {
    const comparison = compareRoutes({
      ...DEFAULT_CALCULATOR_PARAMS,
      zarubUsdRate: 101.5,
      whitebirdUsdtRate: 82.37,
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
      zarubUsdRate: 101.5,
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
});

describe('Vue 3 Component Tree Integration & Dynamic Whitebird / Zarub Rate Inputs', () => {
  it('renders empty rate fields by default, whitebird.io/exchanger link, and switches rate inputs per crypto', async () => {
    const wrapper = mount(App);
    expect(wrapper.text()).toContain('ZarubCalc');

    // Ссылка на курсы Whitebird должна присутствовать
    const wbLink = wrapper.find('a[href="https://whitebird.io/exchanger"]');
    expect(wbLink.exists()).toBe(true);

    // По умолчанию выбран GRAM: отображаются поля Whitebird GRAM и Zarub GRAM, оба пустые по умолчанию
    const wbGramInput = wrapper.find('#whitebird-gram-rate-input');
    const zarubGramInput = wrapper.find('#zarub-gram-rate-input');
    expect(wbGramInput.exists()).toBe(true);
    expect(zarubGramInput.exists()).toBe(true);
    expect((wbGramInput.element as HTMLInputElement).value).toBe('');
    expect((zarubGramInput.element as HTMLInputElement).value).toBe('');

    // Переключаем на TRX
    const trxBtn = wrapper.findAll('button').find((b) => b.text().includes('TRX · TRON'));
    expect(trxBtn).toBeDefined();
    await trxBtn!.trigger('click');

    expect(wrapper.find('#whitebird-trx-rate-input').exists()).toBe(true);
    expect(wrapper.find('#zarub-trx-rate-input').exists()).toBe(true);
    expect(wrapper.find('#whitebird-gram-rate-input').exists()).toBe(false);

    // Переключаем на USDT TRC-20 — поле Whitebird USDT активно, а поле Zarub USDT фиксировано 1 к 1
    const usdtBtn = wrapper.findAll('button').find((b) => b.text().includes('USDT · TRC-20'));
    expect(usdtBtn).toBeDefined();
    await usdtBtn!.trigger('click');

    expect(wrapper.find('#whitebird-usdt-rate-input').exists()).toBe(true);
    const zarubUsdtInput = wrapper.find('#zarub-usdt-rate-input');
    expect(zarubUsdtInput.exists()).toBe(true);
    expect((zarubUsdtInput.element as HTMLInputElement).value).toBe('1');
    expect((zarubUsdtInput.element as HTMLInputElement).disabled).toBe(true);
  });
});
