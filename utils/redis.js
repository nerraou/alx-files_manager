import { promisify } from 'util';
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.getAsync = promisify(this.client.get);
    this.client.setAsync = promisify(this.client.set);
    this.client.setexAsync = promisify(this.client.setex);
    this.client.delAsync = promisify(this.client.del);

    this.client.on('error', (err) => {
      console.log(err.message);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  get(key) {
    return this.client.getAsync(key);
  }

  set(key, value, duration) {
    return this.client.setexAsync(key, duration, value);
  }

  del(key) {
    return this.client.delAsync(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
