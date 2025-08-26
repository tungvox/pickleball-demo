# Hướng dẫn Deployment

## Firebase Hosting

### 1. Cài đặt Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Đăng nhập Firebase
```bash
firebase login
```

### 3. Build ứng dụng
```bash
npm run build
```

### 4. Deploy lên Firebase Hosting
```bash
firebase deploy
```

## Cấu hình Firebase

### 1. Authentication
- Vào Firebase Console > Authentication
- Bật Google Sign-in provider
- Thêm domain của bạn vào Authorized domains

### 2. Firestore Database
- Vào Firebase Console > Firestore Database
- Tạo database mới
- Cấu hình security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tournaments/{tournamentId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerUid;
      allow create: if request.auth != null;
    }
  }
}
```

### 3. Cấu hình PWA
- Ứng dụng đã được cấu hình PWA cơ bản
- Service worker sẽ cache các file tĩnh
- Manifest.json đã được tạo

## Kiểm tra sau deployment

1. **Authentication**: Thử đăng nhập với Google
2. **Database**: Tạo giải đấu mới và kiểm tra dữ liệu trong Firestore
3. **PWA**: Cài đặt ứng dụng trên thiết bị di động
4. **Offline**: Kiểm tra hoạt động offline

## Troubleshooting

### Lỗi Authentication
- Kiểm tra domain trong Firebase Console
- Đảm bảo Google Sign-in đã được bật

### Lỗi Database
- Kiểm tra security rules
- Đảm bảo user đã đăng nhập

### Lỗi PWA
- Kiểm tra manifest.json
- Kiểm tra service worker trong DevTools
