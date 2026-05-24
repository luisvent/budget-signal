import { Component, inject } from '@angular/core';
import { BudgetStoreService } from '../../core/services/budget-store.service';

@Component({
  selector: 'app-recent-transactions',
  templateUrl: './recent-transactions.component.html'
})
export class RecentTransactionsComponent {
  readonly store = inject(BudgetStoreService);
}