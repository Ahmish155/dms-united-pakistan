import mongoose from 'mongoose';
import { app } from '../server/src/app';
import { ENV } from '../server/src/config/env';

// Cache database connection for Vercel serverless execution
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    isConnected = conn.connections[0].readyState === 1;
    console.log('MongoDB connected successfully for serverless function.');
  } catch (error) {
    console.error('Failed to connect to MongoDB in serverless environment:', error);
    throw error;
  }
};

export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}
