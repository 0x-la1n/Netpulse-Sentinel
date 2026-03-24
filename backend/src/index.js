require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { testConnection } = require('./db/connection');

// ── Routes ───
const targetsRouter = require('./routes/target');
const statusRouter = require('./routes/status');
const eventsRouter = require('./routes/events');

const app = express();
const server = http.createServer(app);

// ── Socket.io setup ──
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Hacer que la E/S sea accesible desde rutas/servicios
app.set('io', io);

// ── Middleware ───
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

// ── API Routes ──
app.use('/api/targets', targetsRouter);
app.use('/api/status', statusRouter);
app.use('/api/events', eventsRouter);

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
    await testConnection();
    server.listen(PORT, () => {
      console.log(`🚀 NetPulse Backend running on http://localhost:${PORT}`);
      console.log(`📡 Socket.io ready`);
    });

    // Iniciar el motor de sondeo
    // const { startPoller } = require('./services/poller');
    // startPoller(io);

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();