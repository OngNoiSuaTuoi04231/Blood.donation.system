import api from './api';
import { User } from './authService';

export interface CreateMedicalStaffData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
}

const adminService = {
  getDonors: async (params?: Record<string, string>) => {
    const res = await api.get<{ success: boolean; data: User[] }>('/admin/donors', { params });
    return res.data;
  },

  updateDonorStatus: async (id: string, isActive: boolean) => {
    const res = await api.put<{ success: boolean; data: User }>(`/admin/donors/${id}/status`, { isActive });
    return res.data;
  },

  getMedicalStaff: async () => {
    const res = await api.get<{ success: boolean; data: User[] }>('/admin/medical-staff');
    return res.data;
  },

  createMedicalStaff: async (data: CreateMedicalStaffData) => {
    const res = await api.post<{ success: boolean; data: User }>('/admin/medical-staff', data);
    return res.data;
  },

  updateMedicalStaff: async (id: string, data: Partial<CreateMedicalStaffData>) => {
    const res = await api.put<{ success: boolean; data: User }>(`/admin/medical-staff/${id}`, data);
    return res.data;
  },

  deleteMedicalStaff: async (id: string) => {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/admin/medical-staff/${id}`);
    return res.data;
  },
};

export default adminService;
