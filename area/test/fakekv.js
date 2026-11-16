export class FakeKV {
  constructor() { this.m = new Map(); }
  async get(k, type) { const e = this.m.get(k); if (!e) return null; return type === 'json' ? JSON.parse(e.v) : type === 'arrayBuffer' ? e.v : e.v; }
  async getWithMetadata(k, type) { const e = this.m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; }
  async put(k, v, opt = {}) { if (v instanceof ArrayBuffer) v = v.slice(0); this.m.set(k, { v, meta: opt.metadata }); }
  async delete(k) { this.m.delete(k); }
  async list({ prefix = '' } = {}) { return { keys: [...this.m.keys()].filter(k => k.startsWith(prefix)).sort().map(name => ({ name })), list_complete: true }; }
}
