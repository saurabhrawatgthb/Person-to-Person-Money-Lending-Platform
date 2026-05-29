import express from 'express';
import { createRequest, getMatchesForRequest, acceptMatch, getMyRequests, getIncomingRequests, deleteRequest } from '../controllers/requestController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').post(protect, createRequest);
router.route('/my-requests').get(protect, getMyRequests);
router.route('/incoming').get(protect, getIncomingRequests);
router.route('/:id/match').get(protect, getMatchesForRequest);
router.route('/accept').post(protect, acceptMatch);
router.route('/:id').delete(protect, deleteRequest);

export default router;
