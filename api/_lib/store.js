/**
 * Tiny Upstash Redis REST client.
 *
 * Written against fetch rather than a package so the functions stay
 * dependency-light and cold-start fast. Works with either Vercel KV's
 * env vars or plain Upstash ones — whichever the project has.
 */

const URL_ =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  '';
const TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  '';

export const storeConfigured = Boolean(URL_ && TOKEN);

async function command(args) {
  if (!storeConfigured) throw new Error('KV store is not configured');

  const res = await fetch(URL_, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    throw new Error(`KV command failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.result;
}

export async function get(key) {
  const raw = await command(['GET', key]);
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

export async function set(key, value, { ttlSeconds } = {}) {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  const args = ['SET', key, payload];
  if (ttlSeconds) args.push('EX', String(ttlSeconds));
  return command(args);
}

/**
 * Fixed-window counter. Returns the count after incrementing, so a caller
 * can compare it against its own limit.
 */
export async function bump(key, windowSeconds) {
  const count = await command(['INCR', key]);
  if (count === 1) await command(['EXPIRE', key, String(windowSeconds)]);
  return count;
}
