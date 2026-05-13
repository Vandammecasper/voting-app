import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoteDraft {
  mvpName: string;
  mvpComment: string;
  loserName: string;
  loserComment: string;
  updatedAt: number;
}

export type VoteDraftInput = Omit<VoteDraft, 'updatedAt'>;

const voteDraftKey = (voteId: string, userId: string) => `@vote_draft:${voteId}:${userId}`;

export function hasVoteDraftContent(draft: VoteDraftInput): boolean {
  return Boolean(
    draft.mvpName.trim() ||
    draft.mvpComment.trim() ||
    draft.loserName.trim() ||
    draft.loserComment.trim()
  );
}

export async function loadVoteDraft(voteId: string, userId: string): Promise<VoteDraft | null> {
  try {
    const rawDraft = await AsyncStorage.getItem(voteDraftKey(voteId, userId));
    if (!rawDraft) {
      return null;
    }

    const parsed = JSON.parse(rawDraft) as Partial<VoteDraft>;
    return {
      mvpName: parsed.mvpName ?? '',
      mvpComment: parsed.mvpComment ?? '',
      loserName: parsed.loserName ?? '',
      loserComment: parsed.loserComment ?? '',
      updatedAt: parsed.updatedAt ?? 0,
    };
  } catch (error) {
    console.error('Error loading vote draft:', error);
    return null;
  }
}

export async function saveVoteDraft(
  voteId: string,
  userId: string,
  draft: VoteDraftInput
): Promise<void> {
  try {
    const draftToStore: VoteDraft = {
      ...draft,
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(voteDraftKey(voteId, userId), JSON.stringify(draftToStore));
  } catch (error) {
    console.error('Error saving vote draft:', error);
    throw error;
  }
}

export async function removeVoteDraft(voteId: string, userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(voteDraftKey(voteId, userId));
  } catch (error) {
    console.error('Error removing vote draft:', error);
  }
}
