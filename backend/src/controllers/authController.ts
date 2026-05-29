import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d'
  });
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, locationCoordinates } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const coords = locationCoordinates || [0, 0];
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      trustScore: 100,
      rating: 5.0,
      location: {
        type: 'Point',
        coordinates: coords
      }
    });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      trustScore: user.trustScore,
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password || ''))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        trustScore: user.trustScore,
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};



