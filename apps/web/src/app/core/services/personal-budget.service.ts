import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  CurrencyAmount,
  CurrencyCode,
  PersonalBudgetEntry,
  PersonalBudgetResponse,
  PersonalBudgetSnapshot,
  PresupuestoSummary,
  Tone,
  emptyPresupuestoSummary
} from '../models/budget.models';
import { ApiClientService } from './api-client.service';
import { BudgetStoreService } from './budget-store.service';

export interface BudgetPressure {
  score: number;
  tone: Tone;
  label: string;
  remainingPerDay: number;
  baselinePerDay: number;
  detail: string;
}

@Injectable({ providedIn: 'root' })
export class PersonalBudgetService {
  readonly incomes = signal<PersonalBudgetEntry[]>([]);
  readonly expenses = signal<PersonalBudgetEntry[]>([]);
  readonly summary = signal<PresupuestoSummary>(emptyPresupuestoSummary);

  private readonly api = inject(ApiClientService);
  private readonly store = inject(BudgetStoreService);
  private readonly backendReady = signal(false);

  private readonly currencyFormatters: Record<CurrencyCode, Intl.NumberFormat> = {
    DOP: new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  };

  readonly incomeTotals = computed(() => this.calculateTotals(this.incomes()));
  readonly expenseTotals = computed(() => this.calculateTotals(this.expenses()));
  readonly netTotals = computed(() => this.calculateNetTotals());
  readonly pressure = computed(() => this.calculatePressure());

  constructor() {
    effect(() => {
      if (!this.backendReady()) {
        return;
      }

      void this.saveSnapshot({ incomes: this.incomes(), expenses: this.expenses() });
    });
    void this.loadSnapshot();
  }

  updateIncomeAmount(id: string, value: number | string): void {
    this.updateEntryAmount(this.incomes, id, value);
  }

  updateExpenseAmount(id: string, value: number | string): void {
    this.updateEntryAmount(this.expenses, id, value);
  }

  updateIncomeCurrency(id: string, value: string): void {
    this.updateEntryCurrency(this.incomes, id, value);
  }

  updateExpenseCurrency(id: string, value: string): void {
    this.updateEntryCurrency(this.expenses, id, value);
  }

  addExpense(name: string, amount: number | string, currency: CurrencyCode): boolean {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return false;
    }

    const expense: PersonalBudgetEntry = {
      id: this.createEntryId(normalizedName),
      name: normalizedName,
      amount: this.normalizeAmount(amount),
      currency,
      custom: true
    };

    this.expenses.update((expenses) => [...expenses, expense]);
    return true;
  }

  removeExpense(id: string): void {
    this.expenses.update((expenses) => expenses.filter((expense) => expense.id !== id || !expense.custom));
  }

  formatCurrency(value: number, currency: CurrencyCode): string {
    return this.currencyFormatters[currency].format(value);
  }

  formatCurrencyBreakdown(values: CurrencyAmount[]): string {
    return values.map((value) => this.formatCurrency(value.amount, value.currency)).join(' / ');
  }

  private calculateTotals(entries: PersonalBudgetEntry[]): CurrencyAmount[] {
    const amount = entries.reduce((total, entry) => total + this.convertToDop(entry), 0);
    return [{ currency: 'DOP', amount }];
  }

  private calculateNetTotals(): CurrencyAmount[] {
    const incomeTotal = this.incomeTotals()[0]?.amount ?? 0;
    const expenseTotal = this.expenseTotals()[0]?.amount ?? 0;

    return [{ currency: 'DOP', amount: incomeTotal - expenseTotal }];
  }

  private convertToDop(entry: PersonalBudgetEntry): number {
    return entry.currency === 'USD' ? entry.amount * this.store.exchangeRate() : entry.amount;
  }

  private calculatePressure(): BudgetPressure {
    const netRemaining = this.netTotals()[0]?.amount ?? 0;
    const incomeTotal = this.incomeTotals()[0]?.amount ?? 0;
    const expenseTotal = this.expenseTotals()[0]?.amount ?? 0;
    const cycle = this.summary().cycle;
    const daysRemaining = Math.max(1, cycle.daysRemaining || 0);
    const cycleLength = Math.max(1, cycle.cycleLengthDays || cycle.daysElapsed + cycle.daysRemaining || 30);
    const remainingPerDay = netRemaining / daysRemaining;
    const baselinePerDay = Math.max(1, (incomeTotal > 0 ? incomeTotal : expenseTotal) / cycleLength);
    const coverage = Math.max(0, Math.min(1, remainingPerDay / baselinePerDay));
    const score = netRemaining < 0 ? 100 : Math.round((1 - coverage) * 100);
    const tone: Tone = score >= 70 ? 'danger' : score >= 40 ? 'warning' : 'success';
    const label = score >= 70 ? 'Alta' : score >= 40 ? 'Media' : 'Baja';
    const dailyText = this.formatCurrency(Math.max(0, remainingPerDay), 'DOP');

    return {
      score,
      tone,
      label,
      remainingPerDay,
      baselinePerDay,
      detail: `${label}: ${dailyText} por día hasta el 27`
    };
  }

  private updateEntryAmount(entrySignal: typeof this.incomes, id: string, value: number | string): void {
    entrySignal.update((entries) => entries.map((entry) => entry.id === id
      ? { ...entry, amount: this.normalizeAmount(value) }
      : entry));
  }

  private updateEntryCurrency(entrySignal: typeof this.incomes, id: string, value: string): void {
    if (!this.isCurrencyCode(value)) {
      return;
    }

    entrySignal.update((entries) => entries.map((entry) => entry.id === id
      ? { ...entry, currency: value }
      : entry));
  }

  private normalizeAmount(value: number | string): number {
    const amount = Number(value);
    return Number.isFinite(amount) ? Math.max(0, amount) : 0;
  }

  private applySnapshot(snapshot: PersonalBudgetSnapshot): void {
    this.incomes.set(this.normalizeEntries(snapshot.incomes));
    this.expenses.set(this.normalizeEntries(snapshot.expenses));
  }

  private async loadSnapshot(): Promise<void> {
    try {
      const response = await this.api.get<PersonalBudgetResponse | PersonalBudgetSnapshot>('/api/personal-budget');
      const snapshot = this.extractBudgetSnapshot(response);
      this.applySnapshot(snapshot);
      this.applySummary(response);
      this.backendReady.set(true);
    } catch {
      return;
    }
  }

  private async saveSnapshot(snapshot: PersonalBudgetSnapshot): Promise<void> {
    try {
      const response = await this.api.put<PersonalBudgetResponse | PersonalBudgetSnapshot>('/api/personal-budget', snapshot);
      this.applySummary(response);
    } catch {
      return;
    }
  }

  private extractBudgetSnapshot(response: PersonalBudgetResponse | PersonalBudgetSnapshot): PersonalBudgetSnapshot {
    return this.isPersonalBudgetResponse(response) ? response.budget : response;
  }

  private applySummary(response: PersonalBudgetResponse | PersonalBudgetSnapshot): void {
    if (this.isPersonalBudgetResponse(response)) {
      this.summary.set(response.summary);
    }
  }

  private isPersonalBudgetResponse(response: PersonalBudgetResponse | PersonalBudgetSnapshot): response is PersonalBudgetResponse {
    return Boolean(response && 'budget' in response && 'summary' in response);
  }

  private normalizeEntries(entries: PersonalBudgetEntry[] | undefined): PersonalBudgetEntry[] {
    return Array.isArray(entries)
      ? entries
        .filter((entry) => entry?.name?.trim())
        .map((entry) => ({
          id: entry.id || this.createEntryId(entry.name),
          name: entry.name.trim(),
          amount: this.normalizeAmount(entry.amount),
          currency: this.isCurrencyCode(entry.currency) ? entry.currency : 'DOP',
          ...(entry.custom ? { custom: true } : {}),
          ...(entry.hiddenByDefault ? { hiddenByDefault: true } : {})
        }))
      : [];
  }

  private createEntryId(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gasto';
    return `expense-${slug}-${Date.now().toString(36)}`;
  }

  private isCurrencyCode(value: unknown): value is CurrencyCode {
    return value === 'USD' || value === 'DOP';
  }
}