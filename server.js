// File: server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ ROUTES
import contactAccessRoutes from "./routes/contactAccessRoutes.js";
import listingPaymentRoutes from './routes/listingPaymentRoutes.js';
import mpesaRoutes from './routes/mpesa.js';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import rentRoutes from './routes/rentRoutes.js';
import billRoutes from './routes/billRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import billPaymentRoutes from './routes/billPaymentRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import payoutRoutes from './routes/payoutRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import paymentVerificationRoutes from './routes/paymentVerificationRoutes.js';

const app = express();

// === Middleware ===
const allowedOrigins = [
  'http://localhost:3000',
  'https://elihomes-frontend.vercel.app',
  'https://elihomes.vercel.app', // added production frontend
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.warn('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// ✅ Increase body size limit to support base64 images
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// === Static Files ===
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
app.use(express.static('public'));

// === Health Check ===
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ db: '✅ connected' });
  } catch (err) {
    console.error('❌ DB connection failed:', err);
    res.status(500).json({ db: '❌ connection failed', error: err.message });
  }
});

// === API Routes ===
app.use('/api/access', contactAccessRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/rents', rentRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/bill-payments', billPaymentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/listing-payments', listingPaymentRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/payment-verification', paymentVerificationRoutes);

// === Root ===
app.get('/', (req, res) => {
  res.send('EliHomes API is running...');
});

// === Catch-all 404 ===
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
