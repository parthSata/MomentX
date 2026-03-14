import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (email, subject, message) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY is missing in environment variables");
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: 'MomentX <onboarding@resend.dev>', // If you have a verified domain, change this to 'MomentX <noreply@yourdomain.com>'
      to: email,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">MomentX</h2>
          <p style="font-size: 16px;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated message from MomentX. Please do not reply.</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend Error:", error.message);
      return false;
    }

    console.log("✅ Email sent successfully via Resend:", data.id);
    return true;
  } catch (error) {
    console.error("❌ Email Send Error:", error.message);
    return false;
  }
};

export { sendEmail };

