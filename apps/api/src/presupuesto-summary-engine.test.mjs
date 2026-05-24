import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBudgetCycle, generatePresupuestoSummary } from './presupuesto-summary-engine.mjs';

test('calculates the current budget cycle ending on the 27th', () => {
  const cycle = calculateBudgetCycle('2026-05-06T12:00:00.000Z');

  assert.equal(cycle.startDate, '2026-04-28');
  assert.equal(cycle.endDate, '2026-05-27');
  assert.equal(cycle.currentDate, '2026-05-06');
  assert.equal(cycle.daysRemaining, 21);
  assert.equal(cycle.daysElapsed, 8);
  assert.equal(cycle.cycleLengthDays, 30);
});

test('treats the 27th as the final day of the budget cycle', () => {
  const cycle = calculateBudgetCycle('2026-05-27T12:00:00.000Z');

  assert.equal(cycle.startDate, '2026-04-28');
  assert.equal(cycle.endDate, '2026-05-27');
  assert.equal(cycle.daysRemaining, 0);
});

test('moves to the next cycle after the 27th', () => {
  const cycle = calculateBudgetCycle('2026-05-28T12:00:00.000Z');

  assert.equal(cycle.startDate, '2026-05-28');
  assert.equal(cycle.endDate, '2026-06-27');
  assert.equal(cycle.daysRemaining, 30);
});

test('includes remaining cycle days in presupuesto summary text', () => {
  const summary = generatePresupuestoSummary({
    incomes: [{ id: 'income-luis', name: 'Luis', amount: 500000, currency: 'DOP' }],
    expenses: [{ id: 'expense-home', name: 'Casa', amount: 420000, currency: 'DOP' }]
  }, { currentDate: '2026-05-06T12:00:00.000Z' });

  assert.equal(summary.cycle.daysRemaining, 21);
  assert.match(summary.message, /quedan 21 dias para el cierre del 27/);
});

test('does not warn about uncovered USD when converted DOP covers the budget', () => {
  const summary = generatePresupuestoSummary({
    incomes: [{ id: 'income-dop', name: 'Ingreso DOP', amount: 100000, currency: 'DOP' }],
    expenses: [{ id: 'expense-usd', name: 'Tarjeta USD', amount: 1000, currency: 'USD' }]
  }, { currentDate: '2026-05-06T12:00:00.000Z' });

  assert.equal(summary.netDopEquivalent, 40000);
  assert.equal(summary.status, 'barely-good');
  assert.notEqual(summary.headline, 'Ojo con USD');
  assert.equal(summary.signals.includes('deficit-usd'), false);
  assert.doesNotMatch(summary.message, /USD|sin cubrir/i);
});