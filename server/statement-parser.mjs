export function parseStatement(input, sourceLabel) {
  const rows = parseCsvRows(input).filter((row) => row.some((cell) => cell.trim().length > 0));

  if (rows.length < 2) {
    return { source: sourceLabel, transactions: [], totalRows: 0, paymentRows: 0, skippedRows: 0, format: 'Desconocido' };
  }

  if (isBancoPopularExport(rows)) {
    return parseBancoPopularStatement(rows, sourceLabel);
  }

  if (isCreditCardMovementsDetailExport(rows)) {
    return parseCreditCardMovementsDetailStatement(rows, sourceLabel);
  }

  return parseGenericCsvStatement(rows, sourceLabel);
}

export function decodeStatementBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    return '';
  }

  const bytes = new Uint8Array(buffer);

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes);
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes);
  }

  const sampleLength = Math.min(bytes.length, 200);
  let oddNulls = 0;
  let evenNulls = 0;

  for (let byteIndex = 0; byteIndex < sampleLength; byteIndex += 1) {
    if (bytes[byteIndex] === 0) {
      if (byteIndex % 2 === 0) {
        evenNulls += 1;
      } else {
        oddNulls += 1;
      }
    }
  }

  if (oddNulls > sampleLength * 0.2) {
    return new TextDecoder('utf-16le').decode(bytes);
  }

  if (evenNulls > sampleLength * 0.2) {
    return new TextDecoder('utf-16be').decode(bytes);
  }

  return new TextDecoder('utf-8').decode(bytes);
}

export function buildUploadPreview(files) {
  return files
    .map((file) => `[${file.name}]\n${file.content}`)
    .join('\n\n');
}

function parseGenericCsvStatement(rows, sourceLabel) {
  const normalizedHeader = rows[0].map((cell) => normalizeKey(cell));
  const hasHeader = normalizedHeader.some((cell) => ['date', 'fecha', 'posteddate', 'transactiondate', 'postdate'].some((candidate) => cell.includes(candidate)))
    && normalizedHeader.some((cell) => ['amount', 'monto', 'importe', 'debit', 'debito', 'charge', 'cargo'].some((candidate) => cell.includes(candidate)));
  const dateIndex = hasHeader ? findColumn(normalizedHeader, ['date', 'fecha', 'posteddate', 'transactiondate', 'postdate']) : 0;
  const merchantIndex = hasHeader ? findColumn(normalizedHeader, ['description', 'descripcion', 'merchant', 'comercio', 'name', 'nombre', 'memo', 'payee']) : 1;
  const amountIndex = hasHeader ? findColumn(normalizedHeader, ['amount', 'monto', 'importe', 'debit', 'debito', 'charge', 'cargo']) : 2;
  const categoryIndex = hasHeader ? findColumn(normalizedHeader, ['category', 'categoria', 'group', 'grupo']) : 3;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  if (dateIndex < 0 || merchantIndex < 0 || amountIndex < 0) {
    return { source: sourceLabel, transactions: [], totalRows: dataRows.length, paymentRows: 0, skippedRows: dataRows.length, format: 'CSV desconocido' };
  }

  const transactions = [];
  let skippedRows = 0;

  dataRows.forEach((row, index) => {
    const transaction = createTransactionFromRow(row, index, dateIndex, merchantIndex, amountIndex, categoryIndex, sourceLabel);

    if (transaction) {
      transactions.push(transaction);
    } else {
      skippedRows += 1;
    }
  });

  return {
    source: sourceLabel,
    transactions,
    totalRows: dataRows.length,
    paymentRows: 0,
    skippedRows,
    format: hasHeader ? 'CSV' : 'CSV sin encabezado'
  };
}

function parseBancoPopularStatement(rows, sourceLabel) {
  const transactions = [];
  let totalRows = 0;
  let paymentRows = 0;
  let skippedRows = 0;

  rows.forEach((row, index) => {
    if (!isBancoPopularTransactionRow(row)) {
      return;
    }

    totalRows += 1;

    const transactionType = row[4].trim().toUpperCase();
    const merchant = cleanMerchant(row[5] ?? 'Comercio desconocido');
    const amount = parseMoney(row[3] ?? '0');

    if (transactionType === 'DB' || isPaymentLike(merchant, transactionType)) {
      paymentRows += 1;
      return;
    }

    if (transactionType !== 'CR' || amount <= 0) {
      skippedRows += 1;
      return;
    }

    const parsedDate = parseStatementDayMonth(row[1] ?? '');

    if (Number.isNaN(parsedDate.getTime())) {
      skippedRows += 1;
      return;
    }

    transactions.push({
      id: index + 1,
      date: serializeDate(parsedDate),
      merchant,
      category: categorizeMerchant(merchant),
      amount,
      currency: 'DOP',
      source: sourceLabel
    });
  });

  return {
    source: sourceLabel,
    transactions,
    totalRows,
    paymentRows,
    skippedRows,
    format: 'Banco Popular TXT'
  };
}

function createTransactionFromRow(row, index, dateIndex, merchantIndex, amountIndex, categoryIndex, fallbackSource) {
  const dateValue = row[dateIndex]?.trim() ?? '';
  const merchant = cleanMerchant(row[merchantIndex] ?? 'Comercio desconocido');
  const rawCategory = categoryIndex >= 0 ? row[categoryIndex] ?? '' : '';
  const category = normalizeCategory(rawCategory, merchant);
  const amount = parseMoney(row[amountIndex] ?? '0');
  const parsedDate = parseDateValue(dateValue);

  if (!dateValue || Number.isNaN(parsedDate.getTime()) || amount <= 0 || isPaymentLike(merchant, category)) {
    return null;
  }

  return {
    id: index + 1,
    date: serializeDate(parsedDate),
    merchant,
    category,
    amount,
    currency: 'USD',
    source: fallbackSource
  };
}

function parseCreditCardMovementsDetailStatement(rows, sourceLabel) {
  const headerIndex = findCreditCardMovementsHeaderIndex(rows);
  const statementSource = buildCreditCardMovementsDetailSource(rows, sourceLabel);

  if (headerIndex < 0) {
    return { source: statementSource, transactions: [], totalRows: 0, paymentRows: 0, skippedRows: rows.length, format: 'CSV desconocido' };
  }

  const normalizedHeader = rows[headerIndex].map((cell) => normalizeKey(cell));
  const dateIndex = findColumn(normalizedHeader, ['fecha']);
  const merchantIndex = findColumn(normalizedHeader, ['descripcion']);
  const pesosIndex = findColumn(normalizedHeader, ['pesos']);
  const dollarsIndex = findColumn(normalizedHeader, ['dolares']);
  const transactions = [];
  let totalRows = 0;
  let paymentRows = 0;
  let skippedRows = 0;

  rows.slice(headerIndex + 1).forEach((row, rowIndex) => {
    const dateValue = row[dateIndex]?.trim() ?? '';

    if (!dateValue) {
      return;
    }

    totalRows += 1;

    const merchant = cleanMerchant(row[merchantIndex] ?? 'Comercio desconocido');
    const parsedDate = parseStatementDayMonth(dateValue);
    const pesosAmount = parseSignedMoney(row[pesosIndex] ?? '0');
    const dollarAmount = parseSignedMoney(row[dollarsIndex] ?? '0');

    if (Number.isNaN(parsedDate.getTime())) {
      skippedRows += 1;
      return;
    }

    if (isPaymentLike(merchant, '') || pesosAmount < 0 || dollarAmount < 0) {
      paymentRows += 1;
      return;
    }

    const movementAmounts = [
      { amount: pesosAmount, currency: 'DOP' },
      { amount: dollarAmount, currency: 'USD' }
    ].filter((movementAmount) => movementAmount.amount > 0);

    if (movementAmounts.length === 0) {
      skippedRows += 1;
      return;
    }

    for (const movementAmount of movementAmounts) {
      transactions.push({
        id: rowIndex + 1,
        date: serializeDate(parsedDate),
        merchant,
        category: categorizeMerchant(merchant),
        amount: movementAmount.amount,
        currency: movementAmount.currency,
        source: statementSource
      });
    }
  });

  return {
    source: statementSource,
    transactions,
    totalRows,
    paymentRows,
    skippedRows,
    format: 'CreditCardMovementsDetail CSV'
  };
}

function parseCsvRows(input) {
  const rows = [];
  let row = [];
  let value = '';
  let insideQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === ',' && !insideQuotes) {
      row.push(value.trim());
      value = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }

      row.push(value.trim());
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += character;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());
    rows.push(row);
  }

  return rows;
}

function isBancoPopularExport(rows) {
  return rows.some((row) => isBancoPopularTransactionRow(row));
}

function isCreditCardMovementsDetailExport(rows) {
  return findCreditCardMovementsHeaderIndex(rows) >= 0;
}

function findCreditCardMovementsHeaderIndex(rows) {
  return rows.findIndex((row) => {
    const normalizedHeader = row.map((cell) => normalizeKey(cell));

    return findColumn(normalizedHeader, ['fecha']) >= 0
      && findColumn(normalizedHeader, ['descripcion']) >= 0
      && findColumn(normalizedHeader, ['pesos']) >= 0
      && findColumn(normalizedHeader, ['dolares']) >= 0;
  });
}

function buildCreditCardMovementsDetailSource(rows, fallbackSource) {
  const detailRow = rows[1] ?? [];
  const statementSource = [detailRow[1], detailRow[2]]
    .map((value) => cleanSource(value ?? ''))
    .filter((value) => value.length > 0)
    .join(' ');

  return statementSource || fallbackSource;
}

function isBancoPopularTransactionRow(row) {
  return row.length >= 6
    && /\*{4,}\d{4}$/.test(row[0]?.trim() ?? '')
    && /^\d{1,2}\/\d{1,2}$/.test(row[1]?.trim() ?? '')
    && /^\d+(?:\.\d+)?$/.test(row[3]?.trim() ?? '')
    && /^(CR|DB)$/i.test(row[4]?.trim() ?? '');
}

function parseStatementDayMonth(value) {
  const dayMonthMatch = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/.exec(value.trim());

  if (!dayMonthMatch) {
    return new Date(Number.NaN);
  }

  const today = new Date();
  const year = dayMonthMatch[3]
    ? normalizeYear(dayMonthMatch[3])
    : today.getFullYear();

  return new Date(year, Number(dayMonthMatch[2]) - 1, Number(dayMonthMatch[1]));
}

function parseDateValue(value) {
  const trimmedValue = value.trim();
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmedValue);

  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(trimmedValue);

  if (slashMatch) {
    const firstPart = Number(slashMatch[1]);
    const secondPart = Number(slashMatch[2]);
    const year = normalizeYear(slashMatch[3]);
    const isDayFirst = firstPart > 12;

    return isDayFirst
      ? new Date(year, secondPart - 1, firstPart)
      : new Date(year, firstPart - 1, secondPart);
  }

  return new Date(trimmedValue);
}

function normalizeYear(value) {
  return value.length === 2 ? Number(`20${value}`) : Number(value);
}

function serializeDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function findColumn(headers, candidates) {
  return headers.findIndex((header) => candidates.some((candidate) => header === candidate || header.includes(candidate)));
}

function parseMoney(value) {
  const amount = parseSignedMoney(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.abs(amount);
}

function parseSignedMoney(value) {
  const isParenthetical = value.includes('(') && value.includes(')');
  const normalized = value.replace(/[$,\s()]/g, '');
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return isParenthetical ? -Math.abs(amount) : amount;
}

function normalizeCategory(category, merchant) {
  const cleanedCategory = category.trim();

  if (!cleanedCategory || /uncategorized|unknown|other|sin categoria|sin categoría|desconocido|otro/i.test(cleanedCategory)) {
    return categorizeMerchant(merchant);
  }

  const normalized = toTitleCase(cleanedCategory.replace(/[_-]/g, ' '));
  const lowerCategory = normalized.toLowerCase();

  if (/restaurant|restaurante|food|comida|coffee|cafe|bar|dining/.test(lowerCategory)) {
    return 'Dining';
  }

  if (/grocery|groceries|supermarket|supermercado/.test(lowerCategory)) {
    return 'Groceries';
  }

  if (/ride|taxi|train|parking|gas|transporte/.test(lowerCategory)) {
    return 'Transport';
  }

  if (/travel|viaje|hotel|airline/.test(lowerCategory)) {
    return 'Travel';
  }

  if (/subscription|suscripcion/.test(lowerCategory)) {
    return 'Subscriptions';
  }

  if (/shopping|compras|shop|store/.test(lowerCategory)) {
    return 'Shopping';
  }

  if (/utility|utilities|servicio/.test(lowerCategory)) {
    return 'Utilities';
  }

  if (/health|salud|pharmacy|farmacia/.test(lowerCategory)) {
    return 'Health';
  }

  if (/home|hogar|hardware|ferreteria/.test(lowerCategory)) {
    return 'Home';
  }

  return normalized;
}

function categorizeMerchant(merchant) {
  const value = merchant.toLowerCase();

  if (/cargo sobregiro|fee|interest|interes|cargo/.test(value)) {
    return 'Fees';
  }

  if (/whole foods|grocery|market|trader|costco|supermarket|jumbo|la sirena|sm nacional|sm bravo|bravo|minimarket|supermercado/.test(value)) {
    return 'Groceries';
  }

  if (/coffee|restaurant|dinner|bar|cafe|pizza|taco|doordash|ubereats|bbq|pedidosya|mcdonald|helados|cafeteria|fast food|muuu|expreso jade|pilon|papas|panad|repost|little caesar|drinks/.test(value)) {
    return 'Dining';
  }

  if (/uber|lyft|mta|train|metro|parking|shell|exxon|texaco|estacion|envasa|gas/.test(value)) {
    return 'Fuel & Transport';
  }

  if (/delta|airlines|hotel|marriott/.test(value)) {
    return 'Travel';
  }

  if (/hola courier|courier/.test(value)) {
    return 'Shipping';
  }

  if (/dental|farmacia|farm carol|imagen oral|pharmacy|cvs|doctor|health/.test(value)) {
    return 'Health';
  }

  if (/ferreteria|ochoa|bellon|madesol|acab|pint|ferrajes|luxo|cuisine|electrodom|warn electrical|home|hardware/.test(value)) {
    return 'Home';
  }

  if (/salon|yves rocher|beauty/.test(value)) {
    return 'Personal Care';
  }

  if (/crudo workout|gym|fitness/.test(value)) {
    return 'Fitness';
  }

  if (/libreria|papeleria|book|school|office/.test(value)) {
    return 'Education';
  }

  if (/payless|amazon|target|uniqlo|shop|store|plaza|santiago center/.test(value)) {
    return 'Shopping';
  }

  if (/coned|utility|electric|water|internet|phone|claro|edenorte|tele/.test(value)) {
    return 'Utilities';
  }

  if (/netflix|spotify|figma|apple|adobe|google|subscription/.test(value)) {
    return 'Subscriptions';
  }

  return 'Uncategorized';
}

function isPaymentLike(merchant, category) {
  return /payment|autopay|refund|cashback|deposit|payroll|transfer|pago|rebate|bono|abono/i.test(`${merchant} ${category}`);
}

function cleanMerchant(value) {
  return toTitleCase(value.replace(/\s+/g, ' ').trim() || 'Comercio desconocido');
}

function cleanSource(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeKey(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function toTitleCase(value) {
  return value.toLowerCase().replace(/\b[a-z]/g, (character) => character.toUpperCase());
}
