/**
 * Nickname store for "OOO이(가) 추가함" display.
 *
 * Spotify API does not support per-item notes, so we store nicknames here.
 *
 * Current implementation: in-memory Map (resets on Lambda cold start).
 * Production recommendation: Replace with Vercel KV or Upstash Redis.
 *   npm install @vercel/kv
 *   import { kv } from "@vercel/kv"
 *   export const setNickname = (uri, nick) => kv.set(`nick:${uri}`, nick)
 *   export const getNicknames = (uris) => Promise.all(uris.map(u => kv.get(`nick:${u}`)))
 */

const store = new Map<string, string>();

export function setNickname(trackUri: string, nickname: string): void {
  store.set(trackUri, nickname);
}

export function getNicknames(
  trackUris: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const uri of trackUris) {
    const nick = store.get(uri);
    if (nick) result[uri] = nick;
  }
  return result;
}

export function deleteNickname(trackUri: string): void {
  store.delete(trackUri);
}
