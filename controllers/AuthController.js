import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Decodes base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const user = await dbClient.db().collection('users').findOne({ email });
      if (!user || sha1(password) !== user.password) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = uuidv4();

      await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 3600);
      return res.status(200).json({ token });
    } catch (err) {
      console.error('Error in getConnect:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await redisClient.del(`auth_${token}`);

      return res.status(204).send();
    } catch (err) {
      console.error('Error in getDisconnect:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AuthController;
