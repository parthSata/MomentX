import nodemailer from 'nodemailer';

const sendEmail = async (email, subject, message) => {
  try {
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      },
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
    return true;
  } catch (error) {
    console.error("❌ Gmail API (OAuth2) Error:", error.message);
    return false;
  }
};

export { sendEmail };