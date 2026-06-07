import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './db/schema';
import { authRouter } from './routes/auth';
import { contactsRouter } from './routes/contacts';
import { messagesRouter } from './routes/messages';
import { mediaRouter } from './routes/media';
import { setupSocketHandlers } from './socket/handlers';

const PORT = process.env.PORT || 3001;

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'app://.'];

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: corsOrigins, methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling'],
});

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth',     authRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/media',    mediaRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', time: Date.now() }));

async function start() {
  await initializeDatabase();
  setupSocketHandlers(io);
  server.listen(PORT, () => {
    console.log(`[Server] LetsChat läuft auf http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('[Server] Startup error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

export { app, server, io };
