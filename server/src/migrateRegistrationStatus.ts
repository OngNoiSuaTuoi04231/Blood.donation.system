import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Registration from './models/Registration';

dotenv.config();

/**
 * Migration một lần cho dữ liệu cũ: `confirmed` (phiên bản cũ) -> `approved` (trạng thái chuẩn).
 * Không xóa document. Chỉ chạy development khi MIGRATION_CONFIRM=YES.
 */
async function migrate(): Promise<void> {
  if (process.env.NODE_ENV === 'production' || process.env.MIGRATION_CONFIRM !== 'YES') {
    throw new Error('Migration bị chặn. Chỉ chạy development với MIGRATION_CONFIRM=YES.');
  }
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI chưa được cấu hình.');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const result = await Registration.updateMany({ registrationStatus: 'confirmed' }, { $set: { registrationStatus: 'approved' } });
    console.log(`Đã chuyển ${result.modifiedCount} đăng ký từ confirmed sang approved.`);
  } finally {
    await mongoose.disconnect();
  }
}

migrate().catch((error) => { console.error('Migration thất bại:', error.message); process.exit(1); });
