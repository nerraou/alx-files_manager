import sha1 from 'sha1';
import { ObjectId } from 'mongodb';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) {
      response.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      response.status(400).json({ error: 'Missing password' });
    }

    try {
      const collection = dbClient.db.collection('users');

      const userInDb = await collection.findOne({ email });

      if (userInDb) {
        response.status(400).json({ error: 'Already exist' });
      } else {
        const hashPwd = sha1(password);

        await collection.insertOne({ email, password: hashPwd });

        const newUser = await collection.findOne(
          { email },
          { projection: { email: 1 } },
        );

        response.status(201).json({ id: newUser._id, email: newUser.email });
      }
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  }

  static async getMe(request, response) {
    try {
      const userToken = request.header('X-Token');
      const authKey = `auth_${userToken}`;

      const userID = await redisClient.get(authKey);

      if (!userID) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await dbClient.getUser({ _id: ObjectId(userID) });

      response.json({ id: user._id, email: user.email });
    } catch (error) {
      response.status(500).json({ error: 'Server error' });
    }
  }
}

export default UsersController;
