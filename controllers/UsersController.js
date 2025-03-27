import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      const existingUser = await dbClient.client.db().collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashpw = sha1(password);

      const newUser = await dbClient.client.db().collection('users').insertOne({ email, password: hashpw });
      return res.status(201).json({ id: newUser.insertedId, email });
    } catch (err) {
      console.error('Error in postNew:', err);
      return res.status(500).json({ err: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    try {
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.client.db().collection('users').findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.status(200).json({ id: user._id, email: user.email });
    } catch (err) {
      console.error('Error in getMe:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default UsersController;
