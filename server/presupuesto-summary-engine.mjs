const economicContext = {
  exchangeRateDopPerUsd: 60,
  budgetCycleEndDay: 27,
  inflationTargetMidpointPercent: 4,
  annualInflationPercent: 4.63,
  largeCompanyMinimumWageDop: 29988,
  mediumCompanyMinimumWageDop: 27489.6,
  smallCompanyMinimumWageDop: 18421.2,
  microCompanyMinimumWageDop: 16993.2,
  firstQuintileBasicBasketProxyDop: 28080,
  references: [
    'BCRD: inflacion interanual 4.63%, meta 4.0% +/- 1.0%, venta USD/RD$ 59.8567 consultado mayo 2026.',
    'Regla Presupuesto: convertir USD a DOP con tasa fija 1 USD = RD$60.',
    'Ministerio de Trabajo RD: salario minimo 2026 no sectorizado RD$29,988 grandes, RD$27,489.60 medianas, RD$18,421.20 pequenas, RD$16,993.20 micro.',
    'NerdWallet 50/30/20: usar excedente para ahorro y pago de deuda; ajustar porcentajes segun realidad.',
    'YNAB: asignar cada peso a un trabajo, preparar gastos no mensuales y decidir que debe hacer el dinero antes del proximo pago.'
  ]
};

export function generatePresupuestoSummary(personalBudget, options = {}) {
  const incomes = Array.isArray(personalBudget?.incomes) ? personalBudget.incomes : [];
  const expenses = Array.isArray(personalBudget?.expenses) ? personalBudget.expenses : [];
  const cycle = calculateBudgetCycle(options.currentDate ?? options.now ?? new Date());
  const totals = calculateTotals(incomes, expenses);
  const incomeEquivalent = totals.incomeDop + totals.incomeUsd * economicContext.exchangeRateDopPerUsd;
  const expenseEquivalent = totals.expenseDop + totals.expenseUsd * economicContext.exchangeRateDopPerUsd;
  const netDopEquivalent = totals.netDop + totals.netUsd * economicContext.exchangeRateDopPerUsd;
  const savingsRate = incomeEquivalent > 0 ? netDopEquivalent / incomeEquivalent : null;
  const expenseRatio = incomeEquivalent > 0 ? expenseEquivalent / incomeEquivalent : null;
  const reserveMonths = expenseEquivalent > 0 && netDopEquivalent > 0 ? netDopEquivalent / expenseEquivalent : 0;
  const band = classifyBand(netDopEquivalent);
  const risks = identifyRisks({ totals, incomeEquivalent, expenseEquivalent, netDopEquivalent, savingsRate, expenseRatio, cycle });
  const score = calculateScore({ band, savingsRate, expenseRatio, netDopEquivalent, reserveMonths, risks });
  const tone = toneForBand(band, risks);
  const message = buildMessage({ band, totals, netDopEquivalent, savingsRate, expenseRatio, reserveMonths, risks, cycle });

  return {
    status: band,
    tone,
    score,
    headline: headlineForBand(band, risks),
    message,
    netDopEquivalent: roundMoney(netDopEquivalent),
    nativeNet: {
      DOP: roundMoney(totals.netDop),
      USD: roundMoney(totals.netUsd)
    },
    incomeDopEquivalent: roundMoney(incomeEquivalent),
    expenseDopEquivalent: roundMoney(expenseEquivalent),
    savingsRate: savingsRate === null ? null : roundRatio(savingsRate),
    expenseRatio: expenseRatio === null ? null : roundRatio(expenseRatio),
    reserveMonths: roundRatio(reserveMonths),
    cycle,
    signals: risks,
    context: economicContext
  };
}

export function calculateBudgetCycle(currentDate = new Date()) {
  const date = normalizeDate(currentDate);
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const dayOfMonth = date.getUTCDate();
  const endDate = dayOfMonth <= economicContext.budgetCycleEndDay
    ? createUtcDate(year, monthIndex, economicContext.budgetCycleEndDay)
    : createUtcDate(year, monthIndex + 1, economicContext.budgetCycleEndDay);
  const startDate = dayOfMonth <= economicContext.budgetCycleEndDay
    ? createUtcDate(year, monthIndex - 1, economicContext.budgetCycleEndDay + 1)
    : createUtcDate(year, monthIndex, economicContext.budgetCycleEndDay + 1);
  const today = createUtcDate(year, monthIndex, dayOfMonth);
  const cycleLengthDays = differenceInDays(endDate, startDate) + 1;
  const daysElapsed = clamp(differenceInDays(today, startDate), 0, cycleLengthDays - 1);
  const daysRemaining = clamp(differenceInDays(endDate, today), 0, cycleLengthDays - 1);

  return {
    cutoffDay: economicContext.budgetCycleEndDay,
    startDate: formatIsoDate(startDate),
    endDate: formatIsoDate(endDate),
    currentDate: formatIsoDate(today),
    daysElapsed,
    daysRemaining,
    cycleLengthDays,
    cycleProgress: roundRatio((daysElapsed + 1) / cycleLengthDays)
  };
}

function calculateTotals(incomes, expenses) {
  const incomeDop = sumEntries(incomes, 'DOP');
  const incomeUsd = sumEntries(incomes, 'USD');
  const expenseDop = sumEntries(expenses, 'DOP');
  const expenseUsd = sumEntries(expenses, 'USD');

  return {
    incomeDop,
    incomeUsd,
    expenseDop,
    expenseUsd,
    netDop: incomeDop - expenseDop,
    netUsd: incomeUsd - expenseUsd
  };
}

function sumEntries(entries, currency) {
  return entries
    .filter((entry) => entry?.currency === currency)
    .reduce((total, entry) => total + normalizeAmount(entry.amount), 0);
}

function classifyBand(netDopEquivalent) {
  if (netDopEquivalent < 0) {
    return 'debt';
  }

  if (netDopEquivalent < 20000) {
    return 'tight';
  }

  if (netDopEquivalent < 50000) {
    return 'barely-good';
  }

  if (netDopEquivalent < 100000) {
    return 'good';
  }

  return 'strong';
}

function identifyRisks({ totals, incomeEquivalent, expenseEquivalent, netDopEquivalent, savingsRate, expenseRatio, cycle }) {
  const risks = [];

  if (incomeEquivalent <= 0 && expenseEquivalent > 0) {
    risks.push('sin-ingresos');
  }

  if (netDopEquivalent < 0) {
    risks.push('deficit-total');
  }

  if (expenseRatio !== null && expenseRatio >= 0.95) {
    risks.push('gasto-casi-total');
  } else if (expenseRatio !== null && expenseRatio >= 0.85) {
    risks.push('gasto-alto');
  }

  if (savingsRate !== null && savingsRate > 0 && savingsRate < 0.1) {
    risks.push('ahorro-bajo');
  }

  if (netDopEquivalent > 0 && netDopEquivalent < economicContext.firstQuintileBasicBasketProxyDop) {
    risks.push('por-debajo-canasta-vulnerable');
  }

  if (netDopEquivalent >= 100000 && savingsRate !== null && savingsRate < 0.2) {
    risks.push('monto-fuerte-margen-bajo');
  }

  if (cycle.daysRemaining <= 3) {
    risks.push('cierre-inminente');
  } else if (cycle.daysRemaining <= 7) {
    risks.push('cierre-cercano');
  }

  if (netDopEquivalent > 0 && netDopEquivalent < 50000 && cycle.daysRemaining > 10) {
    risks.push('margen-bajo-con-dias');
  }

  return risks;
}

function calculateScore({ band, savingsRate, expenseRatio, netDopEquivalent, reserveMonths, risks }) {
  const bandScore = {
    debt: 12,
    tight: 34,
    'barely-good': 56,
    good: 76,
    strong: 92
  }[band];
  const savingsScore = savingsRate === null
    ? 35
    : savingsRate < 0
      ? 5
      : savingsRate < 0.05
        ? 30
        : savingsRate < 0.1
          ? 42
          : savingsRate < 0.2
            ? 64
            : savingsRate < 0.3
              ? 82
              : 94;
  const localScore = netDopEquivalent < 0
    ? 10
    : netDopEquivalent < economicContext.firstQuintileBasicBasketProxyDop
      ? 38
      : netDopEquivalent < economicContext.largeCompanyMinimumWageDop
        ? 45
        : netDopEquivalent < 50000
          ? 58
          : netDopEquivalent < 100000
            ? 78
            : 95;
  const reserveScore = reserveMonths <= 0
    ? 20
    : reserveMonths < 0.1
      ? 40
      : reserveMonths < 0.25
        ? 62
        : reserveMonths < 0.5
          ? 78
          : 92;
  const expensePenalty = expenseRatio !== null && expenseRatio > 1
    ? 12
    : expenseRatio !== null && expenseRatio > 0.95
      ? 8
      : expenseRatio !== null && expenseRatio > 0.85
        ? 4
        : 0;
  const noIncomePenalty = risks.includes('sin-ingresos') ? 10 : 0;

  return clamp(Math.round(
    bandScore * 0.42
    + savingsScore * 0.28
    + localScore * 0.2
    + reserveScore * 0.1
    - expensePenalty
    - noIncomePenalty
  ), 0, 100);
}

function toneForBand(band, risks) {
  if (band === 'debt') {
    return 'danger';
  }

  if (band === 'tight' || risks.includes('gasto-casi-total')) {
    return 'warning';
  }

  if (band === 'barely-good') {
    return risks.includes('ahorro-bajo') ? 'warning' : 'neutral';
  }

  return 'success';
}

function headlineForBand(band, risks) {
  if (band === 'debt') {
    return 'Mes en rojo';
  }

  return {
    tight: 'Cierre muy justo',
    'barely-good': 'Apenas saludable',
    good: 'Buen cierre',
    strong: 'Zona de ahorro'
  }[band];
}

function buildMessage({ band, totals, netDopEquivalent, savingsRate, expenseRatio, reserveMonths, risks, cycle }) {
  if (totals.incomeDop + totals.incomeUsd === 0 && totals.expenseDop + totals.expenseUsd === 0) {
    return `Agrega ingresos y gastos para leer el mes con contexto real; ${buildCycleText(cycle)}.`;
  }

  if (risks.includes('sin-ingresos')) {
    return `Hay gastos sin ingresos registrados; ${buildCycleText(cycle)} y el mes no tiene base para cubrir compromisos.`;
  }

  const amount = formatDop(Math.abs(netDopEquivalent));
  const savingsText = savingsRate === null ? '' : ` (${formatPercent(savingsRate)} del ingreso)`;
  const expenseText = expenseRatio === null ? '' : `; gastos en ${formatPercent(expenseRatio)}`;

  if (band === 'debt') {
    return `Faltan ${amount} para cubrir todo${expenseText}; ${buildCycleText(cycle)}, pausa ahorro y renegocia pagos clave.`;
  }

  if (band === 'tight') {
    return `Quedan ${amount}, por debajo de una canasta básica vulnerable; ${buildCycleText(cycle)}, evita nuevos compromisos.`;
  }

  if (band === 'barely-good') {
    const caution = risks.includes('margen-bajo-con-dias') ? 'cuida gastos diarios porque aun faltan varios dias' : 'el mes cierra, pero el colchon sigue fino';
    return `Quedan ${amount}${savingsText}: ${caution}; ${buildCycleText(cycle)}.`;
  }

  if (band === 'good') {
    const reserveText = reserveMonths >= 0.25 ? 'con margen para automatizar ahorro' : 'conviene separar ahorro antes de gastar';
    return `Quedan ${amount}${savingsText}, buen cierre ${reserveText}; ${buildCycleText(cycle)}.`;
  }

  if (risks.includes('monto-fuerte-margen-bajo')) {
    return `Quedan ${amount}, pero el margen porcentual es bajo; ${buildCycleText(cycle)}, revisa gastos grandes antes de invertir.`;
  }

  return `Quedan ${amount}${savingsText}: cierre fuerte para ahorro, deuda o inversion; ${buildCycleText(cycle)}.`;
}

function buildCycleText(cycle) {
  if (cycle.daysRemaining <= 0) {
    return 'el ciclo cierra hoy';
  }

  if (cycle.daysRemaining === 1) {
    return 'queda 1 dia para el cierre del 27';
  }

  return `quedan ${cycle.daysRemaining} dias para el cierre del 27`;
}

function formatDop(value) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value) {
  return new Intl.NumberFormat('es-DO', { style: 'percent', maximumFractionDigits: 0 }).format(value);
}

function normalizeDate(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function createUtcDate(year, monthIndex, dayOfMonth) {
  return new Date(Date.UTC(year, monthIndex, dayOfMonth));
}

function differenceInDays(laterDate, earlierDate) {
  return Math.round((laterDate.getTime() - earlierDate.getTime()) / 86400000);
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function roundRatio(value) {
  return Math.round(value * 10000) / 10000;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
