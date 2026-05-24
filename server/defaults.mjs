export const emptyImportSummary = {
  files: 0,
  rows: 0,
  payments: 0,
  skipped: 0,
  duplicates: 0,
  formats: []
};

export const defaultIncomes = [
  { id: 'income-leonor', name: 'Leonor', amount: 0, currency: 'DOP' },
  { id: 'income-luis', name: 'Luis', amount: 0, currency: 'DOP' }
];

export const defaultExpenses = [
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
];

export const defaultSourceDeductions = [
  { id: 'source-apt-pp', name: 'Apt PP', amount: 0 },
  { id: 'source-tarjeta-usd', name: 'Tarjeta USD', amount: 0 },
  { id: 'source-tarjeta-lea-usd', name: 'Tarjeta Lea USD', amount: 0 },
  { id: 'source-tarjeta-acap-usd', name: 'Tarjeta ACAP USD', amount: 0 },
  { id: 'source-maestria', name: 'MAestria', amount: 0 }
];

export const defaultDopDeductions = [
  { id: 'dop-tarjeta-luis', name: 'Tarjeta Luis', amount: 0 },
  { id: 'dop-tarjeta-isi', name: 'Tarjeta ISI', amount: 0 },
  { id: 'dop-tarjeta-lea', name: 'Tarjeta Lea', amount: 0 },
  { id: 'dop-tarjeta-acap', name: 'Tarjeta ACAP', amount: 0 }
];

export const sampleStatementName = 'sample-statement.csv';

export const sampleBudgets = [
  { category: 'Groceries', limit: 700, currency: 'USD' },
  { category: 'Dining', limit: 520, currency: 'USD' },
  { category: 'Transport', limit: 250, currency: 'USD' },
  { category: 'Travel', limit: 950, currency: 'USD' },
  { category: 'Subscriptions', limit: 120, currency: 'USD' },
  { category: 'Shopping', limit: 430, currency: 'USD' },
  { category: 'Utilities', limit: 180, currency: 'USD' },
  { category: 'Health', limit: 180, currency: 'USD' }
];

export const sampleStatement = `Fecha,Descripcion,Monto,Categoria
2026-04-03,City Grocer,-128.34,Supermercado
2026-04-05,Blue Bottle,-18.40,Restaurantes
2026-04-06,MTA,-33.00,Transporte
2026-04-08,Figma,-15.00,Suscripciones
2026-04-10,Fresh Market,-214.86,Supermercado
2026-04-11,Tacombi,-74.90,Restaurantes
2026-04-13,Delta Air Lines,-462.20,Viajes
2026-04-15,Amazon,-139.68,Compras
2026-04-16,ConEd,-116.72,Servicios
2026-04-18,Uber,-48.12,Transporte
2026-04-21,Netflix,-22.99,Suscripciones
2026-04-23,Soho House Dinner,-188.45,Restaurantes
2026-04-25,Target,-243.18,Compras
2026-04-27,CVS Pharmacy,-64.20,Salud
2026-04-29,Marriott,-612.44,Viajes
2026-05-01,Apple,-9.99,Suscripciones
2026-05-02,Whole Foods,-172.10,Supermercado
2026-05-03,Uniqlo,-96.40,Compras
2026-05-04,Lyft,-27.65,Transporte
2026-05-04,Balthazar,-141.30,Restaurantes
2026-05-04,Blue Bottle,-16.20,Restaurantes`;
