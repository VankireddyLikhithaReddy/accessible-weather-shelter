const { randomUUID } = require("crypto");

// Memory-based storage implementation
class MemStorage {
  constructor() {
    this.users = new Map();
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

// Create a single shared storage instance
const storage = new MemStorage();

module.exports = { MemStorage, storage };
