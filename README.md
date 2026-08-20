# Hệ Thống Hiến Máu DKT

Hệ thống do **Quỹ Hiến Máu DKT** thành lập, trực thuộc **Bệnh viện OngNoiSuaTuoi**.

Ứng dụng full-stack quản lý quy trình đăng ký hiến máu: đăng ký tài khoản, tạo đợt hiến, sàng lọc ban đầu, QR, điểm danh, sàng lọc y tế, thống kê và xuất báo cáo.

## Công nghệ

- Client: React, Vite, TypeScript, Tailwind CSS, Axios, QR Code và QR Scanner.
- Server: Node.js, Express, TypeScript, Mongoose, JWT, bcrypt, Zod và XLSX.
- Database: MongoDB Atlas với database `blood_donation_system`.

## Collection MongoDB

- `users`: tài khoản donor, admin, medical_staff.
- `bloodDonationEvents`: các đợt hiến máu.
- `registrations`: đăng ký, sàng lọc ban đầu, QR, điểm danh và kết quả y tế.

Không có collection hồ sơ y tế riêng.

## Biến môi trường

Tạo `server/.env` từ `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/blood_donation_system
JWT_SECRET=<secret-an-toan>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

## Chạy ứng dụng

```powershell
npm.cmd run dev:server
npm.cmd run dev:client
```

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api`

Có thể build kiểm tra:

```powershell
npm.cmd run build:server
npm.cmd run build:client
```

## Seed dữ liệu demo

> Seed xóa toàn bộ dữ liệu trong `users`, `bloodDonationEvents`, `registrations`. Lệnh bị chặn ở production và yêu cầu xác nhận rõ ràng.

```powershell
cd server
$env:SEED_CONFIRM='YES'
npm.cmd run seed
```

Tài khoản demo:

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin@example.com` | `Admin@123456` |
| Nhân viên y tế | `medical@example.com` | `Medical@123456` |
| Người hiến máu | `donor@example.com` | `Donor@123456` |

Đổi mật khẩu demo trước khi triển khai thật.

## API chính

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Events: `/api/events`
- Registrations: `/api/registrations`
- Check-in: `/api/checkin`
- Medical: `/api/medical`
- Reports: `/api/reports`
- Admin: `/api/admin`

Các response có định dạng `{ success, message, data }`. API được bảo vệ bằng JWT và phân quyền `donor`, `admin`, `medical_staff`.
