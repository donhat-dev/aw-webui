type Env = Record<string, string | undefined>;

const FALLBACK_ODOO_URL = 'https://dev-hrm.lfglobaltech.com';
const FALLBACK_ODOO_TOKEN = 'ff914bde-b9aa-4499-b16f-e9c6554964b0';

const ODOO_URL_ENV_KEY = 'odoo_url';
const ODOO_TOKEN_ENV_KEY = 'odoo_token';

function envValue(env: Env, key: string): string {
  return env[key]?.trim() || '';
}

export function resolveDefaultOdooUrl(env: Env = process.env): string {
  return envValue(env, ODOO_URL_ENV_KEY) || FALLBACK_ODOO_URL;
}

export function resolveDefaultOdooToken(env: Env = process.env): string {
  return envValue(env, ODOO_TOKEN_ENV_KEY) || FALLBACK_ODOO_TOKEN;
}

export const DEFAULT_ODOO_URL = resolveDefaultOdooUrl();
export const DEFAULT_ODOO_TOKEN = resolveDefaultOdooToken();
