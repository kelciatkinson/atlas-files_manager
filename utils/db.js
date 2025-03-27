const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    this.database = database;

    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });

    this.client.connect()
      .then(() => {
        this.db = this.client.db(this.database);
        console.log('Connected to databse', database);
        console.log('Connected to database', this.db.databaseName);
      })

      .catch((err) => {
        console.error(err);
        this.db = null;
      });
  }

  isAlive() {
    return this.db !== null;
  }

  async nbUsers() {
    if (!this.db) return 0;
    try {
      const users = await this.db.collection('users').countDocuments();
      return users;
    } catch (error) {
      return 0;
    }
  }

  async nbFiles() {
    if (!this.db) return 0;
    try {
      const files = await this.db.collection('files').countDocuments();
      return files;
    } catch (error) {
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
