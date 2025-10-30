// utils/email.js
export const sendReceiptEmail = async (to, subject, htmlContent) => {
  console.log(`Sending email to ${to} with subject "${subject}"`);
  console.log('Email content:', htmlContent);
  // Integration with real email service (like SendGrid or Nodemailer) goes here
};
