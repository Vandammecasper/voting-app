jest.mock('@/services/firebaseAuth', () => ({
  getCurrentIdToken: jest.fn(),
  getFirebaseAuth: jest.fn(),
}));

jest.mock('@/services/firebaseDatabaseUrl', () => ({
  getFirebaseDatabaseUrl: jest.fn(),
}));

import { getCurrentIdToken, getFirebaseAuth } from '@/services/firebaseAuth';
import { getFirebaseDatabaseUrl } from '@/services/firebaseDatabaseUrl';
import { restGet } from '@/services/firebaseRest';

describe('firebase REST authentication', () => {
  const token = 'test-id-token-secret';
  const base = 'https://example.firebaseio.com';

  beforeEach(() => {
    jest.clearAllMocks();
    (getFirebaseAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'u1' } });
    (getCurrentIdToken as jest.Mock).mockResolvedValue(token);
    (getFirebaseDatabaseUrl as jest.Mock).mockReturnValue(base);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => 'null',
    }) as unknown as typeof fetch;
  });

  it('sends Authorization Bearer and keeps the ID token out of the URL', async () => {
    await restGet('lobbies/abc');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${base}/lobbies/abc.json`);
    expect(url).not.toContain(token);
    expect(url).not.toMatch(/[?&]auth=/);
    expect(init.headers.Authorization).toBe(`Bearer ${token}`);
  });
});
