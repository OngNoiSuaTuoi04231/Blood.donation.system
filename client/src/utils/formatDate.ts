/**
 * Format a date string or Date to Vietnamese locale format
 */
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

/**
 * Format a date string or Date with time
 */
export const formatDateTime = (date: string | Date): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(date));
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
};

/**
 * Format date for input[type="date"]
 */
export const formatDateInput = (date: string | Date): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Get relative time (e.g., "2 ngày trước")
 */
export const getRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  return formatDate(date);
};
