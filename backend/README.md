# Backend: MongoDB Setup

This backend already uses `mongoose` and includes a `connectDB()` helper.

Quick steps to run MongoDB locally with Docker and start the backend:

1. Start MongoDB and mongo-express (admin UI):

```bash
docker-compose up -d
```

2. Copy `backend/.env.example` to `backend/.env` and edit values (if desired):

```bash
cd backend
copy .env.example .env
```

3. Start the backend in development mode (uses `tsx`):

```bash
npm install
npm run dev
```

Notes:
- The DB connection uses `MONGO_URI` (default `mongodb://localhost:27017/smart-p2p-lending`).
- Mongo-Express will be available at http://localhost:8081 for quick inspection.
