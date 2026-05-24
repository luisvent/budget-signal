import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyAmount, CurrencyCode } from '../../core/models/budget.models';
import { BudgetStoreService } from '../../core/services/budget-store.service';

interface MerchantDrilldownItem {
  key: string;
  merchant: string;
  count: number;
  totals: CurrencyAmount[];
}

@Component({
  selector: 'app-spending-analysis',
  templateUrl: './spending-analysis.component.html'
})
export class SpendingAnalysisComponent {
  readonly store = inject(BudgetStoreService);
  readonly barSegments = Array.from({ length: 18 }, (_, index) => index);
  readonly selectedMerchant = signal<string | null>(null);

  readonly merchantList = computed<MerchantDrilldownItem[]>(() => {
    const totalsByMerchant = new Map<string, { merchant: string; count: number; totals: Map<CurrencyCode, number> }>();

    for (const transaction of this.store.transactions()) {
      const key = this.merchantKey(transaction.merchant);
      const current = totalsByMerchant.get(key) ?? { merchant: transaction.merchant, count: 0, totals: new Map<CurrencyCode, number>() };
      current.count += 1;
      current.totals.set(transaction.currency, (current.totals.get(transaction.currency) ?? 0) + transaction.amount);
      totalsByMerchant.set(key, current);
    }

    return Array.from(totalsByMerchant, ([key, merchant]) => ({
      key,
      merchant: merchant.merchant,
      count: merchant.count,
      totals: this.sortCurrencyAmounts(Array.from(merchant.totals, ([currency, amount]) => ({ currency, amount })))
    })).sort((first, second) => second.count - first.count || this.totalAmount(second.totals) - this.totalAmount(first.totals));
  });

  readonly activeMerchant = computed(() => {
    const selectedMerchant = this.selectedMerchant();

    if (!selectedMerchant) {
      return null;
    }

    return this.merchantList().find((merchant) => merchant.key === selectedMerchant) ?? null;
  });

  readonly activeMerchantTransactions = computed(() => {
    const activeMerchant = this.activeMerchant();

    if (!activeMerchant) {
      return [];
    }

    return this.store.transactions()
      .filter((transaction) => this.merchantKey(transaction.merchant) === activeMerchant.key)
      .sort((first, second) => second.date.localeCompare(first.date) || second.amount - first.amount);
  });

  selectMerchant(merchantKey: string): void {
    this.selectedMerchant.set(merchantKey);
  }

  private merchantKey(merchant: string): string {
    return merchant.toLowerCase();
  }

  private sortCurrencyAmounts(values: CurrencyAmount[]): CurrencyAmount[] {
    const order: CurrencyCode[] = ['DOP', 'USD'];
    return values.sort((first, second) => order.indexOf(first.currency) - order.indexOf(second.currency));
  }

  private totalAmount(values: CurrencyAmount[]): number {
    return values.reduce((total, value) => total + value.amount, 0);
  }
}