import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyCode, WealthAssetCategory, WealthLiabilityCategory } from '../../core/models/budget.models';
import { WealthPositionService } from '../../core/services/wealth-position.service';
import { MoneyInputDirective } from '../../shared/money-input.directive';

@Component({
  selector: 'app-wealth-position',
  imports: [CommonModule, FormsModule, MoneyInputDirective],
  templateUrl: './wealth-position.component.html',
  styleUrl: './wealth-position.component.scss'
})
export class WealthPositionComponent {
  readonly wealth = inject(WealthPositionService);

  readonly addingAsset = signal(false);
  readonly assetName = signal('');
  readonly assetCategory = signal<WealthAssetCategory>('savings');
  readonly assetAmount = signal(0);
  readonly assetCurrency = signal<CurrencyCode>('DOP');

  readonly addingLiability = signal(false);
  readonly liabilityName = signal('');
  readonly liabilityCategory = signal<WealthLiabilityCategory>('mortgage');
  readonly liabilityAmount = signal(0);
  readonly liabilityCurrency = signal<CurrencyCode>('DOP');
  readonly liabilityInterestRate = signal(0);
  readonly liabilityMonthlyPayment = signal(0);

  readonly assetChartItems = computed(() => {
    const assetBreakdown = this.wealth.summary().assetBreakdown;
    const maxAmount = Math.max(...assetBreakdown.map((item) => item.amountDop), 1);

    return assetBreakdown.map((item) => ({
      id: `asset-${item.category}`,
      label: this.wealth.assetCategoryLabel(item.category),
      amountDop: item.amountDop,
      ratio: item.amountDop / maxAmount
    }));
  });
  readonly hasPortfolio = computed(() => this.wealth.assets().length > 0 || this.wealth.liabilities().length > 0);
  readonly hasAssets = computed(() => this.wealth.assets().length > 0);
  readonly currentSituation = computed(() => this.wealth.summary().analysisSections.find((section) => section.id === 'executive')?.body ?? this.wealth.summary().message);

  showAssetForm(): void {
    this.addingAsset.set(true);
  }

  showLiabilityForm(): void {
    this.addingLiability.set(true);
  }

  cancelAsset(): void {
    this.assetName.set('');
    this.assetCategory.set('savings');
    this.assetAmount.set(0);
    this.assetCurrency.set('DOP');
    this.addingAsset.set(false);
  }

  cancelLiability(): void {
    this.liabilityName.set('');
    this.liabilityCategory.set('mortgage');
    this.liabilityAmount.set(0);
    this.liabilityCurrency.set('DOP');
    this.liabilityInterestRate.set(0);
    this.liabilityMonthlyPayment.set(0);
    this.addingLiability.set(false);
  }

  addAsset(): void {
    const added = this.wealth.addAsset(this.assetName(), this.assetCategory(), this.assetAmount(), this.assetCurrency());

    if (added) {
      this.cancelAsset();
    }
  }

  addLiability(): void {
    const added = this.wealth.addLiability(
      this.liabilityName(),
      this.liabilityCategory(),
      this.liabilityAmount(),
      this.liabilityCurrency(),
      this.liabilityInterestRate(),
      this.liabilityMonthlyPayment()
    );

    if (added) {
      this.cancelLiability();
    }
  }

  setAssetCategory(value: string): void {
    if (this.wealth.assetCategories.some((option) => option.value === value)) {
      this.assetCategory.set(value as WealthAssetCategory);
    }
  }

  setAssetCurrency(value: string): void {
    if (value === 'DOP' || value === 'USD') {
      this.assetCurrency.set(value);
    }
  }

  setLiabilityCategory(value: string): void {
    if (this.wealth.liabilityCategories.some((option) => option.value === value)) {
      this.liabilityCategory.set(value as WealthLiabilityCategory);
    }
  }

  setLiabilityCurrency(value: string): void {
    if (value === 'DOP' || value === 'USD') {
      this.liabilityCurrency.set(value);
    }
  }
}