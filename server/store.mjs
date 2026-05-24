import './env.mjs';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  defaultDopDeductions,
  defaultExpenses,
  defaultIncomes,
  defaultSourceDeductions,
  emptyImportSummary,
  sampleBudgets,
  sampleStatement,
  sampleStatementName
} from './defaults.mjs';
import { generateBalancePaymentSummary } from './balance-payment-summary-engine.mjs';
import { sendBudgetSummaryEmail as deliverBudgetSummaryEmail } from './email/budget-summary-email.mjs';
import { createJsonStateStore } from './persistence/json-store.mjs';
import { generatePresupuestoSummary } from './presupuesto-summary-engine.mjs';
import { buildUploadPreview, decodeStatementBuffer, parseStatement } from './statement-parser.mjs';
import { generateWealthSummary } from './wealth-summary-engine.mjs';

const currentDir = dirname(fileURLToPath(import.meta.url));
const defaultDataDir = process.env.BUDGET_SIGNAL_DATA_DIR ?? join(currentDir, 'data');
const dataFilePath = process.env.BUDGET_SIGNAL_DATA_FILE ?? join(defaultDataDir, 'app-state.json');
const personalEntryIdAliases = new Map([
  ['expense-apartamento', 'expense-ahorro']
]);
const stateStore = createJsonStateStore({ filePath: dataFilePath, normalizeState });

export async function getState() {
  const state = await readState();
  return getAppState(state);
}

export async function sendBudgetSummaryEmail() {
  const state = await readState();
  return await deliverBudgetSummaryEmail(getAppState(state));
}

export async function getPersonalBudget() {
  const state = await readState();
  return createPersonalBudgetResponse(state.personalBudget);
}

export async function updatePersonalBudget(snapshot) {
  return updateState((state) => {
    state.personalBudget = normalizePersonalBudget(extractPersonalBudgetSnapshot(snapshot));
    return createPersonalBudgetResponse(state.personalBudget);
  });
}

export async function getPersonalBudgetSummary() {
  const state = await readState();
  return generatePresupuestoSummary(state.personalBudget);
}

export async function getConversionBudget() {
  const state = await readState();
  return createConversionBudgetResponse(state.conversionBudget);
}

export async function updateConversionBudget(snapshot) {
  return updateState((state) => {
    state.conversionBudget = normalizeConversionBudget(extractConversionBudgetSnapshot(snapshot));
    return createConversionBudgetResponse(state.conversionBudget);
  });
}

export async function getConversionBudgetSummary() {
  const state = await readState();
  return generateBalancePaymentSummary(state.conversionBudget);
}

export async function getWealthPortfolio() {
  const state = await readState();
  return createWealthPortfolioResponse(state.wealthPortfolio, state.personalBudget);
}

export async function updateWealthPortfolio(snapshot) {
  return updateState((state) => {
    state.wealthPortfolio = normalizeWealthPortfolio(extractWealthPortfolioSnapshot(snapshot));
    return createWealthPortfolioResponse(state.wealthPortfolio, state.personalBudget);
  });
}

export async function getWealthSummary() {
  const state = await readState();
  return generateWealthSummary(state.wealthPortfolio, state.personalBudget);
}

export async function updateTheme(theme) {
  return updateState((state) => {
    state.theme = theme === 'light' ? 'light' : 'dark';
    return { theme: state.theme };
  });
}

export async function updateBudgets(budgets) {
  return updateState((state) => {
    const normalizedBudgets = normalizeBudgets(budgets);
    state.budgets = normalizedBudgets.length > 0 ? normalizedBudgets : clone(sampleBudgets);
    return { budgets: state.budgets };
  });
}

export async function importStatementText({ content = '', sourceLabel = 'Estado pegado' } = {}) {
  const parsedStatement = parseStatement(String(content), String(sourceLabel || 'Estado pegado'));
  const response = await importParsedStatements([parsedStatement]);
  return { ...response, statementDraft: String(content) };
}

export async function importStatementFiles({ files = [] } = {}) {
  const decodedFiles = Array.isArray(files)
    ? files.map((file) => decodeFilePayload(file)).filter((file) => file.content.length > 0)
    : [];

  if (decodedFiles.length === 0) {
    const state = await readState();
    return { status: '[ERROR: NO SE PUDIERON LEER ARCHIVOS]', state: getAppState(state), statementDraft: '' };
  }

  const parsedStatements = decodedFiles.map((file) => parseStatement(file.content, file.name));
  const response = await importParsedStatements(parsedStatements);
  const statementDraft = decodedFiles.length === 1 ? decodedFiles[0].content : buildUploadPreview(decodedFiles);

  return { ...response, statementDraft };
}

export async function loadSampleStatement() {
  const parsedStatement = parseStatement(sampleStatement, sampleStatementName);
  const response = await importParsedStatements([parsedStatement]);
  const status = response.status.startsWith('[IMPORTADOS') ? '[DATOS DE EJEMPLO CARGADOS]' : response.status;

  return { ...response, status, statementDraft: sampleStatement };
}

export async function clearStatements() {
  return updateState((state) => {
    state.statements = [];
    return { status: '[LIMPIADO]', state: getAppState(state), statementDraft: '' };
  });
}

async function importParsedStatements(parsedStatements) {
  return updateState((state) => {
    const parsedTransactions = parsedStatements.flatMap((statement) => statement.transactions);
    const existingStatements = state.statements;
    const knownTransactionKeys = new Set(existingStatements.flatMap((statement) => statement.transactions).map((transaction) => transactionKey(transaction)));
    const importedAt = new Date().toISOString();
    const newStatements = [];
    let duplicateCount = 0;
    let importedTransactionCount = 0;

    parsedStatements.forEach((statement, statementIndex) => {
      const uniqueTransactions = statement.transactions.filter((transaction) => {
        const key = transactionKey(transaction);

        if (knownTransactionKeys.has(key)) {
          duplicateCount += 1;
          return false;
        }

        knownTransactionKeys.add(key);
        return true;
      });

      if (uniqueTransactions.length === 0) {
        return;
      }

      importedTransactionCount += uniqueTransactions.length;
      newStatements.push({
        id: createStatementId(statementIndex),
        name: statement.source,
        source: statement.source,
        format: statement.format,
        importedAt,
        totalRows: statement.totalRows,
        paymentRows: statement.paymentRows,
        skippedRows: statement.skippedRows,
        transactions: uniqueTransactions
      });
    });

    if (parsedTransactions.length === 0) {
      return { status: '[ERROR: NO SE ENCONTRARON CARGOS]', state: getAppState(state, duplicateCount) };
    }

    if (newStatements.length === 0) {
      return { status: '[SIN CARGOS NUEVOS: YA EXISTEN]', state: getAppState(state, duplicateCount) };
    }

    state.statements = sortStatements([...existingStatements, ...newStatements]);
    state.budgets = ensureBudgetsForTransactions(state.budgets, transactionsFromStatements(state.statements));

    return {
      status: `[IMPORTADOS ${importedTransactionCount} CARGOS / ${newStatements.length} ESTADO${newStatements.length === 1 ? '' : 'S'} NUEVO${newStatements.length === 1 ? '' : 'S'}]`,
      state: getAppState(state, duplicateCount)
    };
  });
}

async function readState() {
  return stateStore.read();
}

async function writeState(state) {
  return stateStore.write(state);
}

async function updateState(mutator) {
  return stateStore.update(mutator);
}

function getAppState(state, duplicateCount = 0) {
  const statements = sortStatements(state.statements);
  const transactions = transactionsFromStatements(statements);

  return {
    theme: state.theme,
    budgets: state.budgets,
    personalBudget: state.personalBudget,
    personalBudgetSummary: generatePresupuestoSummary(state.personalBudget),
    conversionBudget: state.conversionBudget,
    conversionBudgetSummary: generateBalancePaymentSummary(state.conversionBudget),
    wealthPortfolio: state.wealthPortfolio,
    wealthSummary: generateWealthSummary(state.wealthPortfolio, state.personalBudget),
    statements,
    transactions,
    uploadedStatementNames: statements.map((statement) => statement.source),
    importSummary: summarizeStatements(statements, duplicateCount)
  };
}

function createPersonalBudgetResponse(personalBudget) {
  return {
    budget: personalBudget,
    summary: generatePresupuestoSummary(personalBudget)
  };
}

function extractPersonalBudgetSnapshot(snapshot = {}) {
  return snapshot?.budget && typeof snapshot.budget === 'object' ? snapshot.budget : snapshot;
}

function createConversionBudgetResponse(conversionBudget) {
  return {
    budget: conversionBudget,
    summary: generateBalancePaymentSummary(conversionBudget)
  };
}

function extractConversionBudgetSnapshot(snapshot = {}) {
  return snapshot?.budget && typeof snapshot.budget === 'object' ? snapshot.budget : snapshot;
}

function createWealthPortfolioResponse(wealthPortfolio, personalBudget) {
  return {
    portfolio: wealthPortfolio,
    summary: generateWealthSummary(wealthPortfolio, personalBudget)
  };
}

function extractWealthPortfolioSnapshot(snapshot = {}) {
  return snapshot?.portfolio && typeof snapshot.portfolio === 'object' ? snapshot.portfolio : snapshot;
}

function normalizeState(value) {
  const statements = normalizeStoredStatements(value?.statements);
  const budgets = normalizeBudgets(value?.budgets);

  return {
    theme: value?.theme === 'light' ? 'light' : 'dark',
    budgets: budgets.length > 0 ? budgets : clone(sampleBudgets),
    personalBudget: normalizePersonalBudget(value?.personalBudget),
    conversionBudget: normalizeConversionBudget(value?.conversionBudget),
    wealthPortfolio: normalizeWealthPortfolio(value?.wealthPortfolio),
    statements
  };
}

function normalizePersonalBudget(snapshot = {}) {
  return {
    incomes: restorePersonalEntries(snapshot.incomes, defaultIncomes, false),
    expenses: restorePersonalEntries(snapshot.expenses, defaultExpenses, true)
  };
}

function restorePersonalEntries(entries, defaults, allowCustom) {
  const storedEntries = Array.isArray(entries) ? entries : [];
  const storedById = createStoredPersonalEntryMap(storedEntries);
  const restoredDefaults = defaults.map((entry) => {
    const storedEntry = storedById.get(entry.id);

    return {
      ...entry,
      amount: normalizeAmount(storedEntry?.amount ?? entry.amount),
      currency: isCurrencyCode(storedEntry?.currency) ? storedEntry.currency : entry.currency
    };
  });

  if (!allowCustom) {
    return restoredDefaults;
  }

  const customEntries = storedEntries
    .filter((entry) => entry.custom && String(entry.name ?? '').trim())
    .map((entry) => ({
      id: String(entry.id || createEntryId('expense', entry.name)),
      name: String(entry.name).trim(),
      amount: normalizeAmount(entry.amount),
      currency: isCurrencyCode(entry.currency) ? entry.currency : 'DOP',
      custom: true
    }));

  return [...restoredDefaults, ...customEntries];
}

function createStoredPersonalEntryMap(entries) {
  const storedById = new Map();

  for (const entry of entries) {
    const id = normalizePersonalEntryId(entry.id);

    if (!storedById.has(id) || entry.id === id) {
      storedById.set(id, entry);
    }
  }

  return storedById;
}

function normalizePersonalEntryId(id) {
  const entryId = String(id ?? '');
  return personalEntryIdAliases.get(entryId) ?? entryId;
}

function normalizeConversionBudget(snapshot = {}) {
  return {
    sourceAmount: normalizeAmount(snapshot.sourceAmount),
    sourceCurrency: isCurrencyCode(snapshot.sourceCurrency) ? snapshot.sourceCurrency : 'USD',
    afterConversionAddition: normalizeAmount(snapshot.afterConversionAddition),
    sourceDeductions: restoreConversionEntries(snapshot.sourceDeductions, defaultSourceDeductions, true),
    dopDeductions: restoreConversionEntries(snapshot.dopDeductions, defaultDopDeductions, false)
  };
}

function restoreConversionEntries(entries, defaults, allowCustom) {
  const storedEntries = Array.isArray(entries) ? entries : [];
  const storedById = new Map(storedEntries.map((entry) => [entry.id, entry]));
  const restoredDefaults = defaults.map((entry) => ({
    ...entry,
    amount: normalizeAmount(storedById.get(entry.id)?.amount ?? entry.amount)
  }));

  if (!allowCustom) {
    return restoredDefaults;
  }

  const customEntries = storedEntries
    .filter((entry) => entry.custom && String(entry.name ?? '').trim())
    .map((entry) => ({
      id: String(entry.id || createEntryId('source', entry.name)),
      name: String(entry.name).trim(),
      amount: normalizeAmount(entry.amount),
      custom: true
    }));

  return [...restoredDefaults, ...customEntries];
}

function normalizeWealthPortfolio(snapshot = {}) {
  return {
    assets: normalizeWealthAssets(snapshot.assets),
    liabilities: normalizeWealthLiabilities(snapshot.liabilities)
  };
}

function normalizeWealthAssets(entries) {
  return Array.isArray(entries)
    ? entries
      .filter((entry) => String(entry?.name ?? '').trim() && normalizeAmount(entry?.amount) > 0)
      .map((entry) => ({
        id: String(entry.id || createEntryId('asset', entry.name)),
        name: String(entry.name).trim(),
        category: normalizeWealthAssetCategory(entry.category),
        amount: normalizeAmount(entry.amount),
        currency: isCurrencyCode(entry.currency) ? entry.currency : 'DOP'
      }))
    : [];
}

function normalizeWealthLiabilities(entries) {
  return Array.isArray(entries)
    ? entries
      .filter((entry) => String(entry?.name ?? '').trim() && normalizeAmount(entry?.amount) > 0)
      .map((entry) => ({
        id: String(entry.id || createEntryId('liability', entry.name)),
        name: String(entry.name).trim(),
        category: normalizeWealthLiabilityCategory(entry.category),
        amount: normalizeAmount(entry.amount),
        currency: isCurrencyCode(entry.currency) ? entry.currency : 'DOP',
        interestRate: normalizeRate(entry.interestRate),
        monthlyPayment: normalizeAmount(entry.monthlyPayment)
      }))
    : [];
}

function normalizeWealthAssetCategory(value) {
  const category = String(value ?? '').trim();
  return ['cash', 'checking', 'savings', 'investment', 'retirement', 'real-estate', 'vehicle', 'business', 'other'].includes(category)
    ? category
    : 'other';
}

function normalizeWealthLiabilityCategory(value) {
  const category = String(value ?? '').trim();
  return ['credit-card', 'mortgage', 'personal-loan', 'vehicle-loan', 'student-loan', 'business-loan', 'tax', 'other'].includes(category)
    ? category
    : 'other';
}

function normalizeBudgets(budgets) {
  return Array.isArray(budgets)
    ? budgets
      .filter((budget) => String(budget?.category ?? '').trim() && Number.isFinite(Number(budget?.limit)))
      .map((budget) => ({
        category: String(budget.category).trim(),
        limit: normalizeAmount(budget.limit),
        currency: isCurrencyCode(budget.currency) ? budget.currency : 'USD'
      }))
    : [];
}

function normalizeStoredStatements(statements) {
  return sortStatements(Array.isArray(statements)
    ? statements.map((statement) => normalizeStoredStatement(statement)).filter(Boolean)
    : []);
}

function normalizeStoredStatement(statement) {
  const transactions = Array.isArray(statement?.transactions)
    ? statement.transactions.map((transaction) => normalizeTransaction(transaction)).filter(Boolean)
    : [];

  if (!String(statement?.source ?? '').trim() || transactions.length === 0) {
    return null;
  }

  return {
    id: String(statement.id || randomUUID()),
    name: String(statement.name || statement.source).trim(),
    source: String(statement.source).trim(),
    format: String(statement.format || 'Desconocido'),
    importedAt: String(statement.importedAt || new Date().toISOString()),
    totalRows: normalizeInteger(statement.totalRows),
    paymentRows: normalizeInteger(statement.paymentRows),
    skippedRows: normalizeInteger(statement.skippedRows),
    transactions
  };
}

function normalizeTransaction(transaction) {
  if (!String(transaction?.date ?? '').trim() || !String(transaction?.merchant ?? '').trim()) {
    return null;
  }

  const amount = normalizeAmount(transaction.amount);

  if (amount <= 0) {
    return null;
  }

  return {
    id: normalizeInteger(transaction.id),
    date: String(transaction.date).trim(),
    merchant: String(transaction.merchant).trim(),
    category: String(transaction.category || 'Uncategorized').trim(),
    amount,
    currency: isCurrencyCode(transaction.currency) ? transaction.currency : 'USD',
    source: String(transaction.source || 'Estado').trim()
  };
}

function transactionsFromStatements(statements) {
  return statements
    .flatMap((statement) => statement.transactions)
    .map((transaction, index) => ({ ...transaction, id: index + 1 }));
}

function summarizeStatements(statements, duplicateCount = 0) {
  return {
    files: statements.length,
    rows: statements.reduce((total, statement) => total + statement.totalRows, 0),
    payments: statements.reduce((total, statement) => total + statement.paymentRows, 0),
    skipped: statements.reduce((total, statement) => total + statement.skippedRows, 0),
    duplicates: duplicateCount,
    formats: Array.from(new Set(statements.map((statement) => statement.format))).filter((format) => !/^desconocido|unknown/i.test(format))
  };
}

function ensureBudgetsForTransactions(budgets, transactions) {
  const existingCategories = new Set(budgets.map((budget) => categoryCurrencyKey(budget.category, budget.currency)));
  const spendingByCategory = new Map();

  for (const transaction of transactions) {
    const key = categoryCurrencyKey(transaction.category, transaction.currency);
    const current = spendingByCategory.get(key) ?? { category: transaction.category, currency: transaction.currency, spent: 0 };
    spendingByCategory.set(key, { ...current, spent: current.spent + transaction.amount });
  }

  const additions = Array.from(spendingByCategory.values())
    .filter((category) => !existingCategories.has(categoryCurrencyKey(category.category, category.currency)))
    .map((category) => ({
      category: category.category,
      currency: category.currency,
      limit: Math.max(100, Math.ceil((category.spent * 1.15) / 25) * 25)
    }));

  return additions.length === 0
    ? budgets
    : [...budgets, ...additions].sort((first, second) => first.category.localeCompare(second.category) || first.currency.localeCompare(second.currency));
}

function decodeFilePayload(file) {
  const name = String(file?.name || 'estado.txt');
  const contentBase64 = String(file?.contentBase64 || '');

  try {
    return { name, content: decodeStatementBuffer(Buffer.from(contentBase64, 'base64')) };
  } catch {
    return { name, content: '' };
  }
}

function sortStatements(statements) {
  return [...statements].sort((first, second) => first.importedAt.localeCompare(second.importedAt));
}

function transactionKey(transaction) {
  return [transaction.date, transaction.merchant, transaction.amount.toFixed(2), transaction.currency, transaction.source].join('|');
}

function categoryCurrencyKey(category, currency) {
  return `${String(category).toLowerCase()}|${currency}`;
}

function createStatementId(statementIndex) {
  return `${randomUUID()}-${statementIndex}`;
}

function createEntryId(prefix, name) {
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'categoria';
  return `${prefix}-${slug}-${Date.now().toString(36)}`;
}

function normalizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function normalizeRate(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function normalizeInteger(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
}

function isCurrencyCode(value) {
  return value === 'USD' || value === 'DOP';
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
