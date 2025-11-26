// src/utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Dùng Gmail (dễ nhất) hoặc SMTP của bạn
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,     // ví dụ: noithatxyz@gmail.com
      pass: process.env.EMAIL_PASS,     // App Password nếu bật 2FA
    },
  });

  const mailOptions = {
    from: `"Nội thất XYZ" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;