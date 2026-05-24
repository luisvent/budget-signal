const dopFormatter = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 0
});

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat('es-DO', {
  style: 'percent',
  maximumFractionDigits: 1
});

const decimalFormatter = new Intl.NumberFormat('es-DO', {
  maximumFractionDigits: 2
});

const toneColors = {
  danger: '#D71921',
  neutral: '#999999',
  success: '#4A9E5C',
  warning: '#D4A843'
};

const bandLabels = {
  debt: 'En rojo',
  tight: 'Muy justo',
  'barely-good': 'Apenas saludable',
  good: 'Buen cierre',
  strong: 'Zona de ahorro',
  neutral: 'Sin lectura'
};

const signalLabels = {
  'sin-ingresos': 'Gastos sin ingresos',
  'deficit-total': 'Déficit total',
  'gasto-casi-total': 'Gasto casi total',
  'gasto-alto': 'Gasto alto',
  'ahorro-bajo': 'Ahorro bajo',
  'por-debajo-canasta-vulnerable': 'Bajo canasta vulnerable',
  'monto-fuerte-margen-bajo': 'Margen porcentual bajo',
  'cierre-inminente': 'Cierre inminente',
  'cierre-cercano': 'Cierre cercano',
  'margen-bajo-con-dias': 'Margen bajo con días pendientes'
};

export function renderBudgetSummaryEmail(presupuesto, options = {}) {
  const view = createBudgetSummaryEmailView(presupuesto, options.personalBudget);
  const subject = `${options.subjectPrefix ?? 'Budget Signal'}: ${view.headline} | ${view.netValue}`;

  return {
    subject,
    text: renderTextEmail(view),
    html: renderHtmlEmail(view)
  };
}

export function createBudgetSummaryEmailView(presupuesto = {}, personalBudget = {}) {
  const cycle = presupuesto.cycle ?? {};
  const context = presupuesto.context ?? {};
  const nativeNet = presupuesto.nativeNet ?? {};
  const exchangeRate = normalizeNumber(context.exchangeRateDopPerUsd) || 60;
  const tone = toneColors[presupuesto.tone] ? presupuesto.tone : 'neutral';
  const score = clamp(Math.round(normalizeNumber(presupuesto.score)), 0, 100);
  const cycleProgress = clampRatio(cycle.cycleProgress) * 100;
  const cycleLength = Math.max(1, normalizeInteger(cycle.cycleLengthDays));
  const daysRemaining = clamp(normalizeInteger(cycle.daysRemaining), 0, cycleLength);
  const signals = Array.isArray(presupuesto.signals) ? presupuesto.signals : [];
  const status = presupuesto.status ?? 'neutral';

  return {
    accentColor: toneColors[tone],
    context: {
      annualInflation: formatNumber(context.annualInflationPercent),
      basketProxy: formatDop(context.firstQuintileBasicBasketProxyDop),
      exchangeRate: `1 USD = RD$${formatNumber(context.exchangeRateDopPerUsd)}`,
      references: Array.isArray(context.references) ? context.references : []
    },
    cycle: {
      cutoffDay: cycle.cutoffDay ?? 27,
      currentDate: formatDate(cycle.currentDate),
      daysElapsed: normalizeInteger(cycle.daysElapsed),
      daysRemaining,
      endDate: formatDate(cycle.endDate),
      length: cycleLength,
      progress: Math.round(cycleProgress),
      remainingProgress: Math.round((daysRemaining / cycleLength) * 100),
      startDate: formatDate(cycle.startDate)
    },
    expenseRatio: formatPercentValue(presupuesto.expenseRatio),
    expenseRows: createEntryRows(personalBudget.expenses, exchangeRate, 8, true),
    expenseValue: formatDop(presupuesto.expenseDopEquivalent),
    headline: presupuesto.headline ?? 'Presupuesto',
    incomeRows: createEntryRows(personalBudget.incomes, exchangeRate, 6, false),
    incomeValue: formatDop(presupuesto.incomeDopEquivalent),
    message: presupuesto.message ?? 'Sin lectura disponible.',
    nativeDopValue: formatDop(nativeNet.DOP),
    nativeUsdValue: formatUsd(nativeNet.USD),
    netValue: formatDop(presupuesto.netDopEquivalent),
    reserveMonths: `${formatNumber(presupuesto.reserveMonths)} meses`,
    savingsRate: formatPercentValue(presupuesto.savingsRate),
    score,
    signals: signals.map((signal) => signalLabels[signal] ?? signal),
    status,
    statusLabel: bandLabels[status] ?? status,
    tone
  };
}

function renderTextEmail(view) {
  return [
    'Resumen de Budget Signal',
    '',
    `Presupuesto: ${view.headline}`,
    view.message,
    '',
    `Resultado: ${view.netValue}`,
    `Banda: ${view.statusLabel}`,
    `Ingresos: ${view.incomeValue}`,
    `Gastos: ${view.expenseValue}`,
    `Ahorro: ${view.savingsRate}`,
    `Gasto sobre ingreso: ${view.expenseRatio}`,
    `Reserva estimada: ${view.reserveMonths}`,
    `Score de salud: ${view.score}/100`,
    `Neto DOP: ${view.nativeDopValue}`,
    `Neto USD: ${view.nativeUsdValue}`,
    '',
    ...renderTextEntries('Entradas', view.incomeRows, 'Sin entradas con monto'),
    '',
    ...renderTextEntries('Gastos principales', view.expenseRows, 'Sin gastos con monto'),
    '',
    `Ciclo ${view.cycle.startDate} al ${view.cycle.endDate}`,
    `Cierre ${view.cycle.cutoffDay}: ${view.cycle.daysRemaining} dias restantes de ${view.cycle.length}`,
    `Progreso del ciclo: ${view.cycle.progress}%`,
    '',
    `Señales: ${view.signals.length === 0 ? 'Sin alertas activas' : view.signals.join(', ')}`,
    '',
    `Contexto: ${view.context.exchangeRate}; inflación anual ${view.context.annualInflation}%; canasta vulnerable ${view.context.basketProxy}`
  ].join('\n');
}

function renderHtmlEmail(view) {
  return `
    <div style="margin:0;background:#000000;padding:0;color:#E8E8E8;font-family:Arial,Helvetica,sans-serif;line-height:1.5">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#000000">
        <tr>
          <td align="center" style="padding:28px 12px">
            <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:separate;border-spacing:0;border:1px solid #333333;border-radius:8px;background:#111111;overflow:hidden">
              <tr>
                <td style="padding:28px 24px 22px;border-bottom:1px solid #333333">
                  <p style="margin:0 0 14px;color:#999999;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Señal de Presupuesto</p>
                  <h1 style="margin:0;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:34px;line-height:1.05;font-weight:400">${escapeHtml(view.headline)}</h1>
                  <p style="margin:14px 0 0;color:#E8E8E8;font-size:15px;line-height:1.55">${escapeHtml(view.message)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
                    <tr>
                      <td style="padding:0 0 8px;color:#999999;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Restante para el Mes</td>
                      <td align="right" style="padding:0 0 8px"><span style="display:inline-block;border:1px solid ${view.accentColor};border-radius:999px;padding:5px 9px;color:${view.accentColor};background:#000000;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:11px;line-height:1;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(view.statusLabel)}</span></td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:0 0 20px;color:#FFFFFF;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:42px;line-height:1;word-break:break-word">${escapeHtml(view.netValue)}</td>
                    </tr>
                    <tr>
                      <td style="padding:0;color:#999999;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Días restantes</td>
                      <td align="right" style="padding:0;color:#FFFFFF;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:13px">${view.cycle.daysRemaining} / ${view.cycle.length}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:8px 0 0">
                        <div style="height:8px;background:#222222;border-radius:999px;overflow:hidden">
                          <div style="height:8px;width:${view.cycle.remainingProgress}%;background:#999999;border-radius:999px"></div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px">
                  ${renderMetricTable([
                    ['Ingresos', view.incomeValue],
                    ['Gastos', view.expenseValue],
                    ['Ahorro', view.savingsRate],
                    ['Gasto / ingreso', view.expenseRatio],
                    ['Reserva', view.reserveMonths],
                    ['Cierre 27', `${view.cycle.daysRemaining} días`]
                  ])}
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px">
                  ${renderEntryTable('Entradas', view.incomeRows, 'Sin entradas con monto')}
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px">
                  ${renderEntryTable('Gastos principales', view.expenseRows, 'Sin gastos con monto')}
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #333333;border-radius:8px;background:#000000">
                    <tr>
                      <td style="padding:18px;border-bottom:1px solid #222222">
                        <p style="margin:0;color:#999999;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Ciclo actual</p>
                        <p style="margin:8px 0 0;color:#FFFFFF;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:16px">${escapeHtml(view.cycle.startDate)} → ${escapeHtml(view.cycle.endDate)}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
                          <tr>
                            <td style="color:#999999;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Progreso</td>
                            <td align="right" style="color:#FFFFFF;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:13px">${view.cycle.progress}%</td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding-top:8px">
                              <div style="height:8px;background:#222222;border-radius:999px;overflow:hidden">
                                <div style="height:8px;width:${view.cycle.progress}%;background:#999999;border-radius:999px"></div>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 28px">
                  <p style="margin:0 0 10px;color:#999999;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Señales</p>
                  ${renderSignalTags(view)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `.trim();
}

function renderMetricTable(items) {
  const rows = [];

  for (let index = 0; index < items.length; index += 2) {
    const left = items[index];
    const right = items[index + 1];
    rows.push(`
      <tr>
        ${renderMetricCell(left)}
        ${renderMetricCell(right)}
      </tr>
    `);
  }

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #333333;border-radius:8px;background:#000000">
      ${rows.join('')}
    </table>
  `;
}

function renderMetricCell(item) {
  if (!item) {
    return '<td style="width:50%;padding:16px;border-top:1px solid #222222"></td>';
  }

  const [label, value] = item;

  return `
    <td width="50%" style="width:50%;padding:16px;border-top:1px solid #222222;vertical-align:top">
      <p style="margin:0 0 6px;color:#999999;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(label)}</p>
      <p style="margin:0;color:#FFFFFF;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:18px;line-height:1.2;word-break:break-word">${escapeHtml(value)}</p>
    </td>
  `;
}

function renderEntryTable(title, rows, emptyText) {
  const body = rows.length === 0
    ? `<tr><td style="padding:16px;color:#E8E8E8;font-size:14px">${escapeHtml(emptyText)}</td></tr>`
    : rows.map((row) => `
      <tr>
        <td style="padding:12px 16px;border-top:1px solid #222222;color:#E8E8E8;font-size:14px">${escapeHtml(row.name)}</td>
        <td align="right" style="padding:12px 16px;border-top:1px solid #222222;color:#FFFFFF;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:14px;white-space:nowrap">${escapeHtml(row.amountText)}</td>
      </tr>
    `).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #333333;border-radius:8px;background:#000000">
      <tr>
        <td colspan="2" style="padding:16px;border-bottom:1px solid #222222">
          <p style="margin:0;color:#999999;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(title)}</p>
        </td>
      </tr>
      ${body}
    </table>
  `;
}

function renderSignalTags(view) {
  if (view.signals.length === 0) {
    return '<p style="margin:0;color:#E8E8E8;font-size:14px">Sin alertas activas.</p>';
  }

  return view.signals
    .map((signal) => `<span style="display:inline-block;margin:0 6px 8px 0;border:1px solid #333333;border-radius:999px;padding:6px 10px;color:#E8E8E8;background:#000000;font-family:'Space Mono','SFMono-Regular',Consolas,monospace;font-size:11px;text-transform:uppercase">${escapeHtml(signal)}</span>`)
    .join('');
}

function renderTextEntries(title, rows, emptyText) {
  if (rows.length === 0) {
    return [title, emptyText];
  }

  return [title, ...rows.map((row) => `${row.name}: ${row.amountText}`)];
}

function createEntryRows(entries, exchangeRate, limit, sortDescending) {
  const rows = Array.isArray(entries)
    ? entries
        .map((entry) => createEntryRow(entry, exchangeRate))
        .filter((entry) => entry.dopEquivalent > 0)
    : [];

  if (sortDescending) {
    rows.sort((left, right) => right.dopEquivalent - left.dopEquivalent);
  }

  return rows.slice(0, limit);
}

function createEntryRow(entry, exchangeRate) {
  const amount = normalizeNumber(entry?.amount);
  const currency = entry?.currency === 'USD' ? 'USD' : 'DOP';
  const dopEquivalent = currency === 'USD' ? amount * exchangeRate : amount;
  const amountValue = currency === 'USD' ? formatUsd(amount) : formatDop(amount);
  const amountText = currency === 'USD' ? `${amountValue} / ${formatDop(dopEquivalent)}` : amountValue;

  return {
    amountText,
    dopEquivalent,
    name: entry?.name || 'Sin nombre'
  };
}

function formatDop(value) {
  return dopFormatter.format(normalizeNumber(value));
}

function formatUsd(value) {
  return usdFormatter.format(normalizeNumber(value));
}

function formatPercentValue(value) {
  return value === null || value === undefined ? 'Sin lectura' : percentFormatter.format(normalizeNumber(value));
}

function formatNumber(value) {
  return decimalFormatter.format(normalizeNumber(value));
}

function formatDate(value) {
  return value || 'Sin fecha';
}

function normalizeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeInteger(value) {
  return Math.round(normalizeNumber(value));
}

function clampRatio(value) {
  return clamp(normalizeNumber(value), 0, 1);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}