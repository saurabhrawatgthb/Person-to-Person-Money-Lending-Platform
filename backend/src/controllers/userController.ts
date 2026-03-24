import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id).populate('history');

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      trustScore: user.trustScore,
      rating: user.rating,
      location: user.location,
      history: user.history
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
  const { coordinates } = req.body;

  const user = await User.findById(req.user?._id);

  if (user) {
    user.location.coordinates = coordinates;
    const updatedUser = await user.save();
    res.json({ message: 'Location updated', location: updatedUser.location });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
