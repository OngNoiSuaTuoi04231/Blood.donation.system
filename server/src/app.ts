import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import registrationRoutes from './routes/registrationRoutes';
import checkinRoutes from './routes/checkinRoutes';
import medicalRoutes from './routes/medicalRoutes';
import reportRoutes from './routes/reportRoutes';
import adminRoutes from './routes/adminRoutes';

// Import middleware
import { errorMiddleware } from './middleware/errorMiddleware';

dotenv.config();

const app = express();

/**
 * Danh sách website được phép gọi API qua trình duyệt.
 * CLIENT_URL hỗ trợ nhiều domain, phân cách bằng dấu phẩy, ví dụ domain Vercel
 * chính và domain preview. Các công cụ không gửi Origin (curl/Postman) vẫn dùng
 * được để kiểm tra API; trình duyệt từ domain lạ sẽ bị chặn bởi CORS.
 */
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin không được phép truy cập API.'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'OK', timestamp: new Date().toISOString() } });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Error middleware (must be last)
app.use(errorMiddleware);

export default app;
