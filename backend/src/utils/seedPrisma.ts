import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { prisma } from '../config/prisma';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seedPrisma() {
  console.log('Seeding Neon PostgreSQL database with Prisma...');

  console.log('Clearing existing records...');
  // Delete in order to satisfy foreign key constraints
  await prisma.auditLog.deleteMany({});
  await prisma.meal.deleteMany({});
  await prisma.deposit.deleteMany({});
  await prisma.marketTransaction.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.monthlySettlement.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.messSettings.deleteMany({});

  console.log('Creating Mess Settings...');
  await prisma.messSettings.create({
    data: {
      messName: 'Green View Smart Mess',
      currencySymbol: '৳',
      address: 'Sector 10, Road 12/A, House 1, Uttara, Dhaka',
      managerName: 'Tanvir',
      contactNumber: '+8801740721194',
      defaultMealConfig: {
        breakfastMultiplier: 0.5,
        lunchMultiplier: 1,
        dinnerMultiplier: 1
      },
      eligibleMealExpenseCategories: ['GROCERY', 'FISH_MEAT', 'VEGETABLES', 'SPICES', 'GAS_CYLINDER'],
      autoLockClosedMonths: true
    }
  });

  console.log('Creating Members...');
  const memberData = [
    { name: 'Tanvir (Manager)', phone: '+8801740721194', room: '101', code: 'MEM-001', initialDue: 0 },
    { name: 'Real Vai', phone: '+8801712345671', room: '101', code: 'MEM-002', initialDue: 0 },
    { name: 'Muntahi Vai', phone: '+8801712345672', room: '102', code: 'MEM-003', initialDue: 0 },
    { name: 'Rakib Hasan', phone: '+8801712345673', room: '102', code: 'MEM-004', initialDue: 250 },
    { name: 'Sajid Ahmed', phone: '+8801712345674', room: '103', code: 'MEM-005', initialDue: 0 },
    { name: 'Fahim Morshed', phone: '+8801712345675', room: '103', code: 'MEM-006', initialDue: -500 },
    { name: 'Shakil Khan', phone: '+8801712345676', room: '104', code: 'MEM-007', initialDue: 0 },
    { name: 'Mehedi Hasan', phone: '+8801712345677', room: '104', code: 'MEM-008', initialDue: 150 },
    { name: 'Anisur Rahman', phone: '+8801712345678', room: '105', code: 'MEM-009', initialDue: 0 }
  ];

  const createdMembers = [];
  for (const m of memberData) {
    const mem = await prisma.member.create({
      data: {
        memberCode: m.code,
        name: m.name,
        phone: m.phone,
        email: `${m.name.split(' ')[0].toLowerCase()}@mess.com`,
        roomNumber: m.room,
        address: 'Uttara, Dhaka',
        status: 'ACTIVE',
        currentBalance: m.initialDue,
        joiningDate: new Date('2026-01-01')
      }
    });
    createdMembers.push(mem);
  }

  console.log('Creating User Accounts...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const managerPassword = await bcrypt.hash('manager123', salt);
  const memberPassword = await bcrypt.hash('member123', salt);

  await prisma.user.create({
    data: {
      name: 'Mess Super Admin',
      email: 'admin@mess.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      name: 'Tanvir (Manager)',
      email: 'manager@mess.com',
      password: managerPassword,
      role: 'MANAGER',
      memberId: createdMembers[0].id,
      isActive: true
    }
  });

  for (let i = 1; i < createdMembers.length; i++) {
    const mem = createdMembers[i];
    const username = mem.name.split(' ')[0].toLowerCase();
    await prisma.user.create({
      data: {
        name: mem.name,
        email: `${username}@mess.com`,
        password: memberPassword,
        role: 'MEMBER',
        memberId: mem.id,
        isActive: true
      }
    });
  }

  console.log('✅ Prisma Database seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Admin:   admin@mess.com   / admin123');
  console.log('Manager: manager@mess.com / manager123');
  console.log('Member:  real@mess.com    / member123');
  console.log('--------------------------------------------------');
}

seedPrisma()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

