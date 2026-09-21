import { fillRandomBytes } from '@/services/randomBytes';

export const LOBBY_CODE_LENGTH = 8;
export const LOBBY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateLobbyCode(): string {
  const bytes = new Uint8Array(LOBBY_CODE_LENGTH);
  fillRandomBytes(bytes);
  return Array.from(bytes, (byte) => LOBBY_CODE_ALPHABET[byte % LOBBY_CODE_ALPHABET.length]).join('');
}
