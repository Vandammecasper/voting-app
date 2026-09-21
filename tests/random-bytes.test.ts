import { generateLobbyCode, LOBBY_CODE_ALPHABET, LOBBY_CODE_LENGTH } from '@/services/lobbyCode';
import { fillRandomBytes } from '@/services/randomBytes';

describe('fillRandomBytes', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('fills the buffer when Web Crypto is missing (Hermes / React Native)', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });

    const bytes = new Uint8Array(8);
    fillRandomBytes(bytes);
    expect(bytes.some((byte) => byte !== 0)).toBe(true);
  });

  it('still generates a valid lobby code without Web Crypto', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });

    const first = generateLobbyCode();
    const second = generateLobbyCode();
    expect(first).toHaveLength(LOBBY_CODE_LENGTH);
    expect(second).toHaveLength(LOBBY_CODE_LENGTH);
    expect([...first].every((char) => LOBBY_CODE_ALPHABET.includes(char))).toBe(true);
    expect(first).not.toBe(second);
  });
});
