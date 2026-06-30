export default class MiddlewareManager {
  constructor() {
    this.middlewares = { pre: [], post: [] };
  }

  add(middleware) {
    if (middleware.pre) this.middlewares.pre.push(middleware.pre);
    if (middleware.post) this.middlewares.post.push(middleware.post);
  }

  async run(stage, data) {
    let currentData = data;
    for (const fn of this.middlewares[stage]) {
      currentData = await fn(currentData);
      if (!currentData) return null; // Hentikan pipeline jika middleware mengembalikan null
    }
    return currentData;
  }
}