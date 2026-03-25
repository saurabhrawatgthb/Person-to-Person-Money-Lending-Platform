import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/prisma';

export const completeTransactionAndRate = async (req: AuthRequest, res: Response) => {
  const { transactionId, rating } = req.body;
  const userId = req.user?.id;

  try {
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const isLender = transaction.lender_id === userId;
    const isBorrower = transaction.borrower_id === userId;

    if (!isLender && !isBorrower) {
      return res.status(403).json({ message: 'Not authorized for this transaction' });
    }

    const updatedData: any = { status: 'Returned' };
    if (isLender) {
      updatedData.ratingByLender = rating;
    } else {
      updatedData.ratingByBorrower = rating;
    }

    const updatedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: updatedData
    });

    const ratedUserId = isLender ? transaction.borrower_id : transaction.lender_id;
    const ratedUser = await prisma.user.findUnique({ 
      where: { id: ratedUserId },
      include: { transactionsAsLend: true, transactionsAsBorr: true }
    });

    if (ratedUser) {
      const adjustment = (rating - 3) * 5; 
      const historyLength = ratedUser.transactionsAsLend.length + ratedUser.transactionsAsBorr.length;
      
      const newRating = ((ratedUser.rating * historyLength) + rating) / (historyLength + 1);

      await prisma.user.update({
        where: { id: ratedUserId },
        data: {
          trustScore: Math.max(0, ratedUser.trustScore + adjustment),
          rating: newRating
        }
      });
    }

    res.json({ message: 'Transaction completed and rated successfully', transaction: updatedTx });

  } catch (error) {
    res.status(500).json({ message: 'Error completing transaction', error });
  }
};
