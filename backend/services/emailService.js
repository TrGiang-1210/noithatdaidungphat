// backend/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  static transporter = null;

  static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,     // noithatdaidungphat@gmail.com
          pass: process.env.EMAIL_PASS      // App Password 16 ký tự
        }
      });
    }
    return this.transporter;
  }

  // LẤY DANH SÁCH EMAIL ADMIN (từ DB hoặc fallback)
  static async getAdminEmails() {
    try {
      const UserService = require('./userService');
      const admins = await UserService.getAll({ role: 'admin' });
      if (admins.length > 0) {
        return admins.map(admin => admin.email).filter(Boolean);
      }
    } catch (error) {
      console.error('Lỗi lấy email admin từ DB:', error);
    }

    // Fallback: dùng email từ .env
    const fallback = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    return fallback ? [fallback] : [];
  }

  // DUY NHẤT HÀM NÀY ĐƯỢC GIỮ LẠI: Gửi thông báo có đơn mới cho ADMIN
  static async sendNewOrderToAdmin(order, orderDetails = []) {
    const adminEmails = await this.getAdminEmails();
    if (adminEmails.length === 0) {
      console.log('⚠️ Không có email admin nào để gửi thông báo đơn hàng mới');
      return false;
    }

    const totalItems = orderDetails.reduce((sum, item) => sum + item.quantity, 0);
    const itemsHtml = orderDetails.map(item => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #eee;">${item.name || 'Sản phẩm'}</td>
        <td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">${item.quantity}</td>
        <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${item.price.toLocaleString()}đ</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background:#f9f9f9; padding:20px; }
          .container { max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
          .header { background:#e67e22; color:white; padding:20px; text-align:center; }
          .content { padding:30px; line-height:1.6; }
          table { width:100%; border-collapse:collapse; margin:20px 0; }
          .footer { background:#333; color:white; text-align:center; padding:15px; font-size:13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 CÓ ĐƠN HÀNG MỚI!</h1>
          </div>
          <div class="content">
            <h2>Xin chào Đại Dũng Phát,</h2>
            <p>Có khách vừa đặt hàng thành công trên website!</p>
            
            <p><strong>Mã đơn hàng:</strong> #${order._id}</p>
            <p><strong>Khách hàng:</strong> ${order.customer.name} - ${order.customer.phone}</p>
            <p><strong>Địa chỉ:</strong> ${order.customer.address}</p>
            <p><strong>Phương thức thanh toán:</strong> ${order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}</p>
            <p><strong>Ghi chú:</strong> ${order.customer.note || 'Không có'}</p>
            <p><strong>Số sản phẩm:</strong> ${totalItems} món</p>
            <p><strong>TỔNG TIỀN:</strong> <span style="font-size:24px; color:#e67e22; font-weight:bold;">${order.total.toLocaleString()}đ</span></p>

            <h3>Chi tiết sản phẩm:</h3>
            <table>
              <thead style="background:#f0f0f0;">
                <tr>
                  <th style="padding:10px; text-align:left;">Tên sản phẩm</th>
                  <th style="padding:10px;">SL</th>
                  <th style="padding:10px; text-align:right;">Giá</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml || '<tr><td colspan="3">Không có chi tiết</td></tr>'}
              </tbody>
            </table>

            <p style="margin-top:30px; padding:15px; background:#fff3cd; border-radius:8px;">
              ⚡ Vui lòng gọi ngay cho khách: <strong>${order.customer.phone}</strong> để xác nhận đơn hàng!
            </p>
          </div>
          <div class="footer">
            Nội Thất Đại Dũng Phát - Hotline: 0944 333 966
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.getTransporter().sendMail({
        from: `"Nội Thất Đại Dũng Phát" <${process.env.EMAIL_USER}>`,
        to: adminEmails.join(','),
        subject: `🛒 ĐƠN HÀNG MỚI #${order._id} - ${order.total.toLocaleString()}đ`,
        html
      });
      console.log(`✅ Đã gửi email thông báo đơn mới đến: ${adminEmails.join(', ')}`);
      return true;
    } catch (error) {
      console.error('❌ Lỗi gửi email thông báo đơn hàng cho admin:', error);
      return false;
    }
  }
}

module.exports = EmailService;