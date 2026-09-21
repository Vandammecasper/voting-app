import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.join(__dirname, '..');

function read(relPath: string) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

describe('vote flow chrome', () => {
  it('shows the lobby code on a single line', () => {
    const waitingRoom = read('app/waitingRoom.tsx');
    expect(waitingRoom).toContain('numberOfLines={1}');
    expect(waitingRoom).toContain('styles.codeText');
    expect(waitingRoom).not.toMatch(/ID: \$\{lobbyData/);
  });

  it('uses a native Alert for host join requests instead of custom admit buttons', () => {
    const panel = read('components/join-requests-panel.tsx');
    expect(panel).toContain('Alert.alert');
    expect(panel).toContain("'Join request'");
    expect(panel).toContain("text: 'Admit'");
    expect(panel).toContain("text: 'Decline'");
    expect(panel).not.toContain('PrimaryButton');
    expect(panel).not.toContain('SecondaryButton');
  });

  it('uses a close icon only for Exit, and leaves the waiting page to home', () => {
    const exitButton = read('components/screen-back-button.tsx');
    expect(exitButton).toContain('name="close"');
    expect(exitButton).not.toContain('<Text style={styles.label}>{resolvedLabel}</Text>');

    const waiting = read('app/votingWaiting.tsx');
    expect(waiting).toContain("router.replace('/(tabs)')");
    expect(waiting).not.toMatch(/replace\('\/'\)/);
    expect(waiting).toContain('styles.body');
    expect(waiting).toContain('totalParticipants > 0 && votesRemaining === 0');
  });

  it('omits the voter from MVP choices', () => {
    expect(read('app/voting.tsx')).toContain('mvpVoteOptions');
    expect(read('app/voting.tsx')).toContain('options={mvpOptions}');
    expect(read('app/waitingRoom.tsx')).toContain('mvpVoteOptions');
  });

  it('uses top-right Exit on vote-flow screens except final rankings', () => {
    const screens = [
      'app/waitingRoom.tsx',
      'app/voting.tsx',
      'app/votingWaiting.tsx',
      'app/results.tsx',
    ];
    for (const relPath of screens) {
      expect(read(relPath)).toContain('variant="exit"');
    }
    expect(read('app/ranking.tsx')).not.toContain('ScreenBackButton');
  });

  it('routes joiners to ranking once the host publishes it', () => {
    expect(read('app/votingWaiting.tsx')).toContain('isPublishedRankingStatus');
    expect(read('app/voting.tsx')).toContain('isPublishedRankingStatus');
    expect(read('app/results.tsx')).toContain('isPublishedRankingStatus');
    expect(read('app/waitingRoom.tsx')).toContain('isPublishedRankingStatus');
    expect(read('app/results.tsx')).toContain("pathname: '/ranking'");
    expect(read('app/votingWaiting.tsx')).toContain("persistLobbyStatus(voteId, 'results'");
    expect(read('app/results.tsx')).toContain("persistPublishedRanking(");
    expect(read('services/lobbyStatus.ts')).toContain("'completed'");
    expect(read('services/lobbyStatus.ts')).toContain("'ranking'");
    expect(read('app/votingWaiting.tsx')).toContain('Alert.alert');
    expect(read('app/results.tsx')).toContain('Alert.alert');
  });

  it('hides native header chrome that flashes white during swipe-back', () => {
    const layout = read('app/_layout.tsx');
    expect(layout).toContain('headerRight: () => null');
    expect(layout).toContain('headerLeft: () => null');
    expect(layout).toContain('headerBackVisible: false');
    expect(layout).toContain('fullScreenGestureEnabled: false');
    expect(read('constants/systemBars.ts')).toContain('headerStyle');
  });

  it('hides the draft vote button in team lobbies and keeps start voting available', () => {
    const waitingRoom = read('app/waitingRoom.tsx');
    expect(waitingRoom).toContain('showDraftVote = !teamMode');
    expect(waitingRoom).toContain('showStartVoting');
    expect(waitingRoom).toContain('{showDraftVote ? (');
  });

  it('refetches tab lists when the screen is focused', () => {
    expect(read('app/(tabs)/history.tsx')).toContain('useFocusEffect');
    expect(read('app/(tabs)/settings/teams.tsx')).toContain('useFocusEffect');
    expect(read('app/(tabs)/settings/feature-requests.tsx')).toContain('useFocusEffect');
    expect(read('hooks/usePolledRestData.ts')).toContain('useFocusEffect');
  });

  it('sends Finish from rankings to the home tab', () => {
    const ranking = read('app/ranking.tsx');
    expect(ranking).toContain("router.replace('/(tabs)')");
    expect(ranking).not.toContain("router.replace('/(tabs)/history')");
    expect(ranking).not.toContain("router.replace('/history')");
    expect(ranking).not.toMatch(/replace\('\/'\)/);
  });
});
