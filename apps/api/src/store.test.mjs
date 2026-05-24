import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { CURRENT_SCHEMA_VERSION } from './persistence/schema.mjs';

test('legacy app state is normalized with new defaults and backend summaries', async (t) => {
  const filePath = await createTempFilePath(t);
  await writeFile(filePath, JSON.stringify({
    theme: 'light',
    budgets: [],
    personalBudget: {
      incomes: [{ id: 'income-luis', name: 'Luis', amount: 500, currency: 'USD' }],
      expenses: [
        { id: 'expense-tarjeta-leonor', name: 'Tarjeta Leonor', amount: 25000, currency: 'DOP' },
        { id: 'expense-apartamento', name: 'Apartamento', amount: 123456, currency: 'DOP', hiddenByDefault: true }
      ]
    },
    conversionBudget: {
      sourceAmount: 1000,
      sourceCurrency: 'USD',
      afterConversionAddition: 0,
      sourceDeductions: [{ id: 'source-tarjeta-usd', name: 'Tarjeta USD', amount: 100 }],
      dopDeductions: [{ id: 'dop-tarjeta-luis', name: 'Tarjeta Luis', amount: 30000 }]
    },
    statements: []
  }), 'utf8');

  const store = await importStoreFor(filePath);
  const state = await store.getState();
  const hiddenExpenses = state.personalBudget.expenses.filter((expense) => expense.hiddenByDefault);
  const ahorroExpense = state.personalBudget.expenses.find((expense) => expense.id === 'expense-ahorro');
  const sourceCard = state.conversionBudget.sourceDeductions.find((entry) => entry.id === 'source-tarjeta-usd');

  assert.equal(state.theme, 'light');
  assert.equal(hiddenExpenses.length, 9);
  assert.equal(ahorroExpense?.name, 'Ahorro');
  assert.equal(ahorroExpense?.amount, 123456);
  assert.equal(hiddenExpenses.some((expense) => expense.id === 'expense-prestamo-apt' && expense.amount === 38000), true);
  assert.equal(hiddenExpenses.some((expense) => expense.id === 'expense-mantenimiento-apt' && expense.amount === 8000), true);
  assert.equal(state.personalBudget.expenses.some((expense) => expense.id === 'expense-apartamento'), false);
  assert.equal(sourceCard.amount, 100);
  assert.equal(state.personalBudgetSummary.incomeDopEquivalent, 30000);
  assert.equal(state.personalBudgetSummary.expenseDopEquivalent, 345016);
  assert.equal(state.conversionBudgetSummary.sourceFeeAmount, 25);
  assert.equal(state.conversionBudgetSummary.sourceNetAmount, 975);
  assert.equal(state.conversionBudgetSummary.finalDopResult, 22500);
  assert.deepEqual(state.wealthPortfolio, { assets: [], liabilities: [] });
  assert.equal(state.wealthSummary.status, 'empty');
});

test('writes normalized app state as a versioned envelope and backs up the previous file', async (t) => {
  const filePath = await createTempFilePath(t);
  const legacyState = {
    theme: 'dark',
    personalBudget: { incomes: [], expenses: [] },
    conversionBudget: { sourceDeductions: [], dopDeductions: [] },
    statements: []
  };
  await writeFile(filePath, JSON.stringify(legacyState), 'utf8');

  const store = await importStoreFor(filePath);
  await store.updateTheme('light');
  const current = await readJson(filePath);
  const backup = await readJson(`${filePath}.bak`);

  assert.equal(current.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(current.data.theme, 'light');
  assert.equal(current.data.personalBudget.expenses.filter((expense) => expense.hiddenByDefault).length, 9);
  assert.equal(backup.theme, 'dark');
  assert.equal(backup.schemaVersion, undefined);
});

test('corrupt app state is rejected instead of being reset to defaults', async (t) => {
  const filePath = await createTempFilePath(t);
  await writeFile(filePath, '{broken-json', 'utf8');
  const store = await importStoreFor(filePath);

  await assert.rejects(() => store.getState(), { code: 'DATA_STORE_INVALID_JSON' });
  assert.equal(await readFile(filePath, 'utf8'), '{broken-json');
});

test('wealth portfolio is normalized, persisted, and summarized by the backend', async (t) => {
  const filePath = await createTempFilePath(t);
  await writeFile(filePath, JSON.stringify({ personalBudget: { incomes: [], expenses: [] }, conversionBudget: {}, statements: [] }), 'utf8');
  const store = await importStoreFor(filePath);

  const response = await store.updateWealthPortfolio({
    assets: [
      { id: 'asset-checking', name: 'Cuenta', category: 'checking', amount: 50000, currency: 'DOP' },
      { id: 'asset-usd', name: 'Broker USD', category: 'investment', amount: 1000, currency: 'USD' }
    ],
    liabilities: [
      { id: 'liability-loan', name: 'Prestamo', category: 'personal-loan', amount: 30000, currency: 'DOP', interestRate: 22, monthlyPayment: 5000 }
    ]
  });
  const state = await store.getState();
  const current = await readJson(filePath);

  assert.equal(response.portfolio.assets.length, 2);
  assert.equal(response.summary.netWorthDop, 80000);
  assert.equal(response.summary.signals.includes('deuda-alto-costo'), true);
  assert.equal(state.wealthPortfolio.liabilities[0].monthlyPayment, 5000);
  assert.equal(state.wealthSummary.totalAssetsDop, 110000);
  assert.equal(current.data.wealthPortfolio.assets.length, 2);
});

async function importStoreFor(filePath) {
  const previousPath = process.env.BUDGET_SIGNAL_DATA_FILE;
  process.env.BUDGET_SIGNAL_DATA_FILE = filePath;

  try {
    return await import(`./store.mjs?test=${randomUUID()}`);
  } finally {
    if (previousPath === undefined) {
      delete process.env.BUDGET_SIGNAL_DATA_FILE;
    } else {
      process.env.BUDGET_SIGNAL_DATA_FILE = previousPath;
    }
  }
}

async function createTempFilePath(t) {
  const directory = await mkdtemp(join(tmpdir(), 'budget-app-store-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return join(directory, 'state.json');
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}