import api from './api';
import { Registration } from './registrationService';

export interface CheckInResponse {
  message: string;
  registration: {
    _id: string;
    user: { _id: string; fullName: string; email: string; phone: string; dateOfBirth: string; gender: string; bloodType: string };
    event: { _id: string; title: string; location: string; startDate: string; endDate: string; status: string };
    registrationStatus: string;
    checkIn: { status: string; checkInTime: string };
    bloodType: string;
    screeningResult: string;
  };
}

const checkinService = {
  checkIn: async (qrCode: string) => {
    const res = await api.post<{ success: boolean; data: CheckInResponse }>('/checkin', { qrCode });
    return res.data;
  },

  getEventCheckIns: async (eventId: string) => {
    const res = await api.get<{ success: boolean; data: Registration[] }>(`/checkin/event/${eventId}`);
    return res.data;
  },
};

export default checkinService;
