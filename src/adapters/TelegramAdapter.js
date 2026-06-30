import BaseAdapter from './BaseAdapter.js';

export default class TelegramAdapter extends BaseAdapter {
  async connect() {
    console.log('🔌 Menghubungkan ke Telegram...');
    // Implementasi nyata menggunakan node-telegram-bot-api
  }

  async start() {
    console.log('✅ Telegram Adapter dimulai.');
  }

  async sendMessage(chatId, message) {
    console.log(`📤 Mengirim ke Telegram ${chatId}: ${message.text}`);
  }
}