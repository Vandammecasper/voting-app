# Security notes

This app has no separate API server. Firebase Realtime Database security rules in `database.rules.json` are the authorization boundary. The Expo client is untrusted.

## Stay on ReBAC, not a role table

Access is relationship-based:

- **Creator** of a lobby (`lobbies/$id/creatorId === auth.uid`) may update status (`waiting`, `voting`, `results`, `ranking`, `completed`), manage participants, read vote bodies, and delete the session. Host status writes must not be blocked by comparing `teamMembers` with `.val() ===`; that check rejects otherwise-valid sibling updates on team lobbies.
- **Participant** (`participants/$lobbyId/$uid` exists) may read the lobby and participant list, submit one vote, and read vote receipts (counts) without comments. After the lobby is `ranking` or `completed`, participants may read vote bodies so historical results can be shown when published rankings are missing. While the lobby is still `voting` or `results`, comments stay host/self-only.
- **Join** always requires a host-approved request. A non-member may write only `joinRequests/$lobbyId/$uid` as `pending`, and must include the lobby `code`. Knowing a lobby push ID is not enough to become a participant or to file a request. The creator admits by writing `participants` (and a name-keyed `claimedNames` slot) then setting the request to `approved` or `denied`.
- **Participant names** are frozen after join. A member may change `name` only when the creator set `nameChangeRequested`, and only while the lobby is `waiting` or `voting`.
- **Claimed names** on the publicly readable `lobbyCodes` mapping are keyed by display name, not by Firebase uid, so joiners can omit taken team names without leaking account ids.

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
- Vote comments readable only by the voter and the host until ranking is published; participants can then read votes so old sessions without stored rankings still show results

A Cloud Function that performs join/vote with abuse throttling would further reduce brute-force risk. That is out of scope for the rules-first hardening.

## Authorization tests

`security/authorization-matrix.json` lists path × principal × action → allow/deny. `tests/authorization-matrix.test.js` loads that matrix and executes it against the RTDB emulator (`npm run test:rules`). Do not add one-off role/endpoint cases outside the matrix.
