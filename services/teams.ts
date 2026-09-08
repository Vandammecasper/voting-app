import auth from '@react-native-firebase/auth';

import { getFirebaseDatabaseUrl } from '@/services/firebaseDatabaseUrl';

const DATABASE_URL = getFirebaseDatabaseUrl();

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

async function restRequest(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; json: unknown }> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser || !DATABASE_URL) {
      return { ok: false, json: null };
    }

    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    const response = await fetch(url, init);
    if (!response.ok) {
      return { ok: false, json: null };
    }

    const json = await response.json();
    return { ok: true, json };
  } catch {
    return { ok: false, json: null };
  }
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

function teamsPath(userId: string): string {
  return `userTeams/${userId}`;
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
  const { ok, json } = await restRequest(teamsPath(userId));
  if (!ok || !json || typeof json !== 'object') {
    return [];
  }

  return Object.entries(json as Record<string, unknown>)
    .map(([id, value]) => parseTeam(id, value))
    .filter((team): team is UserTeamWithId => team != null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getTeam(userId: string, teamId: string): Promise<UserTeamWithId | null> {
  const { ok, json } = await restRequest(`${teamsPath(userId)}/${teamId}`);
  if (!ok) {
    return null;
  }
  return parseTeam(teamId, json);
}

export async function createTeam(
  userId: string,
  input: { name: string; members: string[] }
): Promise<string | null> {
  const now = Date.now();
  const payload: UserTeam = {
    name: input.name.trim(),
    members: normalizeMemberList(input.members),
    createdAt: now,
    updatedAt: now,
  };

  const { ok, json } = await restRequest(teamsPath(userId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!ok || !json || typeof json !== 'object') {
    return null;
  }

  const name = (json as { name?: string }).name;
  return typeof name === 'string' ? name : null;
}

export async function updateTeam(
  userId: string,
  teamId: string,
  input: { name: string; members: string[] }
): Promise<boolean> {
  const { ok } = await restRequest(`${teamsPath(userId)}/${teamId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name.trim(),
      members: normalizeMemberList(input.members),
      updatedAt: Date.now(),
    }),
  });
  return ok;
}

export async function deleteTeam(userId: string, teamId: string): Promise<boolean> {
  const { ok } = await restRequest(`${teamsPath(userId)}/${teamId}`, {
    method: 'DELETE',
  });
  return ok;
}

export function usableTeams(teams: UserTeamWithId[]): UserTeamWithId[] {
  return teams.filter((team) => team.members.length >= MIN_TEAM_MEMBERS);
}
