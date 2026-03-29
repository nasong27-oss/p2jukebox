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

export function getAllNicknames(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [uri, nick] of store.entries()) {
    result[uri] = nick;
  }
  return result;
}

export function deleteNickname(trackUri: string): void {
  store.delete(trackUri);
}
