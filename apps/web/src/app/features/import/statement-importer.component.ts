import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BudgetStoreService } from '../../core/services/budget-store.service';

@Component({
  selector: 'app-statement-importer',
  imports: [FormsModule],
  templateUrl: './statement-importer.component.html'
})
export class StatementImporterComponent {
  readonly store = inject(BudgetStoreService);

  async handleFileImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    await this.store.importFiles(Array.from(input.files ?? []));
    input.value = '';
  }
}