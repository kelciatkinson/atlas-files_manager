import redis from 'redis';

const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.connected = false;

    this.client.on('ready', () => {
      this.connected = true;
    });

    this.client.on('error', (err) => {
      console.log(err);
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.expireAsync = promisify(this.client.expire).bind(this.client);
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    try {
      return await this.getAsync(key);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.setAsync(key, value);
      await this.expireAsync(key, duration);
    } catch (err) {
      console.error(err);
    }
  }

  async del(key) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.error(err);
    }
  }
}

const redisClient = new RedisClient();

export default redisClient;
