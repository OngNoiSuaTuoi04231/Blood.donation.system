import api from './api';

export interface BloodDonationEvent {
  _id: string;
  title: string;
  description: string;
  /** Ảnh minh họa do admin chọn, được lưu cùng document bloodDonationEvents. */
  imageUrl?: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  status: 'upcoming' | 'open' | 'closed' | 'completed';
  createdBy: { _id: string; fullName: string };
  registrationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  imageUrl?: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  status?: string;
}

const eventService = {
  getAll: async () => {
    const res = await api.get<{ success: boolean; data: BloodDonationEvent[] }>('/events');
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: BloodDonationEvent }>(`/events/${id}`);
    return res.data;
  },

  create: async (data: CreateEventData) => {
    const res = await api.post<{ success: boolean; data: BloodDonationEvent }>('/events', data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateEventData>) => {
    const res = await api.put<{ success: boolean; data: BloodDonationEvent }>(`/events/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/events/${id}`);
    return res.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await api.patch<{ success: boolean; data: BloodDonationEvent }>(`/events/${id}/status`, { status });
    return res.data;
  },
};

export default eventService;
