import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/prisma';
import { Graph } from '../algorithms/Graph';
import { findBestLendersDijkstra } from '../algorithms/Dijkstra';
import { io } from '../server';

export const createRequest = async (req: AuthRequest, res: Response) => {
  const { type, description, urgencyLevel, durationHours } = req.body;
  const userId = req.user?.id;

  try {
    const request = await prisma.request.create({
      data: {
        user_id: userId,
        type,
        description,
        urgencyLevel,
        durationHours: Number(durationHours),
        status: 'Open'
      }
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error creating request', error });
  }
};

export const getMatchesForRequest = async (req: AuthRequest, res: Response) => {
  const requestId = req.params.id;
  const borrowerId = req.user?.id;
  if (!borrowerId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const borrowerData: any[] = await prisma.$queryRaw`
      SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat, "trustScore" 
      FROM "User" WHERE id = ${borrowerId}
    `;

    if (!borrowerData.length) return res.status(404).json({ message: 'User not found' });
    const borrowerLoc = borrowerData[0];

    let nearbyUsers: any[] = [];
    if (borrowerLoc && borrowerLoc.lng !== null) {
      nearbyUsers = await prisma.$queryRaw`
        SELECT id, "trustScore", ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat
        FROM "User"
        WHERE id != ${borrowerId}
        AND ST_DWithin(
          location::geography, 
          ST_SetSRID(ST_MakePoint(${borrowerLoc.lng}, ${borrowerLoc.lat}), 4326)::geography, 
          10000
        )
      `;
    } else {
      nearbyUsers = await prisma.$queryRaw`SELECT id, "trustScore" FROM "User" WHERE id != ${borrowerId}`;
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

    const matchPromises = bestLenders.map(l => {
      return prisma.requestMatch.upsert({
        where: { request_id_user_id: { request_id: requestId, user_id: l.lenderId as string } },
        update: { score: l.cost, status: 'Pending' },
        create: { request_id: requestId, user_id: l.lenderId as string, score: l.cost, status: 'Pending' }
      });
    });

    await Promise.all(matchPromises);

    const updatedRequest = await prisma.request.findUnique({ 
      where: { id: requestId },
      include: { matched_users: true }
    });

    res.json({ matches: updatedRequest?.matched_users });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error finding matches', error });
  }
};

export const acceptMatch = async (req: AuthRequest, res: Response) => {
  const { requestId, lenderId } = req.body;

  try {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ message: 'Not found' });

    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'Matched' }
    });

    await prisma.requestMatch.update({
      where: { request_id_user_id: { request_id: requestId, user_id: lenderId } },
      data: { status: 'Accepted' }
    });

    const notification = await prisma.notification.create({
      data: {
        user_id: lenderId,
        type: 'MatchFound',
        message: `Your help was accepted for request ${request.description.substring(0, 10)}...`
      }
    });

    io.to(lenderId).emit('notification', notification);

    const updatedReq = await prisma.request.findUnique({ where: { id: requestId } });
    res.json({ message: 'Match accepted algorithmically', request: updatedReq });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting match', error });
  }
};
