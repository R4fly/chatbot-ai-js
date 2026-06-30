import axios from 'axios';
import BaseBackend from './BaseBackend.js';

export default class NvidiaBackend extends BaseBackend {
  constructor(config = {}) {
    super(config);
    // Prioritas: config object -> environment variable -> undefined
    this.apiKey = config.apiKey || process.env.NVIDIA_API_KEY;
    this.model = config.model || process.env.NVIDIA_MODEL || 'minimaxai/minimax-m3';
    this.invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    
    if (!this.apiKey) {
      console.warn('⚠️ [NvidiaBackend] NVIDIA_API_KEY belum dikonfigurasi!');
      console.warn('   Kunjungi https://build.nvidia.com untuk mendapatkan API Key gratis.');
      console.warn('   Simpan di file .env atau set sebagai Environment Variable sistem Anda.');
    }
  }

  async generateResponse(message) {
    if (!this.apiKey) {
      return { 
        text: '🚫 Error: API Key Nvidia belum dikonfigurasi. Silakan kunjungi https://build.nvidia.com untuk mendapatkan API Key Anda dan atur NVIDIA_API_KEY.', 
        source: 'error' 
      };
    }

    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Accept": "application/json"
    };

    const payload = {
      "model": this.model,
      "messages": [
        { "role": "system", "content": "Anda adalah asisten AI yang cerdas dan membantu." },
        { "role": "user", "content": message.text }
      ],
      "max_tokens": 8192,
      "temperature": 1.00,
      "top_p": 0.95,
      "stream": false
    };

    try {
      const response = await axios.post(this.invokeUrl, payload, { headers });
      const text = response.data.choices[0].message.content;
      return { text, source: 'nvidia', model: this.model };
    } catch (error) {
      const errorMsg = error.response ? error.response.data.error?.message || error.message : error.message;
      console.error('❌ Nvidia API Error:', errorMsg);
      return { text: `Maaf, terjadi kesalahan pada layanan AI Nvidia.`, source: 'error' };
    }
  }
}