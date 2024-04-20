import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(request, response) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const auth = Buffer.from(authHeader.split(' ')[1], 'base64')
        .toString()
        .split(':');
      const email = auth[0];
      const pass = sha1(auth[1]);

      const user = await dbClient.getUser({ email });

      if (!user) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (pass !== user.password) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      const duration = 60 * 60 * 24;
      await redisClient.set(key, user._id.toString(), duration);

      response.status(200).json({ token });
    } catch (err) {
      response.status(500).json({ error: 'Server error' });
    }
  }

  static async getDisconnect(request, response) {
    try {
      const userToken = request.header('x-token');

      const userKey = await redisClient.get(`auth_${userToken}`);
      if (!userKey) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await redisClient.del(`auth_${userToken}`);

      response.status(204).send('Disconnected');
    } catch (err) {
      console.log(err);
      response.status(500).json({ error: 'Server error' });
    }
  }

  static async checkAuth(request, response, next) {
    try {
      const token = request.headers['x-token'];

      if (!token) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (!userId) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await dbClient.getUser({ _id: ObjectId(userId) });

      request.user = user;
      next();
    } catch (err) {
      console.log(err);
      response.status(500).json({ error: 'Server error' });
    }
  }
}

export default AuthController;
