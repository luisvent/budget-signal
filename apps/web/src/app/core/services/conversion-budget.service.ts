import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  BalancePaymentSummary,
  ConversionBudgetEntry,
  ConversionBudgetResponse,
  ConversionBudgetSnapshot,
  CurrencyCode,
  emptyBalancePaymentSummary
} from '../models/budget.models';
import { ApiClientService } from './api-client.service';
import { BudgetStoreService } from './budget-store.service';

const sourceAdjustmentRate = 0.018;
const sourceFixedFeeUsd = 7;
const cashNeededUsdCategoryIds = new Set(['source-tarjeta-usd', 'source-tarjeta-lea-usd', 'source-tarjeta-acap-usd']);
const cashNeededDopCategoryIds = new Set(['dop-tarjeta-luis', 'dop-tarjeta-isi', 'dop-tarjeta-lea', 'dop-tarjeta-acap']);
const cashNeededUsdCategoryNames = new Set(['tarjeta usd', 'tarjeta lea usd', 'tarjeta acap usd']);
const cashNeededDopCategoryNames = new Set(['tarjeta luis', 'tarjeta isi', 'tarjeta lea', 'tarjeta acap']);

@Injectable({ providedIn: 'root' })
export class ConversionBudgetService {
  private readonly api = inject(ApiClientService);
  private readonly store = inject(BudgetStoreService);
  readonly exchangeRate = this.store.exchangeRate;
  readonly sourceAdjustmentRate = sourceAdjustmentRate;
  readonly sourceFixedFeeUsd = sourceFixedFeeUsd;

  private readonly backendReady = signal(false);
  private readonly currencyFormatters: Record<CurrencyCode, Intl.NumberFormat> = {
    DOP: new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  };

  readonly sourceAmount = signal(0);
  readonly sourceCurrency = signal<CurrencyCode>('USD');
  readonly afterConversionAddition = signal(0);
  readonly sourceDeductions = signal<ConversionBudgetEntry[]>([]);
  readonly dopDeductions = signal<ConversionBudgetEntry[]>([]);
  readonly summary = signal<BalancePaymentSummary>(emptyBalancePaymentSummary);

  readonly sourceFixedFee = computed(() => this.sourceCurrency() === 'USD'
    ? sourceFixedFeeUsd
    : sourceFixedFeeUsd * this.exchangeRate());
  readonly sourceFeeAmount = computed(() => {
    const feeAmount = this.sourceAmount() * sourceAdjustmentRate + this.sourceFixedFee();

    return this.sourceAmount() > 0 ? Math.min(this.sourceAmount(), feeAmount) : 0;
  });
  readonly sourceNetAmount = computed(() => Math.max(0, this.sourceAmount() - this.sourceFeeAmount()));
  readonly sourceDeductionTotal = computed(() => this.calculateTotal(this.sourceDeductions()));
  readonly sourceRemaining = computed(() => this.sourceNetAmount() - this.sourceDeductionTotal());
  readonly convertedDopAmount = computed(() => this.sourceCurrency() === 'USD'
    ? this.sourceRemaining() * this.exchangeRate()
    : this.sourceRemaining());
  readonly afterConversionTotal = computed(() => this.convertedDopAmount() + this.afterConversionAddition());
  readonly afterConversionTotalUsd = computed(() => this.afterConversionTotal() / this.exchangeRate());
  readonly dopDeductionTotal = computed(() => this.calculateTotal(this.dopDeductions()));
  readonly finalDopResult = computed(() => this.afterConversionTotal() - this.dopDeductionTotal());
  readonly finalDopResultUsd = computed(() => this.finalDopResult() / this.exchangeRate());
  readonly cashNeededUsd = computed(() => this.calculateSelectedTotal(this.sourceDeductions(), cashNeededUsdCategoryIds, cashNeededUsdCategoryNames));
  readonly cashNeededDop = computed(() => this.calculateSelectedTotal(this.dopDeductions(), cashNeededDopCategoryIds, cashNeededDopCategoryNames));
  readonly cashNeededDopUsd = computed(() => this.cashNeededDop() / this.exchangeRate());

  constructor() {
    effect(() => {
      if (!this.backendReady()) {
        return;
      }

      void this.saveSnapshot({
        sourceAmount: this.sourceAmount(),
        sourceCurrency: this.sourceCurrency(),
        afterConversionAddition: this.afterConversionAddition(),
        sourceDeductions: this.sourceDeductions(),
        dopDeductions: this.dopDeductions()
      });
    });
    void this.loadSnapshot();
  }

  updateSourceAmount(value: number | string): void {
    this.sourceAmount.set(this.normalizeAmount(value));
  }

  updateSourceCurrency(value: string): void {
    if (this.isCurrencyCode(value)) {
      this.sourceCurrency.set(value);
    }
  }

  updateAfterConversionAddition(value: number | string): void {
    this.afterConversionAddition.set(this.normalizeAmount(value));
  }

  updateSourceDeduction(id: string, value: number | string): void {
    this.updateEntryAmount(this.sourceDeductions, id, value);
  }

  addSourceDeduction(name: string, amount: number | string): boolean {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return false;
    }

    this.sourceDeductions.update((entries) => [...entries, {
      id: this.createEntryId(normalizedName),
      name: normalizedName,
      amount: this.normalizeAmount(amount),
      custom: true
    }]);

    return true;
  }

  removeSourceDeduction(id: string): void {
    this.sourceDeductions.update((entries) => entries.filter((entry) => entry.id !== id || !entry.custom));
  }

  updateDopDeduction(id: string, value: number | string): void {
    this.updateEntryAmount(this.dopDeductions, id, value);
  }

  formatCurrency(value: number, currency: CurrencyCode): string {
    return this.currencyFormatters[currency].format(value);
  }

  formatSourceCurrency(value: number): string {
    return this.formatCurrency(value, this.sourceCurrency());
  }

  formatDop(value: number): string {
    return this.formatCurrency(value, 'DOP');
  }

  private updateEntryAmount(entrySignal: typeof this.sourceDeductions, id: string, value: number | string): void {
    entrySignal.update((entries) => entries.map((entry) => entry.id === id
      ? { ...entry, amount: this.normalizeAmount(value) }
      : entry));
  }

  private calculateTotal(entries: ConversionBudgetEntry[]): number {
    return entries.reduce((total, entry) => total + entry.amount, 0);
  }

  private calculateSelectedTotal(entries: ConversionBudgetEntry[], ids: Set<string>, names: Set<string>): number {
    return entries.reduce((total, entry) => ids.has(entry.id) || names.has(this.normalizeEntryName(entry.name)) ? total + entry.amount : total, 0);
  }

  private normalizeEntryName(name: string): string {
    return name.trim().toLowerCase();
  }

  private applySnapshot(snapshot: ConversionBudgetSnapshot): void {
    this.sourceAmount.set(this.normalizeAmount(snapshot.sourceAmount));
    this.sourceCurrency.set(this.isCurrencyCode(snapshot.sourceCurrency) ? snapshot.sourceCurrency : 'USD');
    this.afterConversionAddition.set(this.normalizeAmount(snapshot.afterConversionAddition));
    this.sourceDeductions.set(this.normalizeEntries(snapshot.sourceDeductions));
    this.dopDeductions.set(this.normalizeEntries(snapshot.dopDeductions));
  }

  private async loadSnapshot(): Promise<void> {
    try {
      const response = await this.api.get<ConversionBudgetResponse | ConversionBudgetSnapshot>('/api/conversion-budget');
      const snapshot = this.extractBudgetSnapshot(response);
      this.applySnapshot(snapshot);
      this.applySummary(response);
      this.backendReady.set(true);
    } catch {
      return;
    }
  }

  private async saveSnapshot(snapshot: ConversionBudgetSnapshot): Promise<void> {
    try {
      const response = await this.api.put<ConversionBudgetResponse | ConversionBudgetSnapshot>('/api/conversion-budget', snapshot);
      this.applySummary(response);
    } catch {
      return;
    }
  }

  private extractBudgetSnapshot(response: ConversionBudgetResponse | ConversionBudgetSnapshot): ConversionBudgetSnapshot {
    return this.isConversionBudgetResponse(response) ? response.budget : response;
  }

  private applySummary(response: ConversionBudgetResponse | ConversionBudgetSnapshot): void {
    if (this.isConversionBudgetResponse(response)) {
      this.summary.set(response.summary);
    }
  }

  private isConversionBudgetResponse(response: ConversionBudgetResponse | ConversionBudgetSnapshot): response is ConversionBudgetResponse {
    return Boolean(response && 'budget' in response && 'summary' in response);
  }

  private normalizeEntries(entries: ConversionBudgetEntry[] | undefined): ConversionBudgetEntry[] {
    return Array.isArray(entries)
      ? entries
        .filter((entry) => entry?.name?.trim())
        .map((entry) => ({
          id: entry.id || this.createEntryId(entry.name),
          name: entry.name.trim(),
          amount: this.normalizeAmount(entry.amount),
          ...(entry.custom ? { custom: true } : {})
        }))
      : [];
  }

  private normalizeAmount(value: number | string): number {
    const amount = Number(value);
    return Number.isFinite(amount) ? Math.max(0, amount) : 0;
  }

  private createEntryId(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'categoria';
    return `source-${slug}-${Date.now().toString(36)}`;
  }

  private isCurrencyCode(value: unknown): value is CurrencyCode {
    return value === 'USD' || value === 'DOP';
  }
}