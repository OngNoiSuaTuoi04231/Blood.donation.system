import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  LockKeyhole,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  Check,
  HelpCircle,
} from 'lucide-react';
import authService from '../../services/authService';
import { sendOtpEmail, EMAILJS_CONFIG } from '../../services/emailJsService';

interface ForgotPasswordProps {
  toast: {
    addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  };
}

export default function ForgotPassword({ toast }: ForgotPasswordProps) {
  const navigate = useNavigate();

  // Các bước: 'email' -> 'otp' -> 'new_password' -> 'success'
  const [step, setStep] = useState<'email' | 'otp' | 'new_password' | 'success'>('email');

  // Dữ liệu nhập
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Ẩn/hiện mật khẩu
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Trạng thái xử lý
  const [busy, setBusy] = useState(false);
  const [activeError, setActiveError] = useState('');

  // OTP state nội bộ
  const [sentOtp, setSentOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(0);
  const [mockNotice, setMockNotice] = useState<string | null>(null);

  // Ref cho 6 ô input OTP
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Đếm ngược 60 giây cho nút Gửi lại mã
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus ô đầu tiên khi bước sang 'otp'
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Che email để hiển thị an toàn (VD: tr***@gmail.com)
  const maskEmail = (str: string) => {
    if (!str.includes('@')) return str;
    const [name, domain] = str.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  };

  // Tạo và gửi mã OTP
  const generateAndSendOtp = async (targetEmail: string, targetName: string) => {
    // Tạo mã ngẫu nhiên 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 phút

    setSentOtp(otp);
    setOtpExpiry(expiryTime);
    setCountdown(60); // 60s có thể gửi lại
    setOtpDigits(['', '', '', '', '', '']);
    setActiveError('');

    const res = await sendOtpEmail({
      toEmail: targetEmail,
      toName: targetName,
      otp,
      timeLimitMinutes: 5,
    });

    if (res.isMockDemo) {
      setMockNotice(
        `EmailJS Template ID hiện đang là "${EMAILJS_CONFIG.TEMPLATE_ID}". Mã OTP thử nghiệm của bạn là: ${otp}`
      );
      toast.addToast(
        'info',
        `Mã OTP thử nghiệm: ${otp} (EmailJS Template ID chưa được cấu hình).`
      );
    } else if (res.success) {
      setMockNotice(null);
      toast.addToast('success', 'Mã xác thực OTP đã được gửi đến email của bạn.');
    } else {
      // Vẫn hỗ trợ mã test nếu EmailJS gặp trục trặc dịch vụ
      setMockNotice(
        `EmailJS gặp sự cố: ${res.message}. Bạn có thể dùng mã OTP dự phòng này để tiếp tục thử nghiệm: ${otp}`
      );
      toast.addToast('warning', 'Không thể kết nối EmailJS. Đã kích hoạt mã OTP dự phòng.');
    }
  };

  // 1. Submit bước Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActiveError('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setActiveError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    try {
      setBusy(true);
      // Kiểm tra tài khoản có trong hệ thống không
      const checkRes = await authService.checkEmail(cleanEmail);
      const name = checkRes?.data?.fullName || 'Người dùng';
      setFullName(name);

      // Gửi OTP
      await generateAndSendOtp(cleanEmail, name);
      setStep('otp');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không tìm thấy tài khoản tương ứng với email này.';
      setActiveError(msg);
      toast.addToast('error', msg);
    } finally {
      setBusy(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || busy) return;
    try {
      setBusy(true);
      await generateAndSendOtp(email.trim().toLowerCase(), fullName);
    } catch (err: any) {
      toast.addToast('error', 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  // Xử lý khi gõ vào 1 ô OTP
  const handleOtpChange = (index: number, value: string) => {
    // Chỉ lấy ký tự số
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    const digit = cleanValue.slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setActiveError('');

    // Tự động nhảy sang ô tiếp theo
    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Xử lý phím xóa Backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Xử lý dán (Paste) mã 6 số
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasteData) return;

    const chars = pasteData.slice(0, 6).split('');
    const next = ['', '', '', '', '', ''];
    chars.forEach((c, idx) => {
      next[idx] = c;
    });
    setOtpDigits(next);
    setActiveError('');

    // Focus vào ô cuối cùng tương ứng
    const targetIdx = Math.min(chars.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  // 2. Submit xác thực OTP
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveError('');
    const enteredOtp = otpDigits.join('');

    if (enteredOtp.length < 6) {
      setActiveError('Vui lòng nhập đủ 6 chữ số mã xác thực OTP.');
      return;
    }

    // Kiểm tra hạn sử dụng
    if (Date.now() > otpExpiry) {
      setActiveError('Mã xác thực OTP đã hết hạn (quá 5 phút). Vui lòng bấm "Gửi lại mã OTP".');
      toast.addToast('error', 'Mã OTP đã hết hạn.');
      return;
    }

    // So sánh OTP
    if (enteredOtp !== sentOtp) {
      setActiveError('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
      toast.addToast('error', 'Mã xác thực OTP không đúng.');
      return;
    }

    toast.addToast('success', 'Xác thực OTP thành công! Vui lòng đặt mật khẩu mới.');
    setStep('new_password');
  };

  // 3. Submit đổi mật khẩu mới
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActiveError('');

    if (newPassword.length < 6) {
      setActiveError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setActiveError('Mật khẩu xác nhận chưa khớp với mật khẩu mới.');
      return;
    }

    try {
      setBusy(true);
      await authService.resetPassword({
        email: email.trim().toLowerCase(),
        newPassword,
      });

      setStep('success');
      toast.addToast('success', 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật mật khẩu mới. Vui lòng thử lại.';
      setActiveError(msg);
      toast.addToast('error', msg);
    } finally {
      setBusy(false);
    }
  };

  // Độ an toàn mật khẩu
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-slate-200' };
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;

    if (s <= 2) return { score: 33, text: 'Yếu', color: 'bg-red-500' };
    if (s <= 4) return { score: 66, text: 'Trung bình', color: 'bg-amber-500' };
    return { score: 100, text: 'Rất mạnh', color: 'bg-emerald-600' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-4">
      {/* Chỉ báo tiến trình 3 bước */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            step === 'email'
              ? 'text-red-700 dark:text-red-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 'email'
                ? 'bg-red-700 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {step === 'email' ? '1' : <Check size={12} />}
          </span>
          <span>Nhập Email</span>
        </div>

        <div className="h-0.5 flex-1 mx-2 bg-slate-200 dark:bg-slate-700" />

        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            step === 'otp'
              ? 'text-red-700 dark:text-red-400'
              : ['new_password', 'success'].includes(step)
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 'otp'
                ? 'bg-red-700 text-white'
                : ['new_password', 'success'].includes(step)
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}
          >
            {['new_password', 'success'].includes(step) ? <Check size={12} /> : '2'}
          </span>
          <span>Mã OTP</span>
        </div>

        <div className="h-0.5 flex-1 mx-2 bg-slate-200 dark:bg-slate-700" />

        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            step === 'new_password'
              ? 'text-red-700 dark:text-red-400'
              : step === 'success'
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 'new_password'
                ? 'bg-red-700 text-white'
                : step === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}
          >
            {step === 'success' ? <Check size={12} /> : '3'}
          </span>
          <span>Mật khẩu mới</span>
        </div>
      </div>

      {/* Thông báo lỗi nổi bật nếu có */}
      {activeError && (
        <div
          className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs leading-relaxed"
          role="alert"
        >
          <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-600" />
          <span>{activeError}</span>
        </div>
      )}

      {/* BƯỚC 1: NHẬP EMAIL */}
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <Mail size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Xác thực bằng mã OTP qua Email
              </p>
              <p className="mt-0.5">
                Nhập email đã đăng ký. Hệ thống sẽ gửi một mã gồm 6 số tới hộp thư của bạn qua
                EmailJS.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium mb-1">
              Địa chỉ Email tài khoản
            </label>
            <div className="relative">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="forgot-email"
                type="email"
                required
                placeholder="tenban@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setActiveError('');
                }}
                className="input-field pl-10"
                autoFocus
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Ví dụ: hoangnam@gmail.com hoặc email bạn đã dùng để hiến máu.
            </p>
          </div>

          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="btn-primary auth-submit w-full flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Đang kiểm tra & gửi mã OTP...
              </>
            ) : (
              <>
                <Send size={18} />
                Gửi mã xác thực OTP
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-600 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-400 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Quay lại trang đăng nhập
            </Link>
          </div>
        </form>
      )}

      {/* BƯỚC 2: NHẬP MÃ OTP 6 SỐ */}
      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-500">
              Mã xác thực đã được gửi đến hộp thư:
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
              <Mail size={15} className="text-red-600" />
              {maskEmail(email)}
            </p>
          </div>

          {/* Hộp gợi ý Demo nếu EmailJS chưa cấu hình template */}
          {mockNotice && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold">
                <HelpCircle size={16} className="text-amber-600 shrink-0" />
                <span>Chế độ thử nghiệm EmailJS</span>
              </div>
              <p>{mockNotice}</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                💡 Khi đã tạo Template trên EmailJS, bạn chỉ cần điền Template ID vào file{' '}
                <code>.env</code> để nhận email thực tế trong Gmail.
              </p>
            </div>
          )}

          {/* 6 ô nhập mã OTP */}
          <div>
            <label className="block text-xs font-semibold text-center text-slate-700 dark:text-slate-300 mb-2">
              NHẬP MÃ XÁC THỰC 6 CHỮ SỐ
            </label>
            <div
              className="flex items-center justify-center gap-2 sm:gap-2.5"
              onPaste={handleOtpPaste}
            >
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  aria-label={`Số thứ ${idx + 1}`}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-red-600 dark:focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/60 focus:outline-none transition-all shadow-sm"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-500">
              {countdown > 0 ? (
                <>Gửi lại mã sau: <strong className="text-red-700">{countdown}s</strong></>
              ) : (
                'Chưa nhận được mã?'
              )}
            </span>
            <button
              type="button"
              disabled={countdown > 0 || busy}
              onClick={handleResendOtp}
              className={`font-semibold transition-colors flex items-center gap-1 ${
                countdown > 0
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-red-700 hover:text-red-800 dark:text-red-400 hover:underline'
              }`}
            >
              <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
              Gửi lại mã OTP
            </button>
          </div>

          <button
            type="submit"
            disabled={busy || otpDigits.join('').length < 6}
            className="btn-primary auth-submit w-full flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            Xác nhận mã OTP
          </button>

          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setActiveError('');
              }}
              className="text-slate-500 hover:text-red-700 dark:text-slate-400 flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Đổi email khác
            </button>
            <Link
              to="/login"
              className="text-slate-600 hover:text-red-700 font-medium"
            >
              Hủy bỏ
            </Link>
          </div>
        </form>
      )}

      {/* BƯỚC 3: ĐẶT LẠI MẬT KHẨU MỚI */}
      {step === 'new_password' && (
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>
              Đã xác thực OTP cho tài khoản <strong>{email}</strong>. Vui lòng thiết lập mật khẩu mới.
            </span>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label
              htmlFor="forgot-new-password"
              className="block text-sm font-medium mb-1"
            >
              Mật khẩu mới
            </label>
            <div className="relative">
              <span className="input-icon">
                <LockKeyhole size={18} />
              </span>
              <input
                id="forgot-new-password"
                type={showNewPassword ? 'text' : 'password'}
                required
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setActiveError('');
                }}
                className="input-field pl-10 pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-red-700 flex items-center"
                aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Thanh đo độ mạnh mật khẩu */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Độ mạnh: <strong className="text-slate-700 dark:text-slate-300">{strength.text}</strong></span>
                  <span>Tối thiểu 6 ký tự</span>
                </div>
              </div>
            )}
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label
              htmlFor="forgot-confirm-password"
              className="block text-sm font-medium mb-1"
            >
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <span className="input-icon">
                <CheckCircle2 size={18} />
              </span>
              <input
                id="forgot-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setActiveError('');
                }}
                className="input-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-red-700 flex items-center"
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-600">Mật khẩu xác nhận chưa khớp.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="btn-primary auth-submit w-full flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Đang cập nhật mật khẩu...
              </>
            ) : (
              <>
                <KeyRound size={18} />
                Cập nhật mật khẩu mới
              </>
            )}
          </button>
        </form>
      )}

      {/* BƯỚC 4: THÀNH CÔNG */}
      {step === 'success' && (
        <div className="text-center py-6 space-y-3">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Check size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Đổi mật khẩu thành công!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Mật khẩu mới đã được cập nhật an toàn vào hệ thống. Đang tự động chuyển hướng về trang
            đăng nhập...
          </p>
          <div className="pt-2">
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-sm px-5 py-2">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
