import mongoose from 'mongoose';
import { dbConfig } from './config';

class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Using existing database connection');
      return;
    }

    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(dbConfig.mongodb.url, {
        serverSelectionTimeoutMS: 5000,
      });
      
      this.isConnected = true;
      console.log('MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to MongoDB');
      });

      mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected');
        this.isConnected = false;
      });

      // Close the Mongoose connection when the Node process ends
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Mongoose connection closed through app termination');
        process.exit(0);
      });
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }
}

export const database = Database.getInstance();
