import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS_LOADED:', Boolean(process.env.EMAIL_PASS));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('EMAIL TRANSPORTER ERROR:', error);
  } else {
    console.log('✅ Email transporter is ready');
  }
});

export default transporter;
