import { TestBed } from '@angular/core/testing';
import { AppState, Budget, emptyBalancePaymentSummary, emptyPresupuestoSummary, emptyWealthSummary } from './core/models/budget.models';
import { ApiClientService } from './core/services/api-client.service';
import { AppComponent } from './app.component';

const testBudgets: Budget[] = [
  { category: 'Groceries', limit: 700, currency: 'USD' },
  { category: 'Dining', limit: 520, currency: 'USD' }
];

class ApiClientStub {
  readonly postPaths: string[] = [];
  readonly appState: AppState = {
    theme: 'dark',
    budgets: testBudgets,
    personalBudget: {
      incomes: [],
      expenses: [
        { id: 'expense-tarjeta-leonor', name: 'Tarjeta Leonor', amount: 9999, currency: 'DOP' },
        { id: 'expense-tarjeta-luis-isi', name: 'Tarjeta Luis ISI', amount: 15000, currency: 'DOP' },
        { id: 'expense-tarjeta-platinum', name: 'Tarjeta Platinum', amount: 30000, currency: 'DOP' },
        { id: 'expense-tarjeta-luis-us', name: 'Tarjeta Luis US', amount: 1000, currency: 'USD' },
        { id: 'expense-tarjeta-leonor-us', name: 'Tarjeta Leonor US', amount: 1500, currency: 'USD' }
      ]
    },
    personalBudgetSummary: {
      ...emptyPresupuestoSummary,
      cycle: { ...emptyPresupuestoSummary.cycle, daysRemaining: 21, endDate: '2026-05-27' }
    },
    conversionBudget: { sourceAmount: 0, sourceCurrency: 'USD', afterConversionAddition: 0, sourceDeductions: [], dopDeductions: [] },
    conversionBudgetSummary: emptyBalancePaymentSummary,
    wealthPortfolio: { assets: [], liabilities: [] },
    wealthSummary: emptyWealthSummary,
    statements: [],
    transactions: [],
    uploadedStatementNames: [],
    importSummary: { files: 0, rows: 0, payments: 0, skipped: 0, duplicates: 0, formats: [] }
  };

  async get(path: string): Promise<unknown> {
    if (path === '/api/state') {
      return this.appState;
    }

    if (path === '/api/personal-budget') {
      return { budget: this.appState.personalBudget, summary: this.appState.personalBudgetSummary };
    }

    if (path === '/api/conversion-budget') {
      return { budget: this.appState.conversionBudget, summary: this.appState.conversionBudgetSummary };
    }

    return {};
  }

  async put(): Promise<unknown> {
    return {};
  }

  async post(path: string): Promise<unknown> {
    this.postPaths.push(path);

    if (path === '/api/budget-summary-email') {
      return { status: '[RESUMEN ENVIADO]', id: 'email_123', to: 'user@example.com' };
    }

    return { status: '[SIN DATOS CARGADOS]', state: this.appState };
  }

  async delete(): Promise<unknown> {
    return { status: '[LIMPIADO]', state: this.appState };
  }
}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: ApiClientService, useClass: ApiClientStub }]
    }).compileComponents();
  });

  it('should create the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the dashboard brand', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.wordmark')?.textContent).toContain('SEÑAL DE PRESUPUESTO');
  });

  it('should not render the light and dark mode toggle', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.mode-toggle')).toBeNull();
  });

  it('should color the budget signal dot from the remaining budget level', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector<HTMLElement>('.signal-dot')?.dataset['level']).toBe('1');
  });

  it('should mark the budget signal dot as best level at RD$120,000 remaining', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.personalBudget.incomes.set([
      { id: 'income-test', name: 'Ingreso', amount: 120000, currency: 'DOP' }
    ]);
    fixture.componentInstance.personalBudget.expenses.set([]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector<HTMLElement>('.signal-dot')?.dataset['level']).toBe('5');
  });

  it('should step the budget signal dot down below RD$120,000 remaining', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.personalBudget.incomes.set([
      { id: 'income-test', name: 'Ingreso', amount: 119999, currency: 'DOP' }
    ]);
    fixture.componentInstance.personalBudget.expenses.set([]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector<HTMLElement>('.signal-dot')?.dataset['level']).toBe('4');
  });

  it('should render the manual summary dashboard cards', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const summary = compiled.querySelector('.manual-dashboard') as HTMLElement;

    expect(summary).not.toBeNull();
    expect(summary.textContent).toContain('Dashboard');
    expect(summary.textContent).toContain('PRESUPUESTO');
    expect(summary.textContent).toContain('BALANCE DE PAGO');
    expect(summary.textContent).toContain('PATRIMONIO');
    expect(summary.textContent).toContain('PRESIÓN');
    expect(summary.querySelectorAll('.manual-summary-card').length).toBe(3);
  });

  it('should request a budget summary email from the dashboard action', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const api = TestBed.inject(ApiClientService) as unknown as ApiClientStub;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const emailButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.includes('ENVIAR RESUMEN'));

    expect(emailButton).toBeTruthy();
  expect(emailButton?.classList).toContain('dashboard-email-button');
    emailButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.postPaths).toContain('/api/budget-summary-email');
    expect(compiled.querySelector('.system-status')?.textContent).toContain('[RESUMEN ENVIADO]');
  });

  it('should show the presupuesto view by default', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const personalBudget = compiled.querySelector('.personal-budget') as HTMLElement;

    expect(personalBudget).not.toBeNull();
    expect(personalBudget.textContent).toContain('PRESUPUESTO PERSONAL');
    expect(personalBudget.textContent).toContain('21 DÍAS');
    expect(personalBudget.textContent).toContain('PRESIÓN');
    expect(personalBudget.querySelector('.budget-pressure-track')).not.toBeNull();
    expect(personalBudget.querySelector('.budget-cycle-spotlight')?.textContent).toContain('CIERRE 27');
    expect(personalBudget.querySelectorAll('.budget-category-image img').length).toBeGreaterThan(0);
    expect(personalBudget.textContent).toContain('USD');
    expect(compiled.querySelector('.conversion-budget')).toBeNull();
  });

  it('should color-code non-fixed expense names by converted DOP amount level', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const names = Array.from(compiled.querySelectorAll<HTMLElement>('.personal-budget .budget-entry-name'));

    expect(names.find((name) => name.textContent?.includes('Tarjeta Leonor'))?.dataset['expenseLevel']).toBe('1');
    expect(names.find((name) => name.textContent?.includes('Tarjeta Luis ISI'))?.dataset['expenseLevel']).toBe('2');
    expect(names.find((name) => name.textContent?.includes('Tarjeta Platinum'))?.dataset['expenseLevel']).toBe('3');
    expect(names.find((name) => name.textContent?.includes('Tarjeta Luis US'))?.dataset['expenseLevel']).toBe('4');
    expect(names.find((name) => name.textContent?.includes('Tarjeta Leonor US'))?.dataset['expenseLevel']).toBe('5');
  });

  it('should switch to the Balance de Pago view from navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const paymentButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.desktop-nav button'))
      .find((button) => button.textContent?.includes('BALANCE'));

    expect(paymentButton).toBeTruthy();
    paymentButton?.click();
    fixture.detectChanges();

    const conversionBudget = compiled.querySelector('.conversion-budget') as HTMLElement;

    expect(conversionBudget).not.toBeNull();
    expect(conversionBudget.textContent).toContain('FLUJO DE CONVERSIÓN');
    expect(conversionBudget.textContent).toContain('Balance de Pago');
    expect(conversionBudget.textContent).toContain('RESULTADO FINAL');
    expect(compiled.querySelector('.personal-budget')).toBeNull();
  });

  it('should switch back to the presupuesto view from navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navButtons = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.desktop-nav button'));
    navButtons.find((button) => button.textContent?.includes('BALANCE'))?.click();
    fixture.detectChanges();
    navButtons.find((button) => button.textContent?.includes('PRESUPUESTO'))?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.personal-budget')).not.toBeNull();
    expect(compiled.querySelector('.conversion-budget')).toBeNull();
  });

  it('should render the mobile navigation tabs', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const mobileTabs = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.mobile-nav button'))
      .map((button) => button.textContent?.trim());

    expect(mobileTabs).toEqual(['PRESUPUESTO', 'BALANCE', 'PATR.', 'IMPORT.']);
  });

  it('should switch to the statement import view from navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const importButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.desktop-nav button'))
      .find((button) => button.textContent?.includes('IMPORTAR'));

    expect(importButton).toBeTruthy();
    importButton?.click();
    fixture.detectChanges();

    const importPanel = compiled.querySelector('.import-panel') as HTMLElement;

    expect(importPanel).not.toBeNull();
    expect(importPanel.textContent).toContain('CARGA DE ESTADOS');
    expect(compiled.querySelector('.hero')).not.toBeNull();
    expect(compiled.querySelector('.chart-dashboard')).not.toBeNull();
    expect(compiled.querySelector('.signal-grid')).not.toBeNull();
    expect(compiled.querySelector('.split-layout')).not.toBeNull();
    expect(compiled.querySelector('.transactions-panel')).not.toBeNull();
    expect(compiled.querySelector('.personal-budget')).toBeNull();
    expect(compiled.querySelector('.conversion-budget')).toBeNull();
  });

  it('should keep statement analysis sections out of the default budget view', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.chart-dashboard')).toBeNull();
    expect(compiled.querySelector('.signal-grid')).toBeNull();
    expect(compiled.querySelector('.split-layout')).toBeNull();
    expect(compiled.querySelector('.transactions-panel')).toBeNull();
  });
});
