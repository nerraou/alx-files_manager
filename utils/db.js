import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.db = null;

    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/`;

    MongoClient.connect(url, { useUnifiedTopology: true }, (error, client) => {
      if (error) {
        console.log(error);
      }

      this.db = client.db(database);
      this.db.createCollection('users');
      this.db.createCollection('files');
    });
  }

  isAlive() {
    return !!this.db;
  }

  nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  nbFiles() {
    return this.db.collection('files').countDocuments();
  }

  getUser(query) {
    return this.db.collection('users').findOne(query);
  }

  getFile(query) {
    return this.db.collection('files').findOne(query);
  }

  getFiles(query, page, limit) {
    return this.db
      .collection('files')
      .find(query)
      .skip(page * limit)
      .limit(limit)
      .toArray();
  }

  createFile(file) {
    return this.db.collection('files').insertOne(file);
  }
}

const dbClient = new DBClient();

export default dbClient;
