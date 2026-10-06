import { io } from 'socket.io-client';
const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5005'
).replace(/\/+$/, '');

const socket = io(`${API_BASE}`, {
  transports: ['websocket', 'polling'],
});

export default socket;
