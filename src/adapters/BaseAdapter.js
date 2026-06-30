export default class BaseAdapter {
  constructor(credentials, bot) {
    this.credentials = credentials;
    this.bot = bot;
  }
  async connect() { throw new Error('Method connect() harus diimplementasikan.'); }
  async start() { throw new Error('Method start() harus diimplementasikan.'); }
  async sendMessage(chatId, message) { throw new Error('Method sendMessage() harus diimplementasikan.'); }
}