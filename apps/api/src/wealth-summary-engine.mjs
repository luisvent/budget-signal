const dopFormatter = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('es-DO', { style: 'percent', maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 1 });

const researchSources = [
  {
    id: 'world-bank-findex-accounts',
    region: 'global',
    source: 'World Bank Global Findex 2025',
    use: 'Financial inclusion and account ownership context.',
    dataPoints: ['79% de adultos globales tienen cuenta', '40% de adultos en economias en desarrollo ahorran en una cuenta financiera']
  },
  {
    id: 'world-bank-findex-emergency',
    region: 'global',
    source: 'World Bank Global Findex 2025 financial health',
    use: 'Emergency access benchmark for resilience.',
    dataPoints: ['56% de adultos puede acceder dinero extra confiablemente en una emergencia', '1 de cada 4 adultos en LMICs enfrento desastre natural en tres anos']
  },
  {
    id: 'cfpb-emergency-fund',
    region: 'global',
    source: 'CFPB Emergency Fund Guide',
    use: 'Emergency reserve logic, safe accessibility, and avoiding debt after shocks.',
    dataPoints: ['Reserva separada para gastos no planificados', 'Sin ahorros un choque menor puede convertirse en deuda', 'Automatizar aportes mejora constancia']
  },
  {
    id: 'cfpb-wellbeing',
    region: 'global',
    source: 'CFPB Financial Well-Being questionnaire',
    use: 'Qualitative lens for security today and freedom of choice in the future.',
    dataPoints: ['Capacidad para manejar gasto inesperado', 'Dinero sobrante al final del mes', 'Preocupacion de que ahorros no duren']
  },
  {
    id: 'federal-reserve-shed',
    region: 'global',
    source: 'Federal Reserve SHED 2025',
    use: 'Household economic well-being modules for savings, credit, retirement, hardship, and housing.',
    dataPoints: ['Ahorros', 'credito', 'retiro', 'fragilidad economica', 'vivienda']
  },
  {
    id: 'fdic-money-smart',
    region: 'global',
    source: 'FDIC Money Smart',
    use: 'Financial education foundation for banking, credit, savings, and positive financial habits.',
    dataPoints: ['Habilidades financieras', 'relaciones bancarias positivas', 'decisiones reales de presupuesto']
  },
  {
    id: 'sec-diversification',
    region: 'global',
    source: 'Investor.gov / SEC Diversification',
    use: 'Concentration and investment risk framing.',
    dataPoints: ['Diversificacion distribuye dinero entre inversiones para que una perdida no domine todo el resultado']
  },
  {
    id: 'imf-gfsr-2026',
    region: 'global',
    source: 'IMF Global Financial Stability Report 2026',
    use: 'Volatility, tighter financial conditions, global risk sentiment, and debt sustainability framing.',
    dataPoints: ['Riesgos por guerra, inflacion potencial y condiciones financieras mas apretadas', 'Flujos a emergentes sensibles a sentimiento global']
  },
  {
    id: 'imf-gfsr-2025',
    region: 'global',
    source: 'IMF Global Financial Stability Report 2025',
    use: 'Elevated valuations, leverage, market turmoil, and FX vulnerability context.',
    dataPoints: ['Riesgos elevados por valoraciones, soberanos y NBFIs', 'FX vulnerable a incertidumbre macrofinanciera']
  },
  {
    id: 'imf-weo-2026',
    region: 'global',
    source: 'IMF World Economic Outlook 2026',
    use: 'Global growth, inflation pressure, and need to rebuild buffers.',
    dataPoints: ['Crecimiento global con riesgos y presiones inflacionarias renovadas', 'Politicas deben preservar estabilidad y buffers']
  },
  {
    id: 'bis-annual-2025',
    region: 'global',
    source: 'BIS Annual Economic Report 2025',
    use: 'Uncertainty, fragmentation, price stability, and interconnected financial system risks.',
    dataPoints: ['Incertidumbre y tensiones comerciales nublan perspectivas', 'Mercados financieros mas interconectados']
  },
  {
    id: 'bcrd-precios-ipc',
    region: 'dominican-republic',
    source: 'BCRD Precios IPC',
    use: 'Inflation, real purchasing power, IPC by groups/quintiles, and family basket context.',
    dataPoints: ['IPC anualizado', 'IPC por quintiles', 'costo de canasta familiar por quintiles y regiones']
  },
  {
    id: 'bcrd-mercado-cambiario',
    region: 'dominican-republic',
    source: 'BCRD Mercado Cambiario',
    use: 'DOP/USD exposure and currency mismatch analysis.',
    dataPoints: ['Tasa de cambio de referencia', 'sondeo compra/venta', 'volatilidad de tasa de cambio', 'volumen de operaciones cambiarias']
  },
  {
    id: 'bcrd-sector-financiero',
    region: 'dominican-republic',
    source: 'BCRD Sector Monetario y Financiero',
    use: 'Interest rate pressure, credit conditions, and deposit/loan rate context.',
    dataPoints: ['Tasa de politica monetaria', 'tasas activas y pasivas', 'balances de sociedades de deposito', 'captacion y canalizacion bancaria']
  },
  {
    id: 'bcrd-engih',
    region: 'dominican-republic',
    source: 'BCRD ENGIH 2018',
    use: 'Household income and expense structure for local spending pressure.',
    dataPoints: ['Viviendas, hogares, personas e ingresos', 'gasto de consumo final efectivo mensual', 'gasto por periodicidad']
  },
  {
    id: 'bcrd-encft',
    region: 'dominican-republic',
    source: 'BCRD ENCFT labor market',
    use: 'Income stability, labor participation, formality, occupation and education context.',
    dataPoints: ['Poblacion ocupada por sector formal e informal', 'poblacion perceptora de ingresos', 'indicadores 2014-2025']
  },
  {
    id: 'ministerio-trabajo-salarios',
    region: 'dominican-republic',
    source: 'Ministerio de Trabajo RD minimum wage resolutions',
    use: 'Local wage anchor for emergency fund and net worth scale.',
    dataPoints: ['Salarios minimos privados no sectorizados usados como escala de ingreso local']
  },
  {
    id: 'dgii-estadisticas',
    region: 'dominican-republic',
    source: 'DGII Estadisticas Tributarias',
    use: 'Tax, vehicle, exchange-rate and fiscal reference context for household obligations.',
    dataPoints: ['Estadisticas tributarias', 'parque vehicular', 'tasas de cambio', 'ingresos y recaudaciones']
  },
  {
    id: 'sb-estadisticas',
    region: 'dominican-republic',
    source: 'Superintendencia de Bancos RD estadisticas',
    use: 'Banking system, credit and deposit context when available.',
    dataPoints: ['Indicadores bancarios', 'credito', 'captaciones', 'calidad de cartera']
  },
  {
    id: 'sipen-estadisticas',
    region: 'dominican-republic',
    source: 'SIPEN estadisticas previsionales',
    use: 'Retirement and pension-account context when available.',
    dataPoints: ['Fondos de pensiones', 'afiliados', 'cuentas previsionales']
  },
  {
    id: 'budget-signal-presupuesto',
    region: 'app',
    source: 'Budget Signal Presupuesto',
    use: 'Monthly income and expense base from the same app.',
    dataPoints: ['Ingreso mensual', 'gasto mensual', 'resultado mensual', 'ciclo de presupuesto']
  },
  {
    id: 'budget-signal-fx-rule',
    region: 'app',
    source: 'Budget Signal fixed FX rule',
    use: 'Consistent DOP conversion across Presupuesto, Balance de Pago, and Patrimonio.',
    dataPoints: ['1 USD = RD$60']
  }
];

const financialContext = {
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
  researchSources,
  references: researchSources.map((source) => `${source.source}: ${source.use} (${source.dataPoints.join('; ')}).`)
};

const liquidAssetCategories = new Set(['cash', 'checking', 'savings']);
const productiveAssetCategories = new Set(['investment', 'retirement', 'business']);
const realAssetCategories = new Set(['real-estate', 'vehicle']);
const highCostDebtCategories = new Set(['credit-card', 'personal-loan', 'tax']);
const nonMortgageDebtCategories = new Set(['credit-card', 'personal-loan', 'vehicle-loan', 'student-loan', 'business-loan', 'tax', 'other']);

export function generateWealthSummary(wealthPortfolio, personalBudget = {}, options = {}) {
  const rawRate = options?.exchangeRateDopPerUsd;
  const numericRate = typeof rawRate === 'number' ? rawRate : Number(rawRate);
  const previousRate = financialContext.exchangeRateDopPerUsd;

  if (Number.isFinite(numericRate) && numericRate > 0) {
    financialContext.exchangeRateDopPerUsd = numericRate;
  }

  try {
    return computeWealthSummary(wealthPortfolio, personalBudget);
  } finally {
    financialContext.exchangeRateDopPerUsd = previousRate;
  }
}

function computeWealthSummary(wealthPortfolio, personalBudget = {}) {
  const assets = Array.isArray(wealthPortfolio?.assets) ? wealthPortfolio.assets : [];
  const liabilities = Array.isArray(wealthPortfolio?.liabilities) ? wealthPortfolio.liabilities : [];
  const assetMetrics = calculateAssetMetrics(assets);
  const liabilityMetrics = calculateLiabilityMetrics(liabilities);
  const budgetMetrics = calculateBudgetMetrics(personalBudget);
  const derived = calculateDerivedMetrics(assetMetrics, liabilityMetrics, budgetMetrics);
  const signals = identifySignals({ assets, liabilities, assetMetrics, liabilityMetrics, budgetMetrics, derived });
  const scoreDimensions = buildScoreDimensions({ assets, liabilities, assetMetrics, liabilityMetrics, budgetMetrics, derived, signals });
  const score = calculateCompositeScore(scoreDimensions, signals);
  const status = classifyStatus({ assets, liabilities, derived, score, signals });
  const tone = toneForStatus(status);
  const diagnostics = buildDiagnostics({ assetMetrics, liabilityMetrics, budgetMetrics, derived });
  const benchmarks = buildBenchmarks({ assetMetrics, liabilityMetrics, budgetMetrics, derived });
  const stressTests = buildStressTests({ assetMetrics, liabilityMetrics, budgetMetrics, derived });
  const analysisSections = buildAnalysisSections({ status, assetMetrics, liabilityMetrics, budgetMetrics, derived, signals, scoreDimensions, benchmarks, stressTests });
  const actionPlan = buildActionPlan({ status, assetMetrics, liabilityMetrics, budgetMetrics, derived, signals });
  const recommendations = actionPlan.map((item) => item.detail).slice(0, 5);

  return {
    status,
    tone,
    score,
    headline: headlineForStatus(status, signals),
    message: buildMessage({ status, assetMetrics, liabilityMetrics, budgetMetrics, derived, signals }),
    netWorthDop: roundMoney(derived.netWorthDop),
    totalAssetsDop: roundMoney(assetMetrics.totalDop),
    totalLiabilitiesDop: roundMoney(liabilityMetrics.totalDop),
    liquidAssetsDop: roundMoney(assetMetrics.liquidDop),
    investedAssetsDop: roundMoney(assetMetrics.productiveDop),
    realAssetsDop: roundMoney(assetMetrics.realDop),
    monthlyExpensesDop: roundMoney(budgetMetrics.monthlyExpensesDop),
    monthlyIncomeDop: roundMoney(budgetMetrics.monthlyIncomeDop),
    monthlyDebtPaymentDop: roundMoney(liabilityMetrics.monthlyPaymentDop),
    highCostDebtDop: roundMoney(liabilityMetrics.highCostDop),
    nonMortgageDebtDop: roundMoney(liabilityMetrics.nonMortgageDop),
    emergencyFundGapDop: roundMoney(derived.stableReserveGapDop),
    stableReserveTargetDop: roundMoney(derived.stableReserveTargetDop),
    strongReserveTargetDop: roundMoney(derived.strongReserveTargetDop),
    annualInflationDragDop: roundMoney(derived.annualInflationDragDop),
    annualDebtInterestCostDop: roundMoney(liabilityMetrics.annualInterestCostDop),
    debtWeightedAverageRate: nullableRatio(derived.debtWeightedAverageRateRatio),
    financialIndependenceProgress: nullableRatio(derived.financialIndependenceProgress),
    debtToAssetRatio: nullableRatio(derived.debtToAssetRatio),
    liquidityMonths: nullableRatio(derived.liquidityMonths),
    netWorthMonths: roundRatio(derived.netWorthMonths),
    debtPaymentToIncomeRatio: nullableRatio(derived.debtPaymentToIncomeRatio),
    investmentShare: nullableRatio(derived.productiveAssetShare),
    liquidShare: nullableRatio(derived.liquidShare),
    realAssetShare: nullableRatio(derived.realAssetShare),
    usdAssetShare: nullableRatio(derived.usdAssetShare),
    usdDebtShare: nullableRatio(derived.usdDebtShare),
    largestPositionShare: nullableRatio(derived.largestPositionShare),
    assetBreakdown: assetMetrics.breakdown,
    liabilityBreakdown: liabilityMetrics.breakdown,
    diagnostics,
    benchmarks,
    stressTests,
    analysisSections,
    actionPlan,
    scoreDimensions,
    recommendations,
    signals,
    context: financialContext
  };
}

function calculateAssetMetrics(assets) {
  const breakdown = new Map();
  let totalDop = 0;
  let liquidDop = 0;
  let productiveDop = 0;
  let realDop = 0;
  let cashDop = 0;
  let checkingDop = 0;
  let savingsDop = 0;
  let retirementDop = 0;
  let investmentDop = 0;
  let businessDop = 0;
  let vehicleDop = 0;
  let realEstateDop = 0;
  let usdDop = 0;
  let largestPositionDop = 0;
  let largestPositionName = '';

  for (const asset of assets) {
    const category = normalizeAssetCategory(asset.category);
    const amountDop = toDop(asset.amount, asset.currency);

    if (amountDop <= 0) {
      continue;
    }

    breakdown.set(category, (breakdown.get(category) ?? 0) + amountDop);
    totalDop += amountDop;

    if (amountDop > largestPositionDop) {
      largestPositionDop = amountDop;
      largestPositionName = String(asset.name || category);
    }

    if (asset.currency === 'USD') {
      usdDop += amountDop;
    }

    if (liquidAssetCategories.has(category)) {
      liquidDop += amountDop;
    }

    if (productiveAssetCategories.has(category)) {
      productiveDop += amountDop;
    }

    if (realAssetCategories.has(category)) {
      realDop += amountDop;
    }

    if (category === 'cash') {
      cashDop += amountDop;
    } else if (category === 'checking') {
      checkingDop += amountDop;
    } else if (category === 'savings') {
      savingsDop += amountDop;
    } else if (category === 'investment') {
      investmentDop += amountDop;
    } else if (category === 'retirement') {
      retirementDop += amountDop;
    } else if (category === 'business') {
      businessDop += amountDop;
    } else if (category === 'vehicle') {
      vehicleDop += amountDop;
    } else if (category === 'real-estate') {
      realEstateDop += amountDop;
    }
  }

  return {
    totalDop,
    liquidDop,
    productiveDop,
    realDop,
    cashDop,
    checkingDop,
    savingsDop,
    investmentDop,
    retirementDop,
    businessDop,
    vehicleDop,
    realEstateDop,
    usdDop,
    largestPositionDop,
    largestPositionName,
    categoryCount: breakdown.size,
    breakdown: mapBreakdown(breakdown)
  };
}

function calculateLiabilityMetrics(liabilities) {
  const breakdown = new Map();
  let totalDop = 0;
  let monthlyPaymentDop = 0;
  let highCostDop = 0;
  let mortgageDop = 0;
  let nonMortgageDop = 0;
  let securedDop = 0;
  let usdDop = 0;
  let annualInterestCostDop = 0;
  let weightedRateNumerator = 0;
  let highestRate = 0;
  let missingPaymentCount = 0;

  for (const liability of liabilities) {
    const category = normalizeLiabilityCategory(liability.category);
    const amountDop = toDop(liability.amount, liability.currency);
    const monthlyPayment = toDop(liability.monthlyPayment, liability.currency);
    const interestRate = normalizeAmount(liability.interestRate);

    if (amountDop <= 0) {
      continue;
    }

    breakdown.set(category, (breakdown.get(category) ?? 0) + amountDop);
    totalDop += amountDop;
    monthlyPaymentDop += monthlyPayment;
    weightedRateNumerator += amountDop * interestRate;
    annualInterestCostDop += amountDop * (interestRate / 100);
    highestRate = Math.max(highestRate, interestRate);

    if (monthlyPayment <= 0) {
      missingPaymentCount += 1;
    }

    if (liability.currency === 'USD') {
      usdDop += amountDop;
    }

    if (category === 'mortgage') {
      mortgageDop += amountDop;
      securedDop += amountDop;
    }

    if (category === 'vehicle-loan') {
      securedDop += amountDop;
    }

    if (nonMortgageDebtCategories.has(category)) {
      nonMortgageDop += amountDop;
    }

    if (highCostDebtCategories.has(category) || interestRate >= financialContext.highCostDebtRatePercent) {
      highCostDop += amountDop;
    }
  }

  return {
    totalDop,
    monthlyPaymentDop,
    highCostDop,
    mortgageDop,
    nonMortgageDop,
    securedDop,
    usdDop,
    annualInterestCostDop,
    weightedAverageRate: totalDop > 0 ? weightedRateNumerator / totalDop : null,
    highestRate,
    missingPaymentCount,
    categoryCount: breakdown.size,
    breakdown: mapBreakdown(breakdown)
  };
}

function calculateBudgetMetrics(personalBudget) {
  const incomes = Array.isArray(personalBudget?.incomes) ? personalBudget.incomes : [];
  const expenses = Array.isArray(personalBudget?.expenses) ? personalBudget.expenses : [];
  const monthlyIncomeDop = sumEntriesDop(incomes);
  const monthlyExpensesDop = sumEntriesDop(expenses);
  const monthlySurplusDop = monthlyIncomeDop - monthlyExpensesDop;

  return {
    monthlyIncomeDop,
    monthlyExpensesDop,
    monthlySurplusDop,
    savingsRate: monthlyIncomeDop > 0 ? monthlySurplusDop / monthlyIncomeDop : null,
    expenseRatio: monthlyIncomeDop > 0 ? monthlyExpensesDop / monthlyIncomeDop : null,
    hasBudgetData: monthlyIncomeDop > 0 || monthlyExpensesDop > 0
  };
}

function calculateDerivedMetrics(assetMetrics, liabilityMetrics, budgetMetrics) {
  const netWorthDop = assetMetrics.totalDop - liabilityMetrics.totalDop;
  const stableReserveTargetDop = budgetMetrics.monthlyExpensesDop * financialContext.emergencyFundStableMonths;
  const strongReserveTargetDop = budgetMetrics.monthlyExpensesDop * financialContext.emergencyFundStrongMonths;
  const aggressiveReserveTargetDop = budgetMetrics.monthlyExpensesDop * financialContext.emergencyFundAggressiveMonths;
  const stableReserveGapDop = Math.max(0, stableReserveTargetDop - assetMetrics.liquidDop);
  const strongReserveGapDop = Math.max(0, strongReserveTargetDop - assetMetrics.liquidDop);
  const annualExpensesDop = budgetMetrics.monthlyExpensesDop * 12;
  const financialIndependenceTargetDop = annualExpensesDop * 25;

  return {
    netWorthDop,
    stableReserveTargetDop,
    strongReserveTargetDop,
    aggressiveReserveTargetDop,
    stableReserveGapDop,
    strongReserveGapDop,
    annualExpensesDop,
    financialIndependenceTargetDop,
    debtToAssetRatio: ratioOrNull(liabilityMetrics.totalDop, assetMetrics.totalDop),
    liquidityMonths: ratioOrNull(assetMetrics.liquidDop, budgetMetrics.monthlyExpensesDop),
    netWorthMonths: budgetMetrics.monthlyExpensesDop > 0 && netWorthDop > 0 ? netWorthDop / budgetMetrics.monthlyExpensesDop : 0,
    debtPaymentToIncomeRatio: ratioOrNull(liabilityMetrics.monthlyPaymentDop, budgetMetrics.monthlyIncomeDop),
    liabilityToAnnualIncomeRatio: ratioOrNull(liabilityMetrics.totalDop, budgetMetrics.monthlyIncomeDop * 12),
    nonMortgageDebtToAnnualIncomeRatio: ratioOrNull(liabilityMetrics.nonMortgageDop, budgetMetrics.monthlyIncomeDop * 12),
    productiveAssetShare: ratioOrNull(assetMetrics.productiveDop, assetMetrics.totalDop),
    liquidShare: ratioOrNull(assetMetrics.liquidDop, assetMetrics.totalDop),
    realAssetShare: ratioOrNull(assetMetrics.realDop, assetMetrics.totalDop),
    usdAssetShare: ratioOrNull(assetMetrics.usdDop, assetMetrics.totalDop),
    usdDebtShare: ratioOrNull(liabilityMetrics.usdDop, liabilityMetrics.totalDop),
    largestPositionShare: ratioOrNull(assetMetrics.largestPositionDop, assetMetrics.totalDop),
    liquidNetWorthRatio: ratioOrNull(assetMetrics.liquidDop - liabilityMetrics.highCostDop, Math.max(1, Math.abs(netWorthDop))),
    highCostDebtToLiquidRatio: ratioOrNull(liabilityMetrics.highCostDop, assetMetrics.liquidDop),
    debtWeightedAverageRateRatio: liabilityMetrics.weightedAverageRate === null ? null : liabilityMetrics.weightedAverageRate / 100,
    annualInflationDragDop: assetMetrics.liquidDop * (financialContext.annualInflationPercent / 100),
    financialIndependenceProgress: financialIndependenceTargetDop > 0 && netWorthDop > 0 ? netWorthDop / financialIndependenceTargetDop : null,
    currencyShockNetDop: (assetMetrics.usdDop - liabilityMetrics.usdDop) * (financialContext.currencyShockPercent / 100),
    marketDrawdownDop: assetMetrics.productiveDop * (financialContext.marketDrawdownPercent / 100),
    realAssetHaircutDop: assetMetrics.realDop * (financialContext.realAssetHaircutPercent / 100),
    rateShockAnnualDop: liabilityMetrics.totalDop * (financialContext.rateShockPercent / 100)
  };
}

function identifySignals({ assets, liabilities, assetMetrics, liabilityMetrics, budgetMetrics, derived }) {
  const signals = [];

  if (assets.length === 0 && liabilities.length === 0) {
    signals.push('sin-datos-patrimonio');
  }

  if (!budgetMetrics.hasBudgetData) {
    signals.push('sin-presupuesto-base');
  }

  if (derived.netWorthDop < 0) {
    signals.push('patrimonio-negativo');
  }

  if (derived.netWorthDop > 0 && derived.netWorthDop < financialContext.firstQuintileBasicBasketProxyDop) {
    signals.push('patrimonio-por-debajo-canasta-vulnerable');
  }

  if (derived.liquidityMonths !== null && derived.liquidityMonths < financialContext.emergencyFundMinimumMonths) {
    signals.push('liquidez-critica');
  } else if (derived.liquidityMonths !== null && derived.liquidityMonths < financialContext.emergencyFundStableMonths) {
    signals.push('liquidez-baja');
  } else if (derived.liquidityMonths !== null && derived.liquidityMonths >= financialContext.emergencyFundStrongMonths) {
    signals.push('liquidez-fuerte');
  }

  if (derived.strongReserveGapDop > 0 && derived.stableReserveGapDop === 0) {
    signals.push('reserva-estable-no-fuerte');
  }

  if (derived.debtToAssetRatio !== null && derived.debtToAssetRatio >= financialContext.debtToAssetStressRatio) {
    signals.push('apalancamiento-alto');
  } else if (derived.debtToAssetRatio !== null && derived.debtToAssetRatio >= financialContext.debtToAssetCautionRatio) {
    signals.push('apalancamiento-medio');
  }

  if (derived.debtPaymentToIncomeRatio !== null && derived.debtPaymentToIncomeRatio >= financialContext.debtPaymentToIncomeStressRatio) {
    signals.push('pagos-deuda-estresan-ingreso');
  } else if (derived.debtPaymentToIncomeRatio !== null && derived.debtPaymentToIncomeRatio >= financialContext.debtPaymentToIncomeCautionRatio) {
    signals.push('pagos-deuda-elevados');
  }

  if (derived.nonMortgageDebtToAnnualIncomeRatio !== null && derived.nonMortgageDebtToAnnualIncomeRatio >= financialContext.nonMortgageDebtToIncomeCautionRatio) {
    signals.push('deuda-consumo-alta');
  }

  if (liabilityMetrics.highCostDop > 0) {
    signals.push('deuda-alto-costo');
  }

  if (liabilityMetrics.missingPaymentCount > 0) {
    signals.push('deuda-sin-cuota-registrada');
  }

  if (derived.productiveAssetShare !== null && derived.productiveAssetShare < financialContext.investmentShareBuildingRatio && derived.netWorthDop > 0) {
    signals.push('capital-productivo-bajo');
  } else if (derived.productiveAssetShare !== null && derived.productiveAssetShare >= financialContext.investmentShareStrongRatio) {
    signals.push('capital-productivo-fuerte');
  }

  if (derived.largestPositionShare !== null && derived.largestPositionShare >= financialContext.concentrationStressRatio) {
    signals.push('concentracion-extrema');
  } else if (derived.largestPositionShare !== null && derived.largestPositionShare >= financialContext.concentrationCautionRatio) {
    signals.push('concentracion-alta');
  }

  if ((derived.usdDebtShare ?? 0) > 0.25 && (derived.usdDebtShare ?? 0) > (derived.usdAssetShare ?? 0) + 0.15) {
    signals.push('descalce-usd');
  } else if ((derived.usdAssetShare ?? 0) >= 0.15 || (derived.usdDebtShare ?? 0) >= 0.15) {
    signals.push('exposicion-usd-material');
  }

  if ((derived.liquidShare ?? 0) > 0.7 && (derived.productiveAssetShare ?? 0) < financialContext.investmentShareBuildingRatio && (derived.liquidityMonths ?? 0) > financialContext.emergencyFundStrongMonths) {
    signals.push('efectivo-ocioso');
  }

  if (assetMetrics.cashDop > budgetMetrics.monthlyExpensesDop * 0.5 && budgetMetrics.monthlyExpensesDop > 0) {
    signals.push('mucho-efectivo-fisico');
  }

  if (budgetMetrics.monthlySurplusDop < 0) {
    signals.push('flujo-mensual-negativo');
  }

  if (budgetMetrics.savingsRate !== null && budgetMetrics.savingsRate >= 0.2) {
    signals.push('capacidad-ahorro-fuerte');
  }

  if (liabilities.length === 0 && assetMetrics.totalDop > 0) {
    signals.push('sin-deuda');
  }

  return signals;
}

function buildScoreDimensions({ assets, liabilities, assetMetrics, liabilityMetrics, budgetMetrics, derived, signals }) {
  if (assets.length === 0 && liabilities.length === 0) {
    return emptyScoreDimensions();
  }

  const solvencyScore = derived.netWorthDop < 0
    ? 5
    : derived.debtToAssetRatio === null
      ? 92
      : derived.debtToAssetRatio >= 0.8
        ? 15
        : derived.debtToAssetRatio >= financialContext.debtToAssetStressRatio
          ? 35
          : derived.debtToAssetRatio >= financialContext.debtToAssetCautionRatio
            ? 60
            : derived.debtToAssetRatio >= 0.2
              ? 78
              : 94;
  const liquidityScore = derived.liquidityMonths === null
    ? 38
    : derived.liquidityMonths < 0.5
      ? 12
      : derived.liquidityMonths < 1
        ? 25
        : derived.liquidityMonths < 3
          ? 52
          : derived.liquidityMonths < 6
            ? 78
            : 96;
  const paymentScore = derived.debtPaymentToIncomeRatio === null
    ? liabilityMetrics.totalDop > 0 ? 45 : 90
    : derived.debtPaymentToIncomeRatio >= financialContext.debtPaymentToIncomeStressRatio
      ? 18
      : derived.debtPaymentToIncomeRatio >= financialContext.debtPaymentToIncomeCautionRatio
        ? 45
        : derived.debtPaymentToIncomeRatio >= 0.2
          ? 70
          : 90;
  const debtCostScore = liabilityMetrics.highCostDop <= 0
    ? 92
    : (derived.highCostDebtToLiquidRatio ?? 999) > 1
      ? 22
      : (derived.highCostDebtToLiquidRatio ?? 0) > 0.5
        ? 42
        : 62;
  const productiveScore = derived.productiveAssetShare === null
    ? 30
    : derived.productiveAssetShare < 0.05
      ? 32
      : derived.productiveAssetShare < financialContext.investmentShareBuildingRatio
        ? 48
        : derived.productiveAssetShare < financialContext.investmentShareStrongRatio
          ? 74
          : 90;
  const diversificationScore = derived.largestPositionShare === null
    ? 40
    : derived.largestPositionShare >= financialContext.concentrationStressRatio
      ? 30
      : derived.largestPositionShare >= financialContext.concentrationCautionRatio
        ? 52
        : assetMetrics.categoryCount >= 4
          ? 88
          : 70;
  const currencyScore = signals.includes('descalce-usd')
    ? 35
    : signals.includes('exposicion-usd-material')
      ? 72
      : 85;
  const cashFlowScore = budgetMetrics.savingsRate === null
    ? 45
    : budgetMetrics.savingsRate < 0
      ? 15
      : budgetMetrics.savingsRate < 0.05
        ? 38
        : budgetMetrics.savingsRate < 0.1
          ? 54
          : budgetMetrics.savingsRate < 0.2
            ? 74
            : 90;

  return [
    buildScoreDimension('solvency', 'Solvencia', solvencyScore, 0.2, `Patrimonio neto ${formatDop(derived.netWorthDop)} y deuda/activos ${formatRatioLabel(derived.debtToAssetRatio)}.`),
    buildScoreDimension('liquidity', 'Liquidez', liquidityScore, 0.18, `Reserva liquida de ${formatMonths(derived.liquidityMonths)} frente a gastos mensuales.`),
    buildScoreDimension('payment-pressure', 'Presion de cuotas', paymentScore, 0.14, `Cuotas mensuales equivalen a ${formatRatioLabel(derived.debtPaymentToIncomeRatio)} del ingreso.`),
    buildScoreDimension('debt-cost', 'Costo de deuda', debtCostScore, 0.13, `Deuda cara: ${formatDop(liabilityMetrics.highCostDop)}; tasa media ${formatRate(liabilityMetrics.weightedAverageRate)}.`),
    buildScoreDimension('productive-capital', 'Capital productivo', productiveScore, 0.13, `${formatDop(assetMetrics.productiveDop)} en inversiones, retiro o negocio.`),
    buildScoreDimension('diversification', 'Diversificacion', diversificationScore, 0.1, `Mayor posicion: ${assetMetrics.largestPositionName || 'N/A'} (${formatRatioLabel(derived.largestPositionShare)}).`),
    buildScoreDimension('currency', 'Moneda', currencyScore, 0.06, `Activos USD ${formatRatioLabel(derived.usdAssetShare)}; deudas USD ${formatRatioLabel(derived.usdDebtShare)}.`),
    buildScoreDimension('cash-flow', 'Flujo mensual', cashFlowScore, 0.06, `Resultado mensual estimado ${formatDop(budgetMetrics.monthlySurplusDop)}.`)
  ];
}

function emptyScoreDimensions() {
  return [
    buildScoreDimension('solvency', 'Solvencia', 0, 0.2, 'Sin datos patrimoniales.'),
    buildScoreDimension('liquidity', 'Liquidez', 0, 0.18, 'Sin activos liquidos.'),
    buildScoreDimension('payment-pressure', 'Presion de cuotas', 0, 0.14, 'Sin cuotas registradas.'),
    buildScoreDimension('debt-cost', 'Costo de deuda', 0, 0.13, 'Sin deudas registradas.'),
    buildScoreDimension('productive-capital', 'Capital productivo', 0, 0.13, 'Sin inversiones registradas.'),
    buildScoreDimension('diversification', 'Diversificacion', 0, 0.1, 'Sin mezcla de activos.'),
    buildScoreDimension('currency', 'Moneda', 0, 0.06, 'Sin exposicion registrada.'),
    buildScoreDimension('cash-flow', 'Flujo mensual', 0, 0.06, 'Sin presupuesto base.')
  ];
}

function buildScoreDimension(id, label, score, weight, detail) {
  const roundedScore = clamp(Math.round(score), 0, 100);

  return {
    id,
    label,
    score: roundedScore,
    weight,
    weightedScore: roundRatio(roundedScore * weight),
    tone: toneForScore(roundedScore),
    detail
  };
}

function calculateCompositeScore(scoreDimensions, signals) {
  const baseScore = scoreDimensions.reduce((total, dimension) => total + dimension.score * dimension.weight, 0);
  const penalties = [
    signals.includes('patrimonio-negativo') ? 8 : 0,
    signals.includes('liquidez-critica') ? 7 : 0,
    signals.includes('deuda-alto-costo') ? 5 : 0,
    signals.includes('descalce-usd') ? 4 : 0,
    signals.includes('flujo-mensual-negativo') ? 5 : 0,
    signals.includes('deuda-sin-cuota-registrada') ? 3 : 0
  ].reduce((total, value) => total + value, 0);

  return clamp(Math.round(baseScore - penalties), 0, 100);
}

function classifyStatus({ assets, liabilities, derived, score, signals }) {
  if (assets.length === 0 && liabilities.length === 0) {
    return 'empty';
  }

  if (derived.netWorthDop < 0) {
    return 'negative';
  }

  if (signals.includes('liquidez-critica') || signals.includes('apalancamiento-alto') || signals.includes('pagos-deuda-estresan-ingreso')) {
    return 'fragile';
  }

  if (score >= 82
    && (derived.liquidityMonths ?? 0) >= financialContext.emergencyFundStrongMonths
    && (derived.debtToAssetRatio === null || derived.debtToAssetRatio < 0.25)
    && (derived.productiveAssetShare ?? 0) >= financialContext.investmentShareBuildingRatio) {
    return 'strong';
  }

  if (score >= 68
    && (derived.liquidityMonths ?? 0) >= financialContext.emergencyFundStableMonths
    && (derived.debtToAssetRatio === null || derived.debtToAssetRatio < financialContext.debtToAssetCautionRatio)) {
    return 'stable';
  }

  return 'building';
}

function toneForStatus(status) {
  return {
    empty: 'neutral',
    negative: 'danger',
    fragile: 'danger',
    building: 'warning',
    stable: 'success',
    strong: 'success'
  }[status] ?? 'neutral';
}

function toneForScore(score) {
  return score >= 76 ? 'success' : score >= 50 ? 'warning' : 'danger';
}

function headlineForStatus(status, signals) {
  if (signals.includes('deuda-alto-costo') && signals.includes('liquidez-critica')) {
    return 'Choque de liquidez y deuda cara';
  }

  if (signals.includes('deuda-alto-costo')) {
    return 'Deuda cara domina la lectura';
  }

  if (signals.includes('descalce-usd')) {
    return 'Riesgo cambiario activo';
  }

  return {
    empty: 'Sin mapa patrimonial',
    negative: 'Patrimonio negativo',
    fragile: 'Posicion fragil',
    building: 'Base en construccion',
    stable: 'Base estable',
    strong: 'Patrimonio fuerte'
  }[status] ?? 'Lectura patrimonial';
}

function buildMessage({ status, assetMetrics, liabilityMetrics, budgetMetrics, derived, signals }) {
  if (status === 'empty') {
    return 'Agrega efectivo, cuentas, inversiones y deudas para activar solvencia, liquidez, apalancamiento, moneda, concentracion y contexto RD/global.';
  }

  const liquidityText = derived.liquidityMonths === null ? 'sin gasto mensual base' : `${formatNumber(derived.liquidityMonths)} meses liquidos`;
  const debtText = derived.debtToAssetRatio === null ? 'sin deuda' : `deuda/activos ${formatPercent(derived.debtToAssetRatio)}`;
  const productiveText = `capital productivo ${formatPercent(derived.productiveAssetShare ?? 0)}`;

  if (status === 'negative') {
    return `Patrimonio neto ${formatDop(derived.netWorthDop)}; ${debtText}, ${liquidityText}. El foco no es invertir: es detener deuda cara, asegurar caja y recuperar solvencia.`;
  }

  if (status === 'fragile') {
    return `Activos ${formatDop(assetMetrics.totalDop)} contra deudas ${formatDop(liabilityMetrics.totalDop)}; ${liquidityText}, ${debtText}. La posicion puede romperse con perdida de ingreso, tasa o FX.`;
  }

  if (status === 'building') {
    const nextMove = signals.includes('liquidez-baja') ? 'subir reserva liquida a 3 meses' : 'reducir concentracion y convertir excedente en activos productivos';
    return `Patrimonio neto ${formatDop(derived.netWorthDop)}; ${liquidityText}, ${debtText}, ${productiveText}. La siguiente mejora clara es ${nextMove}.`;
  }

  if (status === 'stable') {
    return `Patrimonio neto ${formatDop(derived.netWorthDop)} con ${liquidityText}; ${debtText} y ${productiveText}. Hay base, pero aun conviene vigilar concentracion, inflacion y USD.`;
  }

  return `Patrimonio neto ${formatDop(derived.netWorthDop)}; ${liquidityText}, ${debtText}, ${productiveText}. La posicion resiste mejor choques de ingreso, inflacion, tasas y cambio.`;
}

function buildDiagnostics({ assetMetrics, liabilityMetrics, budgetMetrics, derived }) {
  return [
    buildDiagnostic('liquidity', 'Liquidez real', formatMonths(derived.liquidityMonths), `Activos liquidos ${formatDop(assetMetrics.liquidDop)} vs gasto mensual ${formatDop(budgetMetrics.monthlyExpensesDop)}. Gap a 3 meses: ${formatDop(derived.stableReserveGapDop)}.`, derived.liquidityMonths === null ? 'neutral' : derived.liquidityMonths < 1 ? 'danger' : derived.liquidityMonths < 3 ? 'warning' : 'success'),
    buildDiagnostic('solvency', 'Solvencia neta', formatDop(derived.netWorthDop), `Activos ${formatDop(assetMetrics.totalDop)} menos deudas ${formatDop(liabilityMetrics.totalDop)}. Equivale a ${formatNumber(derived.netWorthMonths)} meses de gasto.`, derived.netWorthDop < 0 ? 'danger' : derived.netWorthDop < financialContext.largeCompanyMinimumWageDop * 3 ? 'warning' : 'success'),
    buildDiagnostic('leverage', 'Apalancamiento', formatRatioLabel(derived.debtToAssetRatio), `Deuda total sobre activos; alerta en ${formatPercent(financialContext.debtToAssetCautionRatio)} y estres en ${formatPercent(financialContext.debtToAssetStressRatio)}.`, derived.debtToAssetRatio === null || derived.debtToAssetRatio < 0.4 ? 'success' : derived.debtToAssetRatio < 0.6 ? 'warning' : 'danger'),
    buildDiagnostic('payments', 'Cuotas / ingreso', formatRatioLabel(derived.debtPaymentToIncomeRatio), `Cuotas mensuales ${formatDop(liabilityMetrics.monthlyPaymentDop)} frente a ingreso mensual ${formatDop(budgetMetrics.monthlyIncomeDop)}.`, derived.debtPaymentToIncomeRatio === null || derived.debtPaymentToIncomeRatio < 0.36 ? 'success' : derived.debtPaymentToIncomeRatio < 0.5 ? 'warning' : 'danger'),
    buildDiagnostic('debt-cost', 'Costo deuda', formatRate(liabilityMetrics.weightedAverageRate), `Interes anual aproximado ${formatDop(liabilityMetrics.annualInterestCostDop)}; deuda cara ${formatDop(liabilityMetrics.highCostDop)}.`, liabilityMetrics.highCostDop > 0 ? 'danger' : liabilityMetrics.totalDop > 0 ? 'warning' : 'success'),
    buildDiagnostic('productive-capital', 'Capital productivo', formatRatioLabel(derived.productiveAssetShare), `${formatDop(assetMetrics.productiveDop)} en inversiones, retiro o negocio frente a ${formatDop(assetMetrics.totalDop)} en activos.`, derived.productiveAssetShare !== null && derived.productiveAssetShare >= 0.1 ? 'success' : 'warning'),
    buildDiagnostic('concentration', 'Concentracion', formatRatioLabel(derived.largestPositionShare), `Mayor posicion: ${assetMetrics.largestPositionName || 'N/A'} por ${formatDop(assetMetrics.largestPositionDop)}.`, derived.largestPositionShare !== null && derived.largestPositionShare >= 0.75 ? 'danger' : derived.largestPositionShare !== null && derived.largestPositionShare >= 0.6 ? 'warning' : 'success'),
    buildDiagnostic('currency', 'DOP / USD', `${formatRatioLabel(derived.usdAssetShare)} A / ${formatRatioLabel(derived.usdDebtShare)} D`, `Choque USD +${financialContext.currencyShockPercent}% moveria patrimonio en ${formatDop(derived.currencyShockNetDop)}.`, derived.usdDebtShare !== null && derived.usdDebtShare > (derived.usdAssetShare ?? 0) + 0.15 ? 'warning' : 'success'),
    buildDiagnostic('inflation', 'Arrastre inflacion', formatDop(derived.annualInflationDragDop), `Costo estimado de mantener liquidez sin rendimiento usando inflacion ${financialContext.annualInflationPercent}%.`, derived.annualInflationDragDop > budgetMetrics.monthlyExpensesDop && budgetMetrics.monthlyExpensesDop > 0 ? 'warning' : 'neutral')
  ];
}

function buildDiagnostic(id, label, value, detail, tone) {
  return { id, label, value, detail, tone };
}

function buildBenchmarks({ assetMetrics, liabilityMetrics, budgetMetrics, derived }) {
  return [
    buildBenchmark('reserve-3m', 'Reserva minima practica', formatDop(derived.stableReserveTargetDop), `3 meses de gasto local segun tu Presupuesto; faltan ${formatDop(derived.stableReserveGapDop)}.`, derived.stableReserveGapDop <= 0 ? 'success' : 'warning'),
    buildBenchmark('reserve-6m', 'Reserva fuerte', formatDop(derived.strongReserveTargetDop), '6 meses protege mejor ingresos variables, choques medicos, reparaciones y empleo.', derived.strongReserveGapDop <= 0 ? 'success' : 'warning'),
    buildBenchmark('findex-emergency', 'Findex emergencia global', `${financialContext.globalEmergencyMoneyAccessPercent}%`, 'Solo 56% de adultos reporta acceso confiable a dinero extra en emergencia; tu liquidez se compara contra esa idea de resiliencia.', derived.liquidityMonths !== null && derived.liquidityMonths >= 3 ? 'success' : 'warning'),
    buildBenchmark('debt-service', 'Cuotas / ingreso', formatPercent(derived.debtPaymentToIncomeRatio ?? 0), `Umbral de cautela ${formatPercent(financialContext.debtPaymentToIncomeCautionRatio)}; estres ${formatPercent(financialContext.debtPaymentToIncomeStressRatio)}.`, derived.debtPaymentToIncomeRatio === null || derived.debtPaymentToIncomeRatio < 0.36 ? 'success' : derived.debtPaymentToIncomeRatio < 0.5 ? 'warning' : 'danger'),
    buildBenchmark('debt-asset', 'Deuda / activos', formatRatioLabel(derived.debtToAssetRatio), `Cautela ${formatPercent(financialContext.debtToAssetCautionRatio)}; estres ${formatPercent(financialContext.debtToAssetStressRatio)}.`, derived.debtToAssetRatio === null || derived.debtToAssetRatio < 0.4 ? 'success' : derived.debtToAssetRatio < 0.6 ? 'warning' : 'danger'),
    buildBenchmark('high-cost-rate', 'Deuda cara', formatDop(liabilityMetrics.highCostDop), `Marcada si la tasa es >= ${financialContext.highCostDebtRatePercent}% o si es tarjeta/prestamo personal/impuesto.`, liabilityMetrics.highCostDop > 0 ? 'danger' : 'success'),
    buildBenchmark('productive-share', 'Capital productivo', formatRatioLabel(derived.productiveAssetShare), `Construccion desde ${formatPercent(financialContext.investmentShareBuildingRatio)}; fuerte desde ${formatPercent(financialContext.investmentShareStrongRatio)}.`, derived.productiveAssetShare !== null && derived.productiveAssetShare >= 0.1 ? 'success' : 'warning'),
    buildBenchmark('concentration', 'Concentracion', formatRatioLabel(derived.largestPositionShare), `Alerta si una posicion supera ${formatPercent(financialContext.concentrationCautionRatio)} de activos; riesgo alto sobre ${formatPercent(financialContext.concentrationStressRatio)}.`, derived.largestPositionShare !== null && derived.largestPositionShare >= 0.75 ? 'danger' : derived.largestPositionShare !== null && derived.largestPositionShare >= 0.6 ? 'warning' : 'success'),
    buildBenchmark('inflation-rd', 'Inflacion RD', `${financialContext.annualInflationPercent}%`, 'Referencia BCRD usada para estimar perdida de poder de compra de liquidez sin rendimiento.', assetMetrics.liquidDop > 0 ? 'neutral' : 'success'),
    buildBenchmark('minimum-wage-anchor', 'Escala salarial RD', formatDop(financialContext.largeCompanyMinimumWageDop), 'Salario minimo grande no sectorizado usado como ancla local para dimensionar patrimonio y reserva.', derived.netWorthDop >= financialContext.largeCompanyMinimumWageDop * 3 ? 'success' : 'warning')
  ];
}

function buildBenchmark(id, label, value, detail, tone) {
  return { id, label, value, detail, tone };
}

function buildStressTests({ assetMetrics, liabilityMetrics, budgetMetrics, derived }) {
  const threeMonthEmergency = assetMetrics.liquidDop - budgetMetrics.monthlyExpensesDop * 3;
  const sixMonthEmergency = assetMetrics.liquidDop - budgetMetrics.monthlyExpensesDop * 6;
  const marketShockNetWorth = derived.netWorthDop - derived.marketDrawdownDop;
  const realAssetShockNetWorth = derived.netWorthDop - derived.realAssetHaircutDop;
  const fxShockNetWorth = derived.netWorthDop + derived.currencyShockNetDop;
  const inflationOneYear = assetMetrics.liquidDop - derived.annualInflationDragDop;
  const rateShockMonthlyCost = derived.rateShockAnnualDop / 12;
  const debtCostCoverage = assetMetrics.liquidDop - liabilityMetrics.highCostDop;

  return [
    buildStressTest('three-month-emergency', 'Emergencia 3 meses', formatDop(threeMonthEmergency), `Liquidez despues de cubrir 3 meses de gasto (${formatDop(budgetMetrics.monthlyExpensesDop * 3)}).`, threeMonthEmergency >= 0 ? 'success' : 'danger'),
    buildStressTest('six-month-emergency', 'Emergencia 6 meses', formatDop(sixMonthEmergency), `Liquidez despues de cubrir 6 meses de gasto (${formatDop(budgetMetrics.monthlyExpensesDop * 6)}).`, sixMonthEmergency >= 0 ? 'success' : sixMonthEmergency > -budgetMetrics.monthlyExpensesDop * 2 ? 'warning' : 'danger'),
    buildStressTest('market-drawdown', `Mercado -${financialContext.marketDrawdownPercent}%`, formatDop(marketShockNetWorth), `Patrimonio si inversiones/retiro/negocio caen ${financialContext.marketDrawdownPercent}%. Impacto ${formatDop(derived.marketDrawdownDop)}.`, marketShockNetWorth >= 0 ? 'success' : 'danger'),
    buildStressTest('real-asset-haircut', `Activos reales -${financialContext.realAssetHaircutPercent}%`, formatDop(realAssetShockNetWorth), `Patrimonio si inmuebles/vehiculos bajan ${financialContext.realAssetHaircutPercent}%. Impacto ${formatDop(derived.realAssetHaircutDop)}.`, realAssetShockNetWorth >= 0 ? 'success' : 'danger'),
    buildStressTest('usd-shock', `USD +${financialContext.currencyShockPercent}%`, formatDop(fxShockNetWorth), `Patrimonio tras depreciacion DOP: activos USD ayudan, deudas USD duelen. Impacto neto ${formatDop(derived.currencyShockNetDop)}.`, derived.currencyShockNetDop >= 0 ? 'success' : 'warning'),
    buildStressTest('inflation-drag', 'Inflacion 12 meses', formatDop(inflationOneYear), `Poder de compra aproximado de la liquidez despues de inflacion ${financialContext.annualInflationPercent}%.`, derived.annualInflationDragDop > budgetMetrics.monthlyExpensesDop && budgetMetrics.monthlyExpensesDop > 0 ? 'warning' : 'neutral'),
    buildStressTest('rate-shock', `Tasas +${financialContext.rateShockPercent} pts`, formatDop(rateShockMonthlyCost), `Costo mensual adicional aproximado si toda la deuda se encarece ${financialContext.rateShockPercent} puntos.`, rateShockMonthlyCost > budgetMetrics.monthlySurplusDop && budgetMetrics.monthlySurplusDop > 0 ? 'danger' : 'warning'),
    buildStressTest('high-cost-payoff', 'Liquidar deuda cara', formatDop(debtCostCoverage), `Liquidez restante si se paga toda la deuda cara (${formatDop(liabilityMetrics.highCostDop)}).`, debtCostCoverage >= budgetMetrics.monthlyExpensesDop ? 'success' : debtCostCoverage >= 0 ? 'warning' : 'danger')
  ];
}

function buildStressTest(id, label, value, detail, tone) {
  return { id, label, value, detail, tone };
}

function buildAnalysisSections({ status, assetMetrics, liabilityMetrics, budgetMetrics, derived, signals, scoreDimensions, benchmarks, stressTests }) {
  const scoreLeaders = [...scoreDimensions].sort((first, second) => second.score - first.score).slice(0, 2);
  const scoreLaggards = [...scoreDimensions].sort((first, second) => first.score - second.score).slice(0, 2);

  return [
    {
      id: 'executive',
      label: 'SINTESIS',
      tone: toneForStatus(status),
      title: headlineForStatus(status, signals),
      body: buildExecutiveBody(status, assetMetrics, liabilityMetrics, budgetMetrics, derived, signals),
      metrics: [
        `Score ${calculateCompositeScore(scoreDimensions, signals)}/100`,
        `Patrimonio ${formatDop(derived.netWorthDop)}`,
        `Liquidez ${formatMonths(derived.liquidityMonths)}`,
        `Deuda/activos ${formatRatioLabel(derived.debtToAssetRatio)}`
      ],
      sourceNotes: ['World Bank Findex', 'CFPB Financial Well-Being', 'BCRD ENGIH', 'Budget Signal Presupuesto']
    },
    {
      id: 'liquidity',
      label: 'RESILIENCIA',
      tone: derived.liquidityMonths === null ? 'neutral' : derived.liquidityMonths < 1 ? 'danger' : derived.liquidityMonths < 3 ? 'warning' : 'success',
      title: liquidityTitle(derived),
      body: buildLiquidityBody(assetMetrics, budgetMetrics, derived, stressTests),
      metrics: [`Liquido ${formatDop(assetMetrics.liquidDop)}`, `Meta 3M ${formatDop(derived.stableReserveTargetDop)}`, `Meta 6M ${formatDop(derived.strongReserveTargetDop)}`],
      sourceNotes: ['CFPB Emergency Fund Guide', 'World Bank Global Findex emergency access', 'Federal Reserve SHED']
    },
    {
      id: 'debt',
      label: 'DEUDA',
      tone: liabilityMetrics.highCostDop > 0 || signals.includes('pagos-deuda-estresan-ingreso') ? 'danger' : liabilityMetrics.totalDop > 0 ? 'warning' : 'success',
      title: debtTitle(liabilityMetrics, derived, signals),
      body: buildDebtBody(liabilityMetrics, budgetMetrics, derived, signals),
      metrics: [`Deuda total ${formatDop(liabilityMetrics.totalDop)}`, `Deuda cara ${formatDop(liabilityMetrics.highCostDop)}`, `Cuotas ${formatRatioLabel(derived.debtPaymentToIncomeRatio)} ingreso`],
      sourceNotes: ['BCRD Sector Monetario y Financiero', 'IMF GFSR debt vulnerability', 'CFPB debt shock guidance']
    },
    {
      id: 'capital',
      label: 'CRECIMIENTO',
      tone: derived.productiveAssetShare !== null && derived.productiveAssetShare >= financialContext.investmentShareBuildingRatio ? 'success' : 'warning',
      title: capitalTitle(assetMetrics, derived, signals),
      body: buildCapitalBody(assetMetrics, derived, signals),
      metrics: [`Productivo ${formatDop(assetMetrics.productiveDop)}`, `Share ${formatRatioLabel(derived.productiveAssetShare)}`, `Mayor posicion ${formatRatioLabel(derived.largestPositionShare)}`],
      sourceNotes: ['SEC Investor.gov diversification', 'IMF WEO long-term growth buffers', 'BIS interconnected financial markets']
    },
    {
      id: 'macro-rd',
      label: 'RD / MACRO',
      tone: signals.includes('descalce-usd') ? 'warning' : 'neutral',
      title: 'Contexto dominicano aplicado',
      body: buildMacroBody(assetMetrics, liabilityMetrics, derived),
      metrics: [`Inflacion ${financialContext.annualInflationPercent}%`, `USD activos ${formatRatioLabel(derived.usdAssetShare)}`, `USD deudas ${formatRatioLabel(derived.usdDebtShare)}`],
      sourceNotes: ['BCRD Precios', 'BCRD Mercado Cambiario', 'BCRD Sector Monetario y Financiero', 'DGII estadisticas']
    },
    {
      id: 'data-quality',
      label: 'CALIDAD',
      tone: signals.includes('sin-presupuesto-base') || signals.includes('deuda-sin-cuota-registrada') ? 'warning' : 'success',
      title: 'Calidad de los datos',
      body: buildDataQualityBody(liabilityMetrics, budgetMetrics, signals, benchmarks),
      metrics: [`Activos ${assetMetrics.categoryCount} categorias`, `Deudas ${liabilityMetrics.categoryCount} categorias`, `${financialContext.researchSources.length} fuentes base`],
      sourceNotes: ['Engine local deterministico', 'No hay llamadas web en runtime', 'Resumen recalculado al guardar']
    },
    {
      id: 'score-drivers',
      label: 'DRIVERS',
      tone: scoreLaggards[0]?.tone ?? 'neutral',
      title: 'Que mueve el score',
      body: `Fortalezas: ${scoreLeaders.map((item) => `${item.label} ${item.score}`).join(', ') || 'ninguna aun'}. Debilidades: ${scoreLaggards.map((item) => `${item.label} ${item.score}`).join(', ') || 'ninguna critica'}.`,
      metrics: scoreDimensions.map((item) => `${item.label}: ${item.score}`).slice(0, 8),
      sourceNotes: ['Solvencia', 'liquidez', 'cuotas', 'costo deuda', 'capital productivo', 'diversificacion', 'moneda', 'flujo']
    }
  ];
}

function buildExecutiveBody(status, assetMetrics, liabilityMetrics, budgetMetrics, derived, signals) {
  if (status === 'empty') {
    return 'El motor no tiene suficiente mapa financiero. Registra activos y deudas para estimar solvencia, liquidez, capacidad de absorber choques, costo de deuda, concentracion, exposicion USD y progreso de independencia financiera.';
  }

  const pressure = signals.includes('deuda-alto-costo')
    ? 'La deuda cara tiene prioridad porque compite contra cualquier rendimiento razonable y puede convertir un choque pequeno en bola de nieve.'
    : signals.includes('liquidez-critica')
      ? 'La liquidez es el punto debil: antes de optimizar inversion, la posicion necesita efectivo seguro y accesible.'
      : 'La lectura combina patrimonio, flujo mensual, deudas, liquidez y concentracion para decidir el siguiente movimiento.';

  return `${pressure} Con activos de ${formatDop(assetMetrics.totalDop)}, deudas de ${formatDop(liabilityMetrics.totalDop)} y flujo mensual estimado de ${formatDop(budgetMetrics.monthlySurplusDop)}, el patrimonio neto queda en ${formatDop(derived.netWorthDop)}.`;
}

function buildLiquidityBody(assetMetrics, budgetMetrics, derived, stressTests) {
  const threeMonthTest = stressTests.find((test) => test.id === 'three-month-emergency');

  if (derived.liquidityMonths === null) {
    return 'Falta gasto mensual en Presupuesto, por eso el motor no puede medir meses de liquidez. Aun asi, separa efectivo fisico, cuenta corriente y ahorro porque no todos son igual de seguros o utiles ante una emergencia.';
  }

  if (derived.liquidityMonths < 1) {
    return `La reserva liquida cubre menos de 1 mes. Frente al estandar practico de 3 meses, faltan ${formatDop(derived.stableReserveGapDop)}; ${threeMonthTest?.detail ?? ''}`;
  }

  if (derived.liquidityMonths < 3) {
    return `Hay algo de absorcion, pero no suficiente. Con ${formatMonths(derived.liquidityMonths)} puedes manejar eventos pequenos, no una interrupcion seria de ingreso; faltan ${formatDop(derived.stableReserveGapDop)} para 3 meses.`;
  }

  if (derived.liquidityMonths < 6) {
    return `La reserva ya pasa el umbral estable de 3 meses. Para una posicion mas robusta en RD, donde FX, empleo y tasas pueden moverse, el siguiente objetivo son 6 meses: faltan ${formatDop(derived.strongReserveGapDop)}.`;
  }

  return `Liquidez fuerte: ${formatDop(assetMetrics.liquidDop)} cubre ${formatMonths(derived.liquidityMonths)}. El riesgo ahora no es solo falta de caja, sino exceso de efectivo sin rendimiento frente a inflacion de ${financialContext.annualInflationPercent}%.`;
}

function buildDebtBody(liabilityMetrics, budgetMetrics, derived, signals) {
  if (liabilityMetrics.totalDop <= 0) {
    return 'No hay deuda registrada. Eso libera flujo para reserva, inversion y retiro; el motor seguira vigilando concentracion e inflacion porque estar sin deuda no garantiza crecimiento patrimonial.';
  }

  const missing = signals.includes('deuda-sin-cuota-registrada') ? ' Algunas deudas no tienen cuota mensual registrada, asi que la presion de flujo puede estar subestimada.' : '';

  if (liabilityMetrics.highCostDop > 0) {
    return `Hay ${formatDop(liabilityMetrics.highCostDop)} en deuda cara y un costo anual aproximado de ${formatDop(liabilityMetrics.annualInterestCostDop)}. Si esa deuda es tarjeta o prestamo personal, pagarla suele ser una mejora de retorno/riesgo superior a invertir agresivamente.${missing}`;
  }

  return `La deuda registrada suma ${formatDop(liabilityMetrics.totalDop)} y consume ${formatRatioLabel(derived.debtPaymentToIncomeRatio)} del ingreso mensual. La tasa media aproximada es ${formatRate(liabilityMetrics.weightedAverageRate)}; compara refinanciamiento, abonos a capital y liquidez antes de tomar mas deuda.${missing}`;
}

function buildCapitalBody(assetMetrics, derived, signals) {
  if (assetMetrics.totalDop <= 0) {
    return 'Sin activos no hay base de crecimiento. El primer activo que importa es liquidez segura; luego capital productivo diversificado segun horizonte y riesgo.';
  }

  if (signals.includes('efectivo-ocioso')) {
    return `La liquidez esta cubierta, pero el capital productivo sigue bajo. Mantener demasiado efectivo puede perder poder de compra: el arrastre inflacionario estimado es ${formatDop(derived.annualInflationDragDop)} al ano.`;
  }

  if ((derived.productiveAssetShare ?? 0) < financialContext.investmentShareBuildingRatio) {
    return `Solo ${formatRatioLabel(derived.productiveAssetShare)} de activos esta en inversiones, retiro o negocio. Cuando reserva y deuda cara esten controladas, automatiza aportes para que el patrimonio no dependa solo de efectivo o bienes fisicos.`;
  }

  if (signals.includes('concentracion-alta') || signals.includes('concentracion-extrema')) {
    return `Hay capital productivo, pero la mayor posicion pesa ${formatRatioLabel(derived.largestPositionShare)}. Diversificar reduce el riesgo de que un inmueble, vehiculo, negocio o cuenta determine todo el resultado.`;
  }

  return `El capital productivo representa ${formatRatioLabel(derived.productiveAssetShare)} de activos. Esa es una base razonable para crecimiento; ahora la calidad depende de diversificacion, horizonte, costos e impuestos.`;
}

function buildMacroBody(assetMetrics, liabilityMetrics, derived) {
  const fxText = derived.currencyShockNetDop >= 0
    ? `Una depreciacion de ${financialContext.currencyShockPercent}% del DOP mejoraria patrimonio en ${formatDop(derived.currencyShockNetDop)} por tu posicion neta USD.`
    : `Una depreciacion de ${financialContext.currencyShockPercent}% del DOP reduciria patrimonio en ${formatDop(Math.abs(derived.currencyShockNetDop))} por deuda USD superior a activos USD.`;

  return `RD importa mucho en esta lectura: BCRD publica IPC/canasta, tasas y mercado cambiario; ENGIH da estructura de ingresos/gastos; DGII y estadisticas financieras ayudan a entender obligaciones y activos reales. ${fxText} La liquidez de ${formatDop(assetMetrics.liquidDop)} enfrenta un arrastre inflacionario estimado de ${formatDop(derived.annualInflationDragDop)} anual, mientras la deuda de ${formatDop(liabilityMetrics.totalDop)} enfrenta sensibilidad a tasas.`;
}

function buildDataQualityBody(liabilityMetrics, budgetMetrics, signals) {
  const gaps = [];

  if (signals.includes('sin-presupuesto-base')) {
    gaps.push('falta presupuesto mensual para medir liquidez y cuotas contra ingreso');
  }

  if (signals.includes('deuda-sin-cuota-registrada')) {
    gaps.push('hay deudas sin cuota mensual');
  }

  if (liabilityMetrics.totalDop > 0 && liabilityMetrics.weightedAverageRate === 0) {
    gaps.push('las tasas de deuda estan en cero; el costo puede estar subestimado');
  }

  if (gaps.length === 0) {
    return 'Los datos principales estan completos para una lectura operativa. El motor no predice mercados; convierte tu mapa financiero en senales accionables con benchmarks globales y dominicanos.';
  }

  return `La lectura funciona, pero tiene huecos: ${gaps.join('; ')}. Completar esos datos hace mas confiables deuda/ingreso, liquidez, costo financiero y stress tests.`;
}

function buildActionPlan({ status, assetMetrics, liabilityMetrics, budgetMetrics, derived, signals }) {
  if (status === 'empty') {
    return [buildActionItem(1, 'Registrar el mapa', 'Agrega efectivo, cuentas, inversiones, bienes y cada deuda con tasa/cuota.', 'Activa el analisis completo.', 'neutral')];
  }

  const actions = [];

  if (signals.includes('deuda-alto-costo')) {
    actions.push(buildActionItem(1, 'Atacar deuda cara', `Dirige excedentes a ${formatDop(liabilityMetrics.highCostDop)} en deuda cara antes de inversiones riesgosas.`, `Ahorro potencial anual aprox. ${formatDop(liabilityMetrics.annualInterestCostDop)}.`, 'danger'));
  }

  if (derived.liquidityMonths !== null && derived.liquidityMonths < financialContext.emergencyFundStableMonths) {
    actions.push(buildActionItem(actions.length + 1, 'Completar reserva 3M', `Separa ${formatDop(derived.stableReserveGapDop)} para cubrir 3 meses de gasto.`, 'Reduce dependencia de tarjeta/prestamo ante choques.', derived.liquidityMonths < 1 ? 'danger' : 'warning'));
  }

  if (signals.includes('pagos-deuda-estresan-ingreso') || signals.includes('pagos-deuda-elevados')) {
    actions.push(buildActionItem(actions.length + 1, 'Bajar cuota mensual', 'Revisa refinanciamiento, abonos a capital o reordenamiento de vencimientos.', `Cuotas actuales: ${formatRatioLabel(derived.debtPaymentToIncomeRatio)} del ingreso.`, 'warning'));
  }

  if (signals.includes('descalce-usd')) {
    actions.push(buildActionItem(actions.length + 1, 'Cubrir riesgo USD', 'Crea activos USD o reduce deuda USD para que una subida del dolar no golpee patrimonio.', `Choque simulado: ${formatDop(derived.currencyShockNetDop)}.`, 'warning'));
  }

  if (signals.includes('efectivo-ocioso') || signals.includes('capital-productivo-bajo')) {
    actions.push(buildActionItem(actions.length + 1, 'Automatizar capital productivo', 'Cuando reserva y deuda cara esten bajo control, mueve excedente mensual a inversion/retiro/negocio diversificado.', `Capital productivo actual: ${formatRatioLabel(derived.productiveAssetShare)}.`, 'success'));
  }

  if (signals.includes('concentracion-alta') || signals.includes('concentracion-extrema')) {
    actions.push(buildActionItem(actions.length + 1, 'Reducir concentracion', `La mayor posicion pesa ${formatRatioLabel(derived.largestPositionShare)}; evita que un solo activo defina todo el patrimonio.`, 'Diversificar baja riesgo de precio, liquidez y moneda.', 'warning'));
  }

  if (signals.includes('flujo-mensual-negativo')) {
    actions.push(buildActionItem(actions.length + 1, 'Corregir flujo mensual', `El presupuesto muestra ${formatDop(budgetMetrics.monthlySurplusDop)} al mes.`, 'Sin flujo positivo, la reserva y deuda mejoran mas lento.', 'danger'));
  }

  if (actions.length === 0) {
    actions.push(buildActionItem(1, 'Mantener disciplina', 'Revisa patrimonio mensualmente, actualiza tasas/cuotas y automatiza aportes.', 'Conservar liquidez, deuda baja y diversificacion.', 'success'));
  }

  return actions.slice(0, 6).map((action, index) => ({ ...action, priority: index + 1 }));
}

function buildActionItem(priority, label, detail, impact, tone) {
  return {
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `action-${priority}`,
    priority,
    label,
    detail,
    impact,
    tone
  };
}

function liquidityTitle(derived) {
  if (derived.liquidityMonths === null) {
    return 'Liquidez sin base de gasto';
  }

  if (derived.liquidityMonths < 1) {
    return 'Reserva critica';
  }

  if (derived.liquidityMonths < 3) {
    return 'Reserva incompleta';
  }

  if (derived.liquidityMonths < 6) {
    return 'Reserva estable';
  }

  return 'Reserva fuerte';
}

function debtTitle(liabilityMetrics, derived, signals) {
  if (liabilityMetrics.totalDop <= 0) {
    return 'Sin deuda registrada';
  }

  if (signals.includes('deuda-alto-costo')) {
    return 'Costo financiero alto';
  }

  if ((derived.debtPaymentToIncomeRatio ?? 0) >= financialContext.debtPaymentToIncomeCautionRatio) {
    return 'Cuotas presionan flujo';
  }

  return 'Deuda manejable';
}

function capitalTitle(assetMetrics, derived, signals) {
  if (assetMetrics.totalDop <= 0) {
    return 'Sin activos de crecimiento';
  }

  if (signals.includes('concentracion-extrema')) {
    return 'Concentracion extrema';
  }

  if (signals.includes('capital-productivo-fuerte')) {
    return 'Capital productivo fuerte';
  }

  if ((derived.productiveAssetShare ?? 0) < financialContext.investmentShareBuildingRatio) {
    return 'Crecimiento bajo';
  }

  return 'Crecimiento en marcha';
}

function mapBreakdown(breakdown) {
  return Array.from(breakdown, ([category, amountDop]) => ({ category, amountDop: roundMoney(amountDop) }))
    .sort((first, second) => second.amountDop - first.amountDop || first.category.localeCompare(second.category));
}

function sumEntriesDop(entries) {
  return entries.reduce((total, entry) => total + toDop(entry.amount, entry.currency), 0);
}

function toDop(value, currency) {
  const amount = normalizeAmount(value);
  return currency === 'USD' ? amount * financialContext.exchangeRateDopPerUsd : amount;
}

function normalizeAssetCategory(value) {
  const category = String(value ?? '').trim();
  return ['cash', 'checking', 'savings', 'investment', 'retirement', 'real-estate', 'vehicle', 'business', 'other'].includes(category)
    ? category
    : 'other';
}

function normalizeLiabilityCategory(value) {
  const category = String(value ?? '').trim();
  return ['credit-card', 'mortgage', 'personal-loan', 'vehicle-loan', 'student-loan', 'business-loan', 'tax', 'other'].includes(category)
    ? category
    : 'other';
}

function formatDop(value) {
  return dopFormatter.format(roundMoney(value));
}

function formatPercent(value) {
  return percentFormatter.format(value);
}

function formatRatioLabel(value) {
  return value === null ? 'N/A' : formatPercent(value);
}

function formatRate(value) {
  return value === null ? 'N/A' : `${decimalFormatter.format(value)}%`;
}

function formatMonths(value) {
  return value === null ? 'N/A' : `${formatNumber(value)} meses`;
}

function formatNumber(value) {
  return decimalFormatter.format(value);
}

function normalizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function ratioOrNull(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : null;
}

function nullableRatio(value) {
  return value === null ? null : roundRatio(value);
}

function roundRatio(value) {
  return Math.round(value * 1000) / 1000;
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}