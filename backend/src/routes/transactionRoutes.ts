import express from 'express';
import { getActiveTransactions, returnMoney, completeTransactionAndRate } from '../controllers/transactionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/active').get(protect, getActiveTransactions);
router.route('/return').post(protect, returnMoney);
router.route('/complete').post(protect, completeTransactionAndRate);

export default router;
