export const API_URL = '/api';

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
] as const;

export const EVENT_STATUS = {
  upcoming: { label: 'Sắp diễn ra', color: 'badge-info' },
  open: { label: 'Đang mở', color: 'badge-success' },
  closed: { label: 'Đã đóng', color: 'badge-warning' },
  completed: { label: 'Đã hoàn thành', color: 'badge-gray' },
} as const;

export const REGISTRATION_STATUS = {
  pending: { label: 'Chờ duyệt', color: 'badge-warning' },
  approved: { label: 'Đã duyệt', color: 'badge-success' },
  rejected: { label: 'Từ chối', color: 'badge-danger' },
  cancelled: { label: 'Đã hủy', color: 'badge-gray' },
  completed: { label: 'Hoàn thành', color: 'badge-info' },
} as const;

export const MEDICAL_STATUS = {
  pending: { label: 'Chờ kiểm tra', color: 'badge-warning' },
  eligible: { label: 'Đủ điều kiện', color: 'badge-success' },
  ineligible: { label: 'Không đủ điều kiện', color: 'badge-danger' },
} as const;

export const CHECKIN_STATUS = {
  not_checked_in: { label: 'Chưa điểm danh', color: 'badge-gray' },
  checked_in: { label: 'Đã điểm danh', color: 'badge-success' },
} as const;

export const AGE_GROUPS = ['18-25', '26-35', '36-45', '46-55', '56+'] as const;

export const ROLE_LABELS = {
  donor: 'Người hiến máu',
  admin: 'Quản trị viên',
  medical_staff: 'Nhân viên y tế',
} as const;
