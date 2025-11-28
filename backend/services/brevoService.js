// services/brevoService.js
require('dotenv').config();
const Brevo = require('@getbrevo/brevo');

// Cách mới 2025: không cần instance, chỉ cần set apiKey trực tiếp
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.apiKey = process.env.BREVO_API_KEY; // ← ĐƠN GIẢN CHỈ 1 DÒNG NÀY!

const sendResetPasswordEmail = async (email, name = 'Khách hàng', resetUrl) => {
  if (!process.env.BREVO_API_KEY) {
    console.error('BREVO_API_KEY chưa được cấu hình trong .env');
    return false;
  }

  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.sender = { 
    name: 'Nội Thất Đại Dũng Phát', 
    email: 'no-reply@tongkhonoithattayninh.vn' 
  };
  sendSmtpEmail.to = [{ email, name }];
  sendSmtpEmail.templateId = 1;
  sendSmtpEmail.params = { NAME: name, RESET_URL: resetUrl };

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('BREVO: Gửi email reset password thành công tới', email);
    return data;
  } catch (error) {
    console.error('BREVO: Lỗi gửi email');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Body:', error.response.body);
    } else {
      console.error(error.message);
    }
    return false;
  }
};

module.exports = sendResetPasswordEmail;