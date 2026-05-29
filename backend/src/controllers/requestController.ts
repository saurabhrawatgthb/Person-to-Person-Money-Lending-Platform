import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Request from '../models/Request';
import RequestMatch from '../models/RequestMatch';
import Transaction from '../models/Transaction';
import Notification from '../models/Notification';
import { Graph } from '../algorithms/Graph';
import { findBestLendersDijkstra } from '../algorithms/Dijkstra';
import { io } from '../server';

export const createRequest = async (req: AuthRequest, res: Response) => {
  const { type, requestType, amount, interestRate, description, urgencyLevel, durationHours } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID missing' });
  }

  try {
    const amt = Number(amount) || 0;
    const rate = Number(interestRate) || 0;
    const repayment = amt * (1 + rate / 100);

    const request = await Request.create({
      user_id: userId,
      type: type || 'Money',
      requestType: requestType || 'Borrow',
      amount: amt,
      interestRate: rate,
      repaymentAmount: repayment,
      description,
      urgencyLevel: urgencyLevel || 'Medium',
      durationHours: Number(durationHours) || 2,
      status: 'Open'
    });

    // Notify all active users in real-time
    const broadcastMessage = requestType === 'Lend'
      ? `${req.user.name} is lending up to ₹${amt} at ${rate}% interest!`
      : `${req.user.name} is requesting ₹${amt} at ${rate}% interest for ${description}!`;

    io.emit('notification', {
      type: 'RequestAlert',
      message: `📢 ${broadcastMessage}`,
      link: '/dashboard'
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Error creating request', error });
  }
};

export const getMyRequests = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const requests = await Request.find({ user_id: userId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ message: 'Error retrieving your requests', error });
  }
};

export const getIncomingRequests = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Return open requests from OTHER users
    const requests = await Request.find({
      user_id: { $ne: userId },
      status: 'Open'
    })
    .populate('user_id', 'id name trustScore rating')
    .sort({ createdAt: -1 });

    // Map user_id populated object to match the frontend expectations
    const mappedRequests = requests.map((r: any) => {
      const obj = r.toObject();
      return {
        ...obj,
        user_id: obj.user_id // Frontend expects user_id as an object containing trustScore etc.
      };
    });
    
    res.json(mappedRequests);
  } catch (error) {
    console.error('Error fetching incoming requests:', error);
    res.status(500).json({ message: 'Error retrieving open requests', error });
  }
};

export const getMatchesForRequest = async (req: AuthRequest, res: Response) => {
  const requestId = req.params.id;
  const borrowerId = req.user?.id;
  if (!borrowerId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const borrower = await User.findById(borrowerId);
    if (!borrower) return res.status(404).json({ message: 'User not found' });

    let nearbyUsers: any[] = [];
    if (borrower.location && borrower.location.coordinates && borrower.location.coordinates[0] !== 0) {
      nearbyUsers = await User.find({
        _id: { $ne: borrowerId },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: borrower.location.coordinates
            },
            $maxDistance: 10000000 // 10,000km in meters (global financial matching)
          }
        }
      });
    } else {
      nearbyUsers = await User.find({ _id: { $ne: borrowerId } });
    }

    const graph = new Graph();
    const vertices = [borrowerId, ...nearbyUsers.map(u => u.id)];
    vertices.forEach(v => graph.addVertex(v));

    nearbyUsers.forEach(user => {
      const mockDistanceEuclidean = Math.random() * 5; 
      const trustScore = user.trustScore || 1;
      const totalCost = mockDistanceEuclidean + (1000 / trustScore); 

      graph.addEdge(borrowerId, user.id, totalCost);
    });

    const bestLenders = findBestLendersDijkstra(graph, borrowerId, 5); 

    for (const l of bestLenders) {
      await RequestMatch.findOneAndUpdate(
        { request_id: requestId, user_id: l.lenderId },
        { score: l.cost, status: 'Pending' },
        { upsert: true, new: true }
      );
    }

    const updatedMatches = await RequestMatch.find({ request_id: requestId });

    res.json({ matches: updatedMatches });

  } catch (error) {
    console.error('Error finding matches:', error);
    res.status(500).json({ message: 'Error finding matches', error });
  }
};

export const acceptMatch = async (req: AuthRequest, res: Response) => {
  const requestId = req.body.requestId || req.body.id;
  const loggedInUserId = req.user?.id;

  if (!loggedInUserId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const request = await Request.findById(requestId).populate('user_id');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Open') {
      return res.status(400).json({ message: 'This request is no longer open' });
    }

    const creator = request.user_id as any;
    const creatorId = creator._id ? creator._id.toString() : creator.toString();

    // Define Borrower and Lender based on request role
    let lenderId;
    let borrowerId;

    if (request.type === 'Money') {
      if (request.requestType === 'Lend') {
        // Creator is Lender, logged-in user is Borrower
        lenderId = creatorId;
        borrowerId = loggedInUserId;
      } else {
        // Creator is Borrower, logged-in user is Lender
        lenderId = loggedInUserId;
        borrowerId = creatorId;
      }
    } else {
      // Default for Item types
      lenderId = loggedInUserId;
      borrowerId = creatorId;
    }

    // Set request status to Active
    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      { status: 'Active' },
      { new: true }
    );

    // Create the active transaction
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + (request.durationHours || 2));

    const transaction = await Transaction.create({
      lender_id: lenderId,
      borrower_id: borrowerId,
      request_id: request.id,
      amount: request.amount || 0,
      interestRate: request.interestRate || 0,
      repaymentAmount: request.repaymentAmount || 0,
      dueDate,
      status: 'Active'
    });

    // Notify the other user (request creator)
    const otherUserId = creatorId === loggedInUserId ? borrowerId : creatorId;
    const notificationMessage = `Your ${request.requestType === 'Lend' ? 'Lending Pool' : 'Borrow Request'} "${request.description}" was accepted by ${req.user.name}!`;

    const notification = await Notification.create({
      user_id: otherUserId,
      type: 'Accepted',
      message: notificationMessage,
      link: '/dashboard'
    });

    // Emit live WebSocket notification to the user's room
    io.to(otherUserId).emit('notification', notification);

    res.json({
      message: 'Match successfully accepted and transaction created',
      request: updatedRequest,
      transaction
    });
  } catch (error) {
    console.error('Error accepting match:', error);
    res.status(500).json({ message: 'Error accepting match', error });
  }
};

export const deleteRequest = async (req: AuthRequest, res: Response) => {
  const requestId = req.params.id;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.user_id.toString() !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this request' });
    }

    if (request.status !== 'Open') {
      return res.status(400).json({ message: 'Only open requests can be deleted' });
    }

    await Request.findByIdAndDelete(requestId);

    res.json({ message: 'Request successfully deleted' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ message: 'Error deleting request', error });
  }
};
