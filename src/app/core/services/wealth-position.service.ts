import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  CurrencyCode,
  WealthAsset,
  WealthAssetCategory,
  WealthLiability,
  WealthLiabilityCategory,
  WealthPortfolioResponse,
  WealthPortfolioSnapshot,
  WealthSummary,
  emptyWealthSummary
} from '../models/budget.models';
import { ApiClientService } from './api-client.service';

export interface WealthCategoryOption<TCategory extends string> {
  value: TCategory;
  label: string;
}

export interface WealthChartItem {
  id: string;
  kind: 'asset' | 'liability';
  category: string;
  label: string;
  amountDop: number;
  ratio: number;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}

@Injectable({ providedIn: 'root' })
export class WealthPositionService {
  readonly assets = signal<WealthAsset[]>([]);
  readonly liabilities = signal<WealthLiability[]>([]);
  readonly summary = signal<WealthSummary>(emptyWealthSummary);

  readonly assetCategories: readonly WealthCategoryOption<WealthAssetCategory>[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'checking', label: 'Cuenta corriente' },
    { value: 'savings', label: 'Ahorros' },
    { value: 'investment', label: 'Inversiones' },
    { value: 'retirement', label: 'Retiro / pensión' },
    { value: 'real-estate', label: 'Inmueble' },
    { value: 'vehicle', label: 'Vehículo' },
    { value: 'business', label: 'Negocio' },
    { value: 'other', label: 'Otro activo' }
  ];

  readonly liabilityCategories: readonly WealthCategoryOption<WealthLiabilityCategory>[] = [
    { value: 'credit-card', label: 'Tarjeta' },
    { value: 'mortgage', label: 'Hipoteca' },
    { value: 'personal-loan', label: 'Préstamo personal' },
    { value: 'vehicle-loan', label: 'Préstamo vehículo' },
    { value: 'student-loan', label: 'Préstamo estudios' },
    { value: 'business-loan', label: 'Préstamo negocio' },
    { value: 'tax', label: 'Impuesto / legal' },
    { value: 'other', label: 'Otra deuda' }
  ];

  private readonly api = inject(ApiClientService);
  private readonly backendReady = signal(false);
  private readonly currencyFormatters: Record<CurrencyCode, Intl.NumberFormat> = {
    DOP: new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  };
  private readonly ratioFormatter = new Intl.NumberFormat('es-DO', { style: 'percent', maximumFractionDigits: 0 });
  private readonly numberFormatter = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 1 });

  readonly chartItems = computed<WealthChartItem[]>(() => {
    const summary = this.summary();
    const maxAmount = Math.max(
      ...summary.assetBreakdown.map((item) => item.amountDop),
      ...summary.liabilityBreakdown.map((item) => item.amountDop),
      1
    );
    const assetItems = summary.assetBreakdown.map((item) => ({
      id: `asset-${item.category}`,
      kind: 'asset' as const,
      category: item.category,
      label: this.assetCategoryLabel(item.category),
      amountDop: item.amountDop,
      ratio: item.amountDop / maxAmount,
      tone: 'success' as const
    }));
    const liabilityItems = summary.liabilityBreakdown.map((item) => ({
      id: `liability-${item.category}`,
      kind: 'liability' as const,
      category: item.category,
      label: this.liabilityCategoryLabel(item.category),
      amountDop: item.amountDop,
      ratio: item.amountDop / maxAmount,
      tone: 'danger' as const
    }));

    return [...assetItems, ...liabilityItems];
  });

  constructor() {
    effect(() => {
      if (!this.backendReady()) {
        return;
      }

      void this.saveSnapshot({ assets: this.assets(), liabilities: this.liabilities() });
    });
    void this.loadSnapshot();
  }

  addAsset(name: string, category: WealthAssetCategory, amount: number | string, currency: CurrencyCode): boolean {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return false;
    }

    this.assets.update((assets) => [...assets, {
      id: this.createEntryId('asset', normalizedName),
      name: normalizedName,
      category,
      amount: this.normalizeAmount(amount),
      currency
    }]);

    return true;
  }

  addLiability(name: string, category: WealthLiabilityCategory, amount: number | string, currency: CurrencyCode, interestRate: number | string, monthlyPayment: number | string): boolean {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return false;
    }

    this.liabilities.update((liabilities) => [...liabilities, {
      id: this.createEntryId('liability', normalizedName),
      name: normalizedName,
      category,
      amount: this.normalizeAmount(amount),
      currency,
      interestRate: this.normalizeRate(interestRate),
      monthlyPayment: this.normalizeAmount(monthlyPayment)
    }]);

    return true;
  }

  removeAsset(id: string): void {
    this.assets.update((assets) => assets.filter((asset) => asset.id !== id));
  }

  removeLiability(id: string): void {
    this.liabilities.update((liabilities) => liabilities.filter((liability) => liability.id !== id));
  }

  updateAssetAmount(id: string, value: number | string): void {
    this.assets.update((assets) => assets.map((asset) => asset.id === id ? { ...asset, amount: this.normalizeAmount(value) } : asset));
  }

  updateAssetCurrency(id: string, value: string): void {
    if (!this.isCurrencyCode(value)) {
      return;
    }

    this.assets.update((assets) => assets.map((asset) => asset.id === id ? { ...asset, currency: value } : asset));
  }

  updateAssetCategory(id: string, value: string): void {
    if (!this.isAssetCategory(value)) {
      return;
    }

    this.assets.update((assets) => assets.map((asset) => asset.id === id ? { ...asset, category: value } : asset));
  }

  updateLiabilityAmount(id: string, value: number | string): void {
    this.liabilities.update((liabilities) => liabilities.map((liability) => liability.id === id ? { ...liability, amount: this.normalizeAmount(value) } : liability));
  }

  updateLiabilityCurrency(id: string, value: string): void {
    if (!this.isCurrencyCode(value)) {
      return;
    }

    this.liabilities.update((liabilities) => liabilities.map((liability) => liability.id === id ? { ...liability, currency: value } : liability));
  }

  updateLiabilityCategory(id: string, value: string): void {
    if (!this.isLiabilityCategory(value)) {
      return;
    }

    this.liabilities.update((liabilities) => liabilities.map((liability) => liability.id === id ? { ...liability, category: value } : liability));
  }

  updateLiabilityInterestRate(id: string, value: number | string): void {
    this.liabilities.update((liabilities) => liabilities.map((liability) => liability.id === id ? { ...liability, interestRate: this.normalizeRate(value) } : liability));
  }

  updateLiabilityMonthlyPayment(id: string, value: number | string): void {
    this.liabilities.update((liabilities) => liabilities.map((liability) => liability.id === id ? { ...liability, monthlyPayment: this.normalizeAmount(value) } : liability));
  }

  formatCurrency(value: number, currency: CurrencyCode): string {
    return this.currencyFormatters[currency].format(value);
  }

  formatDop(value: number): string {
    return this.formatCurrency(value, 'DOP');
  }

  formatRatio(value: number | null): string {
    return value === null ? 'N/A' : this.ratioFormatter.format(value);
  }

  formatMonths(value: number | null): string {
    return value === null ? 'N/A' : `${this.numberFormatter.format(value)} meses`;
  }

  assetCategoryLabel(category: string): string {
    return this.assetCategories.find((option) => option.value === category)?.label ?? 'Otro activo';
  }

  liabilityCategoryLabel(category: string): string {
    return this.liabilityCategories.find((option) => option.value === category)?.label ?? 'Otra deuda';
  }

  private async loadSnapshot(): Promise<void> {
    try {
      const response = await this.api.get<WealthPortfolioResponse | WealthPortfolioSnapshot>('/api/wealth');
      const snapshot = this.extractPortfolioSnapshot(response);
      this.applySnapshot(snapshot);
      this.applySummary(response);
      this.backendReady.set(true);
    } catch {
      return;
    }
  }

  private async saveSnapshot(snapshot: WealthPortfolioSnapshot): Promise<void> {
    try {
      const response = await this.api.put<WealthPortfolioResponse | WealthPortfolioSnapshot>('/api/wealth', snapshot);
      this.applySummary(response);
    } catch {
      return;
    }
  }

  private applySnapshot(snapshot: WealthPortfolioSnapshot): void {
    this.assets.set(this.normalizeAssets(snapshot.assets));
    this.liabilities.set(this.normalizeLiabilities(snapshot.liabilities));
  }

  private extractPortfolioSnapshot(response: WealthPortfolioResponse | WealthPortfolioSnapshot): WealthPortfolioSnapshot {
    return this.isWealthPortfolioResponse(response) ? response.portfolio : response;
  }

  private applySummary(response: WealthPortfolioResponse | WealthPortfolioSnapshot): void {
    if (this.isWealthPortfolioResponse(response)) {
      this.summary.set(response.summary);
    }
  }

  private isWealthPortfolioResponse(response: WealthPortfolioResponse | WealthPortfolioSnapshot): response is WealthPortfolioResponse {
    return Boolean(response && 'portfolio' in response && 'summary' in response);
  }

  private normalizeAssets(entries: WealthAsset[] | undefined): WealthAsset[] {
    return Array.isArray(entries)
      ? entries
        .filter((entry) => entry?.name?.trim())
        .map((entry) => ({
          id: entry.id || this.createEntryId('asset', entry.name),
          name: entry.name.trim(),
          category: this.isAssetCategory(entry.category) ? entry.category : 'other',
          amount: this.normalizeAmount(entry.amount),
          currency: this.isCurrencyCode(entry.currency) ? entry.currency : 'DOP'
        }))
      : [];
  }

  private normalizeLiabilities(entries: WealthLiability[] | undefined): WealthLiability[] {
    return Array.isArray(entries)
      ? entries
        .filter((entry) => entry?.name?.trim())
        .map((entry) => ({
          id: entry.id || this.createEntryId('liability', entry.name),
          name: entry.name.trim(),
          category: this.isLiabilityCategory(entry.category) ? entry.category : 'other',
          amount: this.normalizeAmount(entry.amount),
          currency: this.isCurrencyCode(entry.currency) ? entry.currency : 'DOP',
          interestRate: this.normalizeRate(entry.interestRate),
          monthlyPayment: this.normalizeAmount(entry.monthlyPayment)
        }))
      : [];
  }

  private normalizeAmount(value: number | string): number {
    const amount = Number(value);
    return Number.isFinite(amount) ? Math.max(0, amount) : 0;
  }

  private normalizeRate(value: number | string): number {
    const amount = Number(value);
    return Number.isFinite(amount) ? Math.max(0, amount) : 0;
  }

  private createEntryId(prefix: string, name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'entrada';
    return `${prefix}-${slug}-${Date.now().toString(36)}`;
  }

  private isCurrencyCode(value: unknown): value is CurrencyCode {
    return value === 'USD' || value === 'DOP';
  }

  private isAssetCategory(value: unknown): value is WealthAssetCategory {
    return this.assetCategories.some((option) => option.value === value);
  }

  private isLiabilityCategory(value: unknown): value is WealthLiabilityCategory {
    return this.liabilityCategories.some((option) => option.value === value);
  }
}