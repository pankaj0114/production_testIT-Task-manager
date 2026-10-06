import express from 'express';
import http from 'http';
import cors from 'cors';
import dns from 'node:dns';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

import connectDB from './config/db.js';

import notificationRoutes from './routes/notificationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import adminAttendanceRoutes from './routes/adminAttendanceRoutes.js';

dotenv.config();

dns.setServers(['1.1.1.1', '8.8.8.8']);

const app = express();
const server = http.createServer(app);

// ========================================
// ENVIRONMENT
// ========================================

const PORT = process.env.PORT || 5005;

// ========================================
// CORS
// ========================================

const allowedOrigins = [
  'http://localhost:5174',
  'https://production-testit-task-manager-6.onrender.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('❌ CORS blocked origin:', origin);

    return callback(new Error(`CORS blocked: ${origin}`));
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// ========================================
// BODY PARSER
// ========================================

app.use(express.json());

// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Make Socket.IO available in routes
app.set('io', io);

// ========================================
// SOCKET CONNECTION
// ========================================

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    if (!userId) {
      return;
    }

    socket.join(userId);

    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ========================================
// API ROUTES
// ========================================

app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/tasks', taskRoutes);

app.use('/api/clients', clientRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/attendance', attendanceRoutes);

app.use('/api/admin/attendance', adminAttendanceRoutes);

// ========================================
// HEALTH CHECK
// ========================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Internal Task Management API running 🚀',
  });
});

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
});

// ========================================
// ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);

  // CORS error
  if (err.message?.startsWith('CORS blocked:')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
  });
});

// ========================================
// DATABASE + SERVER START
// ========================================

const startServer = async () => {
  try {
    await connectDB();

    console.log('✅ MongoDB connected successfully');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);

    process.exit(1);
  }
};

startServer();
