<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-0">Dashboard</h3>
        <p class="text-muted mb-0 mt-1">Trạng thái hệ thống ActivityWatch</p>
      </div>
      <router-link to="/setup" class="btn btn-outline-primary btn-sm">
        ⚙️ Cấu hình Odoo Sync
      </router-link>
    </div>

    <!-- Setup modal -->
    <div v-if="showSetupModal" class="modal-backdrop-custom" @click.self="showSetupModal = false">
      <div class="card shadow-lg setup-modal">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Hướng dẫn cấp quyền macOS</h5>
          <button class="btn btn-sm btn-light" @click="showSetupModal = false">✕</button>
        </div>
        <div class="card-body">
          <p>
            Mở <strong>System Preferences → Privacy &amp; Security</strong> và cấp quyền cho
            <code>ActivityWatch</code>:
          </p>
          <ol>
            <li class="mb-2">
              <strong>Accessibility</strong> — bắt buộc để theo dõi keyboard/mouse
            </li>
            <li class="mb-2">
              <strong>Input Monitoring</strong> — bắt buộc trên macOS 12+ / Apple Silicon
            </li>
            <li class="mb-2"><strong>Screen Recording</strong> — bắt buộc để chụp màn hình</li>
          </ol>
          <div class="alert alert-info mb-0">
            Sau khi cấp quyền, tắt/bật lại ActivityWatch từ menu bar để các watcher reload.
          </div>
        </div>
        <div class="card-footer text-right">
          <button class="btn btn-primary btn-sm" @click="showSetupModal = false">Đã hiểu</button>
        </div>
      </div>
    </div>

    <!-- Error loading -->
    <div v-if="loadError" class="alert alert-danger">
      {{ loadError }}
    </div>

    <!-- Watcher cards -->
    <div class="row">
      <!-- Input Watcher Card -->
      <div class="col-md-6 mb-4">
        <div class="card h-100" :class="cardBorder(inputStatus)">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span><strong>⌨️ Input Watcher</strong></span>
            <status-dot :status="inputStatus" :label="statusLabel(inputStatus)" />
          </div>
          <div class="card-body">
            <div v-if="inputStatus === 'no-bucket'" class="alert alert-secondary py-2 mb-2">
              <strong>Watcher chưa chạy</strong> — aw-watcher-input chưa được khởi động hoặc chưa
              gửi data.
            </div>
            <div v-else-if="inputStatus === 'all-zero'" class="alert alert-danger py-2 mb-2">
              <strong>Thiếu quyền macOS</strong>
              <div class="mt-1 small">
                Cần cấp: <strong>Accessibility</strong> và <strong>Input Monitoring</strong>
                <a href="#" class="ml-2" @click.prevent="showSetupModal = true">→ Xem hướng dẫn</a>
              </div>
            </div>
            <div v-else-if="inputStatus === 'stale'" class="alert alert-warning py-2 mb-2">
              <strong>Không có data gần đây</strong> — watcher có thể đang bị treo.
            </div>

            <!-- Event data display -->
            <div v-if="inputLastEvent" class="mb-2">
              <small class="text-muted">
                Last event: {{ formatTime(inputLastEvent.timestamp) }}
              </small>
              <div class="d-flex flex-wrap mt-1" style="gap: 4px">
                <span
                  v-for="(val, key) in inputLastEvent.data"
                  :key="key"
                  class="badge"
                  :class="Number(val) > 0 ? 'badge-success' : 'badge-secondary'"
                  :title="key"
                >
                  {{ key }}: {{ val }}
                </span>
              </div>
            </div>
            <div v-else-if="!loading" class="text-muted small">Chưa có data.</div>

            <!-- Test result -->
            <div v-if="inputTestResult" class="mt-2">
              <div
                class="alert py-2 mb-0"
                :class="inputTestResult.ok ? 'alert-success' : 'alert-danger'"
              >
                <strong>{{ inputTestResult.ok ? '✓ Input OK' : '✗ Vẫn là zero' }}</strong>
                <div v-if="inputTestResult.data" class="small mt-1">
                  <span
                    v-for="(val, key) in inputTestResult.data"
                    :key="key"
                    class="mr-2"
                    :style="Number(val) > 0 ? 'color:#155724' : 'color:#721c24'"
                    >{{ key }}={{ val }}</span
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer d-flex align-items-center" style="gap: 8px">
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="inputTesting || inputStatus === 'no-bucket'"
              @click="testInput"
            >
              <span v-if="inputTesting">⏳ Test ({{ inputCountdown }}s)...</span>
              <span v-else>▶ Test Input</span>
            </button>
            <small v-if="inputTesting" class="text-muted"
              >Di chuột hoặc gõ phím ngay bây giờ...</small
            >
          </div>
        </div>
      </div>

      <!-- Screenshot Watcher Card -->
      <div class="col-md-6 mb-4">
        <div class="card h-100" :class="cardBorder(screenshotStatus)">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span><strong>📸 Screenshot Watcher</strong></span>
            <status-dot :status="screenshotStatus" :label="statusLabel(screenshotStatus)" />
          </div>
          <div class="card-body">
            <div v-if="screenshotStatus === 'no-bucket'" class="alert alert-secondary py-2 mb-2">
              <strong>Watcher chưa chạy</strong> — aw-watcher-screenshot-mini chưa khởi động.
            </div>
            <div v-else-if="screenshotStatus === 'stale'" class="alert alert-danger py-2 mb-2">
              <strong>Không chụp được</strong> — Có thể thiếu quyền
              <strong>Screen Recording</strong>.
              <a href="#" class="ml-2" @click.prevent="showSetupModal = true">→ Xem hướng dẫn</a>
            </div>

            <!-- Last capture info -->
            <div v-if="screenshotLastEvent">
              <small class="text-muted">
                Last capture: {{ formatTime(screenshotLastEvent.timestamp) }}
              </small>
              <div v-if="screenshotLastEvent.data" class="mt-1 small text-secondary">
                <span v-for="(val, key) in screenshotLastEvent.data" :key="key" class="mr-2">
                  {{ key }}: {{ val }}
                </span>
              </div>
            </div>
            <div v-else-if="!loading" class="text-muted small">Chưa có capture nào.</div>

            <!-- Test result -->
            <div v-if="screenshotTestResult" class="mt-2">
              <div
                class="alert py-2 mb-0"
                :class="screenshotTestResult.ok ? 'alert-success' : 'alert-warning'"
              >
                <strong>{{ screenshotTestResult.message }}</strong>
                <div v-if="screenshotTestResult.ts" class="small text-muted mt-1">
                  Last event: {{ screenshotTestResult.ts }}
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer d-flex align-items-center" style="gap: 8px">
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="screenshotTesting || screenshotStatus === 'no-bucket'"
              @click="testScreenshot"
            >
              <span v-if="screenshotTesting">⏳ Đang kiểm tra...</span>
              <span v-else>▶ Test Screenshot</span>
            </button>
            <button class="btn btn-sm btn-light" :disabled="loading" @click="loadAll">
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Odoo Sync Card -->
      <div class="col-md-6 mb-4">
        <div class="card h-100" :class="cardBorder(odooStatus)">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span><strong>🔄 Odoo Sync</strong></span>
            <status-dot :status="odooStatus" :label="statusLabel(odooStatus)" />
          </div>
          <div class="card-body">
            <div v-if="odooStatus === 'no-bucket'" class="alert alert-secondary py-2 mb-2">
              <strong>Odoo Sync chưa được cấu hình</strong>
              <div class="mt-1">
                <router-link to="/setup" class="btn btn-sm btn-primary mt-1"
                  >Cấu hình ngay</router-link
                >
              </div>
            </div>
            <div v-else-if="odooLastEvent">
              <small class="text-muted">Last sync: {{ formatTime(odooLastEvent.timestamp) }}</small>
              <div v-if="odooLastEvent.data" class="mt-1 small">
                <span
                  v-for="(val, key) in odooLastEvent.data"
                  :key="key"
                  class="mr-2 text-secondary"
                >
                  {{ key }}: {{ val }}
                </span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <router-link to="/setup" class="btn btn-sm btn-outline-secondary">⚙️ Setup</router-link>
          </div>
        </div>
      </div>

      <!-- Server Info Card -->
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-header"><strong>ℹ️ Server Info</strong></div>
          <div class="card-body">
            <table v-if="serverInfo" class="table table-sm table-borderless mb-0">
              <tbody>
                <tr>
                  <th style="width: 120px" class="text-muted">Hostname</th>
                  <td>{{ serverInfo.hostname }}</td>
                </tr>
                <tr>
                  <th class="text-muted">Version</th>
                  <td>{{ serverInfo.version }}</td>
                </tr>
                <tr>
                  <th class="text-muted">Buckets</th>
                  <td>{{ buckets.length }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="text-muted small">Đang tải...</p>
          </div>
          <div class="card-footer">
            <a href="/api/" class="btn btn-sm btn-outline-secondary">🔍 API Browser</a>
          </div>
        </div>
      </div>
    </div>

    <footer v-if="tccError || shouldShowTccFooter" class="mt-1">
      <div v-if="tccError" class="alert alert-warning" role="alert">
        Không thể kiểm tra quyền macOS: {{ tccError }}
      </div>
      <div v-if="tccMissingInput" class="alert alert-secondary" role="alert">
        <strong>Thiếu Input Monitoring.</strong>
        ActivityWatch có thể không nhận keyboard/mouse event; macOS có thể yêu cầu bật quyền thủ
        công, mở
        <a
          href="#"
          class="alert-link font-weight-bold"
          @click.prevent="requestTccPermission('input')"
          >settings</a
        >
      </div>
      <div v-if="tccMissingScreen" class="alert alert-secondary" role="alert">
        <strong>Thiếu Screen Recording.</strong>
        Screenshot watcher sẽ không capture được sau khi restart app, mở
        <a
          href="#"
          class="alert-link font-weight-bold"
          @click.prevent="requestTccPermission('screen')"
          >settings</a
        >
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { getClient } from '~/util/awclient';

type Status = 'loading' | 'ok' | 'stale' | 'all-zero' | 'no-bucket';

interface EventData {
  [key: string]: string | number;
}

interface AWEvent {
  id?: number;
  timestamp: Date | string;
  duration?: number;
  data: EventData;
}

type TccPermissionKind = 'input' | 'screen';

interface MacosTccPermissions {
  is_macos: boolean;
  screen_recording: boolean;
  input_monitoring: boolean;
}

// How old (ms) an event can be before we consider it stale
const STALE_MS = 5 * 60 * 1000;

function invokeTauri<T>(command: string, args: Record<string, unknown> = {}): Promise<T | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const invoke = (window as any).__AW_TAURI_INVOKE__ || (window as any).__TAURI_INTERNALS__?.invoke;
  if (typeof invoke !== 'function') {
    if ((window as any).__AW_IS_TAURI__) {
      return Promise.reject(new Error('Tauri bridge is not available'));
    }
    return Promise.resolve(null);
  }
  return invoke(command, args) as Promise<T>;
}

function isAllZero(data: EventData): boolean {
  return Object.values(data).every(v => Number(v) === 0);
}

function isStale(timestamp: Date | string): boolean {
  return Date.now() - new Date(timestamp).getTime() > STALE_MS;
}

export default {
  name: 'Home',

  components: {
    StatusDot: {
      functional: true,
      props: { status: String, label: String },
      render(h: any, ctx: any) {
        const colorMap: Record<string, string> = {
          ok: '#28a745',
          stale: '#ffc107',
          'all-zero': '#dc3545',
          'no-bucket': '#6c757d',
          loading: '#6c757d',
        };
        const color = colorMap[ctx.props.status] || '#6c757d';
        return h('span', { class: 'd-inline-flex align-items-center', style: 'gap:5px' }, [
          h('span', {
            style: `display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}`,
          }),
          h('small', { class: 'text-muted' }, ctx.props.label),
        ]);
      },
    },
  },

  data() {
    return {
      loading: false,
      loadError: '',
      showSetupModal: false,
      serverInfo: null as null | { hostname: string; version: string; testing: boolean },
      buckets: [] as { id: string; type: string; hostname: string }[],

      // Input watcher
      inputBucketId: '' as string,
      inputLastEvent: null as null | AWEvent,
      inputTesting: false,
      inputCountdown: 5,
      inputTestResult: null as null | { ok: boolean; data?: EventData },

      // Screenshot watcher
      screenshotBucketId: '' as string,
      screenshotLastEvent: null as null | AWEvent,
      screenshotTesting: false,
      screenshotTestResult: null as null | { ok: boolean; message: string; ts?: string },

      // Odoo sync
      odooBucketId: '' as string,
      odooLastEvent: null as null | AWEvent,

      // macOS TCC permissions exposed by the Tauri shell. Browser-only webui keeps this null.
      tccPermissions: null as null | MacosTccPermissions,
      tccError: '',
      tccRequesting: '' as '' | TccPermissionKind,
    };
  },

  computed: {
    inputStatus(): Status {
      if (this.loading) return 'loading';
      if (!this.inputBucketId) return 'no-bucket';
      if (!this.inputLastEvent) return 'no-bucket';
      if (isStale(this.inputLastEvent.timestamp)) return 'stale';
      if (isAllZero(this.inputLastEvent.data)) return 'all-zero';
      return 'ok';
    },
    screenshotStatus(): Status {
      if (this.loading) return 'loading';
      if (!this.screenshotBucketId) return 'no-bucket';
      if (!this.screenshotLastEvent) return 'no-bucket';
      if (isStale(this.screenshotLastEvent.timestamp)) return 'stale';
      return 'ok';
    },
    odooStatus(): Status {
      if (this.loading) return 'loading';
      if (!this.odooBucketId) return 'no-bucket';
      if (!this.odooLastEvent) return 'no-bucket';
      if (isStale(this.odooLastEvent.timestamp)) return 'stale';
      return 'ok';
    },
    tccMissingInput(): boolean {
      return Boolean(this.tccPermissions?.is_macos && !this.tccPermissions.input_monitoring);
    },
    tccMissingScreen(): boolean {
      return Boolean(this.tccPermissions?.is_macos && !this.tccPermissions.screen_recording);
    },
    shouldShowTccFooter(): boolean {
      return this.tccMissingInput || this.tccMissingScreen;
    },
  },

  async mounted() {
    await Promise.all([this.loadAll(), this.loadTccPermissions()]);
  },

  methods: {
    async loadAll() {
      this.loading = true;
      this.loadError = '';
      try {
        const client = getClient();
        const [info, bucketsMap] = await Promise.all([client.getInfo(), client.getBuckets()]);
        this.serverInfo = info;
        this.buckets = Object.values(bucketsMap) as any[];

        const ids = Object.keys(bucketsMap);
        const hostname = info.hostname;
        await Promise.all([
          this.loadBucket('input', ids, 'aw-watcher-input', hostname),
          this.loadBucket('screenshot', ids, 'aw-watcher-screenshot-mini', hostname),
          this.loadBucket('odoo', ids, 'aw-odoo-sync', hostname),
        ]);
      } catch (e: any) {
        this.loadError = `Không thể kết nối tới aw-server: ${e?.message || e}`;
      } finally {
        this.loading = false;
      }
    },

    async loadTccPermissions() {
      this.tccError = '';
      try {
        const permissions = await invokeTauri<MacosTccPermissions>('macos_tcc_permissions');
        this.tccPermissions = permissions;
      } catch (e: any) {
        this.tccError = e?.message || String(e);
      }
    },

    async requestTccPermission(kind: TccPermissionKind) {
      this.tccRequesting = kind;
      this.tccError = '';
      try {
        await invokeTauri<boolean>('request_macos_tcc_permission', { kind });
        await invokeTauri<void>('open_macos_privacy_settings', { kind });
        await this.loadTccPermissions();
      } catch (e: any) {
        this.tccError = e?.message || String(e);
        this.showSetupModal = true;
      } finally {
        this.tccRequesting = '';
      }
    },

    async loadBucket(
      key: 'input' | 'screenshot' | 'odoo',
      ids: string[],
      prefix: string,
      hostname: string
    ) {
      // Try exact `prefix_hostname` first, then any bucket starting with prefix.
      const id =
        ids.find(b => b === `${prefix}_${hostname}`) ||
        ids.find(b => b === prefix) ||
        ids.find(b => b.startsWith(`${prefix}_`)) ||
        ids.find(b => b.startsWith(prefix)) ||
        '';

      if (!id) {
        this[`${key}BucketId`] = '';
        this[`${key}LastEvent`] = null;
        return;
      }

      try {
        const events = await getClient().getEvents(id, { limit: 1 });
        this[`${key}BucketId`] = id;
        this[`${key}LastEvent`] = events[0] || null;
      } catch {
        this[`${key}BucketId`] = '';
        this[`${key}LastEvent`] = null;
      }
    },

    async testInput() {
      if (!this.inputBucketId || this.inputTesting) return;
      this.inputTesting = true;
      this.inputTestResult = null;
      this.inputCountdown = 5;

      const timer = setInterval(() => {
        this.inputCountdown--;
        if (this.inputCountdown <= 0) clearInterval(timer);
      }, 1000);

      await new Promise(r => setTimeout(r, 5500));

      try {
        const events = await getClient().getEvents(this.inputBucketId, { limit: 1 });
        const ev = events[0];
        if (!ev) {
          this.inputTestResult = { ok: false, data: undefined };
        } else {
          const ok = !isAllZero(ev.data);
          this.inputTestResult = { ok, data: ev.data };
        }
      } catch {
        this.inputTestResult = { ok: false };
      } finally {
        this.inputTesting = false;
        clearInterval(timer);
      }
    },

    async testScreenshot() {
      if (!this.screenshotBucketId || this.screenshotTesting) return;
      this.screenshotTesting = true;
      this.screenshotTestResult = null;

      try {
        const events = await getClient().getEvents(this.screenshotBucketId, { limit: 1 });
        const ev = events[0];
        if (!ev) {
          this.screenshotTestResult = { ok: false, message: '✗ Không có capture nào trong bucket' };
        } else {
          const stale = isStale(ev.timestamp);
          this.screenshotTestResult = {
            ok: !stale,
            message: stale
              ? '⚠ Capture cuối đã cũ — kiểm tra quyền Screen Recording'
              : '✓ Screenshot watcher đang hoạt động',
            ts: this.formatTime(ev.timestamp),
          };
        }
      } catch {
        this.screenshotTestResult = { ok: false, message: '✗ Không thể lấy data từ bucket' };
      } finally {
        this.screenshotTesting = false;
      }
    },

    cardBorder(st: Status): string {
      const map: Record<Status, string> = {
        ok: 'border-success',
        stale: 'border-warning',
        'all-zero': 'border-danger',
        'no-bucket': '',
        loading: '',
      };
      return map[st] || '';
    },

    statusLabel(st: Status): string {
      const map: Record<Status, string> = {
        ok: 'Hoạt động',
        stale: 'Không có data mới',
        'all-zero': 'Thiếu quyền',
        'no-bucket': 'Chưa chạy',
        loading: 'Đang tải...',
      };
      return map[st] || '';
    },

    formatTime(ts: Date | string): string {
      if (!ts) return '';
      const d = new Date(ts);
      const diffMs = Date.now() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `${diffH} giờ trước`;
      return d.toLocaleString('vi-VN');
    },
  },
};
</script>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1040;
  display: flex;
  align-items: center;
  justify-content: center;
}
.setup-modal {
  width: 500px;
  max-width: 90vw;
  z-index: 1050;
}
</style>
