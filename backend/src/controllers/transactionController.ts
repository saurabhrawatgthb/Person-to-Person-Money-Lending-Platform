import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Transaction from '../models/Transaction';
import User from '../models/User';
import RequestModel from '../models/Request';

export const completeTransactionAndRate = async (req: AuthRequest, res: Response) => {
  const { transactionId, rating } = req.body;
  const userId = req.user?._id;

  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Validate if the current user is part of the transaction
    const isLender = transaction.lender_id.toString() === userId?.toString();
    const isBorrower = transaction.borrower_id.toString() === userId?.toString();

    if (!isLender && !isBorrower) {
      return res.status(403).json({ message: 'Not authorized for this transaction' });
    }

    if (isLender) {
      transaction.ratingByLender = rating;
    } else {
      transaction.ratingByBorrower = rating;
    }

    transaction.status = 'Returned';
    await transaction.save();

    // Update Trust Score logic
    const ratedUserId = isLender ? transaction.borrower_id : transaction.lender_id;
    const ratedUser = await User.findById(ratedUserId);

    if (ratedUser) {
      // Very basic trust score adjustment
      // Rating 1-5 maps to score adjustments
      const adjustment = (rating - 3) * 5; // e.g rating 5 => +10 trust. rating 1 => -10 trust.
      ratedUser.trustScore = Math.max(0, ratedUser.trustScore + adjustment);
      
      // Update running average rating
      ratedUser.rating = ((ratedUser.rating * ratedUser.history.length) + rating) / (ratedUser.history.length + 1);
      ratedUser.history.push(transaction._id as any);
      
      await ratedUser.save();
    }

    res.json({ message: 'Transaction completed and rated successfully', transaction });

  } catch (error) {
    res.status(500).json({ message: 'Error completing transaction', error });
  }
};
