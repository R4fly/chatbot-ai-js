import { ChatbotAI } from '../src/index.js';
import 'dotenv/config';

async function testWhatsApp() {
  console.log('🚀 Menjalankan test WhatsApp Adapter...\n');
  
  // Validasi API Key
  if (!process.env.NVIDIA_API_KEY) {
    console.error('❌ Error: NVIDIA_API_KEY belum diatur di .env');
    process.exit(1);
  }

  const bot = new ChatbotAI({
    backendConfig: {
      model: process.env.NVIDIA_MODEL || 'minimaxai/minimax-m3'
    }
  });

  // Tambahkan intent
  bot.addIntent('salam', ['Halo', 'Hai', 'Selamat pagi', 'Selamat siang', 'Selamat malam', 'Assalamualaikum']);
  bot.addIntent('cuaca', ['Bagaimana cuaca', 'Cuaca hari ini', 'Prakiraan cuaca']);
  bot.addIntent('bantuan', ['Bantuan', 'Tolong', 'Saya butuh bantuan']);
  bot.addIntent('terima kasih', ['Terima kasih', 'Makasih', 'Thanks']);

  // Daftarkan handler
  bot.onIntent('salam', async (ctx) => ({
    text: `Halo ${ctx.context.userName || 'Kak'}! 👋\n\nSelamat datang di layanan chatbot kami.\nAda yang bisa saya bantu?`
  }));

  bot.onIntent('cuaca', async (ctx) => ({
    text: '🌤️ Cuaca hari ini:\n\n• Cerah berawan\n• Suhu: 28-32°C\n• Kelembaban: 70%\n\nCocok untuk aktivitas outdoor!'
  }));

  bot.onIntent('bantuan', async (ctx) => ({
    text: '🆘 Tentu, saya siap membantu!\n\nSilakan ceritakan masalah Anda, dan saya akan berusaha memberikan solusi terbaik.'
  }));

  bot.onIntent('terima kasih', async (ctx) => ({
    text: '🙏 Sama-sama! Senang bisa membantu.\n\nJika ada pertanyaan lain, jangan ragu untuk bertanya ya!'
  }));

  // Hubungkan ke WhatsApp
  await bot.connectAdapter('whatsapp', {
    authFolder: './whatsapp-auth'
  });

  // Mulai bot
  await bot.start();

  console.log('\n✅ WhatsApp bot sudah aktif!');
  console.log('📱 Scan QR Code di atas dengan WhatsApp Anda');
  console.log('⚠️  Tekan Ctrl+C untuk menghentikan bot\n');
}

testWhatsApp().catch(console.error);