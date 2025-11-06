# Phân tích Bảo mật SpinningWheel - Client-side

## ⚠️ QUAN TRỌNG: Bảo mật thực sự phải ở Server
**Tất cả validation và logic quan trọng phải được thực hiện ở server.** Client-side code luôn có thể bị thao túng.

---

## 🔴 Các Cách Hack Phía Client (Điểm Yếu)

### 1. **Bypass Client-side Validation**
- **Vấn đề**: Tất cả validation ở client có thể bị bypass bằng cách:
  - Mở DevTools và modify code
  - Sử dụng browser extension để inject code
  - Override functions trong console
- **Ví dụ**:
  ```javascript
  // Trong console:
  window.startSpin = () => { /* custom logic */ }
  ```

### 2. **Manipulate Animation & Result Display**
- **Vấn đề**: 
  - Kết quả được tính ở server nhưng hiển thị ở client
  - Có thể modify `spinWheelToResult()` để hiển thị kết quả khác
  - Có thể modify `setResult()` để fake kết quả
- **Ví dụ**:
  ```javascript
  // Trong console:
  setResult("100"); // Fake kết quả
  ```

### 3. **Fake Device Fingerprint**
- **Vấn đề**: Device fingerprint được tạo ở client có thể bị fake
- **Code hiện tại**:
  ```typescript
  const deviceInfo = `${navigator.userAgent}_${screen.width}x${screen.height}_${new Date().getTimezoneOffset()}`;
  ```
- **Cách hack**: Có thể override `navigator.userAgent`, `screen.width`, etc.

### 4. **Multiple API Calls (Race Condition)**
- **Vấn đề**: Có thể gọi API nhiều lần trước khi server lock được tạo
- **Code hiện tại**: Có `isSpinning` check nhưng có thể bị bypass

### 5. **Modify Ticket Data**
- **Vấn đề**: Có thể modify `spinTickets` array hoặc ticket objects
- **Ví dụ**:
  ```javascript
  // Trong console:
  spinTickets[0].status = "pending"; // Fake status
  ```

### 6. **Bypass Time-based Restrictions**
- **Vấn đề**: Function `checkTimeSlotCreateSpinTicket()` ở client có thể bị bypass
- **Code hiện tại**: Chỉ check ở client, không enforce ở server (trừ khi là admin)

### 7. **Intercept Network Requests**
- **Vấn đề**: Có thể intercept và modify requests/responses
- **Tools**: Browser DevTools, Burp Suite, Postman

### 8. **Replay Attacks**
- **Vấn đề**: Có thể capture và replay requests với cùng ticketId
- **Mitigation**: Server đã có lock mechanism nhưng cần thêm timestamp/nonce

---

## 🛡️ Biện pháp Bảo mật Đề xuất

### ✅ **Đã có ở Server (Tốt)**
1. ✅ Transaction-based validation
2. ✅ Ticket ownership check
3. ✅ Ticket status check
4. ✅ Ticket expiration check
5. ✅ Rate limiting
6. ✅ Lock mechanism (ticket-level & user-level)
7. ✅ Session restrictions
8. ✅ Server-side prize calculation

### 🔧 **Cần Cải thiện ở Client (Defense in Depth)**

#### 1. **Obfuscate Critical Logic**
```typescript
// Thêm code obfuscation cho production build
// Sử dụng tools như: webpack-obfuscator, terser
```

#### 2. **Add Request Signing/Timestamp**
```typescript
// Thêm timestamp và signature vào requests
const requestTimestamp = Date.now();
const signature = await generateSignature(ticketId, requestTimestamp);
```

#### 3. **Client-side Rate Limiting (Thêm Layer)**
```typescript
// Thêm client-side rate limiting như backup
const lastSpinTime = localStorage.getItem('lastSpinTime');
const timeSinceLastSpin = Date.now() - (lastSpinTime ? parseInt(lastSpinTime) : 0);
if (timeSinceLastSpin < 1000) {
  toast.error("Vui lòng chờ một chút trước khi quay lại");
  return;
}
localStorage.setItem('lastSpinTime', Date.now().toString());
```

#### 4. **Validate Response từ Server**
```typescript
// Verify response từ server matches với ticket
onSuccess: (prize) => {
  // Verify prize là hợp lệ
  const validPrizes = ["10", "20", "30", "50", "60", "80", "100"];
  if (!validPrizes.includes(prize)) {
    console.error("Invalid prize from server");
    toast.error("Có lỗi xảy ra, vui lòng thử lại");
    return;
  }
  // Continue...
}
```

#### 5. **Disable DevTools (Optional - Không khuyến khích)**
```typescript
// Chỉ để làm khó hacker, không phải giải pháp thực sự
if (process.env.NODE_ENV === 'production') {
  // Detect DevTools
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > 200 || 
        window.outerWidth - window.innerWidth > 200) {
      // DevTools might be open
      console.clear();
    }
  }, 1000);
}
```

#### 6. **Add Request Nonce**
```typescript
// Generate unique nonce cho mỗi request
const nonce = crypto.randomUUID();
await performSpin(studentId, ticketId, deviceInfo, sessionId, nonce);
```

#### 7. **Validate Ticket trước khi gửi**
```typescript
// Double-check ticket status trước khi gửi request
const ticket = spinTickets.find(t => t.id === ticketId);
if (!ticket || ticket.status !== "pending") {
  toast.error("Vé không hợp lệ");
  return;
}
```

#### 8. **Add Error Handling & Logging**
```typescript
// Log suspicious activities
onError: (error) => {
  // Log to monitoring service
  if (error.message.includes("hack") || error.message.includes("bypass")) {
    // Report to server
    reportSuspiciousActivity(studentId, error);
  }
}
```

#### 9. **Disable Console trong Production (Optional)**
```typescript
// Làm khó hacker nhưng không phải giải pháp thực sự
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  // Override các methods khác
}
```

#### 10. **Add Request Timeout & Retry Logic**
```typescript
// Prevent hanging requests
const timeout = setTimeout(() => {
  if (isSpinning) {
    setIsSpinning(false);
    toast.error("Request timeout, vui lòng thử lại");
  }
}, 30000); // 30 seconds
```

---

## 🎯 **Khuyến nghị Ưu tiên**

### **Cao (Phải làm)**
1. ✅ **Server đã có đầy đủ validation** - Đây là quan trọng nhất
2. ✅ **Thêm client-side rate limiting** (backup layer)
3. ✅ **Validate response từ server**
4. ✅ **Add request timestamp/nonce**

### **Trung bình (Nên làm)**
5. ✅ **Obfuscate code trong production**
6. ✅ **Add error logging & monitoring**
7. ✅ **Validate ticket trước khi gửi**

### **Thấp (Có thể làm)**
8. ⚠️ **Disable console** (không khuyến khích, dễ bypass)
9. ⚠️ **Detect DevTools** (không khuyến khích, dễ bypass)

---

## 📝 **Lưu ý Quan trọng**

1. **Không bao giờ tin tưởng client**: Tất cả validation quan trọng phải ở server
2. **Client-side security chỉ là defense in depth**: Làm khó hacker, không phải ngăn chặn hoàn toàn
3. **Focus vào server security**: Đầu tư vào server validation, rate limiting, và monitoring
4. **Monitor suspicious activities**: Log và theo dõi các hành vi bất thường
5. **Regular security audits**: Kiểm tra định kỳ các điểm yếu mới

---

## 🔍 **Các Công cụ Kiểm tra Bảo mật**

1. **Browser DevTools**: Test client-side validation
2. **Burp Suite**: Intercept và modify requests
3. **Postman**: Test API endpoints
4. **OWASP ZAP**: Automated security testing
5. **Code obfuscation tools**: Bảo vệ code khỏi reverse engineering

---

## ✅ **Kết luận**

Server của bạn đã có **bảo mật tốt** với:
- Transaction-based validation
- Lock mechanism
- Rate limiting
- Session restrictions
- Server-side prize calculation

**Client-side chỉ cần thêm các layer phòng thủ bổ sung** để làm khó hacker, nhưng **không thể thay thế server-side security**.

