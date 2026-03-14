import nodemailer from 'nodemailer';

const sendEmail = async (email, subject, message) => {
  try {
    console.log(`📧 Attempting to send email to: ${email}`);
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS for Port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // 16-character App Password
      },
      tls: {
        // Essential for Render/Vercel to bypass certificate issues
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
    });

    const mailOptions = {
      from: `"MomentX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #6366f1;">MomentX</h2>
          <p style="font-size: 16px;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Nodemailer Error:", error.message);
    return false;
  }
};

export { sendEmail };