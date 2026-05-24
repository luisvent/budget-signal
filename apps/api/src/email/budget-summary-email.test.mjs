import assert from 'node:assert/strict';
import test from 'node:test';
import { createBudgetSummaryEmail, sendBudgetSummaryEmail } from './budget-summary-email.mjs';

test('creates a themed budget summary email with only presupuesto details', () => {
  const email = createBudgetSummaryEmail(createEmailState(), {
    from: 'Budget Signal <resumen@example.com>',
    to: 'user@example.com'
  });

  assert.equal(email.from, 'Budget Signal <resumen@example.com>');
  assert.equal(email.to, 'user@example.com');
  assert.match(email.subject, /Mes en rojo/);
  assert.match(email.subject, /RD\$9,060/);
  assert.doesNotMatch(email.subject, /Cubierto/);
  assert.match(email.text, /Presupuesto: Mes en rojo/);
  assert.match(email.text, /Banda: En rojo/);
  assert.match(email.text, /Score de salud: 12\/100/);
  assert.match(email.text, /Gasto sobre ingreso: 102.2%/);
  assert.match(email.text, /Reserva estimada: 0 meses/);
  assert.match(email.text, /Neto USD: \$0/);
  assert.match(email.text, /Entradas/);
  assert.match(email.text, /Luis: RD\$415,000/);
  assert.match(email.text, /Gastos principales/);
  assert.match(email.text, /Ahorro: RD\$150,000/);
  assert.match(email.text, /Tarjeta Luis US: \$300 \/ RD\$18,000/);
  assert.match(email.text, /Señales: Déficit total, Gasto casi total/);
  assert.match(email.html, /Señal de Presupuesto/);
  assert.match(email.html, /background:#111111/);
  assert.match(email.html, /border:1px solid #D71921;border-radius:999px/);
  assert.match(email.html, /En rojo/);
  assert.doesNotMatch(email.html, />debt</);
  assert.match(email.html, /Días restantes/);
  assert.match(email.html, /16 \/ 30/);
  assert.match(email.html, /width:53%/);
  assert.doesNotMatch(email.html, /Score de salud/);
  assert.match(email.html, /Gastos principales/);
  assert.match(email.html, /Tarjeta Luis US/);
  assert.match(email.html, /Ciclo actual/);
  assert.doesNotMatch(email.text, /Balance de Pago/);
  assert.doesNotMatch(email.text, /Cubierto/);
  assert.doesNotMatch(email.html, /Balance de Pago/);
  assert.doesNotMatch(email.html, /Cubierto/);
});

test('sends the budget summary email through Resend', async () => {
  let request;
  const fetchImpl = async (url, init) => {
    request = { url, init };

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ id: 'email_123' })
    };
  };

  const result = await sendBudgetSummaryEmail(createEmailState(), {
    env: {
      RESEND_API_KEY: 'test-key',
      BUDGET_SUMMARY_EMAIL_TO: 'user@example.com, partner@example.com',
      BUDGET_SUMMARY_EMAIL_FROM: 'Budget Signal <resumen@example.com>'
    },
    fetchImpl
  });
  const payload = JSON.parse(request.init.body);

  assert.equal(result.status, '[RESUMEN ENVIADO]');
  assert.equal(result.id, 'email_123');
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.init.headers.Authorization, 'Bearer test-key');
  assert.deepEqual(payload.to, ['user@example.com', 'partner@example.com']);
  assert.equal(payload.from, 'Budget Signal <resumen@example.com>');
  assert.match(payload.html, /Señal de Presupuesto/);
});

test('rejects invalid budget summary email recipients', async () => {
  await assert.rejects(
    () => sendBudgetSummaryEmail(createEmailState(), {
      env: {
        RESEND_API_KEY: 'test-key',
        BUDGET_SUMMARY_EMAIL_TO: 'user@example.com, invalid-email'
      },
      fetchImpl: async () => ({})
    }),
    { statusCode: 400, message: 'Invalid BUDGET_SUMMARY_EMAIL_TO recipient' }
  );
});

test('requires Resend backend configuration before sending', async () => {
  await assert.rejects(
    () => sendBudgetSummaryEmail(createEmailState(), { env: {}, fetchImpl: async () => ({}) }),
    { statusCode: 400, message: 'Missing RESEND_API_KEY' }
  );
});

function createEmailState() {
  return {
    personalBudgetSummary: {
      headline: 'Mes en rojo',
      message: 'Faltan RD$9,060 para cubrir todo.',
      netDopEquivalent: -9060,
      nativeNet: { DOP: -9060, USD: 0 },
      incomeDopEquivalent: 415000,
      expenseDopEquivalent: 424060,
      savingsRate: -0.0218,
      expenseRatio: 1.0218,
      reserveMonths: 0,
      score: 12,
      status: 'debt',
      tone: 'danger',
      signals: ['deficit-total', 'gasto-casi-total'],
      cycle: {
        cutoffDay: 27,
        startDate: '2026-04-28',
        endDate: '2026-05-27',
        currentDate: '2026-05-11',
        daysElapsed: 13,
        daysRemaining: 16,
        cycleLengthDays: 30,
        cycleProgress: 0.4667
      },
      context: {
        exchangeRateDopPerUsd: 60,
        annualInflationPercent: 4.63,
        firstQuintileBasicBasketProxyDop: 28080,
        references: []
      }
    },
    personalBudget: {
      incomes: [
        { id: 'income-luis', name: 'Luis', amount: 415000, currency: 'DOP' }
      ],
      expenses: [
        { id: 'expense-ahorro', name: 'Ahorro', amount: 150000, currency: 'DOP' },
        { id: 'expense-tarjeta-luis-us', name: 'Tarjeta Luis US', amount: 300, currency: 'USD' },
        { id: 'expense-tarjeta-platinum', name: 'Tarjeta Platinum', amount: 16000, currency: 'DOP' }
      ]
    },
    conversionBudgetSummary: {
      headline: 'Cubierto',
      message: 'El dinero generado cubre tarjetas y gastos.',
      sourceAmount: 6600,
      sourceCurrency: 'USD',
      convertedDopAmount: 396000,
      finalDopResult: 36000
    }
  };
}