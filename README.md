# Smart Mess Management System 🍲

A complete, professional, modern, responsive full-stack **Smart Mess Management System** built with **React, TypeScript, Tailwind CSS, Node.js, Express.js, and MongoDB**.

Designed for shared messes and hostels to fully automate monthly meal counts, daily bazar/market purchases, shared house rents and utilities, bua/cook bills, member deposits, live mill rate calculation, and end-of-month financial settlement.

---

## 🌟 Key Features

### 1. Executive Financial Dashboard
- **8 Primary Financial Cards**: Active Members, Meals This Month, Today's Meals, Current Mill Rate, Total Market Expenses, Monthly Deposits, Total House Expenses, and Total Outstanding Dues.
- **Interactive Analytics (Recharts)**:
  - Daily Meal Consumption Trend
  - Member-wise Meal Comparison
  - 6 Months Financial Overview (Deposits vs Total Expenses)
- Recent Market Purchases, Member Deposits, and Real-Time Outstanding Balance Alerts.

### 2. Member Management
- Member Profiles with unique auto-generated IDs (`MEM-001`, `MEM-002`, ...).
- Contact number, address, room/bed assignment, joining date, and status (Active/Inactive).
- Complete financial history: individual meal totals, deposit log, personal market contributions, and running balance ledger.

### 3. Daily Meal Management
- **Single-Screen Bulk Entry**: Managers can log Breakfast, Lunch, Dinner, and Guest/Extra meals for all active members in seconds.
- **Automated Calculations**: Individual daily meal count, individual monthly count, total mess meals, and daily mess totals.
- **Monthly Matrix View**: Mirrors the reference Excel sheet (`MEAL.xlsx`) with horizontal days (1 to 31) and vertical member totals.

### 4. Daily Bazar / Market Management
- **Multi-Item Entry**: Log multiple purchased items (e.g. Beef, Rice, Oil) with quantities, units, and unit prices in a single transaction.
- **Buyer Attribution**: Every purchase is linked to the paying member for financial credit without double counting.
- Categorization (Grocery, Fish/Meat, Vegetables, Spices, Gas Cylinder, Other) and receipt upload support.

### 5. Automated Mill Rate Engine
$$\text{Mill Rate} = \frac{\text{Total Eligible Meal Expenses}}{\text{Total Mess Meals}}$$
- Live estimated meal rate vs locked finalized monthly rate.
- Historical mill rate comparison curve.

### 6. Monthly Deposits / Payment Ledger
- Multi-deposit recording with payment channels (Cash, bKash, Nagad, Bank).
- Transaction ID tracking, receipt upload, and balance credit adjustment.

### 7. House Rent & Shared Utilities
- Fixed & variable bills: House Rent, Electricity, Gas, Water, Wi-Fi, Security, Cleaner.
- **Dedicated Bua / Cook Bill** module with monthly salary history.
- Flexible allocation models:
  1. Equal split among active members.
  2. Proportionate split by active membership days.
  3. Custom member-wise allocation.

### 8. Monthly Financial Settlement & Month Closing
The core financial engine calculates each member's monthly balance:
1. $\text{Individual Meal Cost} = \text{Total Consumed Meals} \times \text{Final Mill Rate}$
2. $\text{Individual Shared Bills} = \text{Allocated House Rent} + \text{Utilities} + \text{Internet} + \text{Cook Salary}$
3. $\text{Individual Total Cost} = \text{Meal Cost} + \text{Shared Bills} + \text{Extra Charges}$
4. $\text{Financial Credits} = \text{Monthly Deposits} + \text{Market Expenses Paid Personally}$
5. $\text{Final Balance} = (\text{Total Cost} + \text{Previous Due}) - \text{Financial Credits}$
   - **Balance > 0**: Member needs to pay (**TO PAY**).
   - **Balance < 0**: Member will receive a refund (**TO RECEIVE**).
   - **Balance = 0**: Account is **SETTLED**.
- **Printable Individual Voucher**: Generates itemized physical slips with mess header and signature lines.
- **Month Closing & Lock**: Finalizes accounts, prevents unauthorized tampering, and carries forward balances.

### 9. Member Portal
- Dedicated login for members to view only their own records (meal diary, personal deposits, bazar spent, running dues/refunds).
- Member accounts cannot alter financial records.

### 10. Reports & Exports
- One-click export to **Excel (.xlsx)**, **PDF**, and **CSV**.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons, Recharts, Vite, jsPDF, XLSX.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose, JWT, Bcrypt, Multer, ExcelJS.
- **Database**: MongoDB.
- **Testing**: Jest with `ts-jest` for financial calculation unit tests.

---

## 🚀 Local Installation & Quick Start

### 1. Prerequisites
- **Node.js** (v18 or newer)
- **MongoDB** installed and running locally on port `27017` (e.g. via Windows Service or `mongod`).

### 2. Clone / Open Directory
```bash
cd "F:\Projects\Smart Mess Management System"
```

### 3. Install All Dependencies
Install root, backend, and frontend dependencies:
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 4. Configure Environment Variables
A pre-configured `.env` is provided in `backend/.env`. You can modify it if needed:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/smart_mess_db
JWT_SECRET=super_secret_mess_jwt_key_2026_xyz123!@#
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
```

### 5. Initialize & Seed Demo Database
Populates the database with real mess members (referenced from `MEAL.xlsx`), meals, bazar transactions, deposits, house bills, cook salary, and system users:
```bash
npm run seed
```

### 6. Run the Application in Development Mode
From the root folder, launch both backend and frontend concurrently:
```bash
npm run dev
```
Or run separately:
- **Backend API**: `cd backend && npm run dev` (starts on `http://localhost:5000`)
- **Frontend UI**: `cd frontend && npm run dev` (starts on `http://localhost:5173`)

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Default Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@mess.com` | `admin123` | Full system access, month closing/reopening, user roles |
| **Manager** | `manager@mess.com` | `manager123` | Meal entry, bazar recording, deposits, house bills, reports |
| **Member** | `member@mess.com` | `member123` | Personal portal, meal diary, deposits, personal statement |

*(One-click quick login buttons are also provided on the login page for instant demo access).*

---

## 🧪 Running Unit Tests

To run the unit test suite verifying all mathematical formulas, mill rate precision, shared bill allocations, and credit balance logic:
```bash
npm test
```
Or directly in backend:
```bash
cd backend && npx jest
```

---

## 🏗️ Production Build

To compile both backend and frontend into production bundles:
```bash
npm run build
```
- Frontend output: `frontend/dist/`
- Backend output: `backend/dist/`

