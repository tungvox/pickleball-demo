# Demo: Hệ thống mã QR cho trọng tài sân

## Tổng quan

Hệ thống mã QR mới cho phép trọng tài sân nhập điểm trực tiếp từ điện thoại, giúp loại bỏ việc ghi chép thủ công và cập nhật real-time về dashboard chính.

## Cách sử dụng

### 1. Tạo mã QR sân đấu (General Referee)

1. **Đăng nhập vào dashboard chính**
2. **Chọn giải đấu** cần quản lý
3. **Chuyển sang tab "Mã QR sân đấu"**
4. **Tạo mã QR** cho từng sân:
   - Nhấn "Tạo tất cả mã QR" để tạo cho tất cả sân
   - Hoặc nhấn "Xem mã QR" cho từng sân riêng lẻ
5. **In hoặc tải xuống** mã QR cho từng sân

### 2. Sử dụng mã QR (Court Referee)

1. **Quét mã QR** bằng camera điện thoại
2. **Truy cập giao diện trọng tài sân**
3. **Nhập điểm số** cho các trận đấu
4. **Lưu kết quả** - tự động cập nhật về dashboard chính

## URL Structure

### Court Access URLs
```
https://your-domain.com/court/{tournamentId}/{courtId}
```

### Example URLs
```
https://pickleball-demo.web.app/court/tournament123/group1
https://pickleball-demo.web.app/court/tournament123/group2
```

## Tính năng chính

### QR Code Manager (Dashboard)
- ✅ Tạo mã QR cho từng sân
- ✅ In mã QR với thông tin sân
- ✅ Tải xuống mã QR dưới dạng PNG
- ✅ Xem trước mã QR trong dialog
- ✅ Tạo hàng loạt mã QR cho tất cả sân

### Court Score Input (Mobile Interface)
- ✅ Giao diện đơn giản, tối ưu cho mobile
- ✅ Hiển thị danh sách trận đấu của sân
- ✅ Nhập điểm số dễ dàng
- ✅ Validation điểm số (không cho phép hòa)
- ✅ Real-time cập nhật về dashboard
- ✅ Hiển thị trạng thái trận đấu (đã hoàn thành/chưa)
- ✅ QR code viewer cho sân hiện tại

## Workflow Demo

### Bước 1: Setup Tournament
```
1. Tạo giải đấu mới với 12 đội, 3 sân
2. Hệ thống tự động chia bảng và tạo lịch đấu
```

### Bước 2: Generate QR Codes
```
1. Chuyển sang tab "Mã QR sân đấu"
2. Nhấn "Tạo tất cả mã QR"
3. In mã QR cho từng sân
4. Dán mã QR tại vị trí tương ứng của mỗi sân
```

### Bước 3: Court Referee Usage
```
1. Trọng tài sân quét mã QR
2. Giao diện hiển thị danh sách trận đấu của sân
3. Nhập điểm số cho từng trận
4. Kết quả tự động cập nhật về dashboard chính
```

### Bước 4: Real-time Updates
```
1. General referee thấy kết quả cập nhật real-time
2. Bảng xếp hạng tự động tính toán lại
3. Vòng loại trực tiếp tự động tạo khi hoàn thành vòng bảng
```

## Lợi ích

### Cho General Referee
- ✅ Không cần nhập điểm thủ công
- ✅ Cập nhật real-time
- ✅ Giảm lỗi nhập liệu
- ✅ Tiết kiệm thời gian

### Cho Court Referee
- ✅ Giao diện đơn giản, dễ sử dụng
- ✅ Không cần cài đặt app
- ✅ Hoạt động trên mọi điện thoại
- ✅ Truy cập nhanh qua QR code

### Cho Tournament
- ✅ Quy trình chuyên nghiệp hơn
- ✅ Dữ liệu chính xác hơn
- ✅ Tốc độ cập nhật nhanh hơn
- ✅ Trải nghiệm người dùng tốt hơn

## Technical Details

### QR Code Generation
- Sử dụng thư viện `qrcode`
- URL format: `/court/{tournamentId}/{courtId}`
- Kích thước: 300x300px
- Margin: 2px

### Mobile Interface
- Responsive design
- Touch-friendly buttons
- Large input fields
- Clear visual feedback

### Real-time Updates
- Firebase Firestore listeners
- Automatic data synchronization
- Offline support with sync when online

## Testing

### Test QR Code Generation
1. Tạo giải đấu test
2. Chuyển sang tab QR Code Manager
3. Tạo mã QR cho một sân
4. Verify QR code displays correctly

### Test Court Access
1. Quét mã QR hoặc truy cập URL trực tiếp
2. Verify court interface loads
3. Test score input functionality
4. Verify updates appear in main dashboard

### Test Real-time Updates
1. Open main dashboard in one browser
2. Open court interface in another browser/device
3. Update scores in court interface
4. Verify updates appear immediately in main dashboard

## Troubleshooting

### QR Code không hiển thị
- Kiểm tra kết nối internet
- Refresh trang và thử lại
- Kiểm tra console browser để xem lỗi

### Court interface không load
- Kiểm tra URL format
- Verify tournament và court ID tồn tại
- Kiểm tra Firebase permissions

### Scores không cập nhật
- Kiểm tra kết nối internet
- Verify Firebase rules cho phép write
- Kiểm tra console browser để xem lỗi

## Future Enhancements

### Phase 2: Role-based Access
- [ ] Thêm authentication cho court referees
- [ ] Court assignment system
- [ ] Permission management

### Phase 3: Enhanced Features
- [ ] Push notifications
- [ ] Match status tracking
- [ ] Score validation rules
- [ ] Match timer integration
