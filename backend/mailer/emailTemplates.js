const BRAND_NAME = 'MediSmart';

const emailShell = ({ preheader, title, body }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f9fc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#03045e;line-height:1.6;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f9fc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #caf0f8;box-shadow:0 12px 40px -18px rgba(3,4,94,0.25);">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#03045e,#0077b6,#00b4d8);"></td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;">
              <div style="display:inline-block;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#0077b6,#00b4d8);line-height:44px;font-size:20px;color:#ffffff;">&#9829;</div>
              <p style="margin:12px 0 0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#0077b6;">${BRAND_NAME}</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#03045e;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-size:15px;color:#334155;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">This is an automated message from ${BRAND_NAME}. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const codeBlock = (code) => `
<div style="margin:24px 0;text-align:center;">
  <div style="display:inline-block;padding:16px 28px;border-radius:12px;background:#f0f9fc;border:1px dashed #90e0ef;">
    <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0077b6;">${code}</span>
  </div>
</div>
`;

const VERIFICATION_EMAIL_TEMPLATE = emailShell({
  preheader: 'Your MediSmart verification code is ready.',
  title: 'Verify your email',
  body: `
    <p style="margin:0 0 12px;">Hello,</p>
    <p style="margin:0 0 12px;">Thanks for joining <strong>${BRAND_NAME}</strong>. Use the code below to verify your email and activate your account:</p>
    ${codeBlock('{verificationCode}')}
    <p style="margin:0 0 12px;">Enter this code on the verification page to complete your registration.</p>
    <p style="margin:0;color:#64748b;font-size:13px;">This code expires in 15 minutes. If you did not create an account, you can safely ignore this email.</p>
    <p style="margin:20px 0 0;">Best regards,<br><strong>The ${BRAND_NAME} Team</strong></p>
  `,
});

const WELCOME_EMAIL_TEMPLATE = emailShell({
  preheader: 'Welcome to MediSmart — your clinical platform is ready.',
  title: 'Welcome aboard',
  body: `
    <p style="margin:0 0 12px;">Hello <strong>{name}</strong>,</p>
    <p style="margin:0 0 12px;">Your email has been verified and your <strong>${BRAND_NAME}</strong> account is now active.</p>
    <p style="margin:0 0 20px;">Sign in to set up your clinic area, invite your team, and start managing patient workflows from one place.</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;padding:12px 24px;border-radius:10px;background:linear-gradient(90deg,#0077b6,#00b4d8);color:#ffffff;font-weight:600;text-decoration:none;">Sign in to ${BRAND_NAME}</span>
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;">Need help? Contact your system administrator.</p>
    <p style="margin:20px 0 0;">Best regards,<br><strong>The ${BRAND_NAME} Team</strong></p>
  `,
});

const PASSWORD_RESET_REQUEST_TEMPLATE = emailShell({
  preheader: 'Reset your MediSmart password with this code.',
  title: 'Reset your password',
  body: `
    <p style="margin:0 0 12px;">Hello,</p>
    <p style="margin:0 0 12px;">We received a request to reset your <strong>${BRAND_NAME}</strong> password. Use the code below to continue:</p>
    ${codeBlock('{resetCode}')}
    <p style="margin:0 0 12px;">Enter this code on the password reset page to choose a new password.</p>
    <p style="margin:0;color:#64748b;font-size:13px;">This code expires in 1 hour. If you did not request a reset, please ignore this email.</p>
    <p style="margin:20px 0 0;">Best regards,<br><strong>The ${BRAND_NAME} Team</strong></p>
  `,
});

const PASSWORD_RESET_SUCCESS_TEMPLATE = emailShell({
  preheader: 'Your MediSmart password was changed successfully.',
  title: 'Password updated',
  body: `
    <p style="margin:0 0 12px;">Hello,</p>
    <p style="margin:0 0 12px;">This confirms that your <strong>${BRAND_NAME}</strong> password was changed successfully.</p>
    <div style="margin:24px 0;text-align:center;">
      <div style="display:inline-block;width:52px;height:52px;border-radius:50%;background:#0077b6;color:#ffffff;font-size:28px;line-height:52px;">&#10003;</div>
    </div>
    <p style="margin:0 0 12px;">If you did not make this change, contact your administrator immediately.</p>
    <ul style="margin:0 0 12px;padding-left:20px;color:#475569;font-size:14px;">
      <li>Use a strong, unique password</li>
      <li>Never share your login credentials</li>
      <li>Sign out on shared devices</li>
    </ul>
    <p style="margin:20px 0 0;">Best regards,<br><strong>The ${BRAND_NAME} Team</strong></p>
  `,
});

module.exports = {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
};
