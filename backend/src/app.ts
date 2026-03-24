import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import requestRoutes from './routes/requestRoutes';
import transactionRoutes from './routes/transactionRoutes';

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/transactions', transactionRoutes);

// Static Frontend Servicing Integration
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback to React Router 
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

export default app;
