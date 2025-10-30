// utils/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or use SMTP host
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendReceiptEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"EliHomes" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Email failed:', err);
    return false;
  }
};
