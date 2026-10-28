jest.mock('@/services/firebaseAuth', () => ({
  getFirebaseAuth: jest.fn(),
}));

const mockReadDataDetailed = jest.fn();
const mockWriteDataDetailed = jest.fn();
const mockUpdateDataDetailed = jest.fn();
const mockDeleteDataDetailed = jest.fn();
const mockPushDataDetailed = jest.fn();

jest.mock('@/services/database', () => ({
  readDataDetailed: (...args: unknown[]) => mockReadDataDetailed(...args),
  writeDataDetailed: (...args: unknown[]) => mockWriteDataDetailed(...args),
  updateDataDetailed: (...args: unknown[]) => mockUpdateDataDetailed(...args),
  deleteDataDetailed: (...args: unknown[]) => mockDeleteDataDetailed(...args),
  pushDataDetailed: (...args: unknown[]) => mockPushDataDetailed(...args),
}));

import { getFirebaseAuth } from '@/services/firebaseAuth';
import { restGet, restPutDetailed } from '@/services/firebaseRest';

describe('firebaseRest SDK-backed authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getFirebaseAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'u1' } });
    mockReadDataDetailed.mockResolvedValue({ ok: true, data: null });
    mockWriteDataDetailed.mockResolvedValue({ ok: true });
    global.fetch = jest.fn();
  });

  it('reads through the native SDK and never calls fetch with an auth= URL', async () => {
    await restGet('lobbies/abc');

    expect(mockReadDataDetailed).toHaveBeenCalledWith('lobbies/abc');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('writes through the native SDK without putting tokens in URLs', async () => {
    const result = await restPutDetailed('lobbies/abc', { status: 'waiting' });

    expect(result).toEqual({ ok: true });
    expect(mockWriteDataDetailed).toHaveBeenCalledWith('lobbies/abc', {
      status: 'waiting',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects when the user is not signed in', async () => {
    (getFirebaseAuth as jest.Mock).mockReturnValue({ currentUser: null });

    const result = await restPutDetailed('lobbies/abc', { status: 'waiting' });
    expect(result).toEqual({
      ok: false,
      path: 'lobbies/abc',
      method: 'PUT',
      status: null,
      error: 'Not signed in',
    });
    expect(mockWriteDataDetailed).not.toHaveBeenCalled();
  });
});
