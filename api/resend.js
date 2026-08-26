/**
 * POST /api/resend  { email }
 *
 * "I've lost my link." Looks the address up among people who have paid and,
 * if it is one of them, emails the link again.
 *
 * The response is identical whether or not the address paid. Anything else
 * turns this into a way to test whether a given person is a customer.
 */

import { mintToken, emailKey } from './_lib/token.js';
import { get, bump, storeConfigured } from './_lib/store.js';
import { sendAccessLink } from './_lib/mail.js';

const SITE = process.env.SITE_ORIGIN || 'https://tejaldesae.com';

const SAME_ANSWER = {
  ok: true,
  message: 'If that address booked a call, the link is on its way.',
};

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');

  if (!storeConfigured) {
    console.error('[resend] KV store is not configured');
    return res.status(503).json({ error: 'unavailable' });
  }

  const body = await readJson(req);
  const email = String(body.email || '').trim().toLowerCase();

  // Shape check only. Whether the address exists is never revealed.
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'bad_email' });
  }

  const key = emailKey(email);

  try {
    // Two windows: one stops someone hammering a single address, the other
    // stops one machine walking a list of addresses.
    const perEmail = await bump(`rl:mail:${key}`, 3600);
    const perIp = await bump(`rl:ip:${emailKey(clientIp(req))}`, 3600);
    if (perEmail > 3 || perIp > 20) {
      return res.status(429).json({ error: 'too_many_requests' });
    }
  } catch (err) {
    console.error('[resend] rate limiter unavailable:', err.message);
    return res.status(503).json({ error: 'unavailable' });
  }

  let payer = null;
  try {
    payer = await get(`paid:${key}`);
  } catch (err) {
    console.error('[resend] lookup failed:', err.message);
    return res.status(503).json({ error: 'unavailable' });
  }

  if (!payer) return res.status(200).json(SAME_ANSWER);

  try {
    const token = mintToken({ email, paymentId: payer.paymentId });
    await sendAccessLink({
      to: email,
      link: `${SITE}/api/auth?t=${encodeURIComponent(token)}`,
      isResend: true,
    });
  } catch (err) {
    console.error('[resend] send failed:', err.message);
    // Still the same answer — a mail failure must not become a probe either.
  }

  return res.status(200).json(SAME_ANSWER);
}
