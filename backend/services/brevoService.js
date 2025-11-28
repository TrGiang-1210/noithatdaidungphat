// services/brevoService.js – PHIÊN BẢN CHẮN 401 100% (28-11-2025)
require('dotenv').config();
const axios = require('axios');

const sendResetPasswordEmail = async (email, name = 'Khách hàng', resetUrl) => {
  const payload = {
    sender: {
      name: 'Nội Thất Đại Dũng Phát',
      email: 'daidungphat@tongkhonoithattayninh.vn'   // ← đã verified
    },
    to: [{ email, name }],
    subject: 'Đặt lại mật khẩu tài khoản của bạn',
    htmlContent: `
      <h2>Xin chào ${name},</h2>
      <p>Click nút dưới để đặt lại mật khẩu (hiệu lực 15 phút):</p>
      <div style="text-align:center;margin:40px 0;">
        <a href="${resetUrl}" style="background:#d4380d;color:white;padding:16px 32px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">
          Đặt lại mật khẩu
        </a>
      </div>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `
  };

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      payload,
      {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        }
      }
    );

    console.log('BREVO GỬI THÀNH CÔNG → MessageId:', response.data.messageId);
    return response.data;
  } catch (error) {
    console.error('BREVO GỬI THẤT BẠI:', error.response?.data || error.message);
    return null;
  }
};

module.exports = sendResetPasswordEmail;