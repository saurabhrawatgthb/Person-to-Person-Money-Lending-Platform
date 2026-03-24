import express from 'express';
import { createRequest, getMatchesForRequest, acceptMatch } from '../controllers/requestController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').post(protect, createRequest);
router.route('/:id/match').get(protect, getMatchesForRequest);
router.route('/accept').post(protect, acceptMatch);

export default router;
