import fs from 'fs';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    const fileName = uuidv4();
    const localPath = path.join(folderPath, fileName);

    if (type === 'folder') {
      const newFile = {
        userId: ObjectId(userId),
        name,
        type,
        isPublic,
      };
      const result = await dbClient.db.collection('files').insertOne(newFile);
      return res.status(201).json({
        id: result.insertedId,
        userId: newFile.userId,
        name,
        type,
        isPublic,
      });
    }

    if (type === 'image' || type === 'file') {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      try {
        const fileData = Buffer.from(data, 'base64');
        fs.writeFileSync(localPath, fileData);
      } catch (error) {
        return res.status(500).json({ error: 'Error saving file' });
      }
    }

    const newFile = {
      userId: ObjectId(userId),
      name,
      type,
      parentId: parentId ? ObjectId(parentId) : 0,
      isPublic,
      localPath,
    };

    const result = await dbClient.db.collection('files').insertOne(newFile);
    return res.status(201).json({
      id: result.insertedId,
      userId: newFile.userId,
      name,
      type,
      parentId: parentId ? ObjectId(parentId) : 0,
      isPublic,
      localPath,
    });
  }
}

export default FilesController;
