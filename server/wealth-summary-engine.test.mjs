import assert from 'node:assert/strict';
import test from 'node:test';
import { generateWealthSummary } from './wealth-summary-engine.mjs';

test('wealth summary identifies a strong net worth position with liquidity and manageable debt', () => {
  const summary = generateWealthSummary({
    assets: [
      { id: 'asset-cash', name: 'Efectivo', category: 'cash', amount: 120000, currency: 'DOP' },
      { id: 'asset-savings', name: 'Ahorro', category: 'savings', amount: 500000, currency: 'DOP' },
      { id: 'asset-investments', name: 'Inversiones', category: 'investment', amount: 600000, currency: 'DOP' },
      { id: 'asset-home', name: 'Apartamento', category: 'real-estate', amount: 3000000, currency: 'DOP' }
    ],
    liabilities: [
      { id: 'liability-mortgage', name: 'Hipoteca', category: 'mortgage', amount: 800000, currency: 'DOP', interestRate: 9, monthlyPayment: 20000 }
    ]
  }, {
    incomes: [{ id: 'income-main', name: 'Ingreso', amount: 200000, currency: 'DOP' }],
    expenses: [{ id: 'expense-month', name: 'Gastos', amount: 100000, currency: 'DOP' }]
  });

  assert.equal(summary.status, 'strong');
  assert.equal(summary.tone, 'success');
  assert.equal(summary.netWorthDop, 3420000);
  assert.equal(summary.liquidityMonths, 6.2);
  assert.equal(summary.debtToAssetRatio, 0.19);
  assert.equal(summary.investmentShare, 0.142);
  assert.equal(summary.signals.includes('liquidez-fuerte'), true);
  assert.equal(summary.context.globalEmergencyMoneyAccessPercent, 56);
  assert.equal(summary.context.researchSources.length >= 20, true);
  assert.equal(summary.analysisSections.length >= 7, true);
  assert.equal(summary.benchmarks.length >= 10, true);
  assert.equal(summary.stressTests.length, 8);
  assert.equal(summary.scoreDimensions.length, 8);
  assert.equal(summary.annualInflationDragDop, 28706);
  assert.equal(summary.actionPlan.some((action) => action.id === 'reducir-concentracion'), true);
});

test('wealth summary flags negative net worth and high-cost debt', () => {
  const summary = generateWealthSummary({
    assets: [
      { id: 'asset-savings', name: 'Ahorro', category: 'savings', amount: 20000, currency: 'DOP' }
    ],
    liabilities: [
      { id: 'liability-card', name: 'Tarjeta', category: 'credit-card', amount: 140000, currency: 'DOP', interestRate: 60, monthlyPayment: 25000 }
    ]
  }, {
    incomes: [{ id: 'income-main', name: 'Ingreso', amount: 80000, currency: 'DOP' }],
    expenses: [{ id: 'expense-month', name: 'Gastos', amount: 70000, currency: 'DOP' }]
  });

  assert.equal(summary.status, 'negative');
  assert.equal(summary.tone, 'danger');
  assert.equal(summary.netWorthDop, -120000);
  assert.equal(summary.signals.includes('patrimonio-negativo'), true);
  assert.equal(summary.signals.includes('deuda-alto-costo'), true);
  assert.equal(summary.recommendations[0].includes('deuda'), true);
  assert.equal(summary.highCostDebtDop, 140000);
  assert.equal(summary.annualDebtInterestCostDop, 84000);
  assert.equal(summary.actionPlan[0].id, 'atacar-deuda-cara');
  assert.equal(summary.analysisSections.some((section) => section.id === 'debt' && section.tone === 'danger'), true);
  assert.equal(summary.stressTests.some((test) => test.id === 'high-cost-payoff' && test.tone === 'danger'), true);
});

test('wealth summary returns an empty state before assets or liabilities exist', () => {
  const summary = generateWealthSummary({ assets: [], liabilities: [] }, { incomes: [], expenses: [] });

  assert.equal(summary.status, 'empty');
  assert.equal(summary.score, 0);
  assert.equal(summary.netWorthDop, 0);
  assert.equal(summary.signals.includes('sin-datos-patrimonio'), true);
  assert.equal(summary.analysisSections.length >= 7, true);
  assert.equal(summary.actionPlan[0].id, 'registrar-el-mapa');
  assert.equal(summary.scoreDimensions.every((dimension) => dimension.score === 0), true);
});