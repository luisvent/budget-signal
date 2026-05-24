export type Theme = 'dark' | 'light';
export type Tone = 'success' | 'warning' | 'danger' | 'neutral';
export type CurrencyCode = 'USD' | 'DOP';
export type WealthAssetCategory = 'cash' | 'checking' | 'savings' | 'investment' | 'retirement' | 'real-estate' | 'vehicle' | 'business' | 'other';
export type WealthLiabilityCategory = 'credit-card' | 'mortgage' | 'personal-loan' | 'vehicle-loan' | 'student-loan' | 'business-loan' | 'tax' | 'other';

export interface Transaction {
  id: number;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  currency: CurrencyCode;
  source: string;
}

export interface Budget {
  category: string;
  limit: number;
  currency: CurrencyCode;
}

export interface PersonalBudgetEntry {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  custom?: boolean;
  hiddenByDefault?: boolean;
}

export interface PersonalBudgetSnapshot {
  incomes: PersonalBudgetEntry[];
  expenses: PersonalBudgetEntry[];
}

export type PresupuestoSummaryStatus = 'debt' | 'tight' | 'barely-good' | 'good' | 'strong';

export interface PresupuestoCycle {
  cutoffDay: number;
  startDate: string;
  endDate: string;
  currentDate: string;
  daysElapsed: number;
  daysRemaining: number;
  cycleLengthDays: number;
  cycleProgress: number;
}

export interface PresupuestoSummary {
  status: PresupuestoSummaryStatus;
  tone: Tone;
  score: number;
  headline: string;
  message: string;
  netDopEquivalent: number;
  nativeNet: Record<CurrencyCode, number>;
  incomeDopEquivalent: number;
  expenseDopEquivalent: number;
  savingsRate: number | null;
  expenseRatio: number | null;
  reserveMonths: number;
  cycle: PresupuestoCycle;
  signals: string[];
  context: {
    exchangeRateDopPerUsd: number;
    budgetCycleEndDay: number;
    inflationTargetMidpointPercent: number;
    annualInflationPercent: number;
    largeCompanyMinimumWageDop: number;
    mediumCompanyMinimumWageDop: number;
    smallCompanyMinimumWageDop: number;
    microCompanyMinimumWageDop: number;
    firstQuintileBasicBasketProxyDop: number;
    references: string[];
  };
}

export interface PersonalBudgetResponse {
  budget: PersonalBudgetSnapshot;
  summary: PresupuestoSummary;
}

export interface ConversionBudgetEntry {
  id: string;
  name: string;
  amount: number;
  custom?: boolean;
}

export interface ConversionBudgetSnapshot {
  sourceAmount: number;
  sourceCurrency: CurrencyCode;
  afterConversionAddition: number;
  sourceDeductions: ConversionBudgetEntry[];
  dopDeductions: ConversionBudgetEntry[];
}

export type BalancePaymentSummaryStatus = 'debt' | 'covered-tight' | 'covered' | 'comfortable' | 'surplus';

export interface BalancePaymentSummary {
  status: BalancePaymentSummaryStatus;
  tone: Tone;
  score: number;
  headline: string;
  message: string;
  sourceAmount: number;
  sourceCurrency: CurrencyCode;
  sourceFeeAmount: number;
  sourceNetAmount: number;
  sourceDeductionTotal: number;
  sourceRemaining: number;
  convertedDopAmount: number;
  afterConversionAddition: number;
  afterConversionTotal: number;
  dopDeductionTotal: number;
  finalDopResult: number;
  coverageRatio: number | null;
  signals: string[];
  context: {
    exchangeRateDopPerUsd: number;
    sourceAdjustmentRate: number;
    sourceFixedFeeUsd: number;
    tightBufferDop: number;
    stableBufferDop: number;
    strongBufferDop: number;
    references: string[];
  };
}

export interface ConversionBudgetResponse {
  budget: ConversionBudgetSnapshot;
  summary: BalancePaymentSummary;
}

export interface WealthAsset {
  id: string;
  name: string;
  category: WealthAssetCategory;
  amount: number;
  currency: CurrencyCode;
}

export interface WealthLiability {
  id: string;
  name: string;
  category: WealthLiabilityCategory;
  amount: number;
  currency: CurrencyCode;
  interestRate: number;
  monthlyPayment: number;
}

export interface WealthPortfolioSnapshot {
  assets: WealthAsset[];
  liabilities: WealthLiability[];
}

export type WealthSummaryStatus = 'empty' | 'negative' | 'fragile' | 'building' | 'stable' | 'strong';

export interface WealthBreakdownItem {
  category: string;
  amountDop: number;
}

export interface WealthDiagnostic {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}

export interface WealthBenchmark {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}

export interface WealthStressTest {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}

export interface WealthAnalysisSection {
  id: string;
  label: string;
  tone: Tone;
  title: string;
  body: string;
  metrics: string[];
  sourceNotes: string[];
}

export interface WealthActionItem {
  id: string;
  priority: number;
  label: string;
  detail: string;
  impact: string;
  tone: Tone;
}

export interface WealthScoreDimension {
  id: string;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
  tone: Tone;
  detail: string;
}

export interface WealthResearchSource {
  id: string;
  region: string;
  source: string;
  use: string;
  dataPoints: string[];
}

export interface WealthSummary {
  status: WealthSummaryStatus;
  tone: Tone;
  score: number;
  headline: string;
  message: string;
  netWorthDop: number;
  totalAssetsDop: number;
  totalLiabilitiesDop: number;
  liquidAssetsDop: number;
  investedAssetsDop: number;
  realAssetsDop: number;
  monthlyExpensesDop: number;
  monthlyIncomeDop: number;
  monthlyDebtPaymentDop: number;
  highCostDebtDop: number;
  nonMortgageDebtDop: number;
  emergencyFundGapDop: number;
  stableReserveTargetDop: number;
  strongReserveTargetDop: number;
  annualInflationDragDop: number;
  annualDebtInterestCostDop: number;
  debtWeightedAverageRate: number | null;
  financialIndependenceProgress: number | null;
  debtToAssetRatio: number | null;
  liquidityMonths: number | null;
  netWorthMonths: number;
  debtPaymentToIncomeRatio: number | null;
  investmentShare: number | null;
  liquidShare: number | null;
  realAssetShare: number | null;
  usdAssetShare: number | null;
  usdDebtShare: number | null;
  largestPositionShare: number | null;
  assetBreakdown: WealthBreakdownItem[];
  liabilityBreakdown: WealthBreakdownItem[];
  diagnostics: WealthDiagnostic[];
  benchmarks: WealthBenchmark[];
  stressTests: WealthStressTest[];
  analysisSections: WealthAnalysisSection[];
  actionPlan: WealthActionItem[];
  scoreDimensions: WealthScoreDimension[];
  recommendations: string[];
  signals: string[];
  context: {
    exchangeRateDopPerUsd: number;
    emergencyFundMinimumMonths: number;
    emergencyFundStableMonths: number;
    emergencyFundStrongMonths: number;
    emergencyFundAggressiveMonths: number;
    debtToAssetCautionRatio: number;
    debtToAssetStressRatio: number;
    debtPaymentToIncomeCautionRatio: number;
    debtPaymentToIncomeStressRatio: number;
    nonMortgageDebtToIncomeCautionRatio: number;
    investmentShareBuildingRatio: number;
    investmentShareStrongRatio: number;
    concentrationCautionRatio: number;
    concentrationStressRatio: number;
    highCostDebtRatePercent: number;
    annualInflationPercent: number;
    inflationTargetMidpointPercent: number;
    currencyShockPercent: number;
    marketDrawdownPercent: number;
    realAssetHaircutPercent: number;
    rateShockPercent: number;
    largeCompanyMinimumWageDop: number;
    mediumCompanyMinimumWageDop: number;
    smallCompanyMinimumWageDop: number;
    microCompanyMinimumWageDop: number;
    firstQuintileBasicBasketProxyDop: number;
    globalAccountOwnershipPercent: number;
    globalEmergencyMoneyAccessPercent: number;
    developingFormalSavingsAccountPercent: number;
    researchSources: WealthResearchSource[];
    references: string[];
  };
}

export interface WealthPortfolioResponse {
  portfolio: WealthPortfolioSnapshot;
  summary: WealthSummary;
}

export interface BudgetProgress extends Budget {
  spent: number;
  remaining: number;
  ratio: number;
  tone: Tone;
}

export interface Insight {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}

export interface ParsedStatement {
  source: string;
  transactions: Transaction[];
  totalRows: number;
  paymentRows: number;
  skippedRows: number;
  format: string;
}

export interface StoredStatement {
  id: string;
  name: string;
  source: string;
  format: string;
  importedAt: string;
  totalRows: number;
  paymentRows: number;
  skippedRows: number;
  transactions: Transaction[];
}

export interface ImportSummary {
  files: number;
  rows: number;
  payments: number;
  skipped: number;
  duplicates: number;
  formats: string[];
}

export interface StatementFileContent {
  name: string;
  content: string;
}

export interface StatementFilePayload {
  name: string;
  contentBase64: string;
}

export interface AppState {
  theme: Theme;
  budgets: Budget[];
  personalBudget: PersonalBudgetSnapshot;
  personalBudgetSummary: PresupuestoSummary;
  conversionBudget: ConversionBudgetSnapshot;
  conversionBudgetSummary: BalancePaymentSummary;
  wealthPortfolio: WealthPortfolioSnapshot;
  wealthSummary: WealthSummary;
  statements: StoredStatement[];
  transactions: Transaction[];
  uploadedStatementNames: string[];
  importSummary: ImportSummary;
}

export interface ImportResponse {
  status: string;
  state: AppState;
  statementDraft?: string;
}

export interface CategoryTotal {
  category: string;
  currency: CurrencyCode;
  spent: number;
}

export interface MerchantTotal {
  merchant: string;
  currency: CurrencyCode;
  spent: number;
  count: number;
  average: number;
}

export interface MonthlyTotal {
  month: string;
  currency: CurrencyCode;
  spent: number;
  count: number;
}

export interface CurrencyAmount {
  currency: CurrencyCode;
  amount: number;
}

export const emptyPresupuestoSummary: PresupuestoSummary = {
  status: 'tight',
  tone: 'neutral',
  score: 0,
  headline: 'Sin lectura',
  message: 'Agrega ingresos y gastos para leer el mes con contexto real.',
  netDopEquivalent: 0,
  nativeNet: { DOP: 0, USD: 0 },
  incomeDopEquivalent: 0,
  expenseDopEquivalent: 0,
  savingsRate: null,
  expenseRatio: null,
  reserveMonths: 0,
  cycle: {
    cutoffDay: 27,
    startDate: '',
    endDate: '',
    currentDate: '',
    daysElapsed: 0,
    daysRemaining: 0,
    cycleLengthDays: 0,
    cycleProgress: 0
  },
  signals: [],
  context: {
    exchangeRateDopPerUsd: 60,
    budgetCycleEndDay: 27,
    inflationTargetMidpointPercent: 4,
    annualInflationPercent: 4.63,
    largeCompanyMinimumWageDop: 29988,
    mediumCompanyMinimumWageDop: 27489.6,
    smallCompanyMinimumWageDop: 18421.2,
    microCompanyMinimumWageDop: 16993.2,
    firstQuintileBasicBasketProxyDop: 28080,
    references: []
  }
};

export const emptyBalancePaymentSummary: BalancePaymentSummary = {
  status: 'covered-tight',
  tone: 'neutral',
  score: 0,
  headline: 'Sin lectura',
  message: 'Agrega el dinero generado, tarjetas y gastos para leer el cierre de pago.',
  sourceAmount: 0,
  sourceCurrency: 'USD',
  sourceFeeAmount: 0,
  sourceNetAmount: 0,
  sourceDeductionTotal: 0,
  sourceRemaining: 0,
  convertedDopAmount: 0,
  afterConversionAddition: 0,
  afterConversionTotal: 0,
  dopDeductionTotal: 0,
  finalDopResult: 0,
  coverageRatio: null,
  signals: [],
  context: {
    exchangeRateDopPerUsd: 60,
    sourceAdjustmentRate: 0.018,
    sourceFixedFeeUsd: 7,
    tightBufferDop: 10000,
    stableBufferDop: 50000,
    strongBufferDop: 100000,
    references: []
  }
};

export const emptyWealthSummary: WealthSummary = {
  status: 'empty',
  tone: 'neutral',
  score: 0,
  headline: 'Sin mapa patrimonial',
  message: 'Agrega efectivo, cuentas, inversiones y deudas para activar la lectura completa.',
  netWorthDop: 0,
  totalAssetsDop: 0,
  totalLiabilitiesDop: 0,
  liquidAssetsDop: 0,
  investedAssetsDop: 0,
  realAssetsDop: 0,
  monthlyExpensesDop: 0,
  monthlyIncomeDop: 0,
  monthlyDebtPaymentDop: 0,
  highCostDebtDop: 0,
  nonMortgageDebtDop: 0,
  emergencyFundGapDop: 0,
  stableReserveTargetDop: 0,
  strongReserveTargetDop: 0,
  annualInflationDragDop: 0,
  annualDebtInterestCostDop: 0,
  debtWeightedAverageRate: null,
  financialIndependenceProgress: null,
  debtToAssetRatio: null,
  liquidityMonths: null,
  netWorthMonths: 0,
  debtPaymentToIncomeRatio: null,
  investmentShare: null,
  liquidShare: null,
  realAssetShare: null,
  usdAssetShare: null,
  usdDebtShare: null,
  largestPositionShare: null,
  assetBreakdown: [],
  liabilityBreakdown: [],
  diagnostics: [],
  benchmarks: [],
  stressTests: [],
  analysisSections: [],
  actionPlan: [],
  scoreDimensions: [],
  recommendations: [],
  signals: [],
  context: {
    exchangeRateDopPerUsd: 60,
    emergencyFundMinimumMonths: 1,
    emergencyFundStableMonths: 3,
    emergencyFundStrongMonths: 6,
    emergencyFundAggressiveMonths: 12,
    debtToAssetCautionRatio: 0.4,
    debtToAssetStressRatio: 0.6,
    debtPaymentToIncomeCautionRatio: 0.36,
    debtPaymentToIncomeStressRatio: 0.5,
    nonMortgageDebtToIncomeCautionRatio: 0.2,
    investmentShareBuildingRatio: 0.1,
    investmentShareStrongRatio: 0.25,
    concentrationCautionRatio: 0.6,
    concentrationStressRatio: 0.75,
    highCostDebtRatePercent: 18,
    annualInflationPercent: 4.63,
    inflationTargetMidpointPercent: 4,
    currencyShockPercent: 10,
    marketDrawdownPercent: 15,
    realAssetHaircutPercent: 10,
    rateShockPercent: 2,
    largeCompanyMinimumWageDop: 29988,
    mediumCompanyMinimumWageDop: 27489.6,
    smallCompanyMinimumWageDop: 18421.2,
    microCompanyMinimumWageDop: 16993.2,
    firstQuintileBasicBasketProxyDop: 28080,
    globalAccountOwnershipPercent: 79,
    globalEmergencyMoneyAccessPercent: 56,
    developingFormalSavingsAccountPercent: 40,
    researchSources: [],
    references: []
  }
};

export const emptyImportSummary: ImportSummary = {
  files: 0,
  rows: 0,
  payments: 0,
  skipped: 0,
  duplicates: 0,
  formats: []
};