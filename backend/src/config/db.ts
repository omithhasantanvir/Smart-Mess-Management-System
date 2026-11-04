import mongoose from 'mongoose';
import { prisma } from './prisma';

export async function connectDB(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;

  // If PostgreSQL (Neon) URL is configured
  if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
    try {
      await prisma.$connect();
      console.log(`[Database] PostgreSQL (Neon) successfully connected via Prisma!`);
      return;
    } catch (err: any) {
      console.error(`[Database Error] Could not connect to PostgreSQL (Neon): ${err.message}`);
      throw err;
    }
  }

  // Otherwise MongoDB
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mess_db';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB successfully connected to: ${uri}`);
  } catch (err: any) {
    console.warn(`[Database Warning] Could not connect to primary MongoDB URI (${uri}): ${err.message}`);
    console.log(`[Database Notice] Please ensure MongoDB service is running or provide a valid DATABASE_URL in backend/.env`);
    throw err;
  }
}
