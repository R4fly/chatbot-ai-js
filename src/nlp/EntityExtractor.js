export default class EntityExtractor {
  constructor() {
    this.entities = [];
  }

  addEntity(name, pattern, options = {}) {
    this.entities.push({ name, pattern, options });
  }

  extract(text) {
    const extracted = {};
    for (const entity of this.entities) {
      const regex = new RegExp(entity.pattern, 'gi');
      const matches = text.match(regex);
      if (matches) {
        extracted[entity.name] = matches;
      }
    }
    return extracted;
  }

  exportData() {
    return this.entities.map(e => ({ name: e.name, pattern: e.pattern.source, options: e.options }));
  }

  importData(data) {
    this.entities = data.map(e => ({ name: e.name, pattern: new RegExp(e.pattern, 'gi'), options: e.options }));
  }
}