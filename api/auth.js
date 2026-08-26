/**
 * GET /api/auth?t=<token>
 *
 * The target of the magic link. Verifies the token, exchanges it for an
 * HttpOnly cookie, and redirects to the assessment. The token leaves the
 * URL at this point, so it never lingers in browser history or in a
 * Referer header sent to a third party.
 */

import { verifyToken, accessCookie } from './_lib/token.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const token = typeof req.query.t === 'string' ? req.query.t : '';
  const claims = verifyToken(token);

  if (!claims) {
    res.setHeader('Location', '/eq-t1uqlm.html?link=invalid');
    return res.status(302).end();
  }

  // `next` lets the same link land on the report instead, but only ever on
  // a path of this site — never an absolute URL an attacker could supply.
  const next = typeof req.query.next === 'string' ? req.query.next : '';
  const dest = /^\/[A-Za-z0-9._~\-/]*$/.test(next) && !next.startsWith('//')
    ? next
    : '/eq-t1uqlm.html';

  res.setHeader('Set-Cookie', accessCookie(token));
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', dest);
  return res.status(302).end();
}
