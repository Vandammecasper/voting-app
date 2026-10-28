const mockOnValue = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
const mockPush = jest.fn();
const mockRef = jest.fn((_db: unknown, path?: string) => ({ path: path ?? '' }));

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({ name: 'app' })),
}));

jest.mock('@/services/firebaseDatabaseUrl', () => ({
  getFirebaseDatabaseUrl: jest.fn(
    () => 'https://example.firebaseio.com'
  ),
}));

jest.mock('@react-native-firebase/database', () => ({
  getDatabase: jest.fn(() => ({ name: 'db' })),
  ref: (...args: unknown[]) => mockRef(...args),
  onValue: (...args: unknown[]) => mockOnValue(...args),
  set: (...args: unknown[]) => mockSet(...args),
  update: (...args: unknown[]) => mockUpdate(...args),
  remove: (...args: unknown[]) => mockRemove(...args),
  push: (...args: unknown[]) => mockPush(...args),
  child: jest.fn(),
  query: jest.fn(),
  orderByChild: jest.fn(),
  equalTo: jest.fn(),
}));

import {
  deleteDataDetailed,
  formatDbError,
  pushDataDetailed,
  readDataDetailed,
  updateDataDetailed,
  writeDataDetailed,
} from '@/services/database';

describe('database detailed helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnValue.mockImplementation((_ref, onSuccess) => {
      onSuccess({ exists: () => false, val: () => null });
      return jest.fn();
    });
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockRemove.mockResolvedValue(undefined);
    mockPush.mockReturnValue({ key: 'generated-key' });
  });

  it('formats native Firebase error codes', () => {
    const error = Object.assign(new Error('Permission denied'), {
      code: 'database/permission-denied',
    });
    expect(formatDbError(error)).toBe(
      'database/permission-denied: Permission denied'
    );
  });

  it('returns ok with null when the path is empty', async () => {
    const result = await readDataDetailed('lobbyCodes/ABC');
    expect(result).toEqual({ ok: true, data: null });
  });

  it('returns ok with data when the snapshot exists', async () => {
    mockOnValue.mockImplementation((_ref, onSuccess) => {
      onSuccess({ exists: () => true, val: () => ({ lobbyId: 'L1' }) });
      return jest.fn();
    });

    const result = await readDataDetailed<{ lobbyId: string }>('lobbyCodes/ABC');
    expect(result).toEqual({ ok: true, data: { lobbyId: 'L1' } });
  });

  it('returns a failure when the read listener errors', async () => {
    mockOnValue.mockImplementation((_ref, _onSuccess, onError) => {
      onError(Object.assign(new Error('Permission denied'), {
        code: 'database/permission-denied',
      }));
      return jest.fn();
    });

    const result = await readDataDetailed('lobbyCodes/ABC');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.method).toBe('GET');
      expect(result.path).toBe('lobbyCodes/ABC');
      expect(result.error).toContain('permission-denied');
    }
  });

  it('returns write failure instead of throwing', async () => {
    mockSet.mockRejectedValue(
      Object.assign(new Error('Permission denied'), {
        code: 'database/permission-denied',
      })
    );

    const result = await writeDataDetailed('lobbies/L1', { status: 'waiting' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.method).toBe('PUT');
      expect(result.error).toContain('Permission denied');
    }
  });

  it('returns push key on success and failure details on error', async () => {
    const ok = await pushDataDetailed('lobbies', { status: 'waiting' });
    expect(ok).toEqual({ ok: true, key: 'generated-key' });

    mockSet.mockRejectedValue(new Error('offline'));
    const failed = await pushDataDetailed('lobbies', { status: 'waiting' });
    expect(failed.ok).toBe(false);
  });

  it('maps update and delete failures', async () => {
    mockUpdate.mockRejectedValue(new Error('patch failed'));
    mockRemove.mockRejectedValue(new Error('delete failed'));

    const patch = await updateDataDetailed('lobbies/L1', { status: 'voting' });
    const del = await deleteDataDetailed('lobbies/L1');

    expect(patch).toMatchObject({ ok: false, method: 'PATCH', error: 'patch failed' });
    expect(del).toMatchObject({ ok: false, method: 'DELETE', error: 'delete failed' });
  });
});
