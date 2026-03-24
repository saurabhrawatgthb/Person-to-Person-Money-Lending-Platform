import express from 'express';
import { completeTransactionAndRate } from '../controllers/transactionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/complete').post(protect, completeTransactionAndRate);

export default router;
