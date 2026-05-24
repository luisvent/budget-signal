const balanceContext = {
  exchangeRateDopPerUsd: 60,
  sourceAdjustmentRate: 0.018,
  sourceFixedFeeUsd: 7,
  tightBufferDop: 10000,
  stableBufferDop: 50000,
  strongBufferDop: 100000,
  references: [
    'Regla Balance de Pago: convertir USD a DOP con tasa fija 1 USD = RD$60.',
    'Regla Balance de Pago: el monto antes de convertir se usa neto despues de descontar 1.8% y US$7.',
    'Objetivo: confirmar si el dinero generado cubre tarjetas y gastos reales al cierre del mes.',
    'Lectura: resultado negativo significa que se debe dinero; resultado positivo significa dinero disponible.'
  ]
};

export function generateBalancePaymentSummary(conversionBudget) {
  const totals = calculateBalanceTotals(conversionBudget);
  const band = classifyBand(totals.finalDopResult);
  const risks = identifyRisks(totals);
  const score = calculateScore({ band, totals, risks });
  const tone = toneForBand(band, risks);
  const message = buildMessage({ band, totals, risks });

  return {
    status: band,
    tone,
    score,
    headline: headlineForBand(band, risks),
    message,
    sourceAmount: roundMoney(totals.sourceAmount),
    sourceCurrency: totals.sourceCurrency,
    sourceFeeAmount: roundMoney(totals.sourceFeeAmount),
    sourceNetAmount: roundMoney(totals.sourceNetAmount),
    sourceDeductionTotal: roundMoney(totals.sourceDeductionTotal),
    sourceRemaining: roundMoney(totals.sourceRemaining),
    convertedDopAmount: roundMoney(totals.convertedDopAmount),
    afterConversionAddition: roundMoney(totals.afterConversionAddition),
    afterConversionTotal: roundMoney(totals.afterConversionTotal),
    dopDeductionTotal: roundMoney(totals.dopDeductionTotal),
    finalDopResult: roundMoney(totals.finalDopResult),
    coverageRatio: totals.dopDeductionTotal > 0 ? roundRatio(totals.afterConversionTotal / totals.dopDeductionTotal) : null,
    signals: risks,
    context: balanceContext
  };
}

function calculateBalanceTotals(conversionBudget = {}) {
  const sourceCurrency = conversionBudget.sourceCurrency === 'DOP' ? 'DOP' : 'USD';
  const sourceAmount = normalizeAmount(conversionBudget.sourceAmount);
  const afterConversionAddition = normalizeAmount(conversionBudget.afterConversionAddition);
  const sourceFeeAmount = calculateSourceFeeAmount(sourceAmount, sourceCurrency);
  const sourceNetAmount = Math.max(0, sourceAmount - sourceFeeAmount);
  const sourceDeductionTotal = sumEntries(conversionBudget.sourceDeductions);
  const dopDeductionTotal = sumEntries(conversionBudget.dopDeductions);
  const sourceRemaining = sourceNetAmount - sourceDeductionTotal;
  const convertedDopAmount = sourceCurrency === 'USD'
    ? sourceRemaining * balanceContext.exchangeRateDopPerUsd
    : sourceRemaining;
  const afterConversionTotal = convertedDopAmount + afterConversionAddition;
  const finalDopResult = afterConversionTotal - dopDeductionTotal;

  return {
    sourceAmount,
    sourceCurrency,
    sourceFeeAmount,
    sourceNetAmount,
    sourceDeductionTotal,
    sourceRemaining,
    convertedDopAmount,
    afterConversionAddition,
    afterConversionTotal,
    dopDeductionTotal,
    finalDopResult
  };
}

function calculateSourceFeeAmount(sourceAmount, sourceCurrency) {
  if (sourceAmount <= 0) {
    return 0;
  }

  const fixedFee = sourceCurrency === 'USD'
    ? balanceContext.sourceFixedFeeUsd
    : balanceContext.sourceFixedFeeUsd * balanceContext.exchangeRateDopPerUsd;
  const feeAmount = sourceAmount * balanceContext.sourceAdjustmentRate + fixedFee;

  return Math.min(sourceAmount, feeAmount);
}

function sumEntries(entries) {
  return Array.isArray(entries)
    ? entries.reduce((total, entry) => total + normalizeAmount(entry?.amount), 0)
    : 0;
}

function classifyBand(finalDopResult) {
  if (finalDopResult < 0) {
    return 'debt';
  }

  if (finalDopResult < balanceContext.tightBufferDop) {
    return 'covered-tight';
  }

  if (finalDopResult < balanceContext.stableBufferDop) {
    return 'covered';
  }

  if (finalDopResult < balanceContext.strongBufferDop) {
    return 'comfortable';
  }

  return 'surplus';
}

function identifyRisks(totals) {
  const risks = [];

  if (totals.sourceAmount <= 0 && totals.dopDeductionTotal > 0) {
    risks.push('sin-monto-base');
  }

  if (totals.sourceRemaining < 0) {
    risks.push('primera-serie-excede-base');
  }

  if (totals.convertedDopAmount < 0) {
    risks.push('conversion-negativa');
  }

  if (totals.finalDopResult < 0) {
    risks.push('deficit-final');
  }

  if (totals.finalDopResult >= 0 && totals.finalDopResult < balanceContext.tightBufferDop) {
    risks.push('colchon-minimo');
  }

  if (totals.dopDeductionTotal > 0 && totals.afterConversionTotal / totals.dopDeductionTotal < 1.1) {
    risks.push('cobertura-ajustada');
  }

  if (totals.afterConversionAddition > 0 && totals.finalDopResult > 0 && totals.convertedDopAmount < totals.dopDeductionTotal) {
    risks.push('depende-entrada-extra');
  }

  return risks;
}

function calculateScore({ band, totals, risks }) {
  const bandScore = {
    debt: 12,
    'covered-tight': 42,
    covered: 64,
    comfortable: 82,
    surplus: 94
  }[band];
  const coverageRatio = totals.dopDeductionTotal > 0 ? totals.afterConversionTotal / totals.dopDeductionTotal : 1;
  const coverageScore = coverageRatio < 0
    ? 5
    : coverageRatio < 1
      ? 20
      : coverageRatio < 1.1
        ? 45
        : coverageRatio < 1.4
          ? 70
          : 90;
  const sourceScore = totals.sourceRemaining < 0
    ? 20
    : totals.sourceRemaining === 0
      ? 45
      : 78;
  const dependencyPenalty = risks.includes('depende-entrada-extra') ? 6 : 0;
  const noBasePenalty = risks.includes('sin-monto-base') ? 10 : 0;

  return clamp(Math.round(
    bandScore * 0.55
    + coverageScore * 0.3
    + sourceScore * 0.15
    - dependencyPenalty
    - noBasePenalty
  ), 0, 100);
}

function toneForBand(band, risks) {
  if (band === 'debt') {
    return 'danger';
  }

  if (band === 'covered-tight' || risks.includes('primera-serie-excede-base') || risks.includes('cobertura-ajustada')) {
    return 'warning';
  }

  if (band === 'covered') {
    return 'neutral';
  }

  return 'success';
}

function headlineForBand(band, risks) {
  if (risks.includes('primera-serie-excede-base')) {
    return 'Antes de convertir falta';
  }

  return {
    debt: 'Debes dinero',
    'covered-tight': 'Cubre justo',
    covered: 'Cubre el mes',
    comfortable: 'Queda margen',
    surplus: 'Sobra fuerte'
  }[band];
}

function buildMessage({ band, totals, risks }) {
  if (totals.sourceAmount === 0 && totals.sourceDeductionTotal === 0 && totals.afterConversionAddition === 0 && totals.dopDeductionTotal === 0) {
    return 'Agrega el dinero generado, tarjetas y gastos para leer el cierre de pago.';
  }

  if (risks.includes('sin-monto-base')) {
    return 'Hay pagos registrados sin dinero base; el cierre queda descubierto.';
  }

  const amount = formatDop(Math.abs(totals.finalDopResult));
  const netNote = totals.sourceFeeAmount > 0
    ? ` Base neta usada: ${formatSource(totals.sourceNetAmount, totals.sourceCurrency)} despues de ${formatSource(totals.sourceFeeAmount, totals.sourceCurrency)} en descuento.`
    : '';
  const sourceWarning = risks.includes('primera-serie-excede-base')
    ? ` La primera serie excede el monto base por ${formatSource(Math.abs(totals.sourceRemaining), totals.sourceCurrency)}.`
    : '';
  const dependencyWarning = risks.includes('depende-entrada-extra')
    ? ' Depende de la entrada extra para cerrar positivo.'
    : '';

  if (band === 'debt') {
    return `Faltan ${amount} para pagar tarjetas y gastos del mes; necesitas reducir pagos o agregar dinero.${sourceWarning}${netNote}`;
  }

  if (band === 'covered-tight') {
    return `Se paga todo, pero solo sobran ${amount}; deja compras nuevas en pausa.${sourceWarning}${dependencyWarning}${netNote}`;
  }

  if (band === 'covered') {
    return `Se pagan tarjetas y gastos, sobran ${amount}; buen cierre, aunque el margen sigue medido.${dependencyWarning}${netNote}`;
  }

  if (band === 'comfortable') {
    return `Se cubre el mes y quedan ${amount}; puedes reservar una parte antes de gastar.${dependencyWarning}${netNote}`;
  }

  return `Se paga todo y sobran ${amount}; cierre fuerte para guardar o adelantar deuda.${dependencyWarning}${netNote}`;
}

function formatDop(value) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(value);
}

function formatSource(value, currency) {
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
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
