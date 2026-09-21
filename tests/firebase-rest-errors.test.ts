jest.mock('@/services/firebaseAuth', () => ({
  getCurrentIdToken: jest.fn(),
  getFirebaseAuth: jest.fn(() => ({ currentUser: null })),
}));

jest.mock('@/services/firebaseDatabaseUrl', () => ({
  getFirebaseDatabaseUrl: jest.fn(),
}));

import { formatCaughtError, formatRestFailure, isTransientFetchError } from '@/services/firebaseRest';

describe('firebase REST error formatting', () => {
  it('includes method, path, status, and the Firebase error body', () => {
    expect(
      formatRestFailure({
        ok: false,
        path: 'lobbies/abc',
        method: 'PUT',
        status: 401,
        error: 'Permission denied',
      })
    ).toBe('PUT lobbies/abc (HTTP 401): Permission denied');
  });

  it('says no response when the request never reached Firebase', () => {
    expect(
      formatRestFailure({
        ok: false,
        path: 'lobbyCodes',
        method: 'GET',
        status: null,
        error: 'Not signed in',
      })
    ).toBe('GET lobbyCodes (no response): Not signed in');
  });

  it('treats cancelled native fetches as a failed request instead of throwing', () => {
    expect(
      isTransientFetchError(
        new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].")
      )
    ).toBe(true);
  });

  it('includes native Firebase error codes when present', () => {
    const error = Object.assign(new Error('Permission denied'), {
      code: 'database/permission-denied',
    });
    expect(formatCaughtError(error)).toBe(
      'database/permission-denied: Permission denied'
    );
  });
});
