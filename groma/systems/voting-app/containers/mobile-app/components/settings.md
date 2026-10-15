---
type: C4 Component
title: Settings
status: stable
groma:
  id: settings
  parent: mobile-app
  code:
    - scanner: react
      file: app/(tabs)/settings/index.tsx
    - scanner: typescript
      file: app/(tabs)/settings/index.tsx
      symbol: SettingsScreen
    - scanner: react
      file: app/(tabs)/settings/_layout.tsx
    - scanner: typescript
      file: app/(tabs)/settings/_layout.tsx
      symbol: SettingsLayout
    - scanner: react
      file: app/(tabs)/settings/teams.tsx
    - scanner: typescript
      file: app/(tabs)/settings/teams.tsx
      symbol: TeamsScreen
    - scanner: react
      file: app/(tabs)/settings/team-edit.tsx
    - scanner: typescript
      file: app/(tabs)/settings/team-edit.tsx
      symbol: TeamEditScreen
    - scanner: typescript
      file: services/teams.ts
    - scanner: react
      file: app/(tabs)/settings/feature-requests.tsx
    - scanner: typescript
      file: app/(tabs)/settings/feature-requests.tsx
    - scanner: typescript
      file: services/feature-request-status-core.ts
    - scanner: typescript
      file: services/feature-request-status.ts
  technology: Expo Router
description: Teams, feature requests with Backlog board status, and account links.
---

Settings hub plus saved-team CRUD against userTeams, feature-request submission with in-app boardStatus badges, and outbound links to the support site for support, privacy, and terms. Feature-request statuses (Request pending through Done) are mirrored from Backlog.md by the Admin sync script. Bug reports use an on-device mailto composer. The teams module also exposes roster helpers that Lobby, Voting session, and History reuse for team lobbies.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [services/teams.ts](../../../../../../services/teams.ts) | [services/firebaseRest.ts](../../../../../../services/firebaseRest.ts) | Persists saved teams | REST |
| [settings](settings.md) | [support-site](../../../../../externals/support-site.md) | Opens support pages | Expo Linking |
| [services/teams.ts](../../../../../../services/teams.ts) | [services/firebaseAuth.ts](../../../../../../services/firebaseAuth.ts) | Scopes teams to user | Firebase Auth |
| [app/(tabs)/settings/feature-requests.tsx](../../../../../../app/(tabs)/settings/feature-requests.tsx) | [contexts/AuthContext.tsx](../../../../../../contexts/AuthContext.tsx) | Attributes feature requests | React context |
| [app/(tabs)/settings/feature-requests.tsx](../../../../../../app/(tabs)/settings/feature-requests.tsx) | [services/firebaseRest.ts](../../../../../../services/firebaseRest.ts) | CRUD feature requests | REST |
| [app/(tabs)/settings/teams.tsx](../../../../../../app/(tabs)/settings/teams.tsx) | [contexts/AuthContext.tsx](../../../../../../contexts/AuthContext.tsx) | Scopes team list | React context |
