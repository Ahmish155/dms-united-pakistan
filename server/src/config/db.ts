import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDB = async (uri?: string): Promise<typeof mongoose> => {
  const connectionUri = uri || ENV.MONGO_URI;
  try {
    const conn = await mongoose.connect(connectionUri);
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
