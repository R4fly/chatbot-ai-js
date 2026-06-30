export default class IntentClassifier {
  constructor(options = {}) {
    this.documents = [];
    this.confidenceThreshold = options.confidenceThreshold || 0.2;
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  addDocument(intentName, examples) {
    const examplesArray = Array.isArray(examples) ? examples : [examples];
    examplesArray.forEach(example => {
      this.documents.push({
        text: example,
        intent: intentName,
        tokens: new Set(this.tokenize(example))
      });
    });
  }

  removeDocument(intentName) {
    this.documents = this.documents.filter(doc => doc.intent !== intentName);
  }

  jaccardSimilarity(setA, setB) {
    if (setA.size === 0 || setB.size === 0) return 0;
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  async predict(text) {
    if (this.documents.length === 0) {
      return { name: 'none', confidence: 0 };
    }

    const inputTokens = new Set(this.tokenize(text));
    if (inputTokens.size === 0) {
      return { name: 'none', confidence: 0 };
    }

    const intentScores = {};
    for (const doc of this.documents) {
      const similarity = this.jaccardSimilarity(inputTokens, doc.tokens);
      if (!intentScores[doc.intent]) {
        intentScores[doc.intent] = { max: 0, total: 0, count: 0 };
      }
      intentScores[doc.intent].max = Math.max(intentScores[doc.intent].max, similarity);
      intentScores[doc.intent].total += similarity;
      intentScores[doc.intent].count++;
    }

    const results = Object.entries(intentScores).map(([intent, scores]) => ({
      name: intent,
      confidence: scores.max,
      avgConfidence: scores.total / scores.count
    }));
    results.sort((a, b) => b.confidence - a.confidence);

    if (results.length > 0 && results[0].confidence >= this.confidenceThreshold) {
      return results[0];
    }
    return { 
      name: 'none', 
      confidence: results.length > 0 ? results[0].confidence : 0 
    };
  }

  train() {
  }

  exportData() {
    return this.documents.map(doc => ({ text: doc.text, intent: doc.intent }));
  }

  importData(data) {
    if (data && Array.isArray(data)) {
      this.documents = data.map(doc => ({
        text: doc.text,
        intent: doc.intent,
        tokens: new Set(this.tokenize(doc.text))
      }));
    }
  }
}