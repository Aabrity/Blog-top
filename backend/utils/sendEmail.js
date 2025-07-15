import nodemailer from 'nodemailer';

/**
 * Sends an email with proper security, error handling, and encoding.
 * @param {string} email - The recipient's email address.
 * @param {string} subject - Email subject line.
 * @param {string} message - HTML content of the email.
 */
export const sendEmail = async (email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // More secure than 'service'
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"RatoFlag Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Email sending failed:', err);
    throw new Error('Email could not be sent. Please try again later.');
  }
};
