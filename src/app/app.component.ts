import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { BudgetStoreService } from './core/services/budget-store.service';
import { ConversionBudgetService } from './core/services/conversion-budget.service';
import { PersonalBudgetService } from './core/services/personal-budget.service';
import { WealthPositionService } from './core/services/wealth-position.service';
import { BudgetPressureBarComponent } from './shared/budget-pressure-bar.component';
import { ConversionBudgetComponent } from './features/conversion-budget/conversion-budget.component';
import { DashboardChartsComponent } from './features/dashboard/dashboard-charts.component';
import { DashboardSummaryComponent } from './features/dashboard/dashboard-summary.component';
import { InsightGridComponent } from './features/dashboard/insight-grid.component';
import { StatementImporterComponent } from './features/import/statement-importer.component';
import { PersonalBudgetComponent } from './features/personal-budget/personal-budget.component';
import { SpendingAnalysisComponent } from './features/spending/spending-analysis.component';
import { RecentTransactionsComponent } from './features/transactions/recent-transactions.component';
import { WealthPositionComponent } from './features/wealth/wealth-position.component';

type AppView = 'budget' | 'payment' | 'wealth' | 'import';
type BudgetSignalLevel = '1' | '2' | '3' | '4' | '5';

const budgetSignalBaseRemaining = 120000;
const budgetSignalBands = 5;
const budgetSignalColors: Record<BudgetSignalLevel, string> = {
  '1': 'var(--accent)',
  '2': '#f97316',
  '3': 'var(--warning)',
  '4': 'var(--interactive)',
  '5': 'var(--success)'
};

@Component({
  selector: 'app-root',
  imports: [
    BudgetPressureBarComponent,
    ConversionBudgetComponent,
    DashboardChartsComponent,
    DashboardSummaryComponent,
    InsightGridComponent,
    StatementImporterComponent,
    PersonalBudgetComponent,
    SpendingAnalysisComponent,
    RecentTransactionsComponent,
    WealthPositionComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  readonly store = inject(BudgetStoreService);
  readonly personalBudget = inject(PersonalBudgetService);
  readonly paymentBalance = inject(ConversionBudgetService);
  readonly wealth = inject(WealthPositionService);
  readonly activeView = signal<AppView>('budget');
  readonly budgetSignalLevel = computed(() => this.levelFromRemaining(this.personalBudget.netTotals()[0]?.amount ?? 0));
  readonly budgetSignalColor = computed(() => budgetSignalColors[this.budgetSignalLevel()]);

  showView(view: AppView): void {
    this.activeView.set(view);
  }

  private levelFromRemaining(remaining: number): BudgetSignalLevel {
    const bandSize = budgetSignalBaseRemaining / budgetSignalBands;

    if (remaining >= budgetSignalBaseRemaining) {
      return '5';
    }

    const level = Math.max(1, budgetSignalBands - Math.ceil((budgetSignalBaseRemaining - Math.max(0, remaining)) / bandSize));

    return String(level) as BudgetSignalLevel;
  }
}
