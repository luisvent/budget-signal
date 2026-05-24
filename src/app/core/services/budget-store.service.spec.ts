import { TestBed } from '@angular/core/testing';
import { AppState, Budget, ImportResponse, ParsedStatement, StoredStatement, Transaction, emptyBalancePaymentSummary, emptyPresupuestoSummary, emptyWealthSummary } from '../models/budget.models';
import { ApiClientService } from './api-client.service';
import { BudgetStoreService } from './budget-store.service';

const testBudgets: Budget[] = [
  { category: 'Groceries', limit: 700, currency: 'USD' },
  { category: 'Dining', limit: 520, currency: 'USD' }
];

class MemoryApiClientService {
  readonly statements: StoredStatement[] = [];

  readonly get = jasmine.createSpy('get').and.callFake(async (path: string) => {
    if (path === '/api/state') {
      return this.createState();
    }

    throw new Error(`Unhandled GET ${path}`);
  });

  readonly post = jasmine.createSpy('post').and.callFake(async (path: string, body: { content?: string; sourceLabel?: string }) => {
    if (path === '/api/budget-summary-email') {
      return { status: '[RESUMEN ENVIADO]', id: 'email_123', to: 'user@example.com' };
    }

    if (path === '/api/statements/import-text') {
      return this.importStatementText(body);
    }

    throw new Error(`Unhandled POST ${path}`);
  });

  readonly put = jasmine.createSpy('put').and.callFake(async () => ({}));

  readonly delete = jasmine.createSpy('delete').and.callFake(async () => {
    this.statements.length = 0;
    return { status: '[LIMPIADO]', state: this.createState(), statementDraft: '' } satisfies ImportResponse;
  });

  private importStatementText(body: { content?: string; sourceLabel?: string }): ImportResponse {
    const parsedStatement = this.parseStatement(body.content ?? '', body.sourceLabel ?? 'Estado pegado');
    const knownTransactionKeys = new Set(this.statements.flatMap((statement) => statement.transactions).map((transaction) => this.transactionKey(transaction)));
    const uniqueTransactions = parsedStatement.transactions.filter((transaction) => {
      const key = this.transactionKey(transaction);

      if (knownTransactionKeys.has(key)) {
        return false;
      }

      knownTransactionKeys.add(key);
      return true;
    });
    const duplicateCount = parsedStatement.transactions.length - uniqueTransactions.length;

    if (parsedStatement.transactions.length === 0) {
      return { status: '[ERROR: NO SE ENCONTRARON CARGOS]', state: this.createState(duplicateCount), statementDraft: body.content ?? '' };
    }

    if (uniqueTransactions.length === 0) {
      return { status: '[SIN CARGOS NUEVOS: YA EXISTEN]', state: this.createState(duplicateCount), statementDraft: body.content ?? '' };
    }

    this.statements.push({
      id: `${Date.now()}-${this.statements.length}`,
      name: parsedStatement.source,
      source: parsedStatement.source,
      format: parsedStatement.format,
      importedAt: new Date().toISOString(),
      totalRows: parsedStatement.totalRows,
      paymentRows: parsedStatement.paymentRows,
      skippedRows: parsedStatement.skippedRows,
      transactions: uniqueTransactions
    });

    return { status: '[IMPORTADOS]', state: this.createState(duplicateCount), statementDraft: body.content ?? '' };
  }

  private createState(duplicateCount = 0): AppState {
    const transactions = this.statements
      .flatMap((statement) => statement.transactions)
      .map((transaction, index) => ({ ...transaction, id: index + 1 }));

    return {
      theme: 'dark',
      budgets: testBudgets,
      personalBudget: { incomes: [], expenses: [] },
      personalBudgetSummary: emptyPresupuestoSummary,
      conversionBudget: { sourceAmount: 0, sourceCurrency: 'USD', afterConversionAddition: 0, sourceDeductions: [], dopDeductions: [] },
      conversionBudgetSummary: emptyBalancePaymentSummary,
      wealthPortfolio: { assets: [], liabilities: [] },
      wealthSummary: emptyWealthSummary,
      statements: [...this.statements],
      transactions,
      uploadedStatementNames: this.statements.map((statement) => statement.source),
      importSummary: {
        files: this.statements.length,
        rows: this.statements.reduce((total, statement) => total + statement.totalRows, 0),
        payments: this.statements.reduce((total, statement) => total + statement.paymentRows, 0),
        skipped: this.statements.reduce((total, statement) => total + statement.skippedRows, 0),
        duplicates: duplicateCount,
        formats: Array.from(new Set(this.statements.map((statement) => statement.format)))
      }
    };
  }

  private transactionKey(transaction: StoredStatement['transactions'][number]): string {
    return [transaction.date, transaction.merchant, transaction.amount.toFixed(2), transaction.currency, transaction.source].join('|');
  }

  private parseStatement(content: string, source: string): ParsedStatement {
    const rows = content.trim().split(/\r?\n/).slice(1).filter(Boolean);
    const transactions: Transaction[] = rows.map((row, index) => {
      const [date, merchant, amount, category] = row.split(',');

      return {
        id: index + 1,
        date: date ?? '',
        merchant: merchant ?? '',
        amount: Math.abs(Number(amount)),
        category: category ?? 'Uncategorized',
        currency: 'USD' as const,
        source
      };
    }).filter((transaction) => transaction.date && transaction.merchant && Number.isFinite(transaction.amount));

    return {
      source,
      transactions,
      totalRows: rows.length,
      paymentRows: 0,
      skippedRows: rows.length - transactions.length,
      format: 'CSV'
    };
  }
}

describe('BudgetStoreService', () => {
  let api: MemoryApiClientService;
  let store: BudgetStoreService;

  beforeEach(() => {
    api = new MemoryApiClientService();

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiClientService, useValue: api }
      ]
    });

    store = TestBed.inject(BudgetStoreService);
  });

  it('should start without sample statement transactions', async () => {
    await Promise.resolve();

    expect(store.transactions()).toEqual([]);
    expect(store.uploadedStatementNames()).toEqual([]);
  });

  it('should append pasted statements and persist them', async () => {
    await Promise.resolve();

    store.statementDraft.set(`Date,Description,Amount,Category
2026-05-04,Blue Bottle,-16.20,Dining`);
    await store.importStatementText();

    store.statementDraft.set(`Date,Description,Amount,Category
2026-05-05,City Grocer,-42.10,Groceries`);
    await store.importStatementText();

    expect(store.transactions().length).toBe(2);
    expect(store.transactions().map((transaction) => transaction.merchant)).toEqual(['Blue Bottle', 'City Grocer']);
    expect(store.importSummary().files).toBe(2);
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.statements.length).toBe(2);
  });

  it('should skip duplicate transactions across stored statements', async () => {
    await Promise.resolve();

    store.statementDraft.set(`Date,Description,Amount,Category
2026-05-04,Blue Bottle,-16.20,Dining`);
    await store.importStatementText();
    await store.importStatementText();

    expect(store.transactions().length).toBe(1);
    expect(store.importSummary().duplicates).toBe(1);
    expect(store.importStatus()).toBe('[SIN CARGOS NUEVOS: YA EXISTEN]');
  });

  it('should request the backend budget summary email', async () => {
    await Promise.resolve();

    await store.sendBudgetSummaryEmail();

    expect(api.post).toHaveBeenCalledWith('/api/budget-summary-email');
    expect(store.budgetEmailStatus()).toBe('[RESUMEN ENVIADO]');
    expect(store.sendingBudgetEmail()).toBeFalse();
  });
});