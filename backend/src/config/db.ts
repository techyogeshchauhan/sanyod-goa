import mongoose from 'mongoose';
import { logger } from '../utils/logger';

mongoose.set('strictQuery', true);

export async function connectDb(uri: string): Promise<typeof mongoose> {
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info({ db: conn.connection.name }, 'MongoDB connected');
  return conn;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
