import { renderBudgetSummaryEmail } from './budget-summary-template.mjs';

const resendEndpoint = 'https://api.resend.com/emails';
const defaultFrom = 'Budget Signal <onboarding@resend.dev>';

export async function sendBudgetSummaryEmail(appState, options = {}) {
  const config = resolveEmailConfig(options.env ?? process.env);
  const email = createBudgetSummaryEmail(appState, config);
  const result = await sendResendEmail(email, {
    apiKey: config.apiKey,
    fetchImpl: options.fetchImpl ?? globalThis.fetch
  });

  return {
    status: '[RESUMEN ENVIADO]',
    id: result.id ?? null,
    to: config.to
  };
}

export function createBudgetSummaryEmail(appState, config = {}) {
  const rendered = renderBudgetSummaryEmail(appState.personalBudgetSummary, {
    personalBudget: appState.personalBudget,
    subjectPrefix: config.subjectPrefix ?? 'Budget Signal'
  });

  return {
    from: config.from,
    to: config.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html
  };
}

export async function sendResendEmail(email, { apiKey, fetchImpl } = {}) {
  if (!fetchImpl) {
    throw createHttpError('Fetch is not available in this Node runtime', 500);
  }

  const response = await fetchImpl(resendEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(email)
  });
  const bodyText = await response.text();
  const body = parseJson(bodyText);

  if (!response.ok) {
    const providerMessage = body?.message ?? body?.error ?? (bodyText || response.statusText);
    throw createHttpError(`Resend rejected the email: ${providerMessage}`, 502);
  }

  return body ?? {};
}

function resolveEmailConfig(env) {
  const apiKey = env.RESEND_API_KEY?.trim();
  const to = parseRecipientList(env.BUDGET_SUMMARY_EMAIL_TO || env.BUDGET_EMAIL_TO);
  const from = env.BUDGET_SUMMARY_EMAIL_FROM?.trim() || env.BUDGET_EMAIL_FROM?.trim() || defaultFrom;
  const subjectPrefix = env.BUDGET_SUMMARY_EMAIL_SUBJECT_PREFIX?.trim() || 'Budget Signal';

  if (!apiKey) {
    throw createHttpError('Missing RESEND_API_KEY', 400);
  }

  if (to.length === 0) {
    throw createHttpError('Missing BUDGET_SUMMARY_EMAIL_TO', 400);
  }

  const invalidRecipients = to.filter((recipient) => !isEmailAddress(recipient));

  if (invalidRecipients.length > 0) {
    throw createHttpError('Invalid BUDGET_SUMMARY_EMAIL_TO recipient', 400);
  }

  return { apiKey, to, from, subjectPrefix };
}

function parseRecipientList(value = '') {
  return String(value)
    .split(/[;,]/)
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

function isEmailAddress(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function parseJson(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}