import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './config/database';

import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import challanRoutes from './routes/challanRoutes';

import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Mini ERP & CRM Backend API'
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/challans', challanRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server & Initialize Database
async function startServer() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🚀 Mini ERP & CRM Backend running on http://localhost:${PORT}`);
  });
}

startServer();
