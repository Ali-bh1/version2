/**
 * POST /api/razorpay-webhook
 *
 * Razorpay calls this when a payment is captured. It is the only place a
 * customer becomes entitled — nothing the browser sends can grant access.
 *
 * Point Razorpay's webhook at https://tejaldesae.com/api/razorpay-webhook
 * and subscribe to `payment.captured`.
 */

import { verifyRazorpaySignature, mintToken, emailKey } from './_lib/token.js';
import { set, storeConfigured } from './_lib/store.js';
import { sendAccessLink } from './_lib/mail.js';

// The signature is computed over the raw bytes, so the parser must stay off.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const SITE = process.env.SITE_ORIGIN || 'https://tejaldesae.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let raw;
  try {
    raw = await readRawBody(req);
  } catch {
    return res.status(400).json({ error: 'unreadable_body' });
  }

  if (!verifyRazorpaySignature(raw, req.headers['x-razorpay-signature'])) {
    // Do not say why. An attacker probing the secret learns nothing from this.
    return res.status(401).json({ error: 'bad_signature' });
  }

  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'bad_json' });
  }

  if (event.event !== 'payment.captured') {
    // Acknowledge anything else so Razorpay stops retrying it.
    return res.status(200).json({ ok: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity || {};
  const email = (payment.email || '').trim().toLowerCase();
  const paymentId = payment.id || null;

  if (!email) {
    // Nothing to send to. Acknowledge — retrying will not produce an email.
    console.warn('[webhook] payment.captured with no email', paymentId);
    return res.status(200).json({ ok: true, skipped: 'no_email' });
  }

  const token = mintToken({ email, paymentId });
  const link = `${SITE}/api/auth?t=${encodeURIComponent(token)}`;

  // Record the payer so "resend my link" can recognise them later. If the
  // store is down we still send the email — losing the resend path is far
  // better than losing the customer's access entirely.
  if (storeConfigured) {
    try {
      await set(`paid:${emailKey(email)}`, { paymentId, at: Date.now() });
    } catch (err) {
      console.error('[webhook] could not record payer:', err.message);
    }
  }

  try {
    await sendAccessLink({ to: email, link });
  } catch (err) {
    console.error('[webhook] could not send access link:', err.message);
    // 500 asks Razorpay to retry, which is what we want — the customer has
    // paid and has no link yet.
    return res.status(500).json({ error: 'mail_failed' });
  }

  return res.status(200).json({ ok: true });
}
