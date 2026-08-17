/**
 * services/mailer.js — Email notification for new leads
 *
 * Sends a formatted notification to hello@tejaldesae.com
 * whenever a new lead is captured (assessment, contact form, etc.).
 *
 * Uses Gmail SMTP via Nodemailer with an App Password.
 * See .env.example for required environment variables.
 */
import nodemailer from 'nodemailer';

// ── Configuration ────────────────────────────────────────────
const NOTIFY_TO = process.env.LEAD_NOTIFY_EMAIL || 'hello@tejaldesae.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── Archetype labels ─────────────────────────────────────────
const ARCHETYPE_NAMES = {
  A: 'The Guard',
  B: 'The Prover',
  C: 'The Hider',
  D: 'The Giver',
  E: 'The Gripper',
};

const CATEGORY_LABELS = {
  A: 'Safety',
  B: 'Worthiness',
  C: 'Visibility',
  D: 'Receiving',
  E: 'Ease',
};

// ── Public API ───────────────────────────────────────────────

/**
 * Send a new-lead email notification.
 *
 * @param {Object} lead - Lead data
 * @param {string} lead.name        - Full name
 * @param {string} lead.email       - Email address
 * @param {string} [lead.phone]     - Phone / WhatsApp
 * @param {string} [lead.program]   - Program interest
 * @param {string} [lead.source]    - Lead source (e.g. 'Assessment Quiz')
 * @param {string} [lead.archetype] - Top archetype letter (A-E)
 * @param {Object} [lead.scores]    - Category scores {A:3, B:1, ...}
 * @param {string} [lead.message]   - Freeform message
 */
export async function notifyNewLead(lead) {
  // Skip if Gmail credentials aren't configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[mailer] Gmail credentials not configured — skipping email notification.');
    return false;
  }

  const archetypeName = ARCHETYPE_NAMES[lead.archetype] || lead.archetype || '';
  const scoresDisplay = formatScoresForEmail(lead.scores);
  const subject = buildSubject(lead);

  const html = `
    <div style="font-family:'Jost',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#154230">
      <div style="background:#154230;padding:28px 32px;text-align:center">
        <h1 style="color:#e6d3a3;font-size:22px;margin:0;font-weight:500;letter-spacing:0.08em">
          New Lead — ${escHtml(lead.source || 'Website')}
        </h1>
      </div>

      <div style="background:#FBFAF6;padding:28px 32px">
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          <tr>
            <td style="padding:10px 0;font-weight:500;width:130px;vertical-align:top;color:#154230">Name</td>
            <td style="padding:10px 0">${escHtml(lead.name || '—')}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:500;vertical-align:top;color:#154230">Email</td>
            <td style="padding:10px 0"><a href="mailto:${escHtml(lead.email)}" style="color:#154230">${escHtml(lead.email || '—')}</a></td>
          </tr>
          ${lead.phone ? `
          <tr>
            <td style="padding:10px 0;font-weight:500;vertical-align:top;color:#154230">Phone</td>
            <td style="padding:10px 0">${escHtml(lead.phone)}</td>
          </tr>` : ''}
          ${lead.program ? `
          <tr>
            <td style="padding:10px 0;font-weight:500;vertical-align:top;color:#154230">Program</td>
            <td style="padding:10px 0">${escHtml(lead.program)}</td>
          </tr>` : ''}
          ${archetypeName ? `
          <tr>
            <td style="padding:10px 0;font-weight:500;vertical-align:top;color:#154230">Archetype</td>
            <td style="padding:10px 0;font-weight:600;color:#154230">${escHtml(archetypeName)}</td>
          </tr>` : ''}
          ${scoresDisplay ? `
          <tr>
            <td style="padding:10px 0;font-weight:500;vertical-align:top;color:#154230">Scores</td>
            <td style="padding:10px 0;font-size:13px;opacity:0.8">${scoresDisplay}</td>
          </tr>` : ''}
          ${lead.message ? `
          <tr>
            <td style="padding:10px 0;font-weight:500;vertical-align:top;color:#154230">Message</td>
            <td style="padding:10px 0;font-style:italic">${escHtml(lead.message)}</td>
          </tr>` : ''}
        </table>
      </div>

      <div style="background:#154230;padding:16px 32px;text-align:center">
        <p style="color:rgba(230,211,163,0.5);font-size:11px;margin:0;letter-spacing:0.12em;text-transform:uppercase">
          tejaldesae.com · Automated Lead Notification
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from:    `"Tejal Desae Website" <${process.env.GMAIL_USER}>`,
      to:      NOTIFY_TO,
      subject,
      html,
    });
    console.log(`[mailer] Lead notification sent → ${NOTIFY_TO} (${lead.email})`);
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send lead notification:', err.message);
    return false;
  }
}


// ── Helpers ──────────────────────────────────────────────────

function buildSubject(lead) {
  const parts = ['🔔 New Lead'];
  if (lead.source)    parts.push(`— ${lead.source}`);
  if (lead.name)      parts.push(`— ${lead.name}`);
  if (lead.archetype) parts.push(`(${ARCHETYPE_NAMES[lead.archetype] || lead.archetype})`);
  return parts.join(' ');
}

function formatScoresForEmail(scores) {
  if (!scores || typeof scores !== 'object') return '';
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([key, val]) => `${CATEGORY_LABELS[key] || key}: ${val}`)
    .join(' · ');
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
