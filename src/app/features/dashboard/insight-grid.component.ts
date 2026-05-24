import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BudgetStoreService } from '../../core/services/budget-store.service';

@Component({
  selector: 'app-insight-grid',
  imports: [CommonModule],
  templateUrl: './insight-grid.component.html'
})
export class InsightGridComponent {
  readonly store = inject(BudgetStoreService);
}