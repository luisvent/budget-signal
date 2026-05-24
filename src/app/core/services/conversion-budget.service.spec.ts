import { TestBed } from '@angular/core/testing';
import { ConversionBudgetSnapshot, emptyBalancePaymentSummary } from '../models/budget.models';
import { ApiClientService } from './api-client.service';
import { ConversionBudgetService } from './conversion-budget.service';

const backendConversionBudget: ConversionBudgetSnapshot = {
  sourceAmount: 0,
  sourceCurrency: 'USD',
  afterConversionAddition: 0,
  sourceDeductions: [
    { id: 'source-apt-pp', name: 'Apt PP', amount: 0 },
    { id: 'source-tarjeta-usd', name: 'Tarjeta USD', amount: 0 },
    { id: 'source-tarjeta-lea-usd', name: 'Tarjeta Lea USD', amount: 0 },
    { id: 'source-tarjeta-acap-usd', name: 'Tarjeta ACAP USD', amount: 0 },
    { id: 'source-maestria', name: 'MAestria', amount: 0 }
  ],
  dopDeductions: [
    { id: 'dop-tarjeta-luis', name: 'Tarjeta Luis', amount: 0 },
    { id: 'dop-tarjeta-isi', name: 'Tarjeta ISI', amount: 0 },
    { id: 'dop-tarjeta-lea', name: 'Tarjeta Lea', amount: 0 },
    { id: 'dop-tarjeta-acap', name: 'Tarjeta ACAP', amount: 0 }
  ]
};

class ConversionBudgetApiStub {
  readonly snapshot = backendConversionBudget;

  async get(): Promise<unknown> {
    return { budget: clone(this.snapshot), summary: emptyBalancePaymentSummary };
  }

  async put(): Promise<unknown> {
    return { budget: this.snapshot, summary: emptyBalancePaymentSummary };
  }
}

describe('ConversionBudgetService', () => {
  let store: ConversionBudgetService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClientService, useClass: ConversionBudgetApiStub }]
    });
    store = TestBed.inject(ConversionBudgetService);
    await Promise.resolve();
  });

  it('should start with the configured conversion categories', () => {
    expect(store.sourceDeductions().map((entry) => entry.name)).toEqual([
      'Apt PP',
      'Tarjeta USD',
      'Tarjeta Lea USD',
      'Tarjeta ACAP USD',
      'MAestria'
    ]);
    expect(store.dopDeductions().map((entry) => entry.name)).toEqual([
      'Tarjeta Luis',
      'Tarjeta ISI',
      'Tarjeta Lea',
      'Tarjeta ACAP'
    ]);
  });

  it('should subtract the source fee and source categories, convert USD to DOP, then subtract DOP categories', () => {
    store.updateSourceAmount(1000);
    store.updateSourceCurrency('USD');
    store.updateSourceDeduction('source-apt-pp', 100);
    store.updateSourceDeduction('source-tarjeta-usd', 50);
    store.updateDopDeduction('dop-tarjeta-luis', 10000);
    store.updateDopDeduction('dop-tarjeta-isi', 5000);

    expect(store.sourceFeeAmount()).toBe(25);
    expect(store.sourceNetAmount()).toBe(975);
    expect(store.sourceRemaining()).toBe(825);
    expect(store.convertedDopAmount()).toBe(49500);
    expect(store.finalDopResult()).toBe(34500);
  });

  it('should apply the USD fixed fee equivalent when source amounts are DOP', () => {
    store.updateSourceAmount(100000);
    store.updateSourceCurrency('DOP');
    store.updateSourceDeduction('source-maestria', 10000);
    store.updateDopDeduction('dop-tarjeta-acap', 5000);

    expect(store.sourceFeeAmount()).toBe(2220);
    expect(store.sourceNetAmount()).toBe(97780);
    expect(store.convertedDopAmount()).toBe(87780);
    expect(store.finalDopResult()).toBe(82780);
  });

  it('should add the after-conversion entry before final DOP deductions', () => {
    store.updateSourceAmount(1000);
    store.updateSourceDeduction('source-apt-pp', 100);
    store.updateAfterConversionAddition(6000);
    store.updateDopDeduction('dop-tarjeta-luis', 10000);

    expect(store.convertedDopAmount()).toBe(52500);
    expect(store.afterConversionTotal()).toBe(58500);
    expect(store.afterConversionTotalUsd()).toBe(975);
    expect(store.finalDopResult()).toBe(48500);
  });

  it('should total cash needed only from selected USD and DOP card categories', () => {
    store.updateSourceDeduction('source-apt-pp', 999);
    store.updateSourceDeduction('source-tarjeta-usd', 100);
    store.updateSourceDeduction('source-tarjeta-lea-usd', 200);
    store.updateSourceDeduction('source-tarjeta-acap-usd', 300);
    store.updateSourceDeduction('source-maestria', 888);
    store.updateDopDeduction('dop-tarjeta-luis', 10000);
    store.updateDopDeduction('dop-tarjeta-isi', 20000);
    store.updateDopDeduction('dop-tarjeta-lea', 30000);
    store.updateDopDeduction('dop-tarjeta-acap', 40000);

    expect(store.cashNeededUsd()).toBe(600);
    expect(store.cashNeededDop()).toBe(100000);
    expect(store.cashNeededDopUsd()).toBe(100000 / 60);
  });

  it('should expose the backend generated payment balance summary', () => {
    expect(store.summary().message).toContain('dinero generado');
    expect(store.summary().finalDopResult).toBe(0);
  });

  it('should allow custom before-conversion categories', () => {
    store.updateSourceAmount(1000);
    const added = store.addSourceDeduction('Seguro USD', 75);
    const customDeduction = store.sourceDeductions().find((entry) => entry.name === 'Seguro USD');

    expect(added).toBeTrue();
    expect(customDeduction?.custom).toBeTrue();
    expect(store.sourceDeductionTotal()).toBe(75);
    expect(store.finalDopResult()).toBe(54000);

    store.removeSourceDeduction(customDeduction?.id ?? 'missing');
    expect(store.sourceDeductions().some((entry) => entry.name === 'Seguro USD')).toBeFalse();
    expect(store.finalDopResult()).toBe(58500);
  });
});

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}