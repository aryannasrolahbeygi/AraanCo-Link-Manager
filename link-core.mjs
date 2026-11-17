/**
 * AraanCo Link Manager – data model and Chrome Storage reconciliation.
 * Each link lives in its own sync-storage item so edits to independent links
 * do not overwrite each other. Deletions are tombstones to prevent resurrection.
 */
export const ITEM_PREFIX = 'alm_v2_item_';
export const SETTINGS = Object.freeze({
  migrated: 'alm_v2_migrated',
  syncEnabled: 'alm_v2_sync_enabled',
  deviceId: 'alm_v2_device_id',
  theme: 'alm_v2_theme'
});
const DEFAULT_CATEGORY = 'سایر لینک‌ها';
const MAX_SYNC_ITEM_BYTES = 7500; // Leave headroom below Chrome's 8192-byte limit.
const SYNC_WARNING_ITEMS = 450; // Chrome allows at most 512 sync keys.

export function normalizedUrl(raw) {
  const candidate = String(raw ?? '').trim();
  if (!candidate || /\s/.test(candidate)) throw new Error('آدرس سایت معتبر نیست.');
  if (/^(?:javascript|data|file|chrome|about):/i.test(candidate)) {
    throw new Error('این نوع آدرس مجاز نیست.');
  }
  const input = /^[a-z][a-z\d+.-]*:\/\//i.test(candidate)
    ? candidate : `https://${candidate}`;
  let parsed;
  try { parsed = new URL(input); } catch { throw new Error('آدرس سایت معتبر نیست.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error('فقط آدرس‌های HTTP/HTTPS بدون نام کاربری و رمز مجازند.');
  }
  return parsed.href;
}

export function cleanFields(data) {
  const title = String(data?.title ?? '').trim();
  const category = String(data?.category ?? '').trim() || DEFAULT_CATEGORY;
  if (!title || title.length > 150) throw new Error('عنوان باید بین ۱ تا ۱۵۰ نویسه باشد.');
  if (category.length > 90) throw new Error('نام دسته‌بندی بیش از حد طولانی است.');
  const url = normalizedUrl(data?.url);
  if (url.length > 2000) throw new Error('آدرس بیش از حد طولانی است.');
  return {title, url, category};
}

export function compareRecords(a, b) {
  const aTime = Number(a?.updatedAt || 0);
  const bTime = Number(b?.updatedAt || 0);
  if (aTime !== bTime) return Math.sign(aTime - bTime);
  const aOp = String(a?.opId || '');
  const bOp = String(b?.opId || '');
  return aOp === bOp ? 0 : (aOp > bOp ? 1 : -1);
}

function isRecord(x) {
  return x && typeof x === 'object' && !Array.isArray(x) &&
    typeof x.id === 'string' && /^[a-z\d-]{8,100}$/i.test(x.id) &&
    Number.isSafeInteger(x.updatedAt) && x.updatedAt > 0 &&
    typeof x.opId === 'string' && x.opId.length <= 120 &&
    typeof x.deleted === 'boolean' &&
    typeof x.title === 'string' && typeof x.url === 'string' &&
    typeof x.category === 'string';
}
const keyFor = id => ITEM_PREFIX + id;
function recordFromStorage(key, value) {
  return key.startsWith(ITEM_PREFIX) && isRecord(value) && key === keyFor(value.id)
    ? value : null;
}

export class LinkStore {
  constructor(api, onChange = () => {}) {
    this.api = api;
    this.onChange = onChange;
    this.records = new Map();
    this.syncEnabled = false;
    this.syncError = '';
    this.syncBusy = false;
    this.deviceId = '';
    this.queue = Promise.resolve();
    this.lastStamp = 0;
    this.listener = null;
    this.syncItemCount = 0;
  }

  snapshot() {
    return [...this.records.values()]
      .filter(record => !record.deleted)
      .sort((a,b) => a.category.localeCompare(b.category, 'fa') || a.title.localeCompare(b.title, 'fa'));
  }

  status() {
    return {
      enabled: this.syncEnabled, error: this.syncError,
      busy: this.syncBusy, count: this.syncItemCount,
      warning: this.syncItemCount >= SYNC_WARNING_ITEMS
    };
  }

  emit() { this.onChange(this.snapshot(), this.status()); }
  schedule(fn) {
    const run = this.queue.then(fn);
    this.queue = run.catch(() => {});
    return run;
  }

  nextStamp() {
    this.lastStamp = Math.max(Date.now(), this.lastStamp + 1);
    return this.lastStamp;
  }

  makeRecord(fields, old = null, deleted = false) {
    return {
      id: old?.id || crypto.randomUUID(),
      ...fields,
      updatedAt: this.nextStamp(),
      opId: crypto.randomUUID(),
      deleted
    };
  }

  async init() {
    const all = await this.api.storage.local.get(null);
    this.deviceId = all[SETTINGS.deviceId] || crypto.randomUUID();
    this.syncEnabled = all[SETTINGS.syncEnabled] === true;
    const importItems = {};
    if (!all[SETTINGS.migrated]) {
      // Legacy v1 used local.storage['links']; leave it untouched as a backup.
      for (const legacy of Array.isArray(all.links) ? all.links : []) {
        try {
          const fields = cleanFields(legacy);
          const record = this.makeRecord(fields);
          importItems[keyFor(record.id)] = record;
          this.records.set(record.id, record);
          this.lastStamp = Math.max(this.lastStamp, record.updatedAt);
        } catch { /* Skip invalid legacy entries, preserve their original backup. */ }
      }
      importItems[SETTINGS.migrated] = true;
    }
    importItems[SETTINGS.deviceId] = this.deviceId;
    if (Object.keys(importItems).length) await this.api.storage.local.set(importItems);
    for (const [key,value] of Object.entries(all)) {
      const record = recordFromStorage(key, value);
      if (record) { this.records.set(record.id, record); this.lastStamp = Math.max(this.lastStamp, record.updatedAt); }
    }
    this.listener = (changes, area) => {
      if (area === 'sync' && this.syncEnabled) {
        this.schedule(() => this.receiveSyncChanges(changes)).catch(() => {});
      } else if (area === 'local') {
        this.schedule(async () => {
          let changed = false;
          for (const [key, value] of Object.entries(changes)) {
            if (key === SETTINGS.syncEnabled) {
              const nextEnabled = value.newValue === true;
              if (nextEnabled !== this.syncEnabled) {
                this.syncEnabled = nextEnabled;
                changed = true;
                if (nextEnabled) await this.reconcile();
              }
            }
            const incoming = recordFromStorage(key, value.newValue);
            if (incoming && compareRecords(incoming, this.records.get(incoming.id)) > 0) {
              this.records.set(incoming.id, incoming);
              this.lastStamp = Math.max(this.lastStamp, incoming.updatedAt);
              changed = true;
            }
          }
          if (changed) this.emit();
        }).catch(() => {});
      }
    };
    this.api.storage.onChanged.addListener(this.listener);
    if (this.syncEnabled) await this.schedule(() => this.reconcile());
    this.emit();
  }

  async saveLocal(record) {
    this.records.set(record.id, record);
    await this.api.storage.local.set({[keyFor(record.id)]: record});
    this.emit();
  }

  async sendSync(pending) {
    if (!this.syncEnabled || !Object.keys(pending).length) return;
    for (const [key, value] of Object.entries(pending)) {
      const itemBytes = new TextEncoder().encode(key + JSON.stringify(value)).byteLength;
      if (itemBytes > MAX_SYNC_ITEM_BYTES) {
        this.syncError = 'یکی از لینک‌ها بیش از ظرفیت مجاز همگام‌سازی است.';
        this.emit();
        return;
      }
    }
    try {
      // Batches reduce sync writes without making any single value >8 KB.
      const entries = Object.entries(pending);
      for (let i=0; i<entries.length; i+=20) {
        await this.api.storage.sync.set(Object.fromEntries(entries.slice(i,i+20)));
      }
      this.syncError = '';
      this.syncItemCount = Math.max(this.syncItemCount, this.records.size);
    } catch (err) {
      this.syncError = `همگام‌سازی انجام نشد: ${err?.message || 'خطای فضای ابری'}`;
    }
    this.emit();
  }

  async reconcile() {
    if (!this.syncEnabled) return;
    this.syncBusy = true;
    this.emit();
    try {
      const remoteAll = await this.api.storage.sync.get(null);
      const remote = new Map();
      for (const [key, value] of Object.entries(remoteAll)) {
        const record = recordFromStorage(key, value);
        if (record) remote.set(record.id, record);
      }
      this.syncItemCount = remote.size;
      const updateLocal = {};
      const updateRemote = {};
      for (const id of new Set([...this.records.keys(), ...remote.keys()])) {
        const localItem = this.records.get(id);
        const remoteItem = remote.get(id);
        if (!localItem || (remoteItem && compareRecords(remoteItem, localItem) > 0)) {
          this.records.set(id, remoteItem);
          this.lastStamp = Math.max(this.lastStamp, remoteItem.updatedAt);
          updateLocal[keyFor(id)] = remoteItem;
        } else if (!remoteItem || compareRecords(localItem, remoteItem) > 0) {
          updateRemote[keyFor(id)] = localItem;
        }
      }
      if (Object.keys(updateLocal).length) await this.api.storage.local.set(updateLocal);
      await this.sendSync(updateRemote);
      // If there were no outbound changes, previous transient error is cleared.
      if (!Object.keys(updateRemote).length) this.syncError = '';
    } catch (err) {
      this.syncError = `امکان خواندن داده‌های همگام‌شده نیست: ${err?.message || 'خطای نامشخص'}`;
    } finally {
      this.syncBusy = false;
      this.emit();
    }
  }

  async receiveSyncChanges(changes) {
    const localUpdates = {};
    const pushBack = {};
    for (const [key, change] of Object.entries(changes)) {
      if (!key.startsWith(ITEM_PREFIX)) continue;
      const remoteItem = recordFromStorage(key, change.newValue);
      const id = key.slice(ITEM_PREFIX.length);
      const localItem = this.records.get(id);
      if (remoteItem && (!localItem || compareRecords(remoteItem, localItem) > 0)) {
        this.records.set(id, remoteItem);
        this.lastStamp = Math.max(this.lastStamp, remoteItem.updatedAt);
        localUpdates[key] = remoteItem;
      } else if (localItem && (!remoteItem || compareRecords(localItem, remoteItem) > 0)) {
        // Repair a stale remote overwrite or accidental key removal.
        pushBack[key] = localItem;
      }
    }
    if (Object.keys(localUpdates).length) await this.api.storage.local.set(localUpdates);
    if (Object.keys(pushBack).length) await this.sendSync(pushBack);
    this.syncItemCount = Math.max(this.syncItemCount, this.records.size);
    this.emit();
  }

  async toggleSync(value) {
    return this.schedule(async () => {
      this.syncEnabled = !!value;
      await this.api.storage.local.set({[SETTINGS.syncEnabled]: this.syncEnabled});
      if (this.syncEnabled) await this.reconcile();
      else { this.syncError = ''; this.syncBusy = false; }
      this.emit();
    });
  }

  async retrySync() { return this.schedule(() => this.reconcile()); }

  async add(data) {
    const fields = cleanFields(data);
    return this.schedule(async () => {
      if (this.snapshot().some(item => item.url === fields.url)) {
        throw new Error('این آدرس قبلاً ذخیره شده است.');
      }
      const record = this.makeRecord(fields);
      await this.saveLocal(record);
      await this.sendSync({[keyFor(record.id)]: record});
      return record;
    });
  }

  async edit(id, data) {
    const fields = cleanFields(data);
    return this.schedule(async () => {
      const previous = this.records.get(id);
      if (!previous || previous.deleted) throw new Error('لینک موردنظر پیدا نشد.');
      if (this.snapshot().some(item => item.id !== id && item.url === fields.url)) {
        throw new Error('این آدرس قبلاً ذخیره شده است.');
      }
      const record = this.makeRecord(fields, previous);
      await this.saveLocal(record);
      await this.sendSync({[keyFor(record.id)]: record});
    });
  }

  async remove(id) {
    return this.schedule(async () => {
      const previous = this.records.get(id);
      if (!previous || previous.deleted) return;
      const record = this.makeRecord({title: previous.title, url: previous.url, category: previous.category}, previous, true);
      await this.saveLocal(record);
      await this.sendSync({[keyFor(record.id)]: record});
    });
  }

  exportData() {
    return {
      application: 'AraanCo Link Manager', formatVersion: 2,
      exportedAt: new Date().toISOString(),
      links: this.snapshot().map(({title,url,category}) => ({title,url,category}))
    };
  }

  async importData(json) {
    const data = Array.isArray(json) ? json : json?.links;
    if (!Array.isArray(data) || data.length > 20000) throw new Error('ساختار فایل پشتیبان معتبر نیست.');
    const clean = [];
    let skipped = 0;
    for (const entry of data) {
      try { clean.push(cleanFields(entry)); } catch { skipped++; }
    }
    return this.schedule(async () => {
      const urls = new Set(this.snapshot().map(x => x.url));
      const newItems = {};
      let added = 0;
      for (const fields of clean) {
        if (urls.has(fields.url)) { skipped++; continue; }
        urls.add(fields.url);
        const record = this.makeRecord(fields);
        newItems[keyFor(record.id)] = record;
        this.records.set(record.id, record);
        added++;
      }
      if (added) {
        await this.api.storage.local.set(newItems);
        this.emit();
        await this.sendSync(newItems);
      }
      return {added, skipped};
    });
  }

  destroy() {
    if (this.listener) this.api.storage.onChanged.removeListener(this.listener);
  }
}
