import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mess_db';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB successfully connected to: ${uri}`);
  } catch (err: any) {
    console.warn(`[Database Warning] Could not connect to primary MongoDB URI (${uri}): ${err.message}`);
    console.log(`[Database Notice] Please ensure MongoDB service is running (e.g. net start MongoDB) or provide a valid MONGODB_URI in backend/.env`);
    // Attempt fallback or retry
    throw err;
  }
}

