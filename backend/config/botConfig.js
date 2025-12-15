// backend/config/botConfig.js
module.exports = {
  // Bật/tắt bot
  enabled: true,
  
  // Thời gian delay trước khi bot trả lời (ms)
  responseDelay: {
    min: 1000,  // 1 giây
    max: 2000   // 2 giây
  },
  
  // Số tin nhắn user gửi liên tiếp trước khi bot reply
  triggerAfterMessages: 1,
  
  // Giờ làm việc (nếu ngoài giờ này, bot sẽ reply ngay)
  workingHours: {
    start: 9,   // 9h sáng
    end: 18,    // 6h chiều
    timezone: 'Asia/Ho_Chi_Minh'
  },
  
  // Thông tin liên hệ
  contact: {
    hotline: ['0941 038 839', '0965 708 839'],
    email: 'noithatdaidungphat@gmail.com',
    address: '474 ĐT824, Mỹ Hạnh Nam, Đức Hòa, Long An 82703, Việt Nam',
    zalo: '0965708839',
    facebook: 'fb.com/noithatdaidungphat'
  },
  
  // Ngưỡng confidence để bot reply (0-1)
  confidenceThreshold: 0.5
};