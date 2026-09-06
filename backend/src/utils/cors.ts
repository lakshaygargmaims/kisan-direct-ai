import { config } from '../config';

/**
 * Allow a request origin when it is:
 *  1. absent (curl, mobile apps, health checks),
 *  2. the configured FRONTEND_URL (production custom domain),
 *  3. any origin listed in CORS_ORIGINS (comma-separated),
 *  4. any *.vercel.app deployment (Vercel preview + production domains),
 *  5. localhost dev origins.
 */
export function isOriginAllowed(origin: string | undefined, requestHost?: string): boolean {
  if (!origin) return true;

  // Same-origin requests (the single-service deployment serves UI + API together)
  try {
    const originHost = new URL(origin).host;
    if (requestHost && originHost === requestHost) return true;
  } catch {
    /* fall through to the allow-list */
  }

  const exact = new Set<string>();
  if (config.frontendUrl) exact.add(config.frontendUrl.replace(/\/+$/, ''));
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .forEach((o) => exact.add(o));

  if (exact.has(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.railway.app')
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
