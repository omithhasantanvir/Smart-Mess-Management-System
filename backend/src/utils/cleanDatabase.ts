import { prisma } from '../config/prisma';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function cleanDatabase() {
  console.log('Cleaning all demo records from Neon PostgreSQL database...');

  // Clean Neon PostgreSQL
  await prisma.auditLog.deleteMany({});
  await prisma.meal.deleteMany({});
  await prisma.deposit.deleteMany({});
  await prisma.marketTransaction.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.monthlySettlement.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.member.deleteMany({});
  console.log('✅ Neon PostgreSQL: All demo records successfully deleted!');

  // Clean local MongoDB if accessible
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      console.log('Cleaning local MongoDB collections...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      const collections = await mongoose.connection.db?.collections();
      if (collections) {
        for (const col of collections) {
          if (col.collectionName !== 'messsettings') {
            await col.deleteMany({});
          }
        }
      }
      console.log('✅ Local MongoDB: All demo records successfully cleared!');
    } catch (e: any) {
      console.log('Note: Local MongoDB not connected or skipped.');
    } finally {
      await mongoose.disconnect();
    }
  }

  console.log('🎉 Database is now 100% clean and ready for real production use!');
}

cleanDatabase()
  .catch((err) => {
    console.error('Error cleaning database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
