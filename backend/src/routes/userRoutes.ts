import express from 'express';
import { getUserProfile, updateLocation } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/profile').get(protect, getUserProfile);
router.route('/location').put(protect, updateLocation);

export default router;
