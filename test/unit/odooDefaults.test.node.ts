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
});
