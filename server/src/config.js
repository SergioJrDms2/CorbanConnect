import 'dotenv/config';

function required(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return v;
}

function optional(name, fallback = '') {
  return process.env[name] ?? fallback;
}

function int(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${name} precisa ser numérico`);
  return n;
}

function bool(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v === 'true' || v === '1';
}

export const config = {
  port: int('PORT', 8080),

  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },

  whatsapp: {
    authDir: optional('AUTH_DIR', './auth_baileys'),
  },

  smtp: {
    host: required('SMTP_HOST'),
    port: int('SMTP_PORT', 465),
    secure: bool('SMTP_SECURE', true),
    user: required('SMTP_USER'),
    pass: required('SMTP_PASS'),
    from: required('EMAIL_FROM'),
  },

  platform: {
    baseUrl: optional('CORBAN_CONNECT_BASE_URL', 'https://app.corbanconnect.com.br'),
  },

  ruler: {
    businessHoursStart: int('BUSINESS_HOURS_START', 8),
    businessHoursEnd: int('BUSINESS_HOURS_END', 20),
    cron: optional('RULER_CRON', '0 * * * *'),
    batchSize: int('RULER_BATCH_SIZE', 500),
    minDelayMs: int('DISPATCH_MIN_DELAY_MS', 5000),
    maxDelayMs: int('DISPATCH_MAX_DELAY_MS', 15000),
  },

  security: {
    internalApiToken: required('INTERNAL_API_TOKEN'),
  },
};
