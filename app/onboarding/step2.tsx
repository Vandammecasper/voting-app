import { useEventListener } from 'expo';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { PressableScale } from '@/components/pressable-scale';
import { SwipePager } from '@/components/swipe-pager';
import { ThemedView } from '@/components/themed-view';
import { UI_SPRING } from '@/constants/motion';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScale } from '@/utils/scale';

const VIDEO_SOURCES = {
  createLobby: require('@/assets/images/createLobby.mov'),
  voting: require('@/assets/images/voting.mov'),
  votingResults: require('@/assets/images/votingResults.mov'),
} as const;

type OnboardingVideo = keyof typeof VIDEO_SOURCES;

export default function OnboardingStep2() {
  const { markCompleted } = useOnboarding();
  const insets = useSafeAreaInsets();
  const { s, compact, width: screenWidth, height: screenHeight } = useScale();
  const [iphoneWidth, setIphoneWidth] = useState(120);
  const [iphoneHeight, setIphoneHeight] = useState(240);
  const [videoWidth, setVideoWidth] = useState(110);
  const [videoHeight, setVideoHeight] = useState(230);
  const [videoError, setVideoError] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentVideo, setCurrentVideo] = useState<OnboardingVideo>('createLobby');
  const [shouldLoop, setShouldLoop] = useState(true);
  const reduceMotion = useReducedMotion();
  const player = useVideoPlayer(VIDEO_SOURCES.createLobby, (nextPlayer) => {
    nextPlayer.loop = true;
  });
  const fadeOpacity = useSharedValue(0);
  const pageWidth = screenWidth - s(compact ? 40 : 64);
  const titleSize = s(compact ? 26 : 34);
  const titleLine = s(compact ? 32 : 40);
  const bodySize = s(compact ? 14 : 17);
  const bodyLine = s(compact ? 20 : 24);

  const VIDEOS = ['createLobby', 'voting', 'votingResults'] as const;
  const dot1Width = useSharedValue(24);
  const dot2Width = useSharedValue(8);
  const dot3Width = useSharedValue(8);
  const dot1Color = useSharedValue(1);
  const dot2Color = useSharedValue(0);
  const dot3Color = useSharedValue(0);

  useEffect(() => {
    try {
      const imageSource = Image.resolveAssetSource(require('@/assets/images/iPhone17.png'));
      // Keep mockup small enough that title + pinned CTA always fit.
      const maxWidth = Math.min(
        screenWidth * (compact ? 0.28 : 0.36),
        screenHeight * (compact ? 0.18 : 0.26)
      );
      if (imageSource?.width && imageSource?.height) {
        const aspectRatio = imageSource.height / imageSource.width;
        const calculatedWidth = Math.min(maxWidth, imageSource.width);
        const calculatedHeight = calculatedWidth * aspectRatio;
        setIphoneWidth(calculatedWidth);
        setIphoneHeight(calculatedHeight);
        setVideoWidth(calculatedWidth * 0.91);
        setVideoHeight(calculatedHeight * 0.97);
      } else {
        setIphoneWidth(maxWidth);
        setIphoneHeight(maxWidth * 2);
        setVideoWidth(maxWidth * 0.91);
        setVideoHeight(maxWidth * 2 * 0.97);
      }
    } catch (error) {
      console.error('Error loading iPhone image:', error);
      const fallbackWidth = Math.min(screenWidth * 0.28, screenHeight * 0.18);
      setIphoneWidth(fallbackWidth);
      setIphoneHeight(fallbackWidth * 2);
      setVideoWidth(fallbackWidth * 0.91);
      setVideoHeight(fallbackWidth * 2 * 0.97);
    }
  }, [compact, screenHeight, screenWidth]);

  useEffect(() => {
    fadeOpacity.value = reduceMotion ? withTiming(1, { duration: 200 }) : withSpring(1, UI_SPRING);
  }, [fadeOpacity, reduceMotion]);

  useEffect(() => {
    dot1Width.value = withSpring(currentStep === 1 ? 24 : 8, UI_SPRING);
    dot2Width.value = withSpring(currentStep === 2 ? 24 : 8, UI_SPRING);
    dot3Width.value = withSpring(currentStep === 3 ? 24 : 8, UI_SPRING);
    dot1Color.value = withTiming(currentStep === 1 ? 1 : 0, { duration: 200 });
    dot2Color.value = withTiming(currentStep === 2 ? 1 : 0, { duration: 200 });
    dot3Color.value = withTiming(currentStep === 3 ? 1 : 0, { duration: 200 });
  }, [currentStep, dot1Color, dot1Width, dot2Color, dot2Width, dot3Color, dot3Width]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await player.replaceAsync(VIDEO_SOURCES[currentVideo]);
        if (cancelled) return;
        player.loop = shouldLoop;
        if (reduceMotion) {
          player.pause();
        } else {
          player.play();
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error playing video:', error);
        setVideoError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentVideo, player, reduceMotion, shouldLoop]);

  useEffect(() => {
    player.loop = shouldLoop;
  }, [player, shouldLoop]);

  useEffect(() => {
    if (reduceMotion) {
      player.pause();
    }
  }, [player, reduceMotion]);

  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status === 'error') {
      console.error('Video error:', error);
      setVideoError(true);
    }
  });

  const fadeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const dot1AnimatedStyle = useAnimatedStyle(() => ({
    width: dot1Width.value,
    backgroundColor: interpolateColor(dot1Color.value, [0, 1], ['#3A3A3A', '#6E92FF']),
  }));

  const dot2AnimatedStyle = useAnimatedStyle(() => ({
    width: dot2Width.value,
    backgroundColor: interpolateColor(dot2Color.value, [0, 1], ['#3A3A3A', '#6E92FF']),
  }));

  const dot3AnimatedStyle = useAnimatedStyle(() => ({
    width: dot3Width.value,
    backgroundColor: interpolateColor(dot3Color.value, [0, 1], ['#3A3A3A', '#6E92FF']),
  }));

  const goToStep = (newStep: number) => {
    if (newStep < 1 || newStep > 3) {
      return;
    }
    setCurrentStep(newStep);
    setShouldLoop(true);
    setCurrentVideo(VIDEOS[newStep - 1]);
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      goToStep(currentStep + 1);
      return;
    }
    await markCompleted();
    router.replace('/(tabs)');
  };

  const handleGoBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
      return;
    }
    router.back();
  };

  const bottomPad = (Platform.OS === 'android' ? 0 : insets.bottom) + s(12);

  return (
    <ThemedView safeAndroid style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: s(compact ? 20 : 32),
            paddingTop: s(compact ? 16 : 36),
            paddingBottom: s(12),
          },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.contentInner, fadeAnimatedStyle]}>
          <View style={[styles.phoneContainer, { marginBottom: s(compact ? 12 : 20) }]}>
            {!videoError && (
              <View style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
                <VideoView
                  player={player}
                  style={styles.video}
                  contentFit="cover"
                  nativeControls={false}
                />
              </View>
            )}
            {videoError && (
              <View
                style={[
                  styles.videoContainer,
                  {
                    width: videoWidth,
                    height: videoHeight,
                    backgroundColor: Colors.background,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={{ color: Colors.text, opacity: 0.5, fontSize: s(12) }}>
                  Video unavailable
                </Text>
              </View>
            )}
            <Image
              source={require('@/assets/images/iPhone17.png')}
              style={[styles.iphoneOutline, { width: iphoneWidth, height: iphoneHeight }]}
              resizeMode="contain"
              onError={(error) => console.error('Image load error:', error)}
            />
          </View>

          <SwipePager
            index={currentStep - 1}
            onIndexChange={(next) => goToStep(next + 1)}
            pageWidth={pageWidth}
          >
            {[
              <View key="step-1" style={[styles.pagerPage, { gap: s(10), marginBottom: s(12) }]}>
                <GradientText
                  text="Create or Join"
                  colors={['#6E92FF', '#90FF91']}
                  style={[styles.title, { fontSize: titleSize, lineHeight: titleLine }]}
                  secondLine="a lobby"
                />
                <Text style={[styles.description, { fontSize: bodySize, lineHeight: bodyLine }]}>
                  One teammate creates a lobby{'\n'}Everyone else joins with a code
                </Text>
              </View>,
              <View key="step-2" style={[styles.pagerPage, { gap: s(10), marginBottom: s(12) }]}>
                <GradientText
                  text="Vote together"
                  colors={['#6E92FF', '#90FF91']}
                  style={[styles.title, { fontSize: titleSize, lineHeight: titleLine }]}
                  secondLine="in real time"
                />
                <Text style={[styles.description, { fontSize: bodySize, lineHeight: bodyLine }]}>
                  Pick the MVP and the loser together{'\n'}Live and in real time!
                </Text>
              </View>,
              <View key="step-3" style={[styles.pagerPage, { gap: s(10), marginBottom: s(12) }]}>
                <GradientText
                  text="Reveal the results"
                  colors={['#6E92FF', '#90FF91']}
                  style={[styles.title, { fontSize: titleSize, lineHeight: titleLine }]}
                  secondLine="as one team"
                />
                <Text style={[styles.description, { fontSize: bodySize, lineHeight: bodyLine }]}>
                  The host reveals the votes one by one then see the final ranking toghether
                </Text>
              </View>,
            ]}
          </SwipePager>

          <View style={[styles.paginationContainer, { marginBottom: s(8), gap: s(8) }]}>
            <Animated.View
              style={[styles.dot, { height: s(8), borderRadius: s(4) }, dot1AnimatedStyle]}
            />
            <Animated.View
              style={[styles.dot, { height: s(8), borderRadius: s(4) }, dot2AnimatedStyle]}
            />
            <Animated.View
              style={[styles.dot, { height: s(8), borderRadius: s(4) }, dot3AnimatedStyle]}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: s(compact ? 20 : 32),
            paddingBottom: bottomPad,
            paddingTop: s(8),
            gap: s(8),
          },
        ]}
      >
        <PrimaryButton
          onPress={handleNext}
          style={[styles.nextButton, { paddingVertical: s(compact ? 10 : 14) }]}
          textStyle={[styles.nextButtonText, { fontSize: s(compact ? 18 : 20) }]}
        >
          {currentStep === 3 ? 'Start voting' : 'Next'}
        </PrimaryButton>

        <PressableScale
          onPress={handleGoBack}
          style={styles.goBackContainer}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.goBackText, { fontSize: s(15) }]}>Go back</Text>
        </PressableScale>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInner: {
    width: '100%',
    alignItems: 'center',
  },
  phoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    backgroundColor: 'transparent',
  },
  videoContainer: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  iphoneOutline: {
    position: 'relative',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  pagerPage: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  description: {
    color: Colors.text,
    textAlign: 'center',
    opacity: 0.7,
    fontFamily: defaultFontFamily,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {},
  footer: {
    width: '100%',
    backgroundColor: Colors.background,
  },
  nextButton: {
    width: '100%',
  },
  nextButtonText: {
    fontWeight: 'bold',
  },
  goBackContainer: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  goBackText: {
    color: Colors.text,
    opacity: 0.7,
    fontFamily: defaultFontFamily,
    textAlign: 'center',
  },
});
