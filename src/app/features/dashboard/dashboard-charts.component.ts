import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyCode } from '../../core/models/budget.models';
import { BudgetStoreService } from '../../core/services/budget-store.service';

interface CategoryChartItem {
  key: string;
  category: string;
  currency: CurrencyCode;
  spent: number;
  count: number;
  height: number;
  opacity: string;
}

@Component({
  selector: 'app-dashboard-charts',
  templateUrl: './dashboard-charts.component.html'
})
export class DashboardChartsComponent {
  readonly store = inject(BudgetStoreService);
  readonly selectedCategory = signal<string | null>(null);

  readonly categoryChart = computed<CategoryChartItem[]>(() => {
    const categories = this.store.categoryTotals().slice(0, 6);
    const maxSpent = Math.max(...categories.map((category) => category.spent), 1);
    const counts = this.store.transactions().reduce((totalByCategory, transaction) => {
      const key = this.categoryKey(transaction.category, transaction.currency);
      totalByCategory.set(key, (totalByCategory.get(key) ?? 0) + 1);
      return totalByCategory;
    }, new Map<string, number>());

    return categories.map((category, index) => ({
      key: this.categoryKey(category.category, category.currency),
      category: category.category,
      currency: category.currency,
      spent: category.spent,
      count: counts.get(this.categoryKey(category.category, category.currency)) ?? 0,
      height: Math.max(8, Math.round((category.spent / maxSpent) * 100)),
      opacity: Math.max(0.42, 1 - index * 0.1).toFixed(2)
    }));
  });

  readonly activeCategory = computed(() => {
    const selectedCategory = this.selectedCategory();
    const chartItems = this.categoryChart();
    const selectedItem = chartItems.find((item) => item.key === selectedCategory);

    return selectedItem ?? chartItems[0] ?? null;
  });

  readonly activeCategoryLabel = computed(() => {
    const activeCategory = this.activeCategory();
    return activeCategory ? `${this.store.formatCategory(activeCategory.category)} / ${activeCategory.currency}` : 'Sin categoría';
  });

  readonly activeCategoryTotal = computed(() => this.activeCategory());

  readonly activeCategoryTransactions = computed(() => {
    const activeCategory = this.activeCategory();

    if (!activeCategory) {
      return [];
    }

    return this.store.transactions()
      .filter((transaction) => transaction.category === activeCategory.category && transaction.currency === activeCategory.currency)
      .sort((first, second) => second.date.localeCompare(first.date) || second.amount - first.amount);
  });

  selectCategory(categoryKey: string): void {
    this.selectedCategory.set(categoryKey);
  }

  private categoryKey(category: string, currency: CurrencyCode): string {
    return `${category.toLowerCase()}|${currency}`;
  }
}