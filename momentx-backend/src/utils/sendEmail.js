import nodemailer from 'nodemailer';

const sendEmail = async (email, subject, message) => {
  try {
    console.log(`📧 Attempting to send email to: ${email}`);
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      pool: true,   // ✅ FIX: Keeps connection alive to prevent timeouts on Render
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Must be a 16-character App Password
      },
      tls: {
        // ✅ FIX: Prevents "unreachable" errors by trusting the handshake
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com'
      }
    });

    const mailOptions = {
      from: `"MomentX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; background-color: #f4f4f4; border-radius: 10px;">
          <h2 style="color: #6366f1;">MomentX</h2>
          <p style="font-size: 16px; line-height: 1.5;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated message from MomentX. Please do not reply.</p>
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