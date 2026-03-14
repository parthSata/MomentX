import { google } from 'googleapis';

/**
 * Sends an email using the Gmail API with OAuth2.
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email body (HTML)
 */
const sendEmail = async (email, subject, message) => {
  try {
    const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
    const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
    const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
    const SENDER_EMAIL = process.env.EMAIL_USER;

    const oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' // Default redirect URI for playground
    );

    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Create the email content
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: MomentX <${SENDER_EMAIL}>`,
      `To: ${email}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      `
        <div style="font-family: sans-serif; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #6366f1;">MomentX</h2>
          <p style="font-size: 16px;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
        </div>
      `,
    ];
    const rawMessage = messageParts.join('\n');

    // The body needs to be base64url encoded
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log(`📧 Attempting to send email via Google API to: ${email}`);
    
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("✅ Email sent successfully via Google API:", res.data.id);
    return true;
  } catch (error) {
    console.error("❌ Google API Error:", error.message);
    if (error.response && error.response.data) {
      console.error("🔍 Error details:", JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
};

export { sendEmail };