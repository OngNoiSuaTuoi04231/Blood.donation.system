import emailjs from '@emailjs/browser';

/**
 * Cấu hình EmailJS phục vụ tính năng gửi mã xác thực OTP
 * Giá trị mặc định lấy từ thông tin EmailJS và tài khoản Gmail bạn đã cung cấp:
 * - Service ID: service_fcenp7s
 * - Public Key: dZOfluB8r6ccingor
 * - Template ID: Bạn có thể cập nhật trong file .env (VITE_EMAILJS_TEMPLATE_ID) hoặc tại đây
 */
export const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_fcenp7s',
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'dZOfluB8r6ccingor',
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID',
};

export interface SendOtpParams {
  toEmail: string;
  toName: string;
  otp: string;
  timeLimitMinutes?: number;
}

export interface SendOtpResult {
  success: boolean;
  message: string;
  isMockDemo?: boolean;
}

/**
 * Gửi mã OTP 6 số qua EmailJS tới địa chỉ email người dùng
 */
export const sendOtpEmail = async ({
  toEmail,
  toName,
  otp,
  timeLimitMinutes = 5,
}: SendOtpParams): Promise<SendOtpResult> => {
  const serviceId = EMAILJS_CONFIG.SERVICE_ID;
  const publicKey = EMAILJS_CONFIG.PUBLIC_KEY;
  const templateId = EMAILJS_CONFIG.TEMPLATE_ID;

  // Nếu người dùng chưa cấu hình Template ID thật trên EmailJS
  const isTemplateUnconfigured =
    !templateId ||
    templateId === 'YOUR_TEMPLATE_ID' ||
    templateId.trim().toUpperCase() === 'YOUR_TEMPLATE_ID';

  if (isTemplateUnconfigured) {
    console.warn(
      `[EmailJS Demo] Chưa cấu hình TEMPLATE_ID thật (đang là "${templateId}"). Mã OTP thử nghiệm là: ${otp}`
    );
    return {
      success: true,
      isMockDemo: true,
      message: `Chế độ demo: EmailJS Template ID chưa được đặt. Mã OTP tạo ra là: ${otp}`,
    };
  }

  // Khởi tạo EmailJS với Public Key
  emailjs.init(publicKey);

  // Bộ tham số đa dạng, tương thích với các tên biến phổ biến trong template EmailJS
  const templateParams = {
    to_email: toEmail,
    email: toEmail,
    recipient_email: toEmail,
    to_name: toName || 'Quý khách',
    name: toName || 'Quý khách',
    otp_code: otp,
    otp: otp,
    passcode: otp,
    time_limit: `${timeLimitMinutes} phút`,
    expire_time: `${timeLimitMinutes} phút`,
    app_name: 'Hệ Thống Hiến Máu DKT',
    reply_to: 'support@dkt-blood.vn',
  };

  try {
    const res = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    if (res.status === 200 || res.text === 'OK') {
      return {
        success: true,
        isMockDemo: false,
        message: 'Mã xác thực OTP đã được gửi đến hộp thư của bạn.',
      };
    }
    throw new Error(res.text || 'Gửi email không thành công.');
  } catch (error: any) {
    console.error('[EmailJS Error]', error);
    // Nếu có lỗi từ EmailJS (ví dụ sai template ID, chưa active template), trả về thông báo rõ ràng
    const errorText = error?.text || error?.message || 'Lỗi gửi email qua EmailJS.';
    return {
      success: false,
      isMockDemo: false,
      message: `Không thể gửi email (${errorText}). Vui lòng kiểm tra lại cấu hình Template ID hoặc Service ID trên EmailJS.`,
    };
  }
};
