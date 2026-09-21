import { getFirebaseAuth } from '@/services/firebaseAuth';
import { restDelete, restGet, restPatch, restPush } from '@/services/firebaseRest';

export const MIN_TEAM_MEMBERS = 2;

export interface UserTeam {
  name: string;
  members: string[];
  createdAt: number;
  updatedAt: number;
}

export interface UserTeamWithId extends UserTeam {
  id: string;
}

export interface TeamLobbyFields {
  teamName?: string;
  teamMembers?: string[] | Record<string, string>;
}

function currentUserId(): string | null {
  return getFirebaseAuth().currentUser?.uid ?? null;
}

function teamsPathFor(userId: string): string | null {
  const uid = currentUserId();
  if (!uid || uid !== userId) {
    return null;
  }
  return `userTeams/${uid}`;
}

export function normalizeMemberList(members: unknown): string[] {
  if (Array.isArray(members)) {
    return members
      .filter((member): member is string => typeof member === 'string')
      .map((member) => member.trim())
      .filter(Boolean);
  }

  if (members && typeof members === 'object') {
    return Object.values(members)
      .filter((member): member is string => typeof member === 'string')
      .map((member) => member.trim())
      .filter(Boolean);
  }

  return [];
}

export function isTeamLobby(lobby: TeamLobbyFields | null | undefined): boolean {
  return normalizeMemberList(lobby?.teamMembers).length > 0;
}

export function claimedParticipantNames(
  participants: Record<string, { name?: string }> | null | undefined,
  exceptUserId?: string
): Set<string> {
  const claimed = new Set<string>();
  if (!participants) {
    return claimed;
  }

  for (const [userId, participant] of Object.entries(participants)) {
    if (exceptUserId && userId === exceptUserId) {
      continue;
    }
    const name = participant?.name?.trim();
    if (name) {
      claimed.add(name);
    }
  }

  return claimed;
}

function parseTeam(id: string, raw: unknown): UserTeamWithId | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const data = raw as Partial<UserTeam>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) {
    return null;
  }

  return {
    id,
    name,
    members: normalizeMemberList(data.members),
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
  };
}

export async function listTeams(userId: string): Promise<UserTeamWithId[]> {
  const path = teamsPathFor(userId);
  if (!path) {
    return [];
  }
  const json = await restGet<Record<string, unknown>>(path);
  if (!json || typeof json !== 'object') {
    return [];
  }

  return Object.entries(json)
    .map(([id, value]) => parseTeam(id, value))
    .filter((team): team is UserTeamWithId => team != null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getTeam(userId: string, teamId: string): Promise<UserTeamWithId | null> {
  const path = teamsPathFor(userId);
  if (!path) {
    return null;
  }
  const json = await restGet(`${path}/${teamId}`);
  return parseTeam(teamId, json);
}

export async function createTeam(
  userId: string,
  input: { name: string; members: string[] }
): Promise<string | null> {
  const path = teamsPathFor(userId);
  if (!path) {
    return null;
  }
  const now = Date.now();
  const payload: UserTeam = {
    name: input.name.trim(),
    members: normalizeMemberList(input.members),
    createdAt: now,
    updatedAt: now,
  };

  return restPush(path, payload);
}

export async function updateTeam(
  userId: string,
  teamId: string,
  input: { name: string; members: string[] }
): Promise<boolean> {
  const path = teamsPathFor(userId);
  if (!path) {
    return false;
  }
  return restPatch(`${path}/${teamId}`, {
    name: input.name.trim(),
    members: normalizeMemberList(input.members),
    updatedAt: Date.now(),
  });
}

export async function deleteTeam(userId: string, teamId: string): Promise<boolean> {
  const path = teamsPathFor(userId);
  if (!path) {
    return false;
  }
  return restDelete(`${path}/${teamId}`);
}

export function claimedNameSet(claimed: unknown): Set<string> {
  const names = new Set<string>();
  if (Array.isArray(claimed)) {
    for (const value of claimed) {
      if (typeof value === 'string' && value.trim()) {
        names.add(value.trim());
      }
    }
    return names;
  }
  if (claimed && typeof claimed === 'object') {
    for (const value of Object.values(claimed as Record<string, unknown>)) {
      if (typeof value === 'string' && value.trim()) {
        names.add(value.trim());
      }
    }
  }
  return names;
}

export function availableMemberNames(
  members: string[],
  claimed: Iterable<string>,
  keepName?: string
): string[] {
  const taken = new Set(
    [...claimed].map((name) => name.trim()).filter(Boolean)
  );
  const keep = keepName?.trim();
  return members.filter((member) => {
    const name = member.trim();
    if (!name) {
      return false;
    }
    if (keep && name === keep) {
      return true;
    }
    return !taken.has(name);
  });
}

export function usableTeams(teams: UserTeamWithId[]): UserTeamWithId[] {
  return teams.filter((team) => team.members.length >= MIN_TEAM_MEMBERS);
}
