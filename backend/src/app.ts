import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
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

app.get('/', (req, res) => {
  res.send('Smart P2P Lending API is running...');
});

export default app;
