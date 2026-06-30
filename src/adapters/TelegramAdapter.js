import BaseAdapter from './BaseAdapter.js';
import TelegramBot from 'node-telegram-bot-api';

export default class TelegramAdapter extends BaseAdapter {
  constructor(credentials, bot) {
    super(credentials, bot);
    this.botToken = credentials.token || process.env.TELEGRAM_BOT_TOKEN;
    this.telegramBot = null;
    this.polling = credentials.polling !== false; // Default: true
  }

  async connect() {
    if (!this.botToken) {
      throw new Error('❌ [Telegram] TELEGRAM_BOT_TOKEN tidak ditemukan! Dapatkan dari @BotFather di Telegram.');
    }

    console.log('✈️  [Telegram] Menginisialisasi bot...');
    
    this.telegramBot = new TelegramBot(this.botToken, { 
      polling: this.polling 
    });

    // Handle pesan masuk
    this.telegramBot.on('message', async (msg) => {
      await this._handleIncomingMessage(msg);
    });

    // Handle error
    this.telegramBot.on('polling_error', (error) => {
      console.error('❌ [Telegram] Polling error:', error.message);
    });

    // Handle connected
    const botInfo = await this.telegramBot.getMe();
    console.log(`✅ [Telegram] Bot terhubung: @${botInfo.username} (${botInfo.first_name})`);
  }

  async _handleIncomingMessage(msg) {
    try {
      const chatId = msg.chat.id;
      const senderName = msg.from.first_name || 'User';
      const text = msg.text;

      if (!text) {
        console.log(`⚠️  [Telegram] Pesan non-teks dari ${senderName} diabaikan`);
        return;
      }

      console.log(`\n📩 [Telegram] Pesan dari ${senderName} (@${msg.from.username || 'no_username'}):`);
      console.log(`   "${text}"`);

      // Buat sessionId unik untuk setiap user
      const sessionId = `tg_${chatId}`;

      // Proses pesan melalui bot
      const response = await this.bot.processMessage(text, sessionId);

      // Kirim respons
      if (response && response.text) {
        await this.sendMessage(chatId, response);
      }
    } catch (error) {
      console.error('❌ [Telegram] Error handling message:', error.message);
    }
  }

  async sendMessage(chatId, message) {
    try {
      // Telegram memiliki limit 4096 karakter per pesan
      const maxLength = 4000;
      const text = message.text;

      if (text.length <= maxLength) {
        await this.telegramBot.sendMessage(chatId, text, { 
          parse_mode: 'Markdown' // Support formatting
        });
      } else {
        // Split pesan panjang menjadi beberapa bagian
        const chunks = this._splitMessage(text, maxLength);
        for (const chunk of chunks) {
          await this.telegramBot.sendMessage(chatId, chunk, { 
            parse_mode: 'Markdown' 
          });
          await new Promise(resolve => setTimeout(resolve, 500)); // Delay untuk rate limiting
        }
      }
      
      console.log(`📤 [Telegram] Pesan terkirim ke chat ${chatId}`);
    } catch (error) {
      console.error(`❌ [Telegram] Gagal mengirim pesan ke ${chatId}:`, error.message);
    }
  }

  _splitMessage(text, maxLength) {
    const chunks = [];
    let currentChunk = '';
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxLength) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  async start() {
    console.log('🚀 [Telegram] Adapter dimulai. Menunggu pesan masuk...');
  }

  async stop() {
    if (this.telegramBot) {
      await this.telegramBot.stopPolling();
      console.log('🛑 [Telegram] Adapter dihentikan.');
    }
  }
}