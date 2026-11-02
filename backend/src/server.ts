import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';

// Route imports
import authRoutes from './routes/authRoutes';
import memberRoutes from './routes/memberRoutes';
import mealRoutes from './routes/mealRoutes';
import marketRoutes from './routes/marketRoutes';
import depositRoutes from './routes/depositRoutes';
import expenseRoutes from './routes/expenseRoutes';
import settlementRoutes from './routes/settlementRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import settingsRoutes from './routes/settingsRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static files for uploaded receipts
const uploadDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Smart Mess Management System API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlement', settlementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API Route not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Connect to Database and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Smart Mess Management System API Server Running  `);
      console.log(`  URL: http://localhost:${PORT}                      `);
      console.log(`  Health Check: http://localhost:${PORT}/api/health  `);
      console.log(`====================================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to Database:', err);
    // Even if MongoDB connection fails initially, still start HTTP server so UI can inform the user
    app.listen(PORT, () => {
      console.log(`[Warning] Server running without active MongoDB connection on port ${PORT}`);
    });
  });

export default app;

