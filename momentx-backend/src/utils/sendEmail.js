import nodemailer from "nodemailer";

const sendEmail = async (email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Validating connection before sending (Optional but good for debugging)
    await transporter.verify();

    await transporter.sendMail({
      from: `"MomentX Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: message,
      html: `<b>${message}</b>`,
    });

    return true; // Success
  } catch (error) {
    console.error("❌ Email Send Error:", error.message);
    return false; // Failed
  }
};

export { sendEmail };
