import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyCode, PersonalBudgetEntry } from '../../core/models/budget.models';
import { PersonalBudgetService } from '../../core/services/personal-budget.service';
import { BudgetPressureBarComponent } from '../../shared/budget-pressure-bar.component';

type BudgetCategoryImage = {
  readonly src: string;
  readonly alt: string;
  readonly usd?: boolean;
};

const cardImages = {
  cibao: { src: 'images/cibao.png', alt: 'Tarjeta Cibao' },
  isi: { src: 'images/isi.png', alt: 'Tarjeta ISI' },
  platinum: { src: 'images/platinum.png', alt: 'Tarjeta Platinum' }
} as const;

const categoryImages: Record<string, readonly BudgetCategoryImage[]> = {
  'Tarjeta Leonor': [cardImages.platinum, cardImages.cibao],
  'Tarjeta Luis ISI': [cardImages.isi],
  'Tarjeta Platinum': [cardImages.platinum],
  'Tarjeta Luis US': [{ ...cardImages.platinum, usd: true }],
  'Tarjeta Leonor US': [{ ...cardImages.cibao, usd: true }],
  'Tarjeta Luis ACAP': [cardImages.cibao],
  'Tarjeta Luis ACAP US': [{ ...cardImages.cibao, usd: true }]
};

const usdToDopRate = 60;

@Component({
  selector: 'app-personal-budget',
  imports: [CommonModule, FormsModule, BudgetPressureBarComponent],
  templateUrl: './personal-budget.component.html',
  styleUrl: './personal-budget.component.scss'
})
export class PersonalBudgetComponent {
  readonly budget = inject(PersonalBudgetService);
  readonly expenseName = signal('');
  readonly expenseAmount = signal(0);
  readonly expenseCurrency = signal<CurrencyCode>('DOP');
  readonly showFixedExpenses = signal(false);
  readonly addingExpense = signal(false);
  readonly canAddExpense = computed(() => this.expenseName().trim().length > 0);
  readonly fixedExpenseCount = computed(() => this.budget.expenses().filter((expense) => expense.hiddenByDefault).length);
  readonly cycleDaysRemaining = computed(() => this.budget.summary().cycle.daysRemaining);
  readonly cycleDaysLabel = computed(() => {
    const days = this.cycleDaysRemaining();

    if (days === 0) {
      return 'HOY';
    }

    return days === 1 ? '1 DÍA' : `${days} DÍAS`;
  });
  readonly cycleCaption = computed(() => {
    const days = this.cycleDaysRemaining();

    if (days === 0) {
      return 'Cierra hoy el ciclo del 27';
    }

    if (days === 1) {
      return 'Último día para ajustar el mes';
    }

    return 'Quedan para ajustar el mes';
  });
  readonly cycleTone = computed(() => {
    const days = this.cycleDaysRemaining();

    if (days <= 3) {
      return 'danger';
    }

    if (days <= 7) {
      return 'warning';
    }

    return 'success';
  });
  readonly displayedExpenses = computed(() => this.showFixedExpenses()
    ? this.budget.expenses()
    : this.budget.expenses().filter((expense) => !expense.hiddenByDefault));

  toggleFixedExpenses(): void {
    this.showFixedExpenses.update((visible) => !visible);
  }

  showExpenseForm(): void {
    this.addingExpense.set(true);
  }

  cancelExpense(): void {
    this.resetExpenseForm();
    this.addingExpense.set(false);
  }

  addExpense(): void {
    const added = this.budget.addExpense(this.expenseName(), this.expenseAmount(), this.expenseCurrency());

    if (!added) {
      return;
    }

    this.cancelExpense();
  }

  private resetExpenseForm(): void {
    this.expenseName.set('');
    this.expenseAmount.set(0);
    this.expenseCurrency.set('DOP');
  }

  setExpenseCurrency(currency: string): void {
    if (currency === 'DOP' || currency === 'USD') {
      this.expenseCurrency.set(currency);
    }
  }

  categoryImages(name: string): readonly BudgetCategoryImage[] {
    return categoryImages[name] ?? [];
  }

  expenseLevel(expense: PersonalBudgetEntry): 1 | 2 | 3 | 4 | 5 {
    const amountDop = expense.currency === 'USD' ? expense.amount * usdToDopRate : expense.amount;

    if (amountDop < 10000) {
      return 1;
    }

    if (amountDop < 20000) {
      return 2;
    }

    if (amountDop < 50000) {
      return 3;
    }

    if (amountDop < 85000) {
      return 4;
    }

    return 5;
  }
}