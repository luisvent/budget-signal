import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BudgetStoreService } from '../../core/services/budget-store.service';

@Component({
  selector: 'app-dashboard-summary',
  imports: [CommonModule],
  templateUrl: './dashboard-summary.component.html'
})
export class DashboardSummaryComponent {
  readonly store = inject(BudgetStoreService);
  readonly heroSegments = Array.from({ length: 24 }, (_, index) => index);
}