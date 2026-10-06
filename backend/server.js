import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import cors from 'cors';
import dns from 'node:dns';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { setServers } from 'node:dns/promises';
import notificationRoutes from './routes/notificationRoutes.js';

import connectDB from './config/db.js';

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

// ========================================
// CORS
// ========================================

const allowedOrigins = [
  'http://localhost:5174',
  'https://task-assignd-system.netlify.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('CORS blocked origin:', origin);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.options('*', cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');

    app.listen(5005, () => {
      console.log('🚀 Server running on http://localhost:5005');
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
  });

app.use(express.json());
//app.use('/api/notifications', notificationRoutes);

const server = http.createServer(app);

// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5174',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

  // join room for this user (use their userId)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
});

// ✅ Mount routes
// app.use('/api/departments', departmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);

// Database connection
connectDB();

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Internal Task Management API running 🚀' });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Server Start
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
