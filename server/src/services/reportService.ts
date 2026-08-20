import * as XLSX from 'xlsx';
import Registration from '../models/Registration';
import User from '../models/User';
import BloodDonationEvent from '../models/BloodDonationEvent';
import mongoose from 'mongoose';

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Get age group label
 */
export const getAgeGroup = (age: number): string => {
  if (age <= 25) return '18-25';
  if (age <= 35) return '26-35';
  if (age <= 45) return '36-45';
  if (age <= 55) return '46-55';
  return '56+';
};

/**
 * Build report data for an event
 */
export const buildReportData = async (filters: {
  eventId?: string;
  startDate?: string;
  endDate?: string;
  registrationStatus?: string;
  checkInStatus?: string;
  medicalStatus?: string;
  bloodType?: string;
  ageGroup?: string;
}) => {
  const query: any = {};

  if (filters.eventId) {
    query.eventId = new mongoose.Types.ObjectId(filters.eventId);
  }
  if (filters.registrationStatus) {
    query.registrationStatus = filters.registrationStatus;
  }
  if (filters.checkInStatus) {
    query['checkIn.status'] = filters.checkInStatus;
  }
  if (filters.medicalStatus) {
    query.medicalStatus = filters.medicalStatus;
  }
  if (filters.bloodType) {
    query.bloodType = filters.bloodType;
  }

  const registrations = await Registration.find(query)
    .populate('userId', 'fullName email phone dateOfBirth gender bloodType')
    .populate('eventId', 'title location startDate endDate')
    .populate('checkedBy', 'fullName')
    .sort({ registeredAt: -1 });

  // Filter by date range if provided
  let filtered = registrations;
  if (filters.startDate || filters.endDate) {
    filtered = registrations.filter((r) => {
      const regDate = new Date(r.registeredAt);
      if (filters.startDate && regDate < new Date(filters.startDate)) return false;
      if (filters.endDate && regDate > new Date(filters.endDate)) return false;
      return true;
    });
  }

  // Filter by age group if provided
  if (filters.ageGroup) {
    filtered = filtered.filter((r) => {
      const user = r.userId as any;
      if (!user?.dateOfBirth) return false;
      const age = calculateAge(new Date(user.dateOfBirth));
      return getAgeGroup(age) === filters.ageGroup;
    });
  }

  return filtered;
};

/**
 * Generate summary statistics from registrations
 */
export const buildSummary = (registrations: any[]) => {
  return {
    total: registrations.length,
    checkedIn: registrations.filter((r) => r.checkIn?.status === 'checked_in').length,
    notCheckedIn: registrations.filter((r) => r.checkIn?.status === 'not_checked_in').length,
    eligible: registrations.filter((r) => r.medicalStatus === 'eligible').length,
    ineligible: registrations.filter((r) => r.medicalStatus === 'ineligible').length,
    pending: registrations.filter((r) => r.registrationStatus === 'pending').length,
    approved: registrations.filter((r) => r.registrationStatus === 'approved').length,
    cancelled: registrations.filter((r) => r.registrationStatus === 'cancelled').length,
    completed: registrations.filter((r) => r.registrationStatus === 'completed').length,
  };
};

/**
 * Generate Excel buffer from report data
 */
export const generateExcel = (registrations: any[]): Buffer => {
  const data = registrations.map((r) => {
    const user = r.userId as any;
    const event = r.eventId as any;
    const checker = r.checkedBy as any;
    return {
      'H? t�n': user?.fullName || '',
      'Email': user?.email || '',
      '�i?n tho?i': user?.phone || '',
      'Gi?i t�nh': user?.gender || '',
      'Nh�m m�u': r.bloodType,
      'C�n n?ng (kg)': r.weight,
      'Chi?u cao (cm)': r.height,
      'S? ki?n': event?.title || '',
      '�?a di?m': event?.location || '',
      'Tr?ng th�i �K': r.registrationStatus,
      'S�ng l?c ban d?u': r.screeningResult,
      '�i?m danh': r.checkIn?.status || '',
      'Th?i gian di?m danh': r.checkIn?.checkInTime || '',
      'K?t qu? y t?': r.medicalStatus,
      'Ghi ch� y t?': r.medicalNote || '',
      'Ngu?i ki?m tra': checker?.fullName || '',
      'Th?i gian ki?m tra': r.checkedAt || '',
      'Ng�y dang k�': r.registeredAt,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
};

/**
 * Generate CSV string from report data
 */
export const generateCSV = (registrations: any[]): string => {
  const headers = [
    'H? t�n', 'Email', '�i?n tho?i', 'Gi?i t�nh', 'Nh�m m�u',
    'C�n n?ng (kg)', 'Chi?u cao (cm)', 'S? ki?n', '�?a di?m',
    'Tr?ng th�i �K', 'S�ng l?c ban d?u', '�i?m danh',
    'Th?i gian di?m danh', 'K?t qu? y t?', 'Ghi ch� y t?',
    'Ngu?i ki?m tra', 'Th?i gian ki?m tra', 'Ng�y dang k�',
  ];

  const rows = registrations.map((r) => {
    const user = r.userId as any;
    const event = r.eventId as any;
    const checker = r.checkedBy as any;
    return [
      user?.fullName || '',
      user?.email || '',
      user?.phone || '',
      user?.gender || '',
      r.bloodType,
      r.weight,
      r.height,
      event?.title || '',
      event?.location || '',
      r.registrationStatus,
      r.screeningResult,
      r.checkIn?.status || '',
      r.checkIn?.checkInTime || '',
      r.medicalStatus,
      r.medicalNote || '',
      checker?.fullName || '',
      r.checkedAt || '',
      r.registeredAt,
    ]
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(',');
  });

  return [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
};

/**
 * Get age distribution statistics
 */
export const getAgeDistribution = async (eventId?: string) => {
  const query: any = {};
  if (eventId) {
    query.eventId = new mongoose.Types.ObjectId(eventId);
  }

  const registrations = await Registration.find(query).populate('userId', 'dateOfBirth');

  const groups: Record<string, number> = {
    '18-25': 0,
    '26-35': 0,
    '36-45': 0,
    '46-55': 0,
    '56+': 0,
  };

  registrations.forEach((r) => {
    const user = r.userId as any;
    if (user?.dateOfBirth) {
      const age = calculateAge(new Date(user.dateOfBirth));
      const group = getAgeGroup(age);
      groups[group] = (groups[group] || 0) + 1;
    }
  });

  return Object.entries(groups).map(([name, value]) => ({ name, value }));
};

/**
 * Get blood type distribution statistics
 */
export const getBloodTypeDistribution = async (eventId?: string) => {
  const query: any = {};
  if (eventId) {
    query.eventId = new mongoose.Types.ObjectId(eventId);
  }

  const result = await Registration.aggregate([
    ...(eventId ? [{ $match: query }] : []),
    { $group: { _id: '$bloodType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return result.map((r) => ({ name: r._id, value: r.count }));
};

/**
 * Danh sách cột export duy nhất cho cả CSV và Excel.
 * Giữ chuỗi UTF-8 trực tiếp để Excel/CSV không bị lỗi mã hóa tiếng Việt.
 */
const exportColumns = [
  ['Họ tên', (r: any) => (r.userId as any)?.fullName || ''],
  ['Email', (r: any) => (r.userId as any)?.email || ''],
  ['Điện thoại', (r: any) => (r.userId as any)?.phone || ''],
  ['Giới tính', (r: any) => (r.userId as any)?.gender || ''],
  ['Nhóm máu', (r: any) => r.bloodType],
  ['Cân nặng (kg)', (r: any) => r.weight],
  ['Chiều cao (cm)', (r: any) => r.height],
  ['Sự kiện', (r: any) => (r.eventId as any)?.title || ''],
  ['Địa điểm', (r: any) => (r.eventId as any)?.location || ''],
  ['Trạng thái đăng ký', (r: any) => r.registrationStatus],
  ['Sàng lọc ban đầu', (r: any) => r.screeningResult],
  ['Điểm danh', (r: any) => r.checkIn?.status || ''],
  ['Thời gian điểm danh', (r: any) => r.checkIn?.checkInTime || ''],
  ['Kết quả y tế', (r: any) => r.medicalStatus],
  ['Ghi chú y tế', (r: any) => r.medicalNote || ''],
  ['Người kiểm tra', (r: any) => (r.checkedBy as any)?.fullName || ''],
  ['Thời gian kiểm tra', (r: any) => r.checkedAt || ''],
  ['Ngày đăng ký', (r: any) => r.registeredAt],
] as const;

export const generateVietnameseExcel = (registrations: any[]): Buffer => {
  const rows = registrations.map((registration) => Object.fromEntries(
    exportColumns.map(([header, value]) => [header, value(registration)])
  ));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Đăng ký hiến máu');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
};

export const generateVietnameseCSV = (registrations: any[]): string => {
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const headers = exportColumns.map(([header]) => escape(header)).join(',');
  const rows = registrations.map((registration) => exportColumns.map(([, value]) => escape(value(registration))).join(','));
  return [headers, ...rows].join('\n');
};
