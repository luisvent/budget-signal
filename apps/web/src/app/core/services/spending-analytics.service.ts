import { Injectable } from '@angular/core';
import { Budget, BudgetProgress, CategoryTotal, CurrencyAmount, CurrencyCode, Insight, MerchantTotal, MonthlyTotal, Tone, Transaction } from '../models/budget.models';

@Injectable({ providedIn: 'root' })
export class SpendingAnalyticsService {
  private readonly shortDateFormatter = new Intl.DateTimeFormat('es-DO', {
    month: 'short',
    day: 'numeric'
  });

  calculateCategoryTotals(transactions: Transaction[]): CategoryTotal[] {
    const totals = new Map<string, CategoryTotal>();

    for (const transaction of transactions) {
      const key = this.currencyKey(transaction.category, transaction.currency);
      const current = totals.get(key) ?? { category: transaction.category, currency: transaction.currency, spent: 0 };
      totals.set(key, { ...current, spent: current.spent + transaction.amount });
    }

    return Array.from(totals.values())
      .sort((first, second) => second.spent - first.spent);
  }

  calculateMerchantTotals(transactions: Transaction[]): MerchantTotal[] {
    const totals = new Map<string, MerchantTotal>();

    for (const transaction of transactions) {
      const key = this.currencyKey(transaction.merchant, transaction.currency);
      const current = totals.get(key) ?? { merchant: transaction.merchant, currency: transaction.currency, spent: 0, count: 0, average: 0 };
      const spent = current.spent + transaction.amount;
      const count = current.count + 1;

      totals.set(key, {
        ...current,
        spent,
        count,
        average: spent / count
      });
    }

    return Array.from(totals.values()).sort((first, second) => second.spent - first.spent);
  }

  calculateMonthlyTotals(transactions: Transaction[]): MonthlyTotal[] {
    const totals = new Map<string, MonthlyTotal>();

    for (const transaction of transactions) {
      const monthKey = transaction.date.slice(0, 7);
      const key = this.currencyKey(monthKey, transaction.currency);
      const current = totals.get(key) ?? { month: monthKey, currency: transaction.currency, spent: 0, count: 0 };
      totals.set(key, {
        ...current,
        spent: current.spent + transaction.amount,
        count: current.count + 1
      });
    }

    return Array.from(totals.values()).sort((first, second) => first.month.localeCompare(second.month) || first.currency.localeCompare(second.currency));
  }

  calculateCurrencyTotals(transactions: Transaction[]): CurrencyAmount[] {
    const totals = new Map<CurrencyCode, number>();

    for (const transaction of transactions) {
      totals.set(transaction.currency, (totals.get(transaction.currency) ?? 0) + transaction.amount);
    }

    return this.sortCurrencyAmounts(Array.from(totals, ([currency, amount]) => ({ currency, amount })));
  }

  calculateBudgetProgress(budgets: Budget[], categoryTotals: CategoryTotal[]): BudgetProgress[] {
    const totals = new Map(categoryTotals.map((category) => [this.currencyKey(category.category, category.currency), category.spent]));

    return budgets
      .map((budget) => {
        const spent = totals.get(this.currencyKey(budget.category, budget.currency)) ?? 0;
        const ratio = budget.limit > 0 ? spent / budget.limit : 0;

        return {
          ...budget,
          spent,
          remaining: budget.limit - spent,
          ratio,
          tone: this.toneForRatio(ratio)
        };
      })
      .sort((first, second) => second.ratio - first.ratio);
  }

  calculateUnbudgetedSpend(budgets: Budget[], categoryTotals: CategoryTotal[]): CurrencyAmount[] {
    const budgetedCategories = new Set(budgets.map((budget) => this.currencyKey(budget.category.toLowerCase(), budget.currency)));
    const totals = new Map<CurrencyCode, number>();

    for (const category of categoryTotals) {
      if (!budgetedCategories.has(this.currencyKey(category.category.toLowerCase(), category.currency))) {
        totals.set(category.currency, (totals.get(category.currency) ?? 0) + category.spent);
      }
    }

    return this.sortCurrencyAmounts(Array.from(totals, ([currency, amount]) => ({ currency, amount })));
  }

  calculateAverageDailySpend(transactions: Transaction[], totalSpend: number): number {
    const dates = this.sortedTransactionDates(transactions);

    if (dates.length === 0) {
      return 0;
    }

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const dayCount = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / 86_400_000) + 1);

    return totalSpend / dayCount;
  }

  calculatePeriodRange(transactions: Transaction[]): string {
    const dates = this.sortedTransactionDates(transactions);

    if (dates.length === 0) {
      return 'SIN PERIODO';
    }

    return `${this.shortDateFormatter.format(dates[0])} - ${this.shortDateFormatter.format(dates[dates.length - 1])}`.toUpperCase();
  }

  buildInsights(options: {
    categoryTotals: CategoryTotal[];
    merchantTotals: MerchantTotal[];
    largestTransaction: Transaction | undefined;
    budgetUsage: number;
    overLimitCount: number;
    unbudgetedSpend: CurrencyAmount[];
    formatCurrency: (value: number, currency: CurrencyCode) => string;
    formatCurrencyBreakdown: (values: CurrencyAmount[]) => string;
    formatCategory: (category: string) => string;
    formatRatio: (value: number) => string;
  }): Insight[] {
    const topCategory = options.categoryTotals[0];
    const topMerchant = options.merchantTotals[0];
    const unbudgetedAmount = options.unbudgetedSpend.reduce((total, value) => total + value.amount, 0);

    return [
      {
        label: 'CATEGORÍA PRINCIPAL',
        value: topCategory ? options.formatCategory(topCategory.category) : 'SIN DATOS',
        detail: topCategory ? `${options.formatCurrency(topCategory.spent, topCategory.currency)} en este ciclo` : 'Importa un estado para empezar',
        tone: 'neutral'
      },
      {
        label: 'PRESIÓN DE PRESUPUESTO',
        value: options.formatRatio(options.budgetUsage),
        detail: options.overLimitCount > 0 ? `${options.overLimitCount} presupuestos sobre el límite` : 'Presupuestos seguidos dentro del límite',
        tone: this.toneForRatio(options.budgetUsage)
      },
      {
        label: 'COMERCIO PRINCIPAL',
        value: topMerchant?.merchant ?? 'NINGUNO',
        detail: topMerchant ? `${options.formatCurrency(topMerchant.spent, topMerchant.currency)} en ${topMerchant.count} movimiento${topMerchant.count === 1 ? '' : 's'}` : 'Sin señal de comercio todavía',
        tone: 'neutral'
      },
      {
        label: 'CARGO MAYOR',
        value: options.largestTransaction?.merchant ?? 'NINGUNO',
        detail: options.largestTransaction ? `${options.formatCurrency(options.largestTransaction.amount, options.largestTransaction.currency)} el ${options.largestTransaction.date}` : 'Sin señal de cargos todavía',
        tone: 'neutral'
      },
      {
        label: 'SIN PRESUPUESTO',
        value: options.formatCurrencyBreakdown(options.unbudgetedSpend),
        detail: unbudgetedAmount > 0 ? 'Crea una línea de presupuesto para cubrirlo' : 'Todas las categorías activas están cubiertas',
        tone: unbudgetedAmount > 0 ? 'warning' : 'success'
      }
    ];
  }

  toneForRatio(ratio: number): Tone {
    if (ratio > 1) {
      return 'danger';
    }

    if (ratio >= 0.85) {
      return 'warning';
    }

    return 'success';
  }

  private sortedTransactionDates(transactions: Transaction[]): Date[] {
    return transactions
      .map((transaction) => this.parseDateValue(transaction.date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((first, second) => first.getTime() - second.getTime());
  }

  private parseDateValue(value: string): Date {
    const trimmedValue = value.trim();
    const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmedValue);

    if (isoMatch) {
      return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    }

    return new Date(trimmedValue);
  }

  private currencyKey(value: string, currency: CurrencyCode): string {
    return `${value.toLowerCase()}|${currency}`;
  }

  private sortCurrencyAmounts(values: CurrencyAmount[]): CurrencyAmount[] {
    const order: CurrencyCode[] = ['DOP', 'USD'];
    return values.sort((first, second) => order.indexOf(first.currency) - order.indexOf(second.currency));
  }
}