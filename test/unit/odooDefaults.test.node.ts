import { resolveDefaultOdooToken, resolveDefaultOdooUrl } from '~/util/odooDefaults';

describe('Odoo default build config', () => {
  test('uses lowercase production env values when provided', () => {
    const env = {
      odoo_url: 'https://prod-odoo.example.com',
      odoo_token: 'prod-token',
    };

    expect(resolveDefaultOdooUrl(env)).toBe('https://prod-odoo.example.com');
    expect(resolveDefaultOdooToken(env)).toBe('prod-token');
  });

  test('ignores alias env keys and falls back to built-in defaults', () => {
    const env = {
      ODOO_URL: 'https://ignored-odoo.example.com',
      ODOO_TOKEN: 'ignored-token',
      VUE_APP_ODOO_URL: 'https://ignored-vue-odoo.example.com',
      VUE_APP_ODOO_TOKEN: 'ignored-vue-token',
    };

    expect(resolveDefaultOdooUrl(env)).toBe('https://dev-hrm.lfglobaltech.com');
    expect(resolveDefaultOdooToken(env)).toBe('ff914bde-b9aa-4499-b16f-e9c6554964b0');
  });
});
