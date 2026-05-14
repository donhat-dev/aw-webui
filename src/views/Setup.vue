<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h3 class="card-title mb-1">ActivityWatch Setup</h3>
            <p class="text-muted mb-4">Connect to Odoo to enable activity time tracking sync.</p>

            <form @submit.prevent="submit">
              <div class="form-group mb-3">
                <label for="odoo_url"><strong>Odoo Server URL</strong></label>
                <input
                  id="odoo_url"
                  v-model="odoo_url"
                  class="form-control"
                  type="url"
                  placeholder="https://your-odoo.example.com"
                  required
                />
                <small class="form-text text-muted">Your company's Odoo server address</small>
              </div>

              <div class="form-group mb-3">
                <label for="pin_code"><strong>Pin Code</strong></label>
                <input
                  id="pin_code"
                  v-model="pin_code"
                  class="form-control"
                  type="password"
                  placeholder="Enter your ActivityWatch pin code"
                  required
                />
                <small class="form-text text-muted"
                  >Get this from Odoo &rarr; Settings &rarr; ActivityWatch</small
                >
              </div>

              <div class="form-group mb-3">
                <label for="token"><strong>API Token</strong> <span class="text-muted font-weight-normal">(optional)</span></label>
                <input
                  id="token"
                  v-model="token"
                  class="form-control"
                  type="password"
                  placeholder="API token for aw-odoo-sync"
                />
                <small class="form-text text-muted">Used by aw-odoo-sync; watchers only collect local ActivityWatch data</small>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="form-group mb-3">
                    <label for="employee_id"><strong>Employee ID</strong> <span class="text-muted font-weight-normal">(optional)</span></label>
                    <input
                      id="employee_id"
                      v-model="employee_id"
                      class="form-control"
                      type="text"
                      placeholder="e.g. 42"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group mb-3">
                    <label for="device_name"><strong>Device Name</strong> <span class="text-muted font-weight-normal">(optional)</span></label>
                    <input
                      id="device_name"
                      v-model="device_name"
                      class="form-control"
                      type="text"
                      placeholder="e.g. MacBook Pro"
                    />
                  </div>
                </div>
              </div>

              <div class="alert alert-info mt-3">
                <strong>Browser Permission</strong>
                <p class="mb-0 mt-1">
                  When Odoo starts a timer, your browser will ask for permission to
                  <em>"Access other apps and services on this device"</em>. Click
                  <strong>Allow</strong> to enable syncing.
                </p>
              </div>

              <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>

              <div class="d-flex justify-content-between align-items-center mt-4">
                <a href="#" class="text-muted" @click.prevent="skipSetup">Skip for now</a>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <span v-if="submitting">Saving...</span>
                  <span v-else>Save &amp; Continue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getClient } from '~/util/awclient';

export default {
  name: 'Setup',
  data() {
    return {
      odoo_url: '',
      pin_code: '',
      token: '',
      employee_id: '',
      device_name: '',
      submitting: false,
      error: null as string | null,
    };
  },
  async created() {
    await this.checkAlreadyConfigured();
    await this.loadBuildConfig();
  },
  methods: {
    async checkAlreadyConfigured() {
      try {
        const data = await getClient().get_setting('odoo-config') as any;
        if (data) {
          if (data.odoo_url) this.odoo_url = data.odoo_url;
          if (data.pin_code) this.pin_code = data.pin_code;
          if (data.token) this.token = data.token;
          if (data.employee_id) this.employee_id = String(data.employee_id);
          if (data.device_name) this.device_name = data.device_name;
        }
      } catch {
        // not yet configured
      }
    },
    async loadBuildConfig() {
      try {
        const resp = await getClient().req.get('/0/build-config');
        if (resp.data?.odoo_url) {
          this.odoo_url = resp.data.odoo_url;
        }
      } catch {
        // build config is optional
      }
    },
    async submit() {
      this.submitting = true;
      this.error = null;
      try {
        await getClient().set_setting('odoo-config', {
          odoo_url: this.odoo_url,
          pin_code: this.pin_code,
          token: this.token,
          employee_id: this.employee_id,
          device_name: this.device_name,
        });
        this.$router.push('/home');
      } catch (e: any) {
        this.error = `Failed to save: ${e?.message || e}`;
      } finally {
        this.submitting = false;
      }
    },
    skipSetup() {
      this.$router.push('/home');
    },
  },
};
</script>
