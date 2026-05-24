import { Component, input } from '@angular/core';
import { BudgetPressure } from '../core/services/personal-budget.service';

@Component({
  selector: 'app-budget-pressure-bar',
  templateUrl: './budget-pressure-bar.component.html',
  styleUrl: './budget-pressure-bar.component.scss'
})
export class BudgetPressureBarComponent {
  readonly pressure = input.required<BudgetPressure>();
  readonly compact = input(false);
}