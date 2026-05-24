import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AppState, Budget, CurrencyAmount, CurrencyCode, ImportResponse, ImportSummary, StatementFilePayload, StoredStatement, Theme, Transaction, emptyImportSummary } from '../models/budget.models';
import { ApiClientService } from './api-client.service';
import { SpendingAnalyticsService } from './spending-analytics.service';

interface BudgetSummaryEmailResponse {
  status: string;
  id: string | null;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class BudgetStoreService {
  readonly title = 'Señal de Presupuesto';
  readonly transactions = signal<Transaction[]>([]);
  readonly budgets = signal<Budget[]>([]);
  readonly theme = signal<Theme>('dark');
  readonly importStatus = signal('[SIN DATOS CARGADOS]');
  readonly budgetEmailStatus = signal('');
  readonly sendingBudgetEmail = signal(false);
  readonly importSummary = signal<ImportSummary>(emptyImportSummary);
  readonly uploadedStatementNames = signal<string[]>([]);
  readonly statementDraft = signal('');
  readonly storedStatements = signal<StoredStatement[]>([]);

  private readonly api = inject(ApiClientService);
  private readonly analytics = inject(SpendingAnalyticsService);
  private readonly backendReady = signal(false);
  private readonly currencyFormatters: Record<CurrencyCode, Intl.NumberFormat> = {
    DOP: new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  };

  readonly spendTotalsByCurrency = computed(() => this.analytics.calculateCurrencyTotals(this.transactions()));
  readonly totalBudgetByCurrency = computed(() => this.calculateBudgetTotalsByCurrency(this.budgets()));
  readonly totalSpend = computed(() => this.spendTotalsByCurrency().reduce((total, value) => total + value.amount, 0));
  readonly totalBudget = computed(() => this.totalBudgetByCurrency().reduce((total, value) => total + value.amount, 0));
  readonly budgetUsage = computed(() => this.calculateHighestBudgetUsage());
  readonly remainingBudgetByCurrency = computed(() => this.calculateRemainingBudgetByCurrency());
  readonly remainingBudget = computed(() => this.remainingBudgetByCurrency().reduce((total, value) => total + value.amount, 0));
  readonly hasNegativeRemainingBudget = computed(() => this.remainingBudgetByCurrency().some((remaining) => remaining.amount < 0));
  readonly primaryCurrency = computed<CurrencyCode>(() => this.spendTotalsByCurrency()[0]?.currency ?? this.totalBudgetByCurrency()[0]?.currency ?? 'USD');
  readonly sourceCount = computed(() => new Set(this.transactions().map((transaction) => transaction.source)).size);
  readonly categoryTotals = computed(() => this.analytics.calculateCategoryTotals(this.transactions()));
  readonly merchantTotals = computed(() => this.analytics.calculateMerchantTotals(this.transactions()));
  readonly monthlyTotals = computed(() => this.analytics.calculateMonthlyTotals(this.transactions()));
  readonly budgetProgress = computed(() => this.analytics.calculateBudgetProgress(this.budgets(), this.categoryTotals()));
  readonly overLimitCount = computed(() => this.budgetProgress().filter((budget) => budget.ratio > 1).length);
  readonly unbudgetedSpend = computed(() => this.analytics.calculateUnbudgetedSpend(this.budgets(), this.categoryTotals()));
  readonly averageDailySpend = computed(() => this.analytics.calculateAverageDailySpend(this.transactions(), this.totalSpend()));
  readonly averageDailySpendByCurrency = computed(() => this.calculateDailySpendByCurrency());
  readonly projectedSpend = computed(() => this.averageDailySpend() * 30);
  readonly projectedSpendByCurrency = computed(() => this.averageDailySpendByCurrency().map((value) => ({ ...value, amount: value.amount * 30 })));
  readonly recentTransactions = computed(() => [...this.transactions()].sort((first, second) => second.date.localeCompare(first.date)).slice(0, 8));
  readonly largestTransactions = computed(() => [...this.transactions()].sort((first, second) => second.amount - first.amount).slice(0, 3));
  readonly recurringSignals = computed(() => this.merchantTotals().filter((merchant) => merchant.count > 1).slice(0, 3));
  readonly periodRange = computed(() => this.analytics.calculatePeriodRange(this.transactions()));
  readonly insights = computed(() => this.analytics.buildInsights({
    categoryTotals: this.categoryTotals(),
    merchantTotals: this.merchantTotals(),
    largestTransaction: this.largestTransactions()[0],
    budgetUsage: this.budgetUsage(),
    overLimitCount: this.overLimitCount(),
    unbudgetedSpend: this.unbudgetedSpend(),
    formatCurrency: (value, currency) => this.formatCurrency(value, currency),
    formatCurrencyBreakdown: (values) => this.formatCurrencyBreakdown(values),
    formatCategory: (category) => this.formatCategory(category),
    formatRatio: (value) => this.formatRatio(value)
  }));

  constructor() {
    effect(() => {
      if (!this.backendReady()) {
        return;
      }

      void this.saveTheme(this.theme());
    });
    effect(() => {
      if (!this.backendReady()) {
        return;
      }

      void this.saveBudgets(this.budgets());
    });
    void this.loadState();
  }

  toggleTheme(): void {
    this.theme.update((theme) => theme === 'dark' ? 'light' : 'dark');
  }

  async importStatementText(): Promise<void> {
    this.importStatus.set('[ANALIZANDO ESTADO]');

    try {
      const response = await this.api.post<ImportResponse>('/api/statements/import-text', {
        content: this.statementDraft(),
        sourceLabel: 'Estado pegado'
      });
      this.applyImportResponse(response);
    } catch {
      this.importStatus.set('[ERROR: API NO DISPONIBLE]');
    }
  }

  async importFiles(files: File[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    this.importStatus.set('[LEYENDO ESTADOS]');

    try {
      const filePayloads = await Promise.all(files.map((file) => this.readStatementFilePayload(file)));
      const response = await this.api.post<ImportResponse>('/api/statements/import-files', { files: filePayloads });
      this.applyImportResponse(response);
    } catch {
      this.importStatus.set('[ERROR: NO SE PUDIERON IMPORTAR ARCHIVOS]');
    }
  }

  async loadSampleData(): Promise<void> {
    this.importStatus.set('[CARGANDO EJEMPLO]');

    try {
      const response = await this.api.post<ImportResponse>('/api/statements/sample');
      this.applyImportResponse(response);
    } catch {
      this.importStatus.set('[ERROR: API NO DISPONIBLE]');
    }
  }

  async clearTransactions(): Promise<void> {
    try {
      const response = await this.api.delete<ImportResponse>('/api/statements');
      this.applyImportResponse(response);
    } catch {
      this.importStatus.set('[ERROR: NO SE PUDO LIMPIAR API]');
    }
  }

  async sendBudgetSummaryEmail(): Promise<void> {
    if (this.sendingBudgetEmail()) {
      return;
    }

    this.sendingBudgetEmail.set(true);
    this.budgetEmailStatus.set('[ENVIANDO RESUMEN]');

    try {
      const response = await this.api.post<BudgetSummaryEmailResponse>('/api/budget-summary-email');
      this.budgetEmailStatus.set(response.status || '[RESUMEN ENVIADO]');
    } catch (error) {
      this.budgetEmailStatus.set(this.emailErrorStatus(error));
    } finally {
      this.sendingBudgetEmail.set(false);
    }
  }

  formatCurrency(value: number, currency: CurrencyCode = 'USD'): string {
    return this.currencyFormatters[currency].format(value);
  }

  formatCurrencyBreakdown(values: CurrencyAmount[]): string {
    if (values.length === 0) {
      return this.formatCurrency(0, this.primaryCurrency());
    }

    return values
      .filter((value) => value.amount !== 0)
      .map((value) => this.formatCurrency(value.amount, value.currency))
      .join(' / ') || this.formatCurrency(0, this.primaryCurrency());
  }

  formatTransactionAmount(transaction: Transaction): string {
    return this.formatCurrency(transaction.amount, transaction.currency);
  }

  formatCategory(category: string): string {
    const categoryLabels: Record<string, string> = {
      Dining: 'Restaurantes',
      Education: 'Educación',
      Fees: 'Cargos',
      Fitness: 'Ejercicio',
      'Fuel & Transport': 'Transporte y combustible',
      Groceries: 'Supermercado',
      Health: 'Salud',
      Home: 'Hogar',
      'Personal Care': 'Cuidado personal',
      Shipping: 'Envíos',
      Shopping: 'Compras',
      Subscriptions: 'Suscripciones',
      Transport: 'Transporte',
      Travel: 'Viajes',
      Uncategorized: 'Sin categoría',
      Utilities: 'Servicios'
    };

    return categoryLabels[category] ?? category;
  }

  formatRatio(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  filledSegments(ratio: number, totalSegments: number): number {
    return Math.min(totalSegments, Math.max(0, Math.round(ratio * totalSegments)));
  }

  toneForRatio(ratio: number) {
    return this.analytics.toneForRatio(ratio);
  }

  private async loadState(): Promise<void> {
    try {
      const state = await this.api.get<AppState>('/api/state');
      this.applyState(state);
      this.importStatus.set(this.statusForStoredStatements(state.statements));
      this.backendReady.set(true);
    } catch {
      this.importStatus.set('[ERROR: API NO DISPONIBLE]');
    }
  }

  private applyImportResponse(response: ImportResponse): void {
    this.applyState(response.state);
    this.importStatus.set(response.status);

    if (response.statementDraft !== undefined) {
      this.statementDraft.set(response.statementDraft);
    }
  }

  private applyState(state: AppState): void {
    this.theme.set(state.theme === 'light' ? 'light' : 'dark');
    this.budgets.set(Array.isArray(state.budgets) ? state.budgets : []);
    this.storedStatements.set(Array.isArray(state.statements) ? state.statements : []);
    this.transactions.set(Array.isArray(state.transactions) ? state.transactions : []);
    this.uploadedStatementNames.set(Array.isArray(state.uploadedStatementNames) ? state.uploadedStatementNames : []);
    this.importSummary.set(state.importSummary ?? emptyImportSummary);
  }

  private async saveTheme(theme: Theme): Promise<void> {
    try {
      await this.api.put<{ theme: Theme }>('/api/settings/theme', { theme });
    } catch {
      return;
    }
  }

  private async saveBudgets(budgets: Budget[]): Promise<void> {
    try {
      await this.api.put<{ budgets: Budget[] }>('/api/budgets', { budgets });
    } catch {
      return;
    }
  }

  private emailErrorStatus(error: unknown): string {
    const message = error instanceof Error ? error.message : '';

    if (message.includes('RESEND_API_KEY') || message.includes('BUDGET_SUMMARY_EMAIL_TO')) {
      return '[CONFIGURA EMAIL]';
    }

    return '[ERROR: NO SE PUDO ENVIAR]';
  }

  private readStatementFilePayload(file: File): Promise<StatementFilePayload> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        contentBase64: this.encodeBase64(reader.result)
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private encodeBase64(result: string | ArrayBuffer | null): string {
    if (typeof result === 'string') {
      return btoa(result);
    }

    if (!result) {
      return '';
    }

    const bytes = new Uint8Array(result);
    const chunkSize = 32_768;
    let binary = '';

    for (let byteIndex = 0; byteIndex < bytes.length; byteIndex += chunkSize) {
      const chunk = bytes.subarray(byteIndex, byteIndex + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  }

  private statusForStoredStatements(statements: StoredStatement[]): string {
    if (statements.length === 0) {
      return '[SIN DATOS CARGADOS]';
    }

    return `[${statements.length} ESTADO${statements.length === 1 ? '' : 'S'} GUARDADO${statements.length === 1 ? '' : 'S'}]`;
  }

  private calculateBudgetTotalsByCurrency(budgets: Budget[]): CurrencyAmount[] {
    const totals = new Map<CurrencyCode, number>();

    for (const budget of budgets) {
      totals.set(budget.currency, (totals.get(budget.currency) ?? 0) + budget.limit);
    }

    return this.sortCurrencyAmounts(Array.from(totals, ([currency, amount]) => ({ currency, amount })));
  }

  private calculateRemainingBudgetByCurrency(): CurrencyAmount[] {
    const budgetTotals = new Map(this.totalBudgetByCurrency().map((value) => [value.currency, value.amount]));
    const spendTotals = new Map(this.spendTotalsByCurrency().map((value) => [value.currency, value.amount]));
    const currencies = new Set<CurrencyCode>([...budgetTotals.keys(), ...spendTotals.keys()]);

    return this.sortCurrencyAmounts(Array.from(currencies, (currency) => ({
      currency,
      amount: (budgetTotals.get(currency) ?? 0) - (spendTotals.get(currency) ?? 0)
    })));
  }

  private calculateHighestBudgetUsage(): number {
    const budgetTotals = new Map(this.totalBudgetByCurrency().map((value) => [value.currency, value.amount]));

    return this.spendTotalsByCurrency().reduce((highestUsage, spendTotal) => {
      const budgetTotal = budgetTotals.get(spendTotal.currency) ?? 0;
      const usage = budgetTotal > 0 ? spendTotal.amount / budgetTotal : 0;

      return Math.max(highestUsage, usage);
    }, 0);
  }

  private calculateDailySpendByCurrency(): CurrencyAmount[] {
    const dates = this.transactions()
      .map((transaction) => new Date(`${transaction.date}T00:00:00`))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((first, second) => first.getTime() - second.getTime());

    if (dates.length === 0) {
      return [];
    }

    const dayCount = Math.max(1, Math.round((dates[dates.length - 1].getTime() - dates[0].getTime()) / 86_400_000) + 1);

    return this.spendTotalsByCurrency().map((value) => ({ ...value, amount: value.amount / dayCount }));
  }

  private sortCurrencyAmounts(values: CurrencyAmount[]): CurrencyAmount[] {
    const order: CurrencyCode[] = ['DOP', 'USD'];
    return values.sort((first, second) => order.indexOf(first.currency) - order.indexOf(second.currency));
  }

  private budgetKey(budget: Budget): string {
    return this.categoryCurrencyKey(budget.category, budget.currency);
  }

  private categoryCurrencyKey(category: string, currency: CurrencyCode): string {
    return `${category.toLowerCase()}|${currency}`;
  }

  private isCurrencyCode(value: unknown): value is CurrencyCode {
    return value === 'USD' || value === 'DOP';
  }
}