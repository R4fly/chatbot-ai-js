import { ChatbotAI } from '../src/index.js';
import 'dotenv/config';

async function testTelegram() {
  console.log('🚀 Menjalankan test Telegram Adapter...\n');
  
  // Validasi API Key
  if (!process.env.NVIDIA_API_KEY) {
    console.error('❌ Error: NVIDIA_API_KEY belum diatur di .env');
    process.exit(1);
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN belum diatur di .env');
    console.error('   Dapatkan token dari @BotFather di Telegram');
    process.exit(1);
  }

  const bot = new ChatbotAI({
    backendConfig: {
      model: process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-pro'
    }
  });

  // Tambahkan intent
  bot.addIntent('salam', ['Halo', 'Hai', 'Selamat pagi', 'Selamat siang', 'Selamat malam']);
  bot.addIntent('cuaca', ['Bagaimana cuaca', 'Cuaca hari ini', 'Prakiraan cuaca']);
  bot.addIntent('bantuan', ['Bantuan', 'Tolong', 'Saya butuh bantuan']);

  // Daftarkan handler
  bot.onIntent('salam', async (ctx) => ({
    text: 'Halo! 👋 Selamat datang di Telegram bot kami. Ada yang bisa saya bantu?'
  }));

  bot.onIntent('cuaca', async (ctx) => ({
    text: '🌤️ Cuaca hari ini cerah dengan suhu 28°C. Cocok untuk aktivitas outdoor!'
  }));

  bot.onIntent('bantuan', async (ctx) => ({
    text: '🆘 Tentu! Silakan ceritakan masalah Anda.'
  }));

  // Hubungkan ke Telegram
  await bot.connectAdapter('telegram', {
    token: process.env.TELEGRAM_BOT_TOKEN
  });

  // Mulai bot
  await bot.start();

  console.log('\n✅ Telegram bot sudah aktif!');
  console.log('✈️  Bot siap menerima pesan');
  console.log('⚠️  Tekan Ctrl+C untuk menghentikan bot\n');
}

testTelegram().catch(console.error);