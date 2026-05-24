import { TestBed } from '@angular/core/testing';
import { PersonalBudgetSnapshot, emptyPresupuestoSummary } from '../models/budget.models';
import { ApiClientService } from './api-client.service';
import { PersonalBudgetService } from './personal-budget.service';

const fixedExpenseTotalDop = 346560;
const backendPersonalBudget: PersonalBudgetSnapshot = {
  incomes: [
    { id: 'income-leonor', name: 'Leonor', amount: 0, currency: 'DOP' },
    { id: 'income-luis', name: 'Luis', amount: 0, currency: 'DOP' }
  ],
  expenses: [
    { id: 'expense-tarjeta-leonor', name: 'Tarjeta Leonor', amount: 0, currency: 'DOP' },
    { id: 'expense-tarjeta-luis-isi', name: 'Tarjeta Luis ISI', amount: 0, currency: 'DOP' },
    { id: 'expense-tarjeta-platinum', name: 'Tarjeta Platinum', amount: 0, currency: 'DOP' },
    { id: 'expense-tarjeta-luis-us', name: 'Tarjeta Luis US', amount: 0, currency: 'USD' },
    { id: 'expense-tarjeta-leonor-us', name: 'Tarjeta Leonor US', amount: 0, currency: 'USD' },
    { id: 'expense-tarjeta-luis-acap', name: 'Tarjeta Luis ACAP', amount: 0, currency: 'DOP' },
    { id: 'expense-tarjeta-luis-acap-us', name: 'Tarjeta Luis ACAP US', amount: 0, currency: 'USD' },
    { id: 'expense-papi', name: 'Papi', amount: 20000, currency: 'DOP', hiddenByDefault: true },
    { id: 'expense-dientes-lea', name: 'Dientes Lea', amount: 7000, currency: 'DOP', hiddenByDefault: true },
    { id: 'expense-ahorro', name: 'Ahorro', amount: 150000, currency: 'DOP', hiddenByDefault: true },
    { id: 'expense-maestria', name: 'Maestria', amount: 176, currency: 'USD', hiddenByDefault: true },
    { id: 'expense-apt-puerto-plata', name: 'Apt Puerto Plata', amount: 96000, currency: 'DOP', hiddenByDefault: true },
    { id: 'expense-prestamo-apt', name: 'Prestamo APT', amount: 38000, currency: 'DOP', hiddenByDefault: true },
    { id: 'expense-mantenimiento-apt', name: 'Mantenimiento APT', amount: 8000, currency: 'DOP', hiddenByDefault: true },
    { id: 'expense-ahorro-rullios', name: 'Ahorro Rullios', amount: 2000, currency: 'DOP', hiddenByDefault: true },
    { id: 'expense-facturas', name: 'Facturas', amount: 15000, currency: 'DOP', hiddenByDefault: true }
  ]
};

class PersonalBudgetApiStub {
  async get(): Promise<unknown> {
    return { budget: clone(backendPersonalBudget), summary: emptyPresupuestoSummary };
  }

  async put(): Promise<unknown> {
    return {};
  }
}

describe('PersonalBudgetService', () => {
  let store: PersonalBudgetService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClientService, useClass: PersonalBudgetApiStub }]
    });
    store = TestBed.inject(PersonalBudgetService);
    await Promise.resolve();
  });

  it('should start with the configured personal income and expense categories', () => {
    expect(store.incomes().map((income) => income.name)).toEqual(['Leonor', 'Luis']);
    expect(store.expenses().map((expense) => expense.name)).toEqual([
      'Tarjeta Leonor',
      'Tarjeta Luis ISI',
      'Tarjeta Platinum',
      'Tarjeta Luis US',
      'Tarjeta Leonor US',
      'Tarjeta Luis ACAP',
      'Tarjeta Luis ACAP US',
      'Papi',
      'Dientes Lea',
      'Ahorro',
      'Maestria',
      'Apt Puerto Plata',
      'Prestamo APT',
      'Mantenimiento APT',
      'Ahorro Rullios',
      'Facturas'
    ]);
    expect(store.expenses().filter((expense) => expense.hiddenByDefault).map((expense) => expense.name)).toEqual([
      'Papi',
      'Dientes Lea',
      'Ahorro',
      'Maestria',
      'Apt Puerto Plata',
      'Prestamo APT',
      'Mantenimiento APT',
      'Ahorro Rullios',
      'Facturas'
    ]);
    expect(store.expenses().map((expense) => expense.id)).toContain('expense-ahorro');
    expect(store.expenses().map((expense) => expense.id)).not.toContain('expense-apartamento');
  });

  it('should calculate the personal budget result from manual incomes and expenses', () => {
    store.updateIncomeAmount('income-leonor', 80000);
    store.updateIncomeAmount('income-luis', 120000);
    store.updateExpenseAmount('expense-tarjeta-leonor', 25000);
    store.updateExpenseAmount('expense-tarjeta-luis-isi', 40000);

    const dopResult = store.netTotals().find((total) => total.currency === 'DOP');

    expect(dopResult?.amount).toBe(-211560);
  });

  it('should convert USD personal budget entries to DOP at the fixed budget rate', () => {
    store.updateIncomeAmount('income-leonor', 100000);
    store.updateIncomeCurrency('income-luis', 'USD');
    store.updateIncomeAmount('income-luis', 500);
    store.updateExpenseAmount('expense-tarjeta-leonor', 25000);
    store.updateExpenseAmount('expense-tarjeta-luis-us', 100);

    const dopIncomeTotal = store.incomeTotals().find((total) => total.currency === 'DOP');
    const dopExpenseTotal = store.expenseTotals().find((total) => total.currency === 'DOP');
    const dopResult = store.netTotals().find((total) => total.currency === 'DOP');
    const usdResult = store.netTotals().find((total) => total.currency === 'USD');

    expect(dopIncomeTotal?.amount).toBe(130000);
    expect(dopExpenseTotal?.amount).toBe(377560);
    expect(dopResult?.amount).toBe(-247560);
    expect(usdResult).toBeUndefined();
  });

  it('should calculate budget pressure from DOP remaining per day and cycle time', () => {
    store.updateIncomeAmount('income-leonor', 600000);

    const pressure = store.pressure();

    expect(pressure.score).toBeLessThan(100);
    expect(pressure.detail).toContain('por día hasta el 27');
  });

  it('should allow custom expense categories without changing statement data', () => {
    const added = store.addExpense('Renta', 50000, 'DOP');
    const customExpense = store.expenses().find((expense) => expense.name === 'Renta');

    expect(added).toBeTrue();
    expect(customExpense?.custom).toBeTrue();
    expect(store.expenseTotals().find((total) => total.currency === 'DOP')?.amount).toBe(fixedExpenseTotalDop + 50000);

    store.removeExpense(customExpense?.id ?? 'missing');
    expect(store.expenses().some((expense) => expense.name === 'Renta')).toBeFalse();
  });
});

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}