import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Kết nối duy nhất tới MongoDB Atlas/local cho toàn bộ backend.
 *
 * Môi trường cần có: `MONGODB_URI` trong `server/.env`.
 * Hàm chỉ in tên database sau khi kết nối, tuyệt đối không in URI hay mật khẩu.
 * Server gọi hàm này trước `app.listen`, vì API không được chạy khi database lỗi.
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    // Mongoose quản lý connection pool; các model User/Event/Registration dùng chung pool này.
    const conn = await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
