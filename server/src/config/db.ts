import mongoose from 'mongoose';
import { ENV } from './env';

// Cache connection promise globally across serverless function invocations
let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (uri?: string): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!cachedPromise) {
    const connectionUri = uri || ENV.MONGO_URI;
    cachedPromise = mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 1,
      socketTimeoutMS: 30000,
      bufferCommands: false
    }).then((conn) => {
      console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
      return conn;
    }).catch((err) => {
      cachedPromise = null;
      console.error('[Database] Connection failed:', err);
      throw err;
    });
  }

  return cachedPromise;
};

export const disconnectDB = async (): Promise<void> => {
  if (cachedPromise) {
    await mongoose.disconnect();
    cachedPromise = null;
  }
};
