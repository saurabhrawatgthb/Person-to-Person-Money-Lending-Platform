import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/prisma';

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ message: 'Not authorized' });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      transactionsAsLend: true,
      transactionsAsBorr: true
    }
  });

  if (user) {
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      trustScore: user.trustScore,
      rating: user.rating,
      history: [...user.transactionsAsLend, ...user.transactionsAsBorr]
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
  const { coordinates } = req.body;
  if (!req.user?.id) return res.status(401).json({ message: 'Not authorized' });

  try {
    await prisma.$executeRaw`
      UPDATE "User"
      SET location = ST_SetSRID(ST_MakePoint(${coordinates[0]}, ${coordinates[1]}), 4326)
      WHERE id = ${req.user.id}
    `;
    res.json({ message: 'Location updated', coordinates });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
