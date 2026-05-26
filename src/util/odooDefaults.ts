type Env = Record<string, string | undefined>;

const FALLBACK_ODOO_URL = 'https://dev-hrm.lfglobaltech.com';
const FALLBACK_ODOO_TOKEN = 'ff914bde-b9aa-4499-b16f-e9c6554964b0';

function envValue(env: Env, ...keys: string[]): string {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return '';
}

export function resolveDefaultOdooUrl(env: Env = process.env): string {
  return envValue(env, 'odoo_url', 'ODOO_URL', 'VUE_APP_ODOO_URL') || FALLBACK_ODOO_URL;
}

export function resolveDefaultOdooToken(env: Env = process.env): string {
  return envValue(env, 'odoo_token', 'ODOO_TOKEN', 'VUE_APP_ODOO_TOKEN') || FALLBACK_ODOO_TOKEN;
}

export const DEFAULT_ODOO_URL = resolveDefaultOdooUrl();
export const DEFAULT_ODOO_TOKEN = resolveDefaultOdooToken();
