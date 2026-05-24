import assert from 'node:assert/strict';
import test from 'node:test';
import { generateBalancePaymentSummary } from './balance-payment-summary-engine.mjs';

test('balance payment summary uses the net USD source amount after 1.8 percent and US$7', () => {
  const summary = generateBalancePaymentSummary({
    sourceAmount: 1000,
    sourceCurrency: 'USD',
    afterConversionAddition: 0,
    sourceDeductions: [{ id: 'source-card', name: 'Tarjeta USD', amount: 100 }],
    dopDeductions: [{ id: 'dop-card', name: 'Tarjeta DOP', amount: 30000 }]
  });

  assert.equal(summary.sourceFeeAmount, 25);
  assert.equal(summary.sourceNetAmount, 975);
  assert.equal(summary.sourceRemaining, 875);
  assert.equal(summary.convertedDopAmount, 52500);
  assert.equal(summary.finalDopResult, 22500);
  assert.match(summary.message, /Base neta usada/);
});

test('balance payment summary converts the fixed USD fee when the source amount is DOP', () => {
  const summary = generateBalancePaymentSummary({
    sourceAmount: 100000,
    sourceCurrency: 'DOP',
    afterConversionAddition: 0,
    sourceDeductions: [{ id: 'source-expense', name: 'Antes', amount: 10000 }],
    dopDeductions: [{ id: 'dop-card', name: 'Tarjeta', amount: 5000 }]
  });

  assert.equal(summary.sourceFeeAmount, 2220);
  assert.equal(summary.sourceNetAmount, 97780);
  assert.equal(summary.sourceRemaining, 87780);
  assert.equal(summary.convertedDopAmount, 87780);
  assert.equal(summary.finalDopResult, 82780);
});