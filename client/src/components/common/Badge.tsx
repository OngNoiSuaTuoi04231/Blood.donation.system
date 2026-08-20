import React from 'react';

interface BadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { className: string; label: string }> = {
  // Registration statuses
  pending: { className: 'badge-warning', label: 'Chờ duyệt' },
  approved: { className: 'badge-success', label: 'Đã duyệt' },
  rejected: { className: 'badge-danger', label: 'Từ chối' },
  cancelled: { className: 'badge-gray', label: 'Đã hủy' },
  completed: { className: 'badge-info', label: 'Hoàn thành' },

  // Event statuses
  upcoming: { className: 'badge-info', label: 'Sắp diễn ra' },
  ongoing: { className: 'badge-success', label: 'Đang diễn ra' },
  finished: { className: 'badge-gray', label: 'Đã kết thúc' },

  // Medical statuses
  pass: { className: 'badge-success', label: 'Đạt' },
  fail: { className: 'badge-danger', label: 'Không đạt' },
  screening: { className: 'badge-warning', label: 'Đang khám' },

  // Check-in statuses
  checked_in: { className: 'badge-success', label: 'Đã điểm danh' },
  not_checked_in: { className: 'badge-gray', label: 'Chưa điểm danh' },

  // General
  active: { className: 'badge-success', label: 'Hoạt động' },
  inactive: { className: 'badge-gray', label: 'Ngừng hoạt động' },
};

const Badge: React.FC<BadgeProps> = ({ status, label, size = 'md' }) => {
  const config = statusConfig[status.toLowerCase()] || {
    className: 'badge-gray',
    label: status,
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span className={`badge ${config.className} ${sizeClasses[size]}`}>
      {label || config.label}
    </span>
  );
};

export default Badge;