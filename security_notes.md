# Security notes

This app has no separate API server. Firebase Realtime Database security rules in `database.rules.json` are the authorization boundary. The Expo client is untrusted.

## Stay on ReBAC, not a role table

Access is relationship-based:

- **Creator** of a lobby (`lobbies/$id/creatorId === auth.uid`) may update status (`waiting`, `voting`, `results`, `ranking`, `completed`), manage participants, read anonymized vote bodies for the reveal, and delete the session. Host status writes must not be blocked by comparing `teamMembers` with `.val() ===`; that check rejects otherwise-valid sibling updates on team lobbies.
- **Participant** (`participants/$lobbyId/$uid` exists) may read the lobby and participant list, submit one vote, and read vote receipts (who has / has not voted) without seeing other people's ballots. After the lobby is `ranking` or `completed`, participants may read vote bodies so historical results can be shown when published rankings are missing.
- **Secret ballot:** Ballots live under `votes/$lobbyId/$ballotId` with opaque ids (not Firebase uids) and must not embed `voterId`/`userId`/`uid`. `voteReceipts/$lobbyId/$uid` is the shared roster signal for everyone in the lobby, including the host. `ownBallots/$lobbyId/$uid` maps a voter to their ballot id and is readable only by that voter, so the host cannot re-link content to people.
- **Join** is automatic with a valid lobby code. Anyone with the code may create their own `participants/$lobbyId/$uid` row while the lobby is `waiting` or `voting`, by including a matching `joinCode`. Knowing only the lobby push ID is not enough. After joining, the client also writes a name-keyed `claimedNames` slot. Existing members can rejoin without rewriting their participant row.
- **Participant names** are frozen after join. A member may change `name` only when the creator set `nameChangeRequested`, and only while the lobby is `waiting` or `voting`.
- **Claimed names** on the publicly readable `lobbyCodes` mapping are keyed by display name, not by Firebase uid, so joiners can omit taken team names without leaking account ids.

Do not replace this with a flat `role: host | player` field on the user or participant record. A client-written `isCreator` flag was removed for that reason.

Anonymous Firebase Auth is the intended identity model for this product. Every `auth != null` rule is therefore equivalent to “anyone who installed the app.” Keep reads scoped to creator/participant relationships.

## Join codes and ID entropy

Lobby join codes are 8-character values from an unambiguous alphabet (`services/lobbyCode.ts`), generated with `crypto.getRandomValues`. They replace sequential 6-digit numeric codes.

Firebase push IDs remain time-ordered. They are not public join tokens. Treat the join code as the shared secret.

Integer or sequential IDs should not be used as external identifiers. Codes are still guessable in principle; this is defense-in-depth, not a substitute for rate limiting.

## Residual risk without a backend

Realtime Database rules cannot rate-limit code lookups. An attacker with a custom client and anonymous auth can still brute-force `lobbyCodes/$code`. Mitigations in this codebase:

- Higher-entropy codes
- Locked `lobbyCodes` writes (no hijack/remap)
- Lobby and participant reads restricted to members
- Vote bodies readable by the host for the reveal and by the submitting voter via `ownBallots`; other participants only after ranking/completed. Receipts expose participation, not ballot content. Timing correlation between a new receipt and a new anonymous ballot remains a residual risk without a backend
- **Client-side lobby-code lookup throttle** (`services/lobbyCodeLookup.ts`): the official app persists a per-device bucket in AsyncStorage (20 attempts / 10 minutes). Join preview charges each distinct code once so polling does not burn the quota. This does not require Cloud Functions or a Blaze plan. It slows casual abuse in the shipped app only; a modified client can bypass it. A trusted callable with server-side throttling would be stronger if the project later upgrades.

## Authorization tests

`security/authorization-matrix.json` lists path × principal × action → allow/deny. `tests/authorization-matrix.test.js` loads that matrix and executes it against the RTDB emulator (`npm run test:rules`). Do not add one-off role/endpoint cases outside the matrix.
