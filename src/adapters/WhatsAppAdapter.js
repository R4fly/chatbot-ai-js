import BaseAdapter from './BaseAdapter.js';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

export default class WhatsAppAdapter extends BaseAdapter {
  constructor(credentials, bot) {
    super(credentials, bot);
    this.sock = null;
    this.authFolder = credentials.authFolder || './whatsapp-auth';
    this.logger = credentials.logger || pino({ level: 'silent' });
    this.isConnecting = false;
    this.maxRetries = credentials.maxRetries || 5;
    this.retryCount = 0;
  }

  async connect() {
    console.log('📱 [WhatsApp] Menginisialisasi koneksi...');
    
    // Pastikan folder auth ada
    if (!fs.existsSync(this.authFolder)) {
      fs.mkdirSync(this.authFolder, { recursive: true });
      console.log(`📁 [WhatsApp] Folder auth dibuat: ${this.authFolder}`);
    }

    // Tambahkan ke .gitignore jika belum ada
    this._ensureGitignore();

    const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
    const { version } = await fetchLatestBaileysVersion();
    
    console.log(`📱 [WhatsApp] Menggunakan WhatsApp Web v${version.join('.')}`);

    this.sock = makeWASocket({
      version,
      auth: state,
      logger: this.logger,
      printQRInTerminal: false, // Kita akan print sendiri dengan qrcode-terminal
    });

    // Handle koneksi
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log(`🔌 [WhatsApp] Status koneksi: ${connection}`);

      if (qr) {
        console.log('\n📱 [WhatsApp] Scan QR Code ini dengan WhatsApp Anda:');
        qrcode.generate(qr, { small: true });
        console.log('⚠️  QR Code akan expire dalam 20 detik\n');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = DisconnectReason[statusCode];
        
        console.error(`❌ [WhatsApp] Koneksi tertutup. Reason: ${reason} (${statusCode})`);

        if (statusCode === DisconnectReason.loggedOut) {
          console.error('🚫 [WhatsApp] Anda telah logout. Hapus folder auth dan scan ulang.');
          console.error(`   rm -rf ${this.authFolder}`);
          process.exit(1);
        } else if (statusCode === DisconnectReason.connectionReplaced) {
          console.error('🚫 [WhatsApp] Koneksi diganti. Pastikan tidak ada sesi WhatsApp Web lain yang aktif.');
          process.exit(1);
        } else if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`🔄 [WhatsApp] Mencoba reconnect... (${this.retryCount}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          this.connect();
        } else {
          console.error('💀 [WhatsApp] Gagal reconnect setelah beberapa percobaan.');
          process.exit(1);
        }
      } else if (connection === 'open') {
        console.log('✅ [WhatsApp] Koneksi berhasil dibuka!');
        console.log(`📱 [WhatsApp] Nomor: ${this.sock.user?.id?.split(':')[0] || 'Unknown'}`);
        this.retryCount = 0;
        this.isConnecting = false;
      }
    });

    // Handle credentials update
    this.sock.ev.on('creds.update', saveCreds);

    // Handle pesan masuk
    this.sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      for (const message of m.messages) {
        if (!message.message) continue;
        if (message.key.fromMe) continue; // Abaikan pesan dari diri sendiri

        await this._handleIncomingMessage(message);
      }
    });
  }

  async _handleIncomingMessage(message) {
    try {
      const chatId = message.key.remoteJid;
      const senderName = message.pushName || 'User';
      
      // Ekstrak teks pesan
      let text = '';
      if (message.message.conversation) {
        text = message.message.conversation;
      } else if (message.message.extendedTextMessage?.text) {
        text = message.message.extendedTextMessage.text;
      } else if (message.message.imageMessage?.caption) {
        text = message.message.imageMessage.caption;
      } else if (message.message.videoMessage?.caption) {
        text = message.message.videoMessage.caption;
      } else {
        console.log(`⚠️  [WhatsApp] Pesan non-teks dari ${senderName} diabaikan`);
        return;
      }

      console.log(`\n📩 [WhatsApp] Pesan dari ${senderName} (${chatId.split('@')[0]}):`);
      console.log(`   "${text}"`);

      // Buat sessionId unik untuk setiap user
      const sessionId = `wa_${chatId}`;

      // Proses pesan melalui bot
      const response = await this.bot.processMessage(text, sessionId);

      // Kirim respons
      if (response && response.text) {
        await this.sendMessage(chatId, response);
      }
    } catch (error) {
      console.error('❌ [WhatsApp] Error handling message:', error.message);
    }
  }

  async sendMessage(chatId, message) {
    try {
      await this.sock.sendMessage(chatId, { 
        text: message.text 
      });
      
      console.log(`📤 [WhatsApp] Pesan terkirim ke ${chatId.split('@')[0]}`);
    } catch (error) {
      console.error(`❌ [WhatsApp] Gagal mengirim pesan ke ${chatId}:`, error.message);
    }
  }

  async start() {
    console.log('🚀 [WhatsApp] Adapter dimulai. Menunggu pesan masuk...');
  }

  _ensureGitignore() {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const authFolderName = path.basename(this.authFolder);
    
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      if (!content.includes(authFolderName)) {
        fs.appendFileSync(gitignorePath, `\n# WhatsApp Auth State\n${authFolderName}/\n`);
        console.log(`✅ [WhatsApp] ${authFolderName}/ ditambahkan ke .gitignore`);
      }
    }
  }
}