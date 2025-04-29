const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: smtp.gmail.com,
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    }
});

async function sendResetEmail(email, token) {
    try {
        const resetLink = `http://localhost:5000/reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Password Reset Request',
            text: `Click the link to reset your password: ${resetLink}`,
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully');
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
}

module.exports = { sendResetEmail };
