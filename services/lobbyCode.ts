export const LOBBY_CODE_LENGTH = 8;
export const LOBBY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateLobbyCode(): string {
  const bytes = new Uint8Array(LOBBY_CODE_LENGTH);
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    throw new Error('Secure random generator is unavailable');
  }
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => LOBBY_CODE_ALPHABET[byte % LOBBY_CODE_ALPHABET.length]).join('');
}
