import { ChatbotAI } from '../src/index.js';

async function runTests() {
  console.log('🚀 Menjalankan pengujian chatbot-ai-js...\n');
  
  // Validasi Keamanan: Pastikan API Key ada di environment
  if (!process.env.NVIDIA_API_KEY) {
    console.error('❌ Error: Environment variable NVIDIA_API_KEY belum diatur untuk testing.');
    console.error('   Cara setting di Windows PowerShell:');
    console.error('   $env:NVIDIA_API_KEY="nvapi-xxx"; npm run test\n');
    process.exit(1); // Hentikan proses
  }

  const bot = new ChatbotAI({
    // API Key otomatis dibaca dari process.env.NVIDIA_API_KEY
    backendConfig: {
      model: process.env.NVIDIA_MODEL || 'minimaxai/minimax-m3'
    }
  });

  bot.addIntent('salam', ['Halo', 'Selamat pagi', 'Assalamualaikum']);
  bot.addIntent('cuaca', ['Bagaimana cuaca hari ini?', 'Prakiraan cuaca besok']);

  bot.onIntent('salam', async (ctx) => ({ text: 'Halo! Ada yang bisa saya bantu?' }));
  bot.onIntent('cuaca', async (ctx) => ({ text: `Cuaca di Jakarta cerah dan panas.` }));

  console.log('Test 1: Intent Classification (Salam)');
  const res1 = await bot.processMessage('Selamat pagi!');
  console.log('Response:', res1.text, '\n');

  console.log('Test 2: AI Backend Fallback');
  const res2 = await bot.processMessage('Siapa presiden Indonesia saat ini?');
  console.log('Response:', res2.text, '\n');

  console.log('✅ Semua pengujian berhasil diselesaikan.');
}

runTests().catch(console.error);