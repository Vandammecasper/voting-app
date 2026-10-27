import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { PressableScale } from '@/components/pressable-scale';
import { ScreenBackButton } from '@/components/screen-back-button';
import { ThemedView } from '@/components/themed-view';
import { UI_SPRING } from '@/constants/motion';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePolledRestData } from '@/hooks/usePolledRestData';
import { useVoteRouteParams } from '@/hooks/useVoteRouteParams';
import { isPublishedRankingStatus, isResultsStatus } from '@/services/lobbyFlow';
import { persistLobbyStatus } from '@/services/lobbyStatus';
import { scale, useScale } from '@/utils/scale';
import {
  formatStillVotingMention,
  partitionVotingRoster,
  type NamedRosterMember,
} from '@/utils/votingWaitRoster';

interface Participant {
  name: string;
  joinedAt: number;
}

interface LobbyData {
  creatorId: string;
  creatorName: string;
  createdAt: number;
  status: string;
  code: string;
}

type ParticipantsData = Record<string, Participant>;
type VoteReceiptsData = Record<string, boolean>;

/** Chevron that rotates about its own center inside a fixed square. */
function RosterChevron({ isOpen, size = 18 }: { isOpen: boolean; size?: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(isOpen ? 180 : 0, UI_SPRING);
  }, [isOpen, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.chevronBox,
        { width: size, height: size },
        animatedStyle,
      ]}
    >
      <Ionicons name="chevron-down" size={size} color={Colors.icon} />
    </Animated.View>
  );
}

function RosterNameList({
  members,
  fontSize,
}: {
  members: NamedRosterMember[];
  fontSize: number;
}) {
  if (members.length === 0) {
    return null;
  }

  return (
    <View style={styles.rosterNames}>
      {members.map((member) => (
        <Text key={member.id} style={[styles.rosterName, { fontSize }]}>
          {member.name}
        </Text>
      ))}
    </View>
  );
}

export default function VotingWaitingScreen() {
  const { voteId, from } = useVoteRouteParams();
  const { user } = useAuth();
  const { s } = useScale();
  const [isOpeningResults, setIsOpeningResults] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [votedOpen, setVotedOpen] = useState(false);

  // Poll lobby data
  const { data: lobbyData } = usePolledRestData<LobbyData>(
    voteId ? `lobbies/${voteId}` : null,
    2000
  );

  const { data: participantsData } = usePolledRestData<ParticipantsData>(
    voteId ? `participants/${voteId}` : null,
    2000
  );

  const { data: receiptsData } = usePolledRestData<VoteReceiptsData>(
    voteId ? `voteReceipts/${voteId}` : null,
    2000
  );

  // Check if current user is the creator
  const isCreator = user && lobbyData && user.uid === lobbyData.creatorId;

  // Calculate vote counts
  const totalParticipants = participantsData ? Object.keys(participantsData).length : 0;
  const votesSubmitted = receiptsData ? Object.keys(receiptsData).length : 0;
  const votesRemaining = totalParticipants - votesSubmitted;

  const { stillVoting, alreadyVoted } = partitionVotingRoster(participantsData, receiptsData);
  const stillVotingMention = formatStillVotingMention(stillVoting.map((member) => member.name));

  // Auto-navigate when the host opens results or publishes the ranking
  useEffect(() => {
    if (!lobbyData?.status || !voteId) {
      return;
    }

    if (isResultsStatus(lobbyData.status)) {
      router.replace({
        pathname: '/results',
        params: { voteId, from },
      });
      return;
    }

    if (isPublishedRankingStatus(lobbyData.status)) {
      router.replace({
        pathname: '/ranking',
        params: { voteId, from },
      });
    }
  }, [lobbyData?.status, voteId, from]);

  const handleGoToResults = async () => {
    if (!voteId || isOpeningResults) {
      return;
    }

    setIsOpeningResults(true);
    const persisted = await persistLobbyStatus(voteId, 'results', lobbyData?.code);
    if (!persisted.ok) {
      Alert.alert("Couldn't open results", persisted.error);
      setIsOpeningResults(false);
      return;
    }

    router.replace({
      pathname: '/results',
      params: { voteId, from },
    });
  };

  const everyoneHasVoted = totalParticipants > 0 && votesRemaining === 0;

  const handleExit = () => {
    router.replace('/(tabs)');
  };

  const handleToggleRoster = () => {
    setRosterOpen((open) => {
      if (open) {
        setVotedOpen(false);
      }
      return !open;
    });
  };

  return (
    <ThemedView safeAndroid style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingTop: s(100), paddingHorizontal: s(24) }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
      {everyoneHasVoted ? (
        <>
          <View style={styles.content}>
            <View style={styles.everyoneVotedContainer}>
              <Text style={[styles.everyoneVotedTitle, { fontSize: s(36) }]}>Everyone</Text>
              <Text style={[styles.everyoneVotedTitle, { fontSize: s(36) }]}>has voted!</Text>
              {!isCreator && (
                <Text style={[styles.waitingOnHost, { fontSize: s(16), marginTop: s(24) }]}>
                  Waiting on the host to read the votes...
                </Text>
              )}
            </View>
          </View>
          {isCreator && (
            <View style={[styles.bottomContainer, styles.bottomContainerButtonOnly, { paddingBottom: s(60), gap: s(24) }]}>
              <PrimaryButton
                onPress={handleGoToResults}
                disabled={isOpeningResults}
                style={styles.resultsButton}
                textStyle={[styles.resultsButtonText, { fontSize: s(20) }]}
              >
                Go to results
              </PrimaryButton>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={[styles.title, { fontSize: s(32) }]}>Your teammates are voting...</Text>

          <View style={styles.content}>
            <View style={styles.countContainer}>
              <Text style={[styles.alreadyLabel, { fontSize: s(18), marginBottom: s(12) }]}>already</Text>
              <GradientText text={String(votesSubmitted)} style={[styles.countNumber, { fontSize: s(104) }]} />
              <GradientText
                text={votesSubmitted === 1 ? 'vote submitted' : 'votes submitted'}
                style={[styles.votesSubmittedLabel, { fontSize: s(20), marginTop: s(8) }]}
              />
            </View>
          </View>

          <View style={[styles.bottomContainer, { paddingBottom: s(60), gap: s(24) }]}>
            {stillVotingMention ? (
              <View style={styles.rosterSection}>
                <PressableScale
                  onPress={handleToggleRoster}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: rosterOpen }}
                  accessibilityLabel={stillVotingMention}
                  style={styles.hintPressable}
                >
                  <Text style={[styles.hint, { fontSize: s(14) }]} numberOfLines={2}>
                    {stillVotingMention}
                  </Text>
                </PressableScale>

                {rosterOpen ? (
                  <View style={styles.dropdownMenu}>
                    <Text style={[styles.rosterHeading, { fontSize: s(12) }]}>Still voting</Text>
                    <RosterNameList members={stillVoting} fontSize={s(16)} />

                    {alreadyVoted.length > 0 ? (
                      <>
                        <PressableScale
                          onPress={() => setVotedOpen((open) => !open)}
                          accessibilityRole="button"
                          accessibilityState={{ expanded: votedOpen }}
                          accessibilityLabel={votedOpen ? 'Hide who voted' : 'Show who voted'}
                          style={styles.extendControl}
                          innerStyle={styles.extendControlInner}
                        >
                          <Text style={[styles.extendLabel, { fontSize: s(13) }]}>
                            {votedOpen ? 'Hide who voted' : 'Show who voted'}
                          </Text>
                          <RosterChevron isOpen={votedOpen} size={s(16)} />
                        </PressableScale>

                        {votedOpen ? (
                          <View style={styles.votedSection}>
                            <Text style={[styles.rosterHeading, { fontSize: s(12) }]}>Already voted</Text>
                            <RosterNameList members={alreadyVoted} fontSize={s(16)} />
                          </View>
                        ) : null}
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {isCreator && (
              <PrimaryButton
                onPress={handleGoToResults}
                disabled={isOpeningResults}
                style={styles.resultsButton}
                textStyle={[styles.resultsButtonText, { fontSize: s(20) }]}
              >
                Go to results
              </PrimaryButton>
            )}
          </View>
        </>
      )}
      </ScrollView>
      <ScreenBackButton variant="exit" onPress={handleExit} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: scale(160),
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#D9D9D9',
    fontFamily: defaultFontFamily,
  },
  countContainer: {
    alignItems: 'center',
  },
  alreadyLabel: {
    color: Colors.icon,
    fontWeight: '500',
    fontFamily: defaultFontFamily,
  },
  countNumber: {
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
  votesSubmittedLabel: {
    fontWeight: '600',
    fontFamily: defaultFontFamily,
  },
  everyoneVotedContainer: {
    alignItems: 'center',
  },
  everyoneVotedTitle: {
    color: Colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  waitingOnHost: {
    color: Colors.icon,
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  bottomContainer: {},
  bottomContainerButtonOnly: {
    marginTop: 24,
  },
  rosterSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  hintPressable: {
    alignSelf: 'center',
  },
  hint: {
    color: Colors.icon,
    textAlign: 'center',
    fontFamily: defaultFontFamily,
    textDecorationLine: 'underline',
  },
  dropdownMenu: {
    width: '100%',
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    borderColor: Colors.icon,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  chevronBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterHeading: {
    color: Colors.placeholder,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: defaultFontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    alignSelf: 'stretch',
  },
  rosterNames: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  rosterName: {
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: defaultFontFamily,
    paddingVertical: 4,
  },
  extendControl: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  extendControlInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  extendLabel: {
    color: Colors.icon,
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  votedSection: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#5a5a5a',
  },
  resultsButton: {
    marginHorizontal: 0,
  },
  resultsButtonText: {
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
});
