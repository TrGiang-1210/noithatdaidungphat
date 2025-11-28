// src/services/brevoService.js ← ĐỔI THÀNH COMMONJS (quan trọng nhất!!!)

const Brevo = require('@getbrevo/brevo');

const apiInstance = new Brevo.TransactionalEmailsApi();

// Cấu hình API key đúng cách 2025
const apiKey = apiInstance.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendResetPasswordEmail = async (email, name = 'Khách hàng', resetUrl) => {
  if (!process.env.BREVO_API_KEY) {
    console.error('BREVO_API_KEY chưa được cấu hình trong .env');
    return null;
  }

  const sendSmtpEmail = {
    sender: {
      name: 'Nội Thất Đại Dũng Phát',
      email: 'no-reply@tongkhonoithattayninh.vn' // ← phải đã verify trên Brevo
    },
    to: [{ email, name }],
    templateId: 1, // ← kiểm tra lại ID này chính xác chưa
    params: {
      NAME: name,
      RESET_URL: resetUrl
    }
  };

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('BREVO: Gửi thành công tới', email, '| MessageId:', result.messageId);
    return result;
  } catch (error) {
    console.error('BREVO LỖI CHI TIẾT:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Body:', error.response.body);
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
};

module.exports = sendResetPasswordEmail; // ← CommonJS export