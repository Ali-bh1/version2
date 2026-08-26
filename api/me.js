/**
 * GET /api/me
 *
 * "Is the person holding this cookie entitled?" The gate script on the
 * assessment and report pages asks this before showing anything.
 */

import { verifyToken, readCookie, COOKIE_NAME } from './_lib/token.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const claims = verifyToken(readCookie(req, COOKIE_NAME));
  if (!claims) return res.status(401).json({ ok: false });

  return res.status(200).json({ ok: true, email: claims.email });
}
