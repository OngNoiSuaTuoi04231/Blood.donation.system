import mongoose, { Document, Schema } from 'mongoose';

/**
 * Collection `registrations` — document trung tâm của toàn bộ quy trình hiến máu.
 * Mỗi document liên kết đúng một donor (userId) với một đợt hiến (eventId).
 * Không có MedicalProfile/MedicalRecord riêng: sàng lọc chỉ phục vụ lần đăng ký này.
 */
export interface IRegistration extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;

  // Registration info
  bloodType: string;
  weight: number;
  height: number;

  // Sàng lọc ban đầu do donor trả lời khi đăng ký.
  hasFever: boolean;
  hasChronicDisease: boolean;
  takingMedication: boolean;
  recentSurgery: boolean;
  screeningResult: 'passed' | 'failed' | 'pending';

  // pending: cần xem xét; approved: đủ điều kiện ban đầu; rejected/cancelled: không tham gia; completed: hoàn thành hiến.
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

  // QR chỉ là identifier ngẫu nhiên, không chứa PII, mật khẩu hoặc dữ liệu y tế.
  qrCode: string;

  // Check-in do admin/medical_staff thực hiện. checkedInBy ghi rõ người thao tác để truy vết.
  checkIn: {
    status: 'not_checked_in' | 'checked_in';
    checkInTime: Date | null;
    checkedInBy: mongoose.Types.ObjectId | null;
  };

  // Sàng lọc y tế do medical_staff thực hiện sau check-in; kết quả không phải bệnh án điện tử.
  medicalResult: string;
  medicalStatus: 'pending' | 'eligible' | 'ineligible';
  medicalNote: string;
  checkedBy: mongoose.Types.ObjectId | null;
  checkedAt: Date | null;

  registeredAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'BloodDonationEvent',
      required: [true, 'Event ID is required'],
    },

    // Registration info
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: [true, 'Blood type is required'],
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [40, 'Weight must be at least 40kg'],
    },
    height: {
      type: Number,
      required: [true, 'Height is required'],
      min: [100, 'Height must be at least 100cm'],
    },

    // Initial screening
    hasFever: { type: Boolean, default: false },
    hasChronicDisease: { type: Boolean, default: false },
    takingMedication: { type: Boolean, default: false },
    recentSurgery: { type: Boolean, default: false },
    screeningResult: {
      type: String,
      enum: ['passed', 'failed', 'pending'],
      default: 'pending',
    },

    // Registration status
    registrationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },

    // QR Code identifier
    qrCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Check-in
    checkIn: {
      status: {
        type: String,
        enum: ['not_checked_in', 'checked_in'],
        default: 'not_checked_in',
      },
      checkInTime: {
        type: Date,
        default: null,
      },
      checkedInBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },

    // Medical screening
    medicalResult: { type: String, default: '' },
    medicalStatus: {
      type: String,
      enum: ['pending', 'eligible', 'ineligible'],
      default: 'pending',
    },
    medicalNote: { type: String, default: '' },
    checkedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    checkedAt: { type: Date, default: null },

    registeredAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Ràng buộc database chống cùng donor tạo nhiều registration cho cùng một event, kể cả khi có request đồng thời.
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const Registration = mongoose.model<IRegistration>('Registration', registrationSchema);
export default Registration;
