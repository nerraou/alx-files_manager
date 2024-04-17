import sha1 from 'sha1';
import dbClient from '../utils/db';

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
}

export default UsersController;
