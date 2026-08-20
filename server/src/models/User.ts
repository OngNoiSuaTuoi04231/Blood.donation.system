import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Collection `users`.
 * Một document là một người dùng hệ thống, gồm donor, admin hoặc medical_staff.
 * Không lưu nghề nghiệp và không lưu tuổi cố định; tuổi luôn tính từ dateOfBirth.
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  identityCard?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
  role: 'donor' | 'admin' | 'medical_staff';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    // Mật khẩu chỉ tồn tại dạng bcrypt hash. `select: false` tránh lộ ra trong query/API thông thường.
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    identityCard: {
      type: String,
      trim: true,
      sparse: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
      required: [true, 'Blood type is required'],
    },
    // Role là nguồn phân quyền của middleware JWT. Public register luôn ghi donor ở controller.
    role: {
      type: String,
      enum: ['donor', 'admin', 'medical_staff'],
      default: 'donor',
    },
    // Soft-disable: false sẽ chặn đăng nhập nhưng giữ lịch sử hiến máu để báo cáo.
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Chỉ hash khi password thay đổi để tránh bcrypt(hash) khi cập nhật profile/tài khoản.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
