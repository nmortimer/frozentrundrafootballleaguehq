import type { VercelRequest, VercelResponse } from '@vercel/node';
import { currentNflSeason } from './compute-league-history.js';

/**
 * Debug only — confirms FantasyPros params before the power rankings rely
 * on them. Example:
 *   /api/fp-raw?q=type=dynasty%26position=ALL%26scoring=PPR
 * Returns the response's top-level keys, player count, and first 3 players.
 * Never returns the API key.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.FANTASYPROS_API_KEY;
  if (!key) return res.status(400).json({ error: 'FANTASYPROS_API_KEY is not set on the server.' });
  const season = Number(req.query.season) || currentNflSeason();
  const q = String(req.query.q ?? 'position=ALL&scoring=PPR');
  const url = `https://api.fantasypros.com/public/v2/json/nfl/${season}/consensus-rankings?${q}`;
  const r = await fetch(url, { headers: { 'x-api-key': key } });
  const body: any = await r.json().catch(() => null);
  const { players, ...meta } = body ?? {};
  return res.status(r.status).json({
    request: `/nfl/${season}/consensus-rankings?${q}`,
    status: r.status,
    topLevelKeys: Object.keys(body ?? {}),
    meta,
    playerCount: Array.isArray(players) ? players.length : null,
    firstPlayers: Array.isArray(players) ? players.slice(0, 3) : body,
  });
}
