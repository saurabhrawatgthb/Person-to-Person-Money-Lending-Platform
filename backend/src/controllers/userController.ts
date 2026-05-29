import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Transaction from '../models/Transaction';

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ message: 'Not authorized' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transactions = await Transaction.find({
      $or: [
        { lender_id: user.id },
        { borrower_id: user.id }
      ]
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      trustScore: user.trustScore,
      rating: user.rating,
      history: transactions
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
  const { coordinates } = req.body;
  if (!req.user?.id) return res.status(401).json({ message: 'Not authorized' });

  try {
    await User.findByIdAndUpdate(req.user.id, {
      location: {
        type: 'Point',
        coordinates: coordinates
      }
    });
    res.json({ message: 'Location updated', coordinates });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


