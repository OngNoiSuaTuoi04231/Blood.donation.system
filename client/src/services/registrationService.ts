import api from './api';

export interface Registration {
  _id: string;
  userId: string | { _id: string; fullName: string; email: string; phone: string; dateOfBirth: string; gender: string; bloodType: string };
  eventId: string | { _id: string; title: string; location: string; startDate: string; endDate: string; status: string };
  bloodType: string;
  weight: number;
  height: number;
  hasFever: boolean;
  hasChronicDisease: boolean;
  takingMedication: boolean;
  recentSurgery: boolean;
  screeningResult: 'passed' | 'failed' | 'pending';
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  qrCode: string;
  checkIn: {
    status: 'not_checked_in' | 'checked_in';
    checkInTime: string | null;
  };
  medicalResult: string;
  medicalStatus: 'pending' | 'eligible' | 'ineligible';
  medicalNote: string;
  checkedBy: string | { _id: string; fullName: string } | null;
  checkedAt: string | null;
  registeredAt: string;
  updatedAt: string;
}

export interface CreateRegistrationData {
  eventId: string;
  bloodType: string;
  weight: number;
  height: number;
  hasFever: boolean;
  hasChronicDisease: boolean;
  takingMedication: boolean;
  recentSurgery: boolean;
}

const registrationService = {
  create: async (data: CreateRegistrationData) => {
    const res = await api.post<{ success: boolean; data: Registration }>('/registrations', data);
    return res.data;
  },

  getMyRegistrations: async () => {
    const res = await api.get<{ success: boolean; data: Registration[] }>('/registrations/my');
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Registration }>(`/registrations/${id}`);
    return res.data;
  },

  getAll: async (params?: Record<string, string>) => {
    const res = await api.get<{ success: boolean; data: Registration[] }>('/registrations', { params });
    return res.data;
  },

  update: async (id: string, data: { registrationStatus: string }) => {
    const res = await api.put<{ success: boolean; data: Registration }>(`/registrations/${id}`, data);
    return res.data;
  },

  cancel: async (id: string) => {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/registrations/${id}`);
    return res.data;
  },
};

export default registrationService;
