import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConversionBudgetService } from '../../core/services/conversion-budget.service';

@Component({
  selector: 'app-conversion-budget',
  imports: [CommonModule, FormsModule],
  templateUrl: './conversion-budget.component.html'
})
export class ConversionBudgetComponent {
  readonly flow = inject(ConversionBudgetService);
  readonly sourceDeductionName = signal('');
  readonly sourceDeductionAmount = signal(0);
  readonly addingSourceDeduction = signal(false);
  readonly canAddSourceDeduction = computed(() => this.sourceDeductionName().trim().length > 0);

  showSourceDeductionForm(): void {
    this.addingSourceDeduction.set(true);
  }

  cancelSourceDeduction(): void {
    this.resetSourceDeductionForm();
    this.addingSourceDeduction.set(false);
  }

  addSourceDeduction(): void {
    const added = this.flow.addSourceDeduction(this.sourceDeductionName(), this.sourceDeductionAmount());

    if (!added) {
      return;
    }

    this.cancelSourceDeduction();
  }

  private resetSourceDeductionForm(): void {
    this.sourceDeductionName.set('');
    this.sourceDeductionAmount.set(0);
  }
}