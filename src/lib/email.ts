import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? 'MAHA From the Farm <noreply@mahafromthefarm.com>';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mahafromthefarm.com';

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', to);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (e) {
    console.error('[email] send failed:', e);
  }
}

function base(previewText: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${previewText}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>
  <div style="max-width:580px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:#1b4332;border-radius:12px 12px 0 0;padding:24px 32px;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">MAHA From the Farm</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6ee7b7;">Certification Program</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:36px 32px;border:1px solid #e7e5e4;border-top:none;">
      ${content}
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:#a8a29e;margin-top:20px;line-height:1.6;">
      © ${new Date().getFullYear()} MAHA From the Farm &nbsp;·&nbsp;
      <a href="${SITE}" style="color:#a8a29e;text-decoration:underline;">mahafromthefarm.com</a>
    </p>

  </div>
</body>
</html>`;
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#2d6a4f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;margin-top:8px;">${text}</a>`;
}

function statusColor(status: string) {
  if (status === 'approved') return '#166534';
  if (status === 'rejected') return '#991b1b';
  if (status === 'needs_clarification') return '#92400e';
  return '#44403c';
}

function statusLabel(status: string) {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Not Approved';
  if (status === 'needs_clarification') return 'Needs Clarification';
  return status;
}

// ─── Application Received ───────────────────────────────────────────────────

export async function sendApplicationConfirmation(
  to: string,
  entityName: string,
  type: 'restaurant' | 'farm'
) {
  const label = type === 'restaurant' ? 'restaurant application' : 'farm registration';
  const dashboard = type === 'restaurant' ? `${SITE}/dashboard/restaurant` : `${SITE}/dashboard/farm`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;">We received your application</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#78716c;">Thank you for submitting your ${label}.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#166534;">${entityName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#15803d;">Application received — pending review</p>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:#57534e;">What happens next:</p>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#57534e;line-height:1.8;">
      <li>Our team will review your ${type === 'restaurant' ? 'dish submissions and supplier details' : 'farm profile and certifications'}</li>
      <li>We may reach out if we need additional information</li>
      <li>You'll receive an email once a decision has been made</li>
    </ul>

    <p style="margin:0 0 20px;font-size:14px;color:#57534e;">You can check your application status at any time from your dashboard.</p>
    ${btn('Go to Dashboard', dashboard)}
  `;

  await send(to, `Application received — ${entityName}`, base(`We received your ${label} for ${entityName}`, content));
}

// ─── Submission Decision ─────────────────────────────────────────────────────

export async function sendSubmissionDecision(
  to: string,
  restaurantName: string,
  status: string,
  adminNotes?: string | null
) {
  const color = statusColor(status);
  const label = statusLabel(status);

  let headline = '';
  let body = '';

  if (status === 'approved') {
    headline = 'Your submission has been approved!';
    body = `<p style="margin:0 0 16px;font-size:14px;color:#57534e;">Congratulations — your submission for <strong>${restaurantName}</strong> has been reviewed and approved. Your certified dishes are now listed in the MAHA From the Farm public directory.</p>`;
  } else if (status === 'rejected') {
    headline = 'Your submission was not approved';
    body = `<p style="margin:0 0 16px;font-size:14px;color:#57534e;">After review, we were unable to approve this submission for <strong>${restaurantName}</strong>. This may be due to certification requirements not being met for the main element of one or more dishes.</p>`;
  } else if (status === 'needs_clarification') {
    headline = 'We need more information';
    body = `<p style="margin:0 0 16px;font-size:14px;color:#57534e;">Our team has a question about your submission for <strong>${restaurantName}</strong>. Please review the note below and contact us if you have additional information to provide.</p>`;
  } else {
    headline = `Submission update: ${label}`;
    body = `<p style="margin:0 0 16px;font-size:14px;color:#57534e;">Your submission for <strong>${restaurantName}</strong> has been updated.</p>`;
  }

  const notesBlock = adminNotes ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Note from MAHA</p>
      <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${adminNotes}</p>
    </div>` : '';

  const content = `
    <div style="display:inline-block;background:${color}20;border:1px solid ${color}40;border-radius:20px;padding:4px 12px;margin-bottom:16px;">
      <span style="font-size:12px;font-weight:600;color:${color};">${label}</span>
    </div>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1c1917;">${headline}</h1>
    ${body}
    ${notesBlock}
    ${btn('View Dashboard', `${SITE}/dashboard/restaurant`)}
    ${status === 'rejected' ? `<p style="margin:16px 0 0;font-size:13px;color:#a8a29e;">You are welcome to reapply with updated sourcing information.</p>` : ''}
  `;

  await send(to, `${label} — ${restaurantName}`, base(headline, content));
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;">Reset your password</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#78716c;">
      A password reset was requested for your MAHA From the Farm account. Click the button below to set a new password.
      This link expires in 24 hours.
    </p>
    ${btn('Reset Password', resetLink)}
    <p style="margin:20px 0 0;font-size:12px;color:#a8a29e;">
      If you didn't request this, you can safely ignore this email. Your password will not change.
    </p>
  `;
  await send(to, 'Reset your MAHA From the Farm password', base('Reset your password', content));
}

// ─── Farm Decision ────────────────────────────────────────────────────────────

export async function sendFarmDecision(to: string, farmName: string, status: string) {
  const color = statusColor(status);
  const label = statusLabel(status);

  let headline = '';
  let body = '';

  if (status === 'approved') {
    headline = 'Your farm has been approved!';
    body = `<p style="margin:0 0 16px;font-size:14px;color:#57534e;">Welcome to the MAHA From the Farm network. <strong>${farmName}</strong> is now listed in the public directory and visible to restaurants looking for verified local suppliers.</p>`;
  } else {
    headline = 'Your farm application was not approved';
    body = `<p style="margin:0 0 16px;font-size:14px;color:#57534e;">After review, we were unable to approve the listing for <strong>${farmName}</strong> at this time. If you have questions or would like to discuss your application, please reach out to us directly.</p>`;
  }

  const content = `
    <div style="display:inline-block;background:${color}20;border:1px solid ${color}40;border-radius:20px;padding:4px 12px;margin-bottom:16px;">
      <span style="font-size:12px;font-weight:600;color:${color};">${label}</span>
    </div>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1c1917;">${headline}</h1>
    ${body}
    ${btn('View Dashboard', `${SITE}/dashboard/farm`)}
    <p style="margin:20px 0 0;font-size:13px;color:#a8a29e;">
      Questions? Email us at <a href="mailto:info@mahafromthefarm.com" style="color:#2d6a4f;">info@mahafromthefarm.com</a>
    </p>
  `;

  await send(to, `${label} — ${farmName}`, base(headline, content));
}
