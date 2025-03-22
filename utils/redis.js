const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  isAlive() {
    if (this.client.connected === true) {
      return true;
    }
    return false;
  }

  async get(key) {
    try {
      await this.client.get(key);
    } catch (err) {
      console.log(err);
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.setex(key, value, duration);
    } catch (err) {
      console.log(err);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.log(err);
    }
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
