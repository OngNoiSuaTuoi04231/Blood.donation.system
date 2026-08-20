/**
 * Tính tuổi tại thời điểm hiện tại từ ngày sinh lưu trong MongoDB.
 * Hàm trả về `null` khi dữ liệu ngày không hợp lệ hoặc nằm ở tương lai,
 * giúp controller không vô tình chấp nhận dữ liệu ngày sinh sai.
 */
export const calculateAge = (dateOfBirth: string | Date): number | null => {
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  if (birthDate > today) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayHasNotArrived = today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (birthdayHasNotArrived) age -= 1;
  return age;
};

/** Quỹ DKT chỉ tiếp nhận người hiến từ đủ 18 đến 60 tuổi. */
export const exceedsDonationAgeLimit = (dateOfBirth: string | Date): boolean => {
  const age = calculateAge(dateOfBirth);
  return age === null || age < 18 || age > 60;
};
