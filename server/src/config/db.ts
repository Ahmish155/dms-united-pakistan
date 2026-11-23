import mongoose from 'mongoose';
import { ENV } from './env';

let isConnected = false;

export const connectDB = async (uri?: string): Promise<typeof mongoose> => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const connectionUri = uri || ENV.MONGO_URI;
  try {
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    });
    isConnected = conn.connections[0].readyState === 1;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  isConnected = false;
};
