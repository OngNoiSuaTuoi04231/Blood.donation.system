import api from './api';
import { Registration } from './registrationService';

export interface ScreeningData {
  medicalResult: string;
  medicalStatus: 'eligible' | 'ineligible';
  medicalNote: string;
}

const medicalService = {
  getRegistrations: async (params?: Record<string, string>) => {
    const res = await api.get<{ success: boolean; data: Registration[] }>('/medical/registrations', { params });
    return res.data;
  },

  getRegistration: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Registration }>(`/medical/registrations/${id}`);
    return res.data;
  },

  performScreening: async (registrationId: string, data: ScreeningData) => {
    const res = await api.post<{ success: boolean; data: Registration }>(`/medical/screening/${registrationId}`, data);
    return res.data;
  },

  updateScreening: async (registrationId: string, data: ScreeningData) => {
    const res = await api.put<{ success: boolean; data: Registration }>(`/medical/screening/${registrationId}`, data);
    return res.data;
  },

  // Chỉ gọi sau khi người hiến đã hiến máu thực tế và đủ điều kiện y tế.
  completeDonation: async (registrationId: string) => {
    const res = await api.post<{ success: boolean; data: Registration }>(`/medical/complete-donation/${registrationId}`);
    return res.data;
  },
};

export default medicalService;
