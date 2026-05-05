import nodemailer from 'nodemailer';

const requiredEnv = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM'
];

for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required email environment variable: ${envVar}`);
  }
}

const emailPort = Number(process.env.EMAIL_PORT);
const secure = emailPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,
  secure,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify().then(() => {
  console.log('Email transporter verified successfully');
}).catch((error) => {
  console.error('Email transporter verification failed:', error);
});

// sendEmail is a reusable function that wraps nodemailer's sendMail
// to: recipient email address
// subject: email subject line
// html: the email body as HTML
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to} with subject '${subject}'`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};