# Security notes

This app has no separate API server. Firebase Realtime Database security rules in `database.rules.json` are the authorization boundary. The Expo client is untrusted.

## Stay on ReBAC, not a role table

Access is relationship-based:

- **Creator** of a lobby (`lobbies/$id/creatorId === auth.uid`) may update status, manage participants, read vote bodies, and delete the session.
- **Participant** (`participants/$lobbyId/$uid` exists) may read the lobby and participant list, submit one vote, and read vote receipts (counts) without comments.
- **Join** is allowed while the lobby is `waiting` and `lobbyCodes/{lobby.code}` maps to that lobby. Knowing a lobby push ID is not enough.
- **Late join** after voting starts is a host-approved request: a non-member may write only `joinRequests/$lobbyId/$uid` as `pending`. The creator admits by writing `participants` (and `claimedNames`) then setting the request to `approved` or `denied`. Requesters cannot self-join `participants` during `voting`.
- **Claimed names** live on the publicly readable `lobbyCodes` mapping so joiners can omit taken team names before they are members. Only that participant or the lobby creator may write a claimed-name slot.

Do not replace this with a flat `role: host | player` field on the user or participant record. A client-written `isCreator` flag was removed for that reason.

Anonymous Firebase Auth is the intended identity model for this product. Every `auth != null` rule is therefore equivalent to “anyone who installed the app.” Keep reads scoped to creator/participant relationships.

## Join codes and ID entropy

Lobby join codes are 8-character values from an unambiguous alphabet (`services/lobbyCode.ts`), generated with `crypto.getRandomValues`. They replace sequential 6-digit numeric codes.

Firebase push IDs remain time-ordered. They are not public join tokens. Treat the join code as the shared secret.

Integer or sequential IDs should not be used as external identifiers. Codes are still guessable in principle; this is defense-in-depth, not a substitute for rate limiting.

## Residual risk without a backend

Realtime Database rules cannot rate-limit code lookups. An attacker with anonymous auth can brute-force `lobbyCodes/$code`. Mitigations in this codebase:

- Higher-entropy codes
- Locked `lobbyCodes` writes (no hijack/remap)
- Lobby and participant reads restricted to members
- Vote comments readable only by the voter and the host; rankings are published aggregates

A Cloud Function that performs join/vote with abuse throttling would further reduce brute-force risk. That is out of scope for the rules-first hardening.

## Authorization tests

`security/authorization-matrix.json` lists path × principal × action → allow/deny. `tests/authorization-matrix.test.js` loads that matrix and executes it against the RTDB emulator (`npm run test:rules`). Do not add one-off role/endpoint cases outside the matrix.
