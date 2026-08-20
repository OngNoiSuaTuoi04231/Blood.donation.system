import api from './api';

export interface DashboardStats {
  summary: {
    totalDonors: number;
    totalMedicalStaff: number;
    totalEvents: number;
    openEvents: number;
    totalRegistrations: number;
    checkedIn: number;
    eligible: number;
    ineligible: number;
  };
  charts: {
    registrationsByEvent: { name: string; value: number }[];
    ageDistribution: { name: string; value: number }[];
    bloodTypeDistribution: { name: string; value: number }[];
    checkInRate: { name: string; value: number }[];
    medicalDistribution: { name: string; value: number }[];
  };
}

export interface ReportSummary {
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  eligible: number;
  ineligible: number;
  pending: number;
  approved: number;
  cancelled: number;
  completed: number;
}

const reportService = {
  getStatistics: async () => {
    const res = await api.get<{ success: boolean; data: DashboardStats }>('/reports/statistics');
    return res.data;
  },

  getEventReport: async (eventId: string, params?: Record<string, string>) => {
    const res = await api.get<{ success: boolean; data: { registrations: any[]; summary: ReportSummary; ageDistribution: any[]; bloodTypeDistribution: any[] } }>(
      `/reports/event/${eventId}`,
      { params }
    );
    return res.data;
  },

  getGeneralReport: async (params?: Record<string, string>) => {
    const res = await api.get<{ success: boolean; data: { registrations: any[]; summary: ReportSummary } }>(
      '/reports/general',
      { params }
    );
    return res.data;
  },

  exportEventReport: async (eventId: string, format: string, params?: Record<string, string>) => {
    const res = await api.get(`/reports/event/${eventId}/export`, {
      params: { ...params, format },
      responseType: 'blob',
    });
    return res.data;
  },

  exportGeneralReport: async (format: string, params?: Record<string, string>) => {
    const res = await api.get('/reports/general/export', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return res.data;
  },
};

export default reportService;
