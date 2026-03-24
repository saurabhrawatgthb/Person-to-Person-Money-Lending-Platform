# Smart Peer-to-Peer Lending & Resource Sharing Platform

This repository contains the architecture and implementation for an intelligent matching-driven peer-to-peer lending and resource-sharing platform designed for university ecosystems.

## Core Features
1. **Algorithmic Matchmaking (Dijkstra + Priority Queues)**: Automatically ranks and pairs borrowers with lenders using an advanced cost function considering proximity, trust score, and historical response time.
2. **Fraud Detection (DFS History Graph)**: Identifies fraudulent circular lending chains designed to artificially artificially boost user ratings.
3. **Geo-location Integration (MongoDB 2dsphere)**: Dynamically constructs active sub-graphs based on radial searches of user coordinates.
4. **WebSocket Real-time System**: Notifies clients instantly upon successful algorithmic matches via Socket.io.
5. **Modern Minimalist UI**: Built via React, Vite, and highly customized Tailwind CSS components.

## Tech Stack
* **Backend:** Node.js, Express, TypeScript, Mongoose
* **Database:** MongoDB
* **Frontend:** React.js, Vite, Zustand, Tailwind CSS

## Architecture & Logic Highlights
The underlying logic replaces basic CRUD listing with a dynamic Graph environment.

```typescript
// Dijkstra's Algorithm Cost Analysis
Cost = (w1 * Distance) + (w2 * (1 / TrustScore)) + (w3 * ResponseTime)
```
The algorithm operates purely on an isolated layer of TypeScript Data Structures (specifically `MinHeap.ts`, `Graph.ts`, `BFS.ts`, and `Dijkstra.ts`) for $O(E \log V)$ efficiency.

## How to Run

1. Clone the repository and ensure **Node.js** is installed.
2. Ensure you have **MongoDB** running locally on default port `27017` or add your `MONGO_URI` to a generated `.env` file in `/backend`.

### Start Backend
```bash
cd backend
npm install
npm run dev
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
