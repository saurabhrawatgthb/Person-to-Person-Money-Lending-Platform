import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Request from '../models/Request';
import Transaction from '../models/Transaction';
import Notification from '../models/Notification';
import { io } from '../server';

export const getActiveTransactions = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const transactions = await Transaction.find({
      $or: [
        { lender_id: userId },
        { borrower_id: userId }
      ],
      status: { $in: ['Pending', 'Active', 'Returned'] }
    })
    .populate('lender_id', 'id name email trustScore rating')
    .populate('borrower_id', 'id name email trustScore rating')
    .populate('request_id');

    // Convert Mongoose documents to plain objects for any downstream manipulation
    const mappedTransactions = transactions.map((t: any) => t.toObject());

    res.json(mappedTransactions);
  } catch (error) {
    console.error('Error fetching active transactions:', error);
    res.status(500).json({ message: 'Error retrieving active transactions', error });
  }
};

export const returnMoney = async (req: AuthRequest, res: Response) => {
  const { transactionId } = req.body;
  const borrowerId = req.user?.id;

  if (!borrowerId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const txBorrowerId = transaction.borrower_id.toString();
    const txLenderId = transaction.lender_id.toString();

    if (txBorrowerId !== borrowerId) {
      return res.status(403).json({ message: 'Only the borrower can return this loan' });
    }

    if (transaction.status === 'Returned') {
      return res.status(400).json({ message: 'Loan has already been repaid' });
    }

    const now = new Date();
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { status: 'Returned', returnedDate: now },
      { new: true }
    )
    .populate('lender_id', 'id name email trustScore rating')
    .populate('borrower_id', 'id name email trustScore rating');

    if (!updatedTransaction) {
      return res.status(500).json({ message: 'Error updating transaction status' });
    }

    // Mark associated request as Completed
    if (transaction.request_id) {
      await Request.findByIdAndUpdate(transaction.request_id, { status: 'Completed' });
    }

    // Trust Score Calculation based on timely return
    const borrower = await User.findById(borrowerId);
    let trustAdjustment = 0;
    let timingStatus = 'on time';
    let newTrustScore = 100;

    if (borrower) {
      const isTimely = now.getTime() <= new Date(transaction.dueDate).getTime();
      if (isTimely) {
        trustAdjustment = 10;
        timingStatus = 'on time';
        newTrustScore = Math.min(100, (borrower.trustScore || 100) + trustAdjustment);
      } else {
        trustAdjustment = -20;
        timingStatus = 'late';
        newTrustScore = Math.max(0, (borrower.trustScore || 100) + trustAdjustment);
      }
      
      await User.findByIdAndUpdate(borrowerId, { trustScore: newTrustScore });
    }

    // Create notifications for lender and borrower
    const messageLender = `Peer repaid loan of ₹${transaction.repaymentAmount.toFixed(2)} ${timingStatus}!`;
    const messageBorrower = `You repaid loan of ₹${transaction.repaymentAmount.toFixed(2)} ${timingStatus}! Trust score is now ${newTrustScore} (${trustAdjustment > 0 ? '+' : ''}${trustAdjustment}).`;

    const notificationLender = await Notification.create({
      user_id: txLenderId,
      type: 'System',
      message: messageLender,
      link: '/dashboard'
    });

    const notificationBorrower = await Notification.create({
      user_id: txBorrowerId,
      type: 'System',
      message: messageBorrower,
      link: '/dashboard'
    });

    io.to(txLenderId).emit('notification', notificationLender);
    io.to(txBorrowerId).emit('notification', notificationBorrower);

    res.json({
      message: 'Loan successfully repaid',
      transaction: updatedTransaction.toObject(),
      trustScore: newTrustScore,
      trustAdjustment
    });

  } catch (error) {
    console.error('Error returning money:', error);
    res.status(500).json({ message: 'Error returning money', error });
  }
};

export const completeTransactionAndRate = async (req: AuthRequest, res: Response) => {
  const { transactionId, rating } = req.body;
  const userId = req.user?.id;

  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const txLenderId = transaction.lender_id.toString();
    const txBorrowerId = transaction.borrower_id.toString();

    const isLender = txLenderId === userId;
    const isBorrower = txBorrowerId === userId;

    if (!isLender && !isBorrower) {
      return res.status(403).json({ message: 'Not authorized for this transaction' });
    }

    const updateFields: any = {};
    if (isLender) {
      updateFields.ratingByLender = rating;
    }
    if (isBorrower) {
      updateFields.ratingByBorrower = rating;
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      updateFields,
      { new: true }
    );

    // If both ratings are submitted, mark transaction as Completed so it hides from active feed
    if (updatedTransaction && 
        updatedTransaction.ratingByLender !== undefined && 
        updatedTransaction.ratingByBorrower !== undefined) {
      await Transaction.findByIdAndUpdate(transactionId, { status: 'Completed' });
      updatedTransaction.status = 'Completed';
    }

    const ratedUserId = isLender ? txBorrowerId : txLenderId;
    const ratedUser = await User.findById(ratedUserId);

    if (ratedUser) {
      const adjustment = (rating - 3) * 5; 
      const historyCount = await Transaction.countDocuments({
        $or: [
          { lender_id: ratedUserId },
          { borrower_id: ratedUserId }
        ]
      });
      
      const currentRating = ratedUser.rating !== undefined ? ratedUser.rating : 5.0;
      const newRating = historyCount > 1 
        ? ((currentRating * (historyCount - 1)) + rating) / historyCount 
        : rating;

      await User.findByIdAndUpdate(ratedUserId, {
        trustScore: Math.max(0, Math.min(100, (ratedUser.trustScore || 100) + adjustment)),
        rating: newRating
      });
    }

    res.json({ message: 'Transaction rated successfully', transaction: updatedTransaction });

  } catch (error) {
    console.error('Error rating transaction:', error);
    res.status(500).json({ message: 'Error rating transaction', error });
  }
};
