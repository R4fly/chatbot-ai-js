import ContextManager from './ContextManager.js';
import MiddlewareManager from './MiddlewareManager.js';
import IntentClassifier from '../nlp/IntentClassifier.js';
import EntityExtractor from '../nlp/EntityExtractor.js';
import NvidiaBackend from '../backends/NvidiaBackend.js';
import fs from 'fs/promises';
import { glob } from 'glob';

export default class ChatbotAI {
  constructor(config = {}) {
    this.config = config;
    this.contextManager = new ContextManager(config.memory);
    this.middlewareManager = new MiddlewareManager();
    this.intentClassifier = new IntentClassifier(config.nlp || {});
    this.entityExtractor = new EntityExtractor();
    this.intentHandlers = {};
    this.adapters = {};
    
    // Hanya Nvidia Backend (sesuai spesifikasi)
    this.aiBackend = new NvidiaBackend(config.backendConfig || {});
  }

  async processMessage(userInput, sessionId = 'default') {
    let context = await this.contextManager.getContext(sessionId);
    let message = { text: userInput, sessionId, context };

    // Jalankan middleware pre-processing
    message = await this.middlewareManager.run('pre', message);
    if (!message) return null;

    // NLP Processing
    const intent = await this.intentClassifier.predict(message.text);
    const entities = this.entityExtractor.extract(message.text);
    
    message.intent = intent;
    message.entities = entities;

    // 🔍 LOGGING: Untuk debugging intent classification
    console.log(`🔍 [${sessionId}] Input: "${userInput}" → Intent: "${intent.name}" (confidence: ${intent.confidence.toFixed(3)})`);

    // Jalankan handler intent jika ada
    let response = null;
    if (intent.name !== 'none' && this.intentHandlers[intent.name]) {
      response = await this.intentHandlers[intent.name](message);
    }

    // Fallback ke AI Backend (Nvidia) jika tidak ada handler
    if (!response) {
      console.log(`🤖 [${sessionId}] Fallback ke Nvidia AI Backend...`);
      response = await this.aiBackend.generateResponse(message);
    }

    // Update konteks sesi
    await this.contextManager.updateContext(sessionId, { 
      lastIntent: intent.name, 
      lastEntities: entities 
    });

    // Jalankan middleware post-processing
    const processed = await this.middlewareManager.run('post', { ...message, response });

    return processed.response || response;
  }

  async trainFromFiles(pathGlob) {
    const files = await glob(pathGlob);
    for (const file of files) {
      const data = JSON.parse(await fs.readFile(file, 'utf-8'));
      if (data.intents) {
        for (const intent of data.intents) {
          this.addIntent(intent.name, intent.examples);
        }
      }
    }
  }

  addIntent(name, examples) {
    this.intentClassifier.addDocument(name, examples);
  }

  removeIntent(name) {
    this.intentClassifier.removeDocument(name);
  }

  addEntity(name, pattern, options = {}) {
    this.entityExtractor.addEntity(name, pattern, options);
  }

  async setContext(sessionId, key, value) {
    await this.contextManager.set(sessionId, key, value);
  }

  async getContext(sessionId, key) {
    return await this.contextManager.get(sessionId, key);
  }

  async clearContext(sessionId) {
    await this.contextManager.clear(sessionId);
  }

  onIntent(intentName, handler) {
    this.intentHandlers[intentName] = handler;
  }

  use(middleware) {
    this.middlewareManager.add(middleware);
  }

  setAIResponseGenerator(backendFunction) {
    this.aiBackend.generateResponse = backendFunction;
  }

  async exportModel(modelPath) {
    const modelData = {
      intents: this.intentClassifier.exportData(),
      entities: this.entityExtractor.exportData()
    };
    await fs.writeFile(modelPath, JSON.stringify(modelData, null, 2));
  }

  async loadModel(modelPath) {
    const data = JSON.parse(await fs.readFile(modelPath, 'utf-8'));
    this.intentClassifier.importData(data.intents);
    this.entityExtractor.importData(data.entities);
  }

  async connectAdapter(adapterName, credentials) {
    let AdapterClass;
    if (adapterName === 'whatsapp') {
      AdapterClass = (await import('../adapters/WhatsAppAdapter.js')).default;
    } else if (adapterName === 'telegram') {
      AdapterClass = (await import('../adapters/TelegramAdapter.js')).default;
    } else {
      throw new Error(`Adapter ${adapterName} tidak didukung.`);
    }
    
    const adapter = new AdapterClass(credentials, this);
    this.adapters[adapterName] = adapter;
    await adapter.connect();
  }

  async evaluateTestSuite(testFile) {
    const tests = JSON.parse(await fs.readFile(testFile, 'utf-8'));
    let correct = 0;
    for (const test of tests) {
      const result = await this.intentClassifier.predict(test.input);
      if (result.name === test.expectedIntent) correct++;
    }
    return { accuracy: correct / tests.length, total: tests.length, correct };
  }

  async start() {
    console.log('🤖 Chatbot AI is starting...');
    for (const name in this.adapters) {
      await this.adapters[name].start();
    }
    console.log('✅ Chatbot siap melayani.');
  }
}