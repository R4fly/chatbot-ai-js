export default class BaseBackend {
  constructor(config) {
    this.config = config;
  }
  async generateResponse(message) {
    throw new Error('Method generateResponse() harus diimplementasikan oleh subclass.');
  }
}