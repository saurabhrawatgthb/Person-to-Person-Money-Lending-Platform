import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import RequestModel from '../models/Request';
import User from '../models/User';
import { Graph } from '../algorithms/Graph';
import { findBestLendersDijkstra } from '../algorithms/Dijkstra';
import { io } from '../server';
import Notification from '../models/Notification';

export const createRequest = async (req: AuthRequest, res: Response) => {
  const { type, description, urgencyLevel, durationHours } = req.body;
  const userId = req.user?._id;

  try {
    const request = await RequestModel.create({
      user_id: userId,
      type,
      description,
      urgencyLevel,
      durationHours: Number(durationHours),
      status: 'Open'
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error creating request', error });
  }
};

export const getMatchesForRequest = async (req: AuthRequest, res: Response) => {
  const requestId = req.params.id;
  const borrowerId = req.user?._id.toString();

  try {
    const request = await RequestModel.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const borrowerInfo = await User.findById(borrowerId);
    if (!borrowerInfo) return res.status(404).json({ message: 'User not found' });

    // 1. Fetch Nearby users using GeoSpatial query (up to 10km)
    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: borrowerInfo.location,
          $maxDistance: 10000 
        }
      },
      _id: { $ne: borrowerId }
    });

    // 2. Build Sub-Graph dynamically
    const graph = new Graph();
    const vertices = [borrowerId, ...nearbyUsers.map(u => u._id.toString())];
    vertices.forEach(v => graph.addVertex(v));

    // Calculate synthetic distances and create edges
    // Distance cost calculation
    nearbyUsers.forEach(user => {
      // Very basic Mock distance for graph weight (real one would use Haversine or similar, here we rely on geoNear's sorting practically)
      // but let's synthesize a cost: w1*dist + w2*(1/trust)
      const mockDistanceEuclidean = Math.random() * 5; // Placeholder
      const trustScore = user.trustScore || 1;
      const totalCost = mockDistanceEuclidean + (1000 / trustScore); // The higher the trust, the lower the cost

      graph.addEdge(borrowerId, user._id.toString(), totalCost);
    });

    // 3. Run Dijkstra's Algorithm
    const bestLenders = findBestLendersDijkstra(graph, borrowerId, 5); // get top 5

    // Save matched users to the request
    request.matched_users = bestLenders.map(l => ({
      user_id: l.lenderId as any,
      score: l.cost,
      status: 'Pending'
    }));

    await request.save();

    res.json({ matches: request.matched_users });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error finding matches', error });
  }
};

export const acceptMatch = async (req: AuthRequest, res: Response) => {
  const { requestId, lenderId } = req.body;

  try {
    const request = await RequestModel.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Not found' });

    // Update Request status to Matched
    request.status = 'Matched';
    const matchIndex = request.matched_users.findIndex(m => m.user_id.toString() === lenderId);
    if (matchIndex !== -1) {
      request.matched_users[matchIndex].status = 'Accepted';
    }
    await request.save();

    // Trigger Notification
    const notification = await Notification.create({
      user_id: lenderId,
      type: 'MatchFound',
      message: `Your help was accepted for request ${request.description.substring(0, 10)}...`
    });

    io.to(lenderId).emit('notification', notification);

    res.json({ message: 'Match accepted algorithmically', request });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting match', error });
  }
};
