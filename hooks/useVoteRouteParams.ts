import { firstSearchParam } from '@/services/routeParams';
import { useLocalSearchParams } from 'expo-router';

export function useVoteRouteParams() {
  const params = useLocalSearchParams<{
    voteId?: string | string[];
    from?: string | string[];
  }>();

  return {
    voteId: firstSearchParam(params.voteId),
    from: firstSearchParam(params.from),
  };
}
