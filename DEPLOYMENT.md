# Deploy Vercel + Render

Mô hình triển khai:

```text
GitHub (main) -> Vercel (React/Vite) -> Render (Express API) -> MongoDB Atlas
```

Mỗi lần push vào nhánh đã liên kết, Vercel và Render tự build, sau đó cập nhật phiên bản mới. Không đưa `.env`, chuỗi MongoDB hay JWT secret lên GitHub.

## 1. Deploy backend trên Render

1. Đăng nhập Render bằng GitHub, chọn **New > Blueprint** và chọn repository này.
2. Render đọc file `render.yaml`; xác nhận service `dkt-blood-donation-api` và deploy.
3. Tại **Environment**, nhập các biến sau:

```env
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<chuỗi bí mật ngẫu nhiên, dài>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://<ten-du-an>.vercel.app
```

4. Sau khi deploy, kiểm tra `https://<ten-dich-vu>.onrender.com/api/health`. Kết quả phải có `success: true`.

> Nếu muốn Vercel Preview gọi được backend, thêm các domain được phép vào `CLIENT_URL`, ngăn cách bằng dấu phẩy. Ví dụ: `https://app.vercel.app,https://preview.vercel.app`.

## 2. Deploy frontend trên Vercel

1. Đăng nhập Vercel bằng GitHub, chọn **Add New > Project** và import repository.
2. Trong phần cấu hình, đặt **Root Directory** là `client`. Vercel sẽ nhận diện Vite.
3. Trong **Environment Variables**, tạo biến:

```env
VITE_API_URL=https://<ten-dich-vu>.onrender.com/api
```

4. Bấm Deploy. Sau khi Render đã nhận đúng `CLIENT_URL`, đăng nhập thử, xem sự kiện và gọi API để xác nhận frontend kết nối backend.

`VITE_API_URL` được đóng gói tại thời điểm build. Vì vậy sau khi đổi giá trị này, hãy Redeploy frontend trên Vercel.

## 3. MongoDB Atlas

- Giữ database `blood_donation_system` hiện có.
- Tạo user database quyền tối thiểu cần thiết cho ứng dụng.
- Cấu hình Network Access theo yêu cầu của Atlas/Render để Render được phép kết nối database.
- Không chạy lệnh seed trên môi trường production vì seed xóa dữ liệu demo hiện hữu.

## Kiểm tra sau deploy

- API health: `/api/health` trả về `success: true`.
- Đăng ký/đăng nhập người hiến hoạt động.
- Admin, nhân viên y tế và người hiến chỉ vào được đúng khu vực được phân quyền.
- QR, check-in và báo cáo vẫn gọi đúng URL Render.
