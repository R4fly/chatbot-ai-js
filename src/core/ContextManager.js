export default class ContextManager {
  constructor(config = {}) {
    this.memoryType = config.type || 'memory';
    this.store = new Map(); // In-memory store. Bisa diganti Redis/MongoDB via plugin.
  }

  async getContext(sessionId) {
    return this.store.get(sessionId) || {};
  }

  async updateContext(sessionId, data) {
    const current = await this.getContext(sessionId);
    this.store.set(sessionId, { ...current, ...data });
  }

  async set(sessionId, key, value) {
    const current = await this.getContext(sessionId);
    current[key] = value;
    this.store.set(sessionId, current);
  }

  async get(sessionId, key) {
    const current = await this.getContext(sessionId);
    return current[key];
  }

  async clear(sessionId) {
    this.store.delete(sessionId);
  }
}