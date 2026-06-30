[![npm version](https://img.shields.io/npm/v/chatbot-ai-js.svg)](https://www.npmjs.com/package/chatbot-ai-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/R4fly/chatbot-ai-js.svg)](https://github.com/R4fly/chatbot-ai-js/stargazers)

# chatbot-ai-js

> **Library JavaScript Modern untuk Membangun Chatbot AI dengan Nvidia AI Backend.**

`chatbot-ai-js` adalah pustaka Node.js yang dirancang untuk mempercepat pengembangan chatbot berbasis AI. Pustaka ini menggabungkan kemampuan *Natural Language Understanding* (NLU) on-device dengan integrasi native ke **Nvidia Build** (build.nvidia.com), memberikan akses ke ratusan model AI (MiniMax-M3, Llama, Mistral, dll.) dengan satu API key.

## 🌟 Fitur Utama
- **NLU On-Device**: Klasifikasi intent menggunakan Jaccard Similarity — transparan, cepat, dan *fail gracefully*.
- **Nvidia AI Native**: Integrasi langsung ke Nvidia Build API. Gunakan model apa saja (MiniMax-M3, Llama 3, dll.) dengan satu API key.
- **Dialog & Context Manager**: Stateful conversation per sesi dengan dukungan short-term memory.
- **Multi-Channel Adapter**: Konektor siap pakai untuk WhatsApp (Baileys) dan Telegram.
- **Middleware Pipeline**: Fleksibel untuk preprocessing, logging, dan filtering.

## 📦 Instalasi
```bash
npm install chatbot-ai-js
```

## 🚀 Contoh Penggunaan Cepat
```js
import { ChatbotAI } from 'chatbot-ai-js';

const bot = new ChatbotAI({
  backendConfig: {
    apiKey: 'nvapi-YOUR_NVIDIA_API_KEY', // Dapatkan dari build.nvidia.com
    model: 'minimaxai/minimax-m3'         // Atau model lainnya
  }
});

// Tambahkan intent dan contoh kalimat
bot.addIntent('salam', ['Halo', 'Selamat pagi', 'Assalamualaikum']);
bot.addIntent('cuaca', ['Bagaimana cuaca hari ini?', 'Prakiraan cuaca besok']);

// Daftarkan handler untuk intent tertentu
bot.onIntent('salam', async (ctx) => ({ 
  text: 'Halo! Ada yang bisa saya bantu?' 
}));

// Proses pesan - jika tidak ada handler, otomatis fallback ke Nvidia AI
const response = await bot.processMessage('Siapa presiden Indonesia?');
console.log(response.text); // Dijawab oleh Nvidia MiniMax-M3
```

## 📱 Multi-Channel Adapters

Library ini mendukung integrasi dengan WhatsApp dan Telegram secara native.

### 📱 WhatsApp Adapter (Baileys)

WhatsApp adapter menggunakan library [Baileys](https://github.com/WhiskeySockets/Baileys) yang merupakan implementasi WhatsApp Web API.

#### Cara Penggunaan:

```javascript
import { ChatbotAI } from 'chatbot-ai-js';

const bot = new ChatbotAI({
  backendConfig: {
    apiKey: process.env.NVIDIA_API_KEY,
    model: 'minimaxai/minimax-m3'
  }
});

// Tambahkan intent dan handler
bot.addIntent('salam', ['Halo', 'Selamat pagi']);
bot.onIntent('salam', async (ctx) => ({
  text: 'Halo! Ada yang bisa saya bantu?'
}));

// Hubungkan ke WhatsApp
await bot.connectAdapter('whatsapp', {
  authFolder: './whatsapp-auth' // Folder untuk menyimpan session
});

await bot.start();
```

## 🔑 Mendapatkan API Key Nvidia
1. Kunjungi https://build.nvidia.com
2. Daftar dan buat API key gratis
3. Pilih model yang diinginkan (MiniMax-M3, Llama 3, dll.)
4. Salin API key dan masukkan ke backendConfig.apiKey

## 🔑 Konfigurasi API Key Nvidia (Wajib)

Library ini menggunakan [Nvidia Build](https://build.nvidia.com) sebagai backend AI utama. Anda tidak perlu membayar untuk memulai karena Nvidia menyediakan *free tier* yang sangat cukup untuk pengembangan.

### Langkah 1: Dapatkan API Key
1. Kunjungi [build.nvidia.com](https://build.nvidia.com)
2. Login atau buat akun Nvidia
3. Pilih model AI (misal: `MiniMax-M3`, `Llama 3`, `Mistral`)
4. Klik **Get API Key** dan salin key Anda (dimulai dengan `nvapi-...`)

### Langkah 2: Amankan API Key Anda
**JANGAN PERNAH** menaruh API Key langsung di dalam source code (hardcode). Gunakan Environment Variables.

Buat file `.env` di root proyek aplikasi Anda:
```env
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NVIDIA_MODEL=minimaxai/minimax-m3
```

## 📜 Lisensi
MIT © Muhammad Rafly Baehaqi