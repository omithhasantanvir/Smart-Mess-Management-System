import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';
import { Member } from '../models/Member';
import { Meal } from '../models/Meal';
import { MarketTransaction } from '../models/MarketTransaction';
import { Deposit } from '../models/Deposit';
import { Expense } from '../models/Expense';
import { MessSettings } from '../models/MessSettings';
import { format, subDays, startOfMonth } from 'date-fns';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mess_db';
  console.log(`Connecting to database at ${uri}...`);
  await mongoose.connect(uri);

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Member.deleteMany({}),
    Meal.deleteMany({}),
    MarketTransaction.deleteMany({}),
    Deposit.deleteMany({}),
    Expense.deleteMany({}),
    MessSettings.deleteMany({})
  ]);

  console.log('Seeding Mess Settings...');
  await MessSettings.create({
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
  });

  console.log('Seeding Members (from MEAL.xlsx reference)...');
  const memberData = [
    { name: 'Tanvir (Manager)', phone: '+8801740721194', room: '101', code: 'MEM-001', initialDue: 0 },
    { name: 'Real Vai', phone: '+8801712345671', room: '101', code: 'MEM-002', initialDue: 0 },
    { name: 'Muntahi Vai', phone: '+8801712345672', room: '102', code: 'MEM-003', initialDue: 0 },
    { name: 'Rakib Hasan', phone: '+8801712345673', room: '102', code: 'MEM-004', initialDue: 250 },
    { name: 'Sajid Ahmed', phone: '+8801712345674', room: '103', code: 'MEM-005', initialDue: 0 },
    { name: 'Fahim Morshed', phone: '+8801712345675', room: '103', code: 'MEM-006', initialDue: -500 }, // in advance
    { name: 'Shakil Khan', phone: '+8801712345676', room: '104', code: 'MEM-007', initialDue: 0 },
    { name: 'Mehedi Hasan', phone: '+8801712345677', room: '104', code: 'MEM-008', initialDue: 150 },
    { name: 'Anisur Rahman', phone: '+8801712345678', room: '105', code: 'MEM-009', initialDue: 0 }
  ];

  const createdMembers = [];
  for (const m of memberData) {
    const mem = await Member.create({
      memberCode: m.code,
      name: m.name,
      phone: m.phone,
      email: `${m.name.split(' ')[0].toLowerCase()}@mess.com`,
      roomNumber: m.room,
      address: 'Uttara, Dhaka',
      status: 'ACTIVE',
      currentBalance: m.initialDue,
      joiningDate: new Date('2026-01-01')
    });
    createdMembers.push(mem);
  }

  console.log('Seeding User Accounts...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const managerPassword = await bcrypt.hash('manager123', salt);
  const memberPassword = await bcrypt.hash('member123', salt);

  const adminUser = await User.create({
    name: 'Mess Super Admin',
    email: 'admin@mess.com',
    password: adminPassword,
    role: 'ADMIN',
    isActive: true
  });

  const managerUser = await User.create({
    name: 'Tanvir (Manager)',
    email: 'manager@mess.com',
    password: managerPassword,
    role: 'MANAGER',
    memberId: createdMembers[0]._id,
    isActive: true
  });
  await Member.findByIdAndUpdate(createdMembers[0]._id, { userId: managerUser._id });

  const regularMemberUser = await User.create({
    name: 'Real Vai',
    email: 'member@mess.com',
    password: memberPassword,
    role: 'MEMBER',
    memberId: createdMembers[1]._id,
    isActive: true
  });
  await Member.findByIdAndUpdate(createdMembers[1]._id, { userId: regularMemberUser._id });

  console.log('Seeding Daily Meals for current month...');
  const now = new Date();
  const currentMonthStr = format(now, 'yyyy-MM');
  const currentDay = now.getDate();

  // Populate meal records for past days of current month
  for (let d = 1; d <= currentDay; d++) {
    const dateStr = `${currentMonthStr}-${String(d).padStart(2, '0')}`;
    for (const mem of createdMembers) {
      const b = 1;
      const l = 1;
      const dinner = 1;
      const guest = (d % 5 === 0 && mem.memberCode === 'MEM-001') ? 1 : 0;
      const total = b + l + dinner + guest;

      await Meal.create({
        member: mem._id,
        date: dateStr,
        month: currentMonthStr,
        breakfast: b,
        lunch: l,
        dinner: dinner,
        guestMeal: guest,
        totalMeals: total,
        createdBy: managerUser._id
      });
    }
  }

  console.log('Seeding Daily Market Purchases...');
  const marketEntries = [
    {
      daysAgo: 1,
      purchasedBy: createdMembers[0]._id, // Tanvir
      items: [
        { name: 'Beef Meat', quantity: 3, unit: 'kg', unitPrice: 800, totalPrice: 2400, category: 'FISH_MEAT' },
        { name: 'Basmati Rice', quantity: 25, unit: 'kg', unitPrice: 85, totalPrice: 2125, category: 'GROCERY' },
        { name: 'Soybean Oil', quantity: 5, unit: 'liter', unitPrice: 170, totalPrice: 850, category: 'GROCERY' }
      ],
      category: 'FISH_MEAT',
      paymentMethod: 'CASH'
    },
    {
      daysAgo: 3,
      purchasedBy: createdMembers[1]._id, // Real Vai
      items: [
        { name: 'Hilsha & Rui Fish', quantity: 4, unit: 'kg', unitPrice: 650, totalPrice: 2600, category: 'FISH_MEAT' },
        { name: 'Potatoes & Onions', quantity: 10, unit: 'kg', unitPrice: 55, totalPrice: 550, category: 'VEGETABLES' },
        { name: 'Spices Mix', quantity: 1, unit: 'packet', unitPrice: 320, totalPrice: 320, category: 'SPICES' }
      ],
      category: 'FISH_MEAT',
      paymentMethod: 'BKASH'
    },
    {
      daysAgo: 5,
      purchasedBy: createdMembers[2]._id, // Muntahi Vai
      items: [
        { name: 'Broiler Chicken', quantity: 5, unit: 'kg', unitPrice: 210, totalPrice: 1050, category: 'FISH_MEAT' },
        { name: 'Fresh Vegetables & Eggs', quantity: 1, unit: 'bundle', unitPrice: 950, totalPrice: 950, category: 'VEGETABLES' }
      ],
      category: 'VEGETABLES',
      paymentMethod: 'CASH'
    },
    {
      daysAgo: 8,
      purchasedBy: createdMembers[3]._id, // Rakib
      items: [
        { name: 'LPG Gas Cylinder Refill', quantity: 1, unit: 'cylinder', unitPrice: 1450, totalPrice: 1450, category: 'GAS_CYLINDER' }
      ],
      category: 'GAS_CYLINDER',
      paymentMethod: 'CASH'
    }
  ];

  for (const m of marketEntries) {
    const tDate = format(subDays(now, m.daysAgo), 'yyyy-MM-dd');
    const totalAmount = m.items.reduce((s, i) => s + i.totalPrice, 0);

    await MarketTransaction.create({
      date: tDate,
      month: tDate.slice(0, 7),
      purchasedBy: m.purchasedBy,
      items: m.items,
      totalAmount,
      category: m.category,
      paymentMethod: m.paymentMethod,
      createdBy: managerUser._id
    });
  }

  console.log('Seeding Member Deposits...');
  const depositEntries = [
    { member: createdMembers[0]._id, amount: 4000, method: 'CASH', daysAgo: 10 },
    { member: createdMembers[1]._id, amount: 3000, method: 'BKASH', daysAgo: 9 },
    { member: createdMembers[2]._id, amount: 3500, method: 'NAGAD', daysAgo: 8 },
    { member: createdMembers[3]._id, amount: 3000, method: 'CASH', daysAgo: 8 },
    { member: createdMembers[4]._id, amount: 3500, method: 'BANK', daysAgo: 7 },
    { member: createdMembers[5]._id, amount: 4500, method: 'CASH', daysAgo: 7 },
    { member: createdMembers[6]._id, amount: 3000, method: 'BKASH', daysAgo: 6 },
    { member: createdMembers[7]._id, amount: 3000, method: 'NAGAD', daysAgo: 5 },
    { member: createdMembers[8]._id, amount: 3500, method: 'CASH', daysAgo: 5 }
  ];

  for (const d of depositEntries) {
    const dDate = format(subDays(now, d.daysAgo), 'yyyy-MM-dd');
    await Deposit.create({
      member: d.member,
      date: dDate,
      month: dDate.slice(0, 7),
      amount: d.amount,
      paymentMethod: d.method,
      transactionId: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      createdBy: managerUser._id
    });
  }

  console.log('Seeding House Rent and Monthly Bills...');
  const startDay = format(startOfMonth(now), 'yyyy-MM-dd');
  const expenses = [
    { title: 'Apartment House Rent', category: 'HOUSE_RENT', amount: 27000 },
    { title: 'DESCO Electricity Bill', category: 'ELECTRICITY', amount: 3600 },
    { title: 'Titas Gas Line Bill', category: 'GAS', amount: 1080 },
    { title: 'WASA Water Bill', category: 'WATER', amount: 900 },
    { title: 'High-speed Fiber Wi-Fi Bill', category: 'WIFI', amount: 1200 },
    { title: 'Building Security & Cleaner Service', category: 'SECURITY', amount: 1800 },
    { title: 'Bua / Cook Monthly Salary (Khala Bill)', category: 'COOK_BUA', amount: 6000 }
  ];

  for (const e of expenses) {
    const perMember = Math.round((e.amount / createdMembers.length) * 100) / 100;
    await Expense.create({
      title: e.title,
      category: e.category,
      amount: e.amount,
      date: startDay,
      month: currentMonthStr,
      sharingMethod: 'EQUAL',
      includeInMealRate: false,
      allocations: createdMembers.map(m => ({
        member: m._id,
        amount: perMember,
        activeDays: 30
      })),
      createdBy: managerUser._id
    });
  }

  console.log('====================================================');
  console.log('DATABASE SEEDED SUCCESSFULLY!');
  console.log('Default Credentials:');
  console.log('  Admin:   admin@mess.com   / admin123');
  console.log('  Manager: manager@mess.com / manager123');
  console.log('  Member:  member@mess.com  / member123');
  console.log('====================================================');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});

