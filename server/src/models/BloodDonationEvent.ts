import mongoose, { Document, Schema } from 'mongoose';

/**
 * Collection `bloodDonationEvents`.
 * Admin tạo đợt hiến; `createdBy` tham chiếu users._id của admin chịu trách nhiệm.
 * status: upcoming (sắp diễn ra), open (nhận đăng ký/điểm danh), closed (đóng), completed (kết thúc).
 */
export interface IBloodDonationEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  /** Đường dẫn ảnh minh họa do admin chọn cho riêng đợt hiến; không chứa dữ liệu người hiến. */
  imageUrl?: string;
  location: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  status: 'upcoming' | 'open' | 'closed' | 'completed';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bloodDonationEventSchema = new Schema<IBloodDonationEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    // Ảnh chỉ phục vụ giao diện card/chi tiết sự kiện. Giá trị mặc định là asset nội bộ của client.
    imageUrl: {
      type: String,
      trim: true,
      maxlength: [1000, 'Image URL cannot exceed 1000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
      maxlength: [300, 'Location cannot exceed 300 characters'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    // Giới hạn số registration active. cancelled/rejected không chiếm chỉ tiêu.
    maxParticipants: {
      type: Number,
      required: [true, 'Maximum participants is required'],
      min: [1, 'Maximum participants must be at least 1'],
    },
    status: {
      type: String,
      enum: ['upcoming', 'open', 'closed', 'completed'],
      default: 'upcoming',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Phục vụ màn hình lọc đợt đang mở và sắp diễn ra theo ngày.
bloodDonationEventSchema.index({ status: 1 });
bloodDonationEventSchema.index({ startDate: 1 });

bloodDonationEventSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

const BloodDonationEvent = mongoose.model<IBloodDonationEvent>(
  'BloodDonationEvent',
  bloodDonationEventSchema
);
export default BloodDonationEvent;
