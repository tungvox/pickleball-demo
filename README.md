# Giải đấu Pickleball - PWA

Ứng dụng Progressive Web App (PWA) để quản lý giải đấu Pickleball với giao diện tiếng Việt.

## Tính năng

- **Đăng nhập đa phương thức**: 
  - Đăng nhập bằng Google (email)
  - Đăng nhập bằng số điện thoại (username/password)
- **Xác thực Firebase Auth**: Hỗ trợ cả email và phone-as-username
- **Quản lý giải đấu**: Tạo và quản lý giải đấu với cấu hình linh hoạt
- **Chia bảng tự động**: Phân bổ đội vào các bảng theo thuật toán "rắn"
- **Lịch thi đấu vòng tròn**: Tự động tạo lịch thi đấu cho từng bảng
- **Bảng xếp hạng**: Tính toán và hiển thị bảng xếp hạng tự động
- **Vòng loại trực tiếp**: Tự động tạo khung đấu loại trực tiếp
- **Mã QR sân đấu**: Tạo mã QR cho từng sân để trọng tài nhập điểm từ điện thoại
- **Giao diện trọng tài sân**: Giao diện đơn giản để nhập điểm từ điện thoại
- **PWA**: Có thể cài đặt như ứng dụng di động
- **Offline**: Hoạt động ngay cả khi mất kết nối mạng

## Công nghệ sử dụng

- **Frontend**: React (JavaScript), Material UI v5
- **Build Tool**: Vite
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **PWA**: vite-plugin-pwa
- **QR Code**: qrcode library

## Cài đặt và chạy

1. **Clone repository**:
```bash
git clone <repository-url>
cd pickleball-demo
```

2. **Cài đặt dependencies**:
```bash
npm install
```

3. **Chạy development server**:
```bash
npm run dev
```

4. **Build cho production**:
```bash
npm run build
```

5. **Preview build**:
```bash
npm run preview
```

## Cấu hình Firebase

Ứng dụng đã được cấu hình với Firebase project `friendly-sport-6be4b`. Để sử dụng Firebase project khác:

1. Tạo project mới trên [Firebase Console](https://console.firebase.google.com/)
2. Bật Authentication với:
   - Google provider (cho đăng nhập email)
   - Email/Password provider (cho đăng nhập bằng số điện thoại)
3. Tạo Firestore database
4. Cập nhật cấu hình trong `src/firebase.js`

### Lưu ý về Phone-as-Username Authentication

Hệ thống sử dụng số điện thoại làm username với mật khẩu:

1. **Không cần billing** - Sử dụng Email/Password provider thay vì Phone provider
2. **Số điện thoại được chuyển đổi** thành email format: `+84912345678@pickleball.local`
3. **Hỗ trợ đặt lại mật khẩu** qua email
4. **Bảo mật cao** với validation và error handling

## Cách sử dụng

### 1. Đăng nhập
- Nhấn nút "Đăng nhập" trên AppBar
- Chọn phương thức đăng nhập:
  - **Google**: Chọn tài khoản Google để đăng nhập
  - **Điện thoại**: Sử dụng số điện thoại làm username và mật khẩu để đăng nhập
    - **Đăng ký**: Tạo tài khoản mới với số điện thoại, tên hiển thị và mật khẩu
    - **Đăng nhập**: Sử dụng số điện thoại và mật khẩu đã đăng ký
    - **Quên mật khẩu**: Gửi email đặt lại mật khẩu
- **Bảng điều khiển trọng tài**: Hỗ trợ cả đăng nhập bằng Google và số điện thoại

### 2. Tạo giải đấu
- Nhập tổng số cặp đôi
- Nhập số cặp mỗi bảng
- Nhập số đội vào vòng loại trực tiếp
- Nhấn "Tạo giải đấu"

### 3. Quản lý đội
- Chỉnh sửa tên đội bằng cách nhấn nút edit
- Nhập tên mới và nhấn Enter hoặc nút check

### 4. Nhập kết quả trận đấu
- Trong phần "Khu vực Bảng đấu", nhập điểm số cho từng trận
- Bảng xếp hạng sẽ tự động cập nhật
- Vòng loại trực tiếp sẽ tự động được tạo

### 5. Vòng loại trực tiếp
- Nhập kết quả các trận đấu vòng loại trực tiếp
- Đội thắng sẽ tự động được đưa vào vòng tiếp theo

### 6. Mã QR sân đấu (Tính năng mới)
- Chuyển sang tab "Mã QR sân đấu"
- Tạo mã QR cho từng sân đấu
- In hoặc tải xuống mã QR
- Trọng tài sân quét mã QR để truy cập giao diện nhập điểm

### 7. Giao diện trọng tài sân
- Trọng tài sân quét mã QR hoặc truy cập trực tiếp URL
- Giao diện đơn giản hiển thị các trận đấu của sân
- Nhập điểm số và lưu kết quả
- Kết quả tự động cập nhật về dashboard chính

### 8. Quản lý quyền truy cập
- Thêm email hoặc số điện thoại của người dùng để cho phép truy cập vào giải đấu
- Hỗ trợ hai tab: "Thêm bằng Email" và "Thêm bằng Số điện thoại"
- Người dùng được ủy quyền có thể nhập điểm, xem kết quả và phân công trọng tài
- Số điện thoại sẽ được hiển thị ở định dạng Việt Nam (VD: 0123456789)

## Quy tắc tính điểm

- **Điểm = Hiệu số điểm**: Đội thắng nhận điểm dương, đội thua nhận điểm âm
- **Ví dụ**: Đội A thắng 11-8 → A: +3 điểm, B: -3 điểm
- **Tổng điểm**: Tổng của tất cả hiệu số điểm từ các trận đấu
- **Không hòa**: Không cho phép kết quả hòa

## Xếp hạng

Thứ tự ưu tiên xếp hạng:
1. Điểm (cao nhất)
2. Đối đầu trực tiếp (nếu chỉ 2 đội hòa)
3. Hiệu số bàn thắng
4. Số bàn thắng
5. Hạt giống ngẫu nhiên

## PWA Features

- **Cài đặt**: Có thể cài đặt như ứng dụng di động
- **Offline**: Hoạt động offline với dữ liệu được cache
- **Push notifications**: Hỗ trợ thông báo (có thể mở rộng)
- **Responsive**: Giao diện tối ưu cho mọi thiết bị

## Cấu trúc dự án

```
src/
├── components/          # React components
│   ├── AppBar.jsx
│   ├── TournamentSettings.jsx
│   ├── PairsList.jsx
│   ├── GroupMatches.jsx
│   ├── KnockoutBracket.jsx
│   ├── QRCodeManager.jsx      # Quản lý mã QR
│   └── CourtScoreInput.jsx    # Giao diện trọng tài sân
├── hooks/              # Custom hooks
│   ├── useAuth.js
│   ├── useTournament.js
│   └── useNetworkStatus.js
├── utils/              # Utility functions
│   ├── tournamentUtils.js
│   └── qrCodeUtils.js         # QR code utilities
├── firebase.js         # Firebase configuration
├── App.jsx            # Main App component
└── main.jsx           # Entry point
```

## Deployment

### Firebase Hosting

1. **Cài đặt Firebase CLI**:
```bash
npm install -g firebase-tools
```

2. **Đăng nhập Firebase**:
```bash
firebase login
```

3. **Khởi tạo project**:
```bash
firebase init hosting
```

4. **Build và deploy**:
```bash
npm run build
firebase deploy
```

## Lưu ý

- Ứng dụng yêu cầu đăng nhập để tạo và chỉnh sửa giải đấu
- Dữ liệu được lưu trữ trên Firebase Firestore
- Hỗ trợ offline với Firebase offline persistence
- PWA icons sẽ được tự động tạo bởi vite-plugin-pwa
- Mã QR sân đấu giúp trọng tài nhập điểm thuận tiện từ điện thoại

## Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Kết nối internet
2. Đăng nhập Firebase
3. Quyền truy cập Firestore
4. Console browser để xem lỗi
