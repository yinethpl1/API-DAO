const { MongoClient } = require('mongodb');

class MongoDBConnection {
  constructor() {
    this.uri = process.env.MONGODB_URI || 'mongodb://yinethpalacios:iwj3QSMA1ShsTqV1@cluster0-shard-00-00.5visb.mongodb.net:27017,cluster0-shard-00-01.5visb.mongodb.net:27017,cluster0-shard-00-02.5visb.mongodb.net:27017/?ssl=true&replicaSet=atlas-n5eaxh-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
    this.dbName = process.env.MONGODB_DBNAME || 'iud_antioquia_rh';
    this.client = new MongoClient(this.uri);
    this.db = null;
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.log('Conexión a MongoDB establecida correctamente');
      return this.db;
    } catch (error) {
      console.error('Error al conectar a MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.close();
      console.log('Conexión a MongoDB cerrada');
    } catch (error) {
      console.error('Error al desconectar de MongoDB:', error);
      throw error;
    }
  }

  getCollection(collectionName) {
    if (!this.db) {
      throw new Error('No hay conexión a la base de datos');
    }
    return this.db.collection(collectionName);
  }
}

// Singleton para manejar una única conexión
const mongoDBConnection = new MongoDBConnection();

module.exports = mongoDBConnection;