import { defineStore } from 'pinia';
import { getClient } from '~/util/awclient';

interface PublicUser {
  id?: unknown;
  name: string;
  attendance_state?: string;
}

interface State {
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  resolving: boolean;
  enabled: boolean;
  defaultOdooUrl: string;
  defaultToken: string;
  odooUrl: string;
  pinCode: string;
  token: string;
  user: PublicUser | null;
  error: string;
  notice: string;
}

const DEFAULT_ODOO_URL = 'https://dev-hrm.lfglobaltech.com';
const DEFAULT_TOKEN = 'ff914bde-b9aa-4499-b16f-e9c6554964b0';

function errorMessage(error: unknown): string {
  const response = (error as any)?.response;
  const data = response?.data;
  if (typeof data === 'string' && data) {
    return data;
  }
  if (data?.message) {
    return data.message;
  }
  if (data?.error) {
    return data.error;
  }
  if ((error as Error)?.message) {
    return (error as Error).message;
  }
  return 'Unable to update Odoo configuration';
}

export const useOdooStore = defineStore('odoo', {
  state: (): State => ({
    loaded: false,
    loading: false,
    saving: false,
    resolving: false,
    enabled: true,
    defaultOdooUrl: DEFAULT_ODOO_URL,
    defaultToken: DEFAULT_TOKEN,
    odooUrl: DEFAULT_ODOO_URL,
    pinCode: '',
    token: DEFAULT_TOKEN,
    user: null,
    error: '',
    notice: '',
  }),

  getters: {
    isAuthenticated: state => Boolean(state.user?.name),
    userName: state => state.user?.name || '',
    displayName: state => state.user?.name || 'USER',
    canSubmit: state => Boolean(state.odooUrl.trim() && state.pinCode.trim() && state.token.trim()),
  },

  actions: {
    async loadConfig() {
      this.loading = true;
      this.error = '';
      try {
        const response = await getClient().req.get('/0/settings/odoo_config');
        const config = response.data || {};
        this.defaultOdooUrl = config.default_odoo_url || DEFAULT_ODOO_URL;
        this.defaultToken = config.default_token || DEFAULT_TOKEN;
        this.enabled = config.enabled !== undefined ? Boolean(config.enabled) : true;
        this.odooUrl = config.odoo_url || config.base_url || this.defaultOdooUrl;
        this.pinCode = config.pin_code || '';
        this.token = config.token || this.defaultToken;
        this.user = config.public_user || (config.user_name ? { name: config.user_name } : null);
        this.loaded = true;
      } catch {
        this.applyDefaults();
        this.loaded = true;
      } finally {
        this.loading = false;
      }
    },

    payload() {
      return {
        enabled: this.enabled,
        default_odoo_url: this.defaultOdooUrl,
        default_token: this.defaultToken,
        odoo_url: this.odooUrl.trim(),
        pin_code: this.pinCode.trim(),
        token: this.token.trim(),
        public_user: this.user,
        updated_at: new Date().toISOString(),
      };
    },

    async saveConfig() {
      this.saving = true;
      this.error = '';
      this.notice = '';
      try {
        await getClient().req.post('/0/settings/odoo_config', this.payload(), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        this.notice = 'Odoo configuration saved';
        this.loaded = true;
      } catch (error) {
        this.error = errorMessage(error);
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async resolvePublicUser() {
      this.resolving = true;
      this.error = '';
      this.notice = '';
      try {
        const response = await getClient().req.post(
          '/0/odoo/public-user',
          {
            odoo_url: this.odooUrl.trim(),
            pin_code: this.pinCode.trim(),
            token: this.token.trim(),
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        this.user = response.data?.user || null;
        this.enabled = true;
        await this.saveConfig();
      } catch (error) {
        this.error = errorMessage(error);
        throw error;
      } finally {
        this.resolving = false;
      }
    },

    applyDefaults() {
      this.enabled = false;
      this.odooUrl = this.defaultOdooUrl;
      this.pinCode = '';
      this.token = this.defaultToken;
      this.user = null;
    },

    async logout() {
      this.error = '';
      this.notice = '';
      this.applyDefaults();
      try {
        await getClient().req.post('/0/settings/odoo_config', this.payload(), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        this.error = errorMessage(error);
      }
      this.loaded = true;
    },
  },
});
