import 'dotenv/config';
import http from 'http';
import app from './app';
import { Server } from 'socket.io';
import path from 'path';
import express from 'express';
import fs from 'fs';
import { connectDB } from './config/db';

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
  const queryUserId = socket.handshake.query.userId;
  if (queryUserId) {
    socket.join(queryUserId as string);
    console.log(`Socket ${socket.id} auto-joined room for User ${queryUserId} via handshake query.`);
  }

  // Fallback / explicit join event
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} explicitly joined room via 'join' event.`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

async function startServer() {
  await connectDB();
  console.log('Starting unified server...');
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      root: path.join(__dirname, '../../frontend')
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // Serve index.html for all other routes (SPA)
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(
          path.resolve(__dirname, '../../frontend/index.html'),
          'utf-8'
        );
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production: Serve static files from the frontend's dist folder
    const frontendDistPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDistPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

