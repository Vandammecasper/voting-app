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
import { scale, touchTarget, useScale } from '@/utils/scale';
import {
  getRosterPanelLimits,
  INITIAL_ROSTER_LAYOUT,
  nextRosterLayoutMode,
  type RosterLayoutMode,
} from '@/utils/votingRosterLayout';
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
  columns,
  twoColMaxWidth,
}: {
  members: NamedRosterMember[];
  fontSize: number;
  columns: 1 | 2;
  twoColMaxWidth: number;
}) {
  if (members.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.rosterNames,
        columns === 2 && [styles.rosterNamesTwoCol, { maxWidth: twoColMaxWidth }],
      ]}
    >
      {members.map((member) => (
        <Text
          key={member.id}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.rosterName,
            columns === 2 && styles.rosterNameTwoCol,
            { fontSize },
          ]}
        >
          {member.name}
        </Text>
      ))}
    </View>
  );
}

function RosterDropdownPanel({
  stillVoting,
  alreadyVoted,
  votedOpen,
  onToggleVoted,
  maxHeight,
  maxWidth,
  headingFontSize,
  nameFontSize,
  extendFontSize,
  chevronSize,
  extendMinHeight,
}: {
  stillVoting: NamedRosterMember[];
  alreadyVoted: NamedRosterMember[];
  votedOpen: boolean;
  onToggleVoted: () => void;
  maxHeight: number;
  maxWidth: number;
  headingFontSize: number;
  nameFontSize: number;
  extendFontSize: number;
  chevronSize: number;
  extendMinHeight: number;
}) {
  const [layout, setLayout] = useState<RosterLayoutMode>(INITIAL_ROSTER_LAYOUT);

  useEffect(() => {
    setLayout(INITIAL_ROSTER_LAYOUT);
  }, [stillVoting, alreadyVoted, votedOpen, maxHeight, maxWidth]);

  const handleMeasuredHeight = (height: number) => {
    setLayout((current) => nextRosterLayoutMode(current, height, maxHeight));
  };

  const panelBody = (
    <>
      <Text style={[styles.rosterHeading, { fontSize: headingFontSize }]}>Still voting</Text>
      <RosterNameList
        members={stillVoting}
        fontSize={nameFontSize}
        columns={layout.columns}
        twoColMaxWidth={maxWidth}
      />

      {alreadyVoted.length > 0 ? (
        <>
          <PressableScale
            onPress={onToggleVoted}
            accessibilityRole="button"
            accessibilityState={{ expanded: votedOpen }}
            accessibilityLabel={votedOpen ? 'Hide who voted' : 'Show who voted'}
            style={[styles.extendControl, { minHeight: extendMinHeight }]}
            innerStyle={styles.extendControlInner}
          >
            <Text style={[styles.extendLabel, { fontSize: extendFontSize }]}>
              {votedOpen ? 'Hide who voted' : 'Show who voted'}
            </Text>
            <RosterChevron isOpen={votedOpen} size={chevronSize} />
          </PressableScale>

          {votedOpen ? (
            <View style={styles.votedSection}>
              <Text style={[styles.rosterHeading, { fontSize: headingFontSize }]}>
                Already voted
              </Text>
              <RosterNameList
                members={alreadyVoted}
                fontSize={nameFontSize}
                columns={layout.columns}
                twoColMaxWidth={maxWidth}
              />
            </View>
          ) : null}
        </>
      ) : null}
    </>
  );

  return (
    <View style={styles.dropdownMenuAnchor} pointerEvents="box-none">
      <View style={[styles.dropdownMenu, { maxHeight, maxWidth }]}>
        {layout.scrollEnabled ? (
          <ScrollView
            style={styles.dropdownMenuScroll}
            contentContainerStyle={styles.dropdownMenuContent}
            nestedScrollEnabled
            bounces={false}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            {panelBody}
          </ScrollView>
        ) : (
          <View
            style={styles.dropdownMenuContent}
            onLayout={(event) => handleMeasuredHeight(event.nativeEvent.layout.height)}
          >
            {panelBody}
          </View>
        )}
      </View>
    </View>
  );
}

export default function VotingWaitingScreen() {
  const { voteId, from } = useVoteRouteParams();
  const { user } = useAuth();
  const { s, width, height } = useScale();
  const [isOpeningResults, setIsOpeningResults] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [votedOpen, setVotedOpen] = useState(false);
  const rosterLimits = getRosterPanelLimits(width, height, s(220), s(260), s(48));
  const extendMinHeight = touchTarget(44, undefined, width, height);

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
                  style={[
                    styles.hintPressable,
                    { minHeight: extendMinHeight, maxWidth: rosterLimits.maxWidth },
                  ]}
                >
                  <Text style={[styles.hint, { fontSize: s(14) }]} numberOfLines={2}>
                    {stillVotingMention}
                  </Text>
                </PressableScale>

                {rosterOpen ? (
                  <RosterDropdownPanel
                    stillVoting={stillVoting}
                    alreadyVoted={alreadyVoted}
                    votedOpen={votedOpen}
                    onToggleVoted={() => setVotedOpen((open) => !open)}
                    maxHeight={rosterLimits.maxHeight}
                    maxWidth={rosterLimits.maxWidth}
                    headingFontSize={s(12)}
                    nameFontSize={s(16)}
                    extendFontSize={s(13)}
                    chevronSize={s(16)}
                    extendMinHeight={extendMinHeight}
                  />
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
  bottomContainer: {
    overflow: 'visible',
    zIndex: 10,
  },
  bottomContainerButtonOnly: {
    marginTop: 24,
  },
  rosterSection: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    zIndex: 20,
    overflow: 'visible',
  },
  hintPressable: {
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  hint: {
    color: Colors.icon,
    textAlign: 'center',
    fontFamily: defaultFontFamily,
    textDecorationLine: 'underline',
  },
  dropdownMenuAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    marginBottom: 8,
    alignItems: 'center',
    zIndex: 30,
  },
  dropdownMenu: {
    alignSelf: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    borderColor: Colors.icon,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  dropdownMenuScroll: {
    flexGrow: 0,
  },
  dropdownMenuContent: {
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
  },
  rosterNames: {
    alignItems: 'center',
    gap: 4,
  },
  rosterNamesTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  rosterName: {
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: defaultFontFamily,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  rosterNameTwoCol: {
    width: '50%',
    paddingHorizontal: 6,
  },
  extendControl: {
    alignSelf: 'center',
    marginTop: 8,
    justifyContent: 'center',
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
    alignSelf: 'stretch',
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
