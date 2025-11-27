// src/services/brevoService.js
import Brevo from '@getbrevo/brevo';

// Cách mới 2025 - chỉ cần 1 dòng này là đủ!
const apiInstance = new Brevo.TransactionalEmailsApi({
  apiKey: process.env.BREVO_API_KEY   // ← Đặt thẳng vào constructor
});

const sendResetPasswordEmail = async (email, name = 'Khách hàng', resetUrl) => {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.sender = {
    name: 'Nội Thất Đại Dũng Phát',
    email: 'no-reply@tongkhonoithattayninh.vn'
  };

  sendSmtpEmail.to = [{ email: email, name: name }];

  sendSmtpEmail.templateId = 1;  // ← ID template của bạn

  sendSmtpEmail.params = {
    NAME: name,
    RESET_URL: resetUrl
  };

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Brevo: Gửi email thành công tới', email);
    return result;
  } catch (error) {
    console.error('Brevo lỗi:', error?.response?.body || error.message);
    return null; // Không throw để UX mượt
  }
};

export default sendResetPasswordEmail;