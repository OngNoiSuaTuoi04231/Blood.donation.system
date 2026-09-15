import api from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
}

export interface ResetPasswordData {
  email: string;
  fullName: string;
  dateOfBirth: string;
  newPassword: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  role: 'donor' | 'admin' | 'medical_staff';
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

const authService = {
  login: async (data: LoginData) => {
    const res = await api.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterData) => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  // Bản demo xác minh bằng email + họ tên + ngày sinh, không gửi email vì dùng email giả.
  resetPassword: async (data: ResetPasswordData) => {
    const res = await api.post<{ success: boolean; data: { message: string } }>('/auth/reset-password', data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<{ success: boolean; data: User }>('/auth/me');
    return res.data;
  },

  updateMe: async (data: Pick<RegisterData, 'fullName' | 'phone' | 'dateOfBirth' | 'gender' | 'bloodType'>) => {
    const res = await api.put<{ success: boolean; data: User }>('/auth/me', data);
    return res.data;
  },
};

export default authService;
