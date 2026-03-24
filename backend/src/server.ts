import 'dotenv/config';
import http from 'http';
import app from './app';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
export const io = new Server(server, {
  cors: {
    origin: '*', // For development
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  // Users will emit a join event to attach their user ID to the socket
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room.`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
