<template lang="pug">
div.end-user-dashboard
  template(v-if="isAuthenticated")
    header.dashboard-header
      h3.mb-0 Hello {{ displayName }}
      div.header-account
        span {{ userName }}
        span.separator -
        b-button.logout-button(variant="link" size="sm" @click="logout") logout

    b-alert(v-if="error" show variant="danger") {{ error }}
    b-alert(v-if="notice" show variant="success") {{ notice }}

    section.dashboard-content

  section.login-screen(v-else)
    b-form.login-panel(@submit.prevent="resolvePublicUser")
      h3 Login
      p.login-subtitle ActivityWatch

      b-alert(v-if="error" show variant="danger") {{ error }}
      b-alert(v-if="notice" show variant="success") {{ notice }}

      b-form-group(label="Odoo URL" label-for="odoo-url")
        b-form-input#odoo-url(
          v-model="odooUrl"
          type="url"
          placeholder="https://odoo.example.com"
          :disabled="loading || saving || resolving"
          required
        )
      b-form-group(label="PIN code" label-for="pin-code")
        b-form-input#pin-code(
          v-model="pinCode"
          type="password"
          autocomplete="one-time-code"
          :disabled="loading || saving || resolving"
          required
        )
      b-form-group(label="Token" label-for="odoo-token")
        b-form-input#odoo-token(
          v-model="token"
          type="password"
          autocomplete="off"
          :disabled="loading || saving || resolving"
          required
        )
      b-button.login-submit(type="submit" variant="primary" :disabled="!canSubmit || loading || saving || resolving")
        span(v-if="resolving || saving") Logging in...
        span(v-else) Login
</template>

<script lang="ts">
import { mapActions, mapState, mapWritableState } from 'pinia';
import { useOdooStore } from '~/stores/odoo';

export default {
  name: 'Home',
  computed: {
    ...mapState(useOdooStore, [
      'canSubmit',
      'displayName',
      'error',
      'isAuthenticated',
      'loading',
      'notice',
      'resolving',
      'saving',
      'userName',
    ]),
    ...mapWritableState(useOdooStore, ['odooUrl', 'pinCode', 'token']),
  },
  async mounted() {
    await this.loadConfig();
  },
  methods: {
    ...mapActions(useOdooStore, ['loadConfig', 'logout', 'resolvePublicUser']),
  },
};
</script>

<style scoped>
.end-user-dashboard {
  min-height: calc(100vh - 96px);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.dashboard-header h3 {
  line-height: 1.2;
}

.header-account {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.logout-button {
  padding: 0;
  line-height: 1.2;
  vertical-align: baseline;
}

.dashboard-content {
  min-height: 50vh;
}

.login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 150px);
  padding: 2rem 0;
}

.login-panel {
  width: 100%;
  max-width: 460px;
  padding: 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: #fff;
}

.login-panel h3 {
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.login-subtitle {
  margin-bottom: 1.25rem;
  color: #6c757d;
}

.login-submit {
  width: 100%;
  min-height: 38px;
}

@media (max-width: 767.98px) {
  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-account {
    white-space: normal;
  }

  .login-screen {
    align-items: flex-start;
    min-height: auto;
    padding-top: 1rem;
  }

  .login-panel {
    padding: 1rem;
  }
}
</style>
