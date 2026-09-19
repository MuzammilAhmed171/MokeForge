import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email verification template
const getEmailVerificationTemplate = (name, otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - MockForge</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #101114;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #101114; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #17181c; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff6b3d 0%, #ff8a5c 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #1a0e08; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">MockForge</h1>
              <p style="margin: 8px 0 0 0; color: #1a0e08; font-size: 14px; opacity: 0.9;">Professional Mockup Studio</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #e9e7e1; font-size: 24px; font-weight: 600;">
                Welcome to MockForge, ${name}! 🎉
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #9aa1ad; font-size: 16px; line-height: 1.6;">
                Thank you for creating an account. To get started, please verify your email address using the code below:
              </p>
              
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #1d1f24; border: 2px solid #ff6b3d; border-radius: 12px; padding: 30px; display: inline-block;">
                      <p style="margin: 0 0 15px 0; color: #9aa1ad; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        Your Verification Code
                      </p>
                      <h1 style="margin: 0; color: #ff6b3d; font-size: 48px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${otp}
                      </h1>
                      <p style="margin: 15px 0 0 0; color: #666d79; font-size: 12px;">
                        This code expires in 10 minutes
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #9aa1ad; font-size: 14px; line-height: 1.6;">
                If you didn't create an account with MockForge, you can safely ignore this email.
              </p>
              
              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #1d1f24; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 15px 0; color: #e9e7e1; font-size: 16px; font-weight: 600;">
                      What's Next?
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #9aa1ad; font-size: 14px; line-height: 1.8;">
                      <li>Create stunning device mockups</li>
                      <li>Design professional portfolios</li>
                      <li>Export high-quality images</li>
                      <li>Access 125+ device models</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1d1f24; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666d79; font-size: 12px;">
                Need help? Contact us at support@mockforge.com
              </p>
              <p style="margin: 0; color: #666d79; font-size: 12px;">
                © 2024 MockForge. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Password reset template
const getPasswordResetTemplate = (name, otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - MockForge</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #101114;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #101114; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #17181c; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ffd166 0%, #ffed8a 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #1a0e08; font-size: 32px; font-weight: 700;">Password Reset</h1>
              <p style="margin: 8px 0 0 0; color: #1a0e08; font-size: 14px; opacity: 0.9;">MockForge</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #e9e7e1; font-size: 24px; font-weight: 600;">
                Hi ${name},
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #9aa1ad; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Use the code below to create a new password:
              </p>
              
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #1d1f24; border: 2px solid #ffd166; border-radius: 12px; padding: 30px; display: inline-block;">
                      <p style="margin: 0 0 15px 0; color: #9aa1ad; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        Reset Code
                      </p>
                      <h1 style="margin: 0; color: #ffd166; font-size: 48px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${otp}
                      </h1>
                      <p style="margin: 15px 0 0 0; color: #666d79; font-size: 12px;">
                        This code expires in 10 minutes
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #9aa1ad; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
              
              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #1d1f24; border-radius: 8px; padding: 20px; border-left: 4px solid #ffd166;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 10px 0; color: #ffd166; font-size: 14px; font-weight: 600;">
                      🔒 Security Notice
                    </h3>
                    <p style="margin: 0; color: #9aa1ad; font-size: 13px; line-height: 1.6;">
                      For your security, this code can only be used once and will expire in 10 minutes. Never share this code with anyone.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1d1f24; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666d79; font-size: 12px;">
                Need help? Contact us at support@mockforge.com
              </p>
              <p style="margin: 0; color: #666d79; font-size: 12px;">
                © 2024 MockForge. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Send verification email
export const sendVerificationEmail = async (email, name, otp) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: 'Verify Your Email - MockForge',
    html: getEmailVerificationTemplate(name, otp),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, name, otp) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: 'Reset Your Password - MockForge',
    html: getPasswordResetTemplate(name, otp),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};
