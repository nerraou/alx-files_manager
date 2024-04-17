import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(request, response) {
    const isRedisAlive = redisClient.isAlive();
    const isDBAlive = dbClient.isAlive();

    response.status(200).json({ redis: isRedisAlive, db: isDBAlive });
  }

  static async getStats(request, response) {
    try {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();

      response.status(200).json({ users, files });
    } catch (error) {
      response.status(500).json({
        message: error.message,
      });
    }
  }
}

export default AppController;
