require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { testConnection, ensureSchema } = require('./db/connection');
const { authenticate } = require('./middleware/auth');

// ── Routes ───
const authRouter = require('./routes/auth');
const targetsRouter = require('./routes/target');
const statusRouter = require('./routes/status');
const eventsRouter = require('./routes/events');
const configRouter = require('./routes/config');

const app = express();
const server = http.createServer(app);

// ── Socket.io setup ──
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Hacer que la E/S sea accesible desde rutas/servicios
app.set('io', io);

// ── Middleware ───
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());

// ── API Routes ──
app.use('/api/auth', authRouter);
app.use('/api/targets', authenticate, targetsRouter);
app.use('/api/status', authenticate, statusRouter);
app.use('/api/events', authenticate, eventsRouter);
app.use('/api/config', authenticate, configRouter);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ───
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Socket.io connection ──
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ── Iniciar servidor ──
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await ensureSchema();
    await testConnection();
    server.listen(PORT, () => {
      console.log(`🚀 NetPulse Backend running on http://localhost:${PORT}`);
      console.log(`📡 Socket.io ready`);
    });

    // Iniciar el motor de sondeo
    const { startPoller } = require('./services/poller');
    startPoller(io);

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();