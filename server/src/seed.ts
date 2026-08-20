import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import BloodDonationEvent from './models/BloodDonationEvent';
import Registration from './models/Registration';
import { generateQRIdentifier } from './services/qrService';

dotenv.config();

/** Chuỗi giữ nguyên UTF-8; dữ liệu demo hiển thị đúng tiếng Việt trong MongoDB/CSV/Excel. */
const vi = (text: string) => text;

/**
 * Tạo lại dữ liệu demo cho môi trường development.
 * Đây là thao tác hủy dữ liệu có chủ đích: xóa 3 collection nghiệp vụ trước khi insert seed mới.
 * Điều kiện bảo vệ: không được là production và phải có biến `SEED_CONFIRM=YES`.
 */
async function seedDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production' || process.env.SEED_CONFIRM !== 'YES') {
    throw new Error('Seed bị chặn. Chỉ chạy development với SEED_CONFIRM=YES.');
  }
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) throw new Error('MONGODB_URI chưa được cấu hình.');

  await mongoose.connect(mongoURI);
  try {
    await Promise.all([Registration.deleteMany({}), BloodDonationEvent.deleteMany({}), User.deleteMany({})]);

    const admin = await User.create({ fullName: vi('Quản trị viên Quỹ Hiến Máu DKT - Dũng Kiệt Tâm'), email: 'admin@example.com', password: 'Admin@123456', phone: '0901234567', dateOfBirth: new Date('1990-01-15'), gender: 'male', bloodType: 'O+', role: 'admin' });
    const medical = await User.create({ fullName: vi('Bác sĩ Nguyễn Văn Y'), email: 'medical@example.com', password: 'Medical@123456', phone: '0912345678', dateOfBirth: new Date('1985-05-20'), gender: 'male', bloodType: 'A+', role: 'medical_staff' });
    const medical2 = await User.create({ fullName: vi('Điều dưỡng Trần Thu Hà'), email: 'medical2@blooddonation.com', password: 'Medical@123456', phone: '0912345679', dateOfBirth: new Date('1988-08-12'), gender: 'female', bloodType: 'B+', role: 'medical_staff' });
    const donorSeed = [
      ['Nguyễn Văn An', 'donor@example.com', '0923456789', '2000-03-10', 'male', 'A+'],
      ['Trần Thị Bình', 'donor2@example.com', '0934567890', '1998-07-22', 'female', 'B+'],
      ['Lê Minh Cường', 'donor3@example.com', '0945678901', '1995-11-05', 'male', 'O+'],
      ['Phạm Thị Diệu', 'donor4@example.com', '0956789012', '2002-01-18', 'female', 'AB+'],
      ['Hoàng Văn Em', 'donor5@example.com', '0967890123', '1992-09-30', 'male', 'A-'],
      ['Vũ Thị Phương', 'donor6@example.com', '0978901234', '1988-04-12', 'female', 'B-'],
      ['Đặng Quốc Gia', 'donor7@example.com', '0989012345', '1975-06-25', 'male', 'O-'],
      ['Bùi Thị Hoa', 'donor8@example.com', '0990123456', '1999-12-08', 'female', 'AB-'],
    ] as const;
    const donors = await Promise.all(donorSeed.map(([fullName, email, phone, birth, gender, bloodType]) => User.create({ fullName: vi(fullName), email, password: 'Donor@123456', phone, dateOfBirth: new Date(birth), gender, bloodType, role: 'donor' })));

    const now = new Date();
    const events = await BloodDonationEvent.create([
      { title: vi('Đợt Hiến Máu Mùa Xuân DKT 2026'), description: vi('Đợt hiến máu nhân đạo do Quỹ Hiến Máu DKT - Dũng Kiệt Tâm tổ chức, trực thuộc Bệnh viện OngNoiSuaTuoi.'), imageUrl: '/event-images/event-dkt.png', location: vi('Bệnh viện OngNoiSuaTuoi'), startDate: new Date(now.getTime() - 2 * 86400000), endDate: new Date(now.getTime() + 2 * 86400000), maxParticipants: 100, status: 'open', createdBy: admin._id },
      { title: vi('Ngày Hội Hiến Máu Tình Nguyện'), description: vi('Ngày hội hưởng ứng Ngày Quốc tế Hiến máu.'), imageUrl: '/event-images/event-hospital.png', location: vi('Bệnh viện Trung ương Huế, 16 Lê Lợi, TP. Huế'), startDate: new Date(now.getTime() + 14 * 86400000), endDate: new Date(now.getTime() + 15 * 86400000), maxParticipants: 150, status: 'upcoming', createdBy: admin._id },
      { title: vi('Đợt Hiến Máu Cộng Đồng Q3/2026'), description: vi('Đợt hiến máu cộng đồng đã hoàn thành.'), imageUrl: '/event-images/event-campus.png', location: vi('Trung tâm Huyết học Truyền máu TP.HCM'), startDate: new Date(now.getTime() - 30 * 86400000), endDate: new Date(now.getTime() - 29 * 86400000), maxParticipants: 80, status: 'completed', createdBy: admin._id },
      { title: vi('Hiến Máu Cộng Đồng Hồ Tây'), description: vi('Sự kiện đã đóng, giữ lại cho mục đích báo cáo.'), imageUrl: '/event-images/event-community.png', location: vi('Trung tâm Văn hóa Tây Hồ, Hà Nội'), startDate: new Date(now.getTime() + 30 * 86400000), endDate: new Date(now.getTime() + 31 * 86400000), maxParticipants: 60, status: 'closed', createdBy: admin._id },
    ]);

    /** Tạo registration demo có đủ trạng thái để kiểm thử QR, check-in, y tế, dashboard và report. */
    const createRegistration = async (donorIndex: number, eventIndex: number, registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed', checkInStatus: 'checked_in' | 'not_checked_in', medicalStatus: 'pending' | 'eligible' | 'ineligible', fever = false) => Registration.create({
      userId: donors[donorIndex]._id, eventId: events[eventIndex]._id, bloodType: donors[donorIndex].bloodType,
      weight: 55 + donorIndex * 2, height: 158 + donorIndex, hasFever: fever, hasChronicDisease: false, takingMedication: false, recentSurgery: false,
      screeningResult: fever ? 'failed' : 'passed', registrationStatus, qrCode: generateQRIdentifier(),
      checkIn: { status: checkInStatus, checkInTime: checkInStatus === 'checked_in' ? now : null, checkedInBy: checkInStatus === 'checked_in' ? medical._id : null },
      medicalStatus, medicalResult: medicalStatus === 'eligible' ? vi('Đủ điều kiện hiến máu') : medicalStatus === 'ineligible' ? vi('Huyết áp thấp') : '',
      medicalNote: medicalStatus === 'ineligible' ? vi('Cần theo dõi và hẹn khám lại.') : '', checkedBy: medicalStatus === 'pending' ? null : medical._id, checkedAt: medicalStatus === 'pending' ? null : now,
    });
    await Promise.all([
      createRegistration(0, 0, 'completed', 'checked_in', 'eligible'), createRegistration(1, 0, 'rejected', 'checked_in', 'ineligible'), createRegistration(2, 0, 'approved', 'checked_in', 'pending'), createRegistration(3, 0, 'approved', 'not_checked_in', 'pending'), createRegistration(4, 0, 'pending', 'not_checked_in', 'pending', true), createRegistration(5, 0, 'cancelled', 'not_checked_in', 'pending'),
      createRegistration(0, 2, 'completed', 'checked_in', 'eligible'), createRegistration(1, 2, 'completed', 'checked_in', 'eligible'), createRegistration(2, 2, 'completed', 'checked_in', 'eligible'),
      createRegistration(0, 3, 'completed', 'checked_in', 'eligible'), createRegistration(1, 3, 'rejected', 'checked_in', 'ineligible'), createRegistration(2, 3, 'approved', 'not_checked_in', 'pending'), createRegistration(3, 3, 'cancelled', 'not_checked_in', 'pending'), createRegistration(4, 3, 'completed', 'checked_in', 'eligible'), createRegistration(5, 3, 'rejected', 'checked_in', 'ineligible'),
    ]);
    console.log('Đã tạo dữ liệu demo: 1 admin, 2 nhân viên y tế, 8 người hiến, 4 đợt và 15 đăng ký.');
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase().catch((error) => { console.error('Seed thất bại:', error.message); process.exit(1); });
