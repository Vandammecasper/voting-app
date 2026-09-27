import { useEventListener } from 'expo';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { PressableScale } from '@/components/pressable-scale';
import { SwipePager } from '@/components/swipe-pager';
import { ThemedView } from '@/components/themed-view';
import { UI_SPRING } from '@/constants/motion';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useScale } from '@/utils/scale';

const VIDEO_SOURCES = {
  createLobby: require('@/assets/images/createLobby.mov'),
  voting: require('@/assets/images/voting.mov'),
  votingResults: require('@/assets/images/votingResults.mov'),
} as const;

type OnboardingVideo = keyof typeof VIDEO_SOURCES;

export default function OnboardingStep2() {
  const { markCompleted } = useOnboarding();
  const { s, width: screenWidth, height: screenHeight } = useScale();
  const [iphoneWidth, setIphoneWidth] = useState<number>(300);
  const [iphoneHeight, setIphoneHeight] = useState<number>(600);
  const [videoWidth, setVideoWidth] = useState<number>(250);
  const [videoHeight, setVideoHeight] = useState<number>(500);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [currentVideo, setCurrentVideo] = useState<OnboardingVideo>('createLobby');
  const [shouldLoop, setShouldLoop] = useState<boolean>(true);
  const reduceMotion = useReducedMotion();
  const player = useVideoPlayer(VIDEO_SOURCES.createLobby, (nextPlayer) => {
    nextPlayer.loop = true;
  });
  const fadeOpacity = useSharedValue(0);
  const pageWidth = screenWidth - s(64);

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
      // Cap phone mockup so title + buttons stay on-screen on short devices.
      const maxWidth = Math.min(screenWidth * 0.4, screenHeight * 0.22);
      if (imageSource && imageSource.width && imageSource.height) {
        const aspectRatio = imageSource.height / imageSource.width;
        const calculatedWidth = Math.min(maxWidth, imageSource.width);
        const calculatedHeight = calculatedWidth * aspectRatio;
        setIphoneWidth(calculatedWidth);
        setIphoneHeight(calculatedHeight);
        
        setVideoWidth(calculatedWidth * 0.91);
        setVideoHeight(calculatedHeight * 0.97);
      } else {
        const fallbackWidth = maxWidth;
        const fallbackHeight = fallbackWidth * 2;
        setIphoneWidth(fallbackWidth);
        setIphoneHeight(fallbackHeight);
        setVideoWidth(fallbackWidth * 0.91);
        setVideoHeight(fallbackHeight * 0.97);
      }
    } catch (error) {
      console.error('Error loading iPhone image:', error);
      const fallbackWidth = Math.min(screenWidth * 0.5, screenHeight * 0.22);
      const fallbackHeight = fallbackWidth * 2;
      setIphoneWidth(fallbackWidth);
      setIphoneHeight(fallbackHeight);
      setVideoWidth(fallbackWidth * 0.91);
      setVideoHeight(fallbackHeight * 0.97);
    }
  }, [screenHeight, screenWidth]);

  useEffect(() => {
    fadeOpacity.value = reduceMotion ? withTiming(1, { duration: 200 }) : withSpring(1, UI_SPRING);
  }, [fadeOpacity, reduceMotion]);

  // Animate dots when step changes
  useEffect(() => {
    // Animate dot widths
    dot1Width.value = withSpring(currentStep === 1 ? 24 : 8, UI_SPRING);
    dot2Width.value = withSpring(currentStep === 2 ? 24 : 8, UI_SPRING);
    dot3Width.value = withSpring(currentStep === 3 ? 24 : 8, UI_SPRING);
    
    dot1Color.value = withTiming(currentStep === 1 ? 1 : 0, { duration: 200 });
    dot2Color.value = withTiming(currentStep === 2 ? 1 : 0, { duration: 200 });
    dot3Color.value = withTiming(currentStep === 3 ? 1 : 0, { duration: 200 });
  }, [currentStep]);

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
  }, [currentVideo, player]);

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

  const fadeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeOpacity.value,
    };
  });

  const dot1AnimatedStyle = useAnimatedStyle(() => {
    return {
      width: dot1Width.value,
      backgroundColor: interpolateColor(
        dot1Color.value,
        [0, 1],
        ['#3A3A3A', '#6E92FF']
      ),
    };
  });

  const dot2AnimatedStyle = useAnimatedStyle(() => {
    return {
      width: dot2Width.value,
      backgroundColor: interpolateColor(
        dot2Color.value,
        [0, 1],
        ['#3A3A3A', '#6E92FF']
      ),
    };
  });

  const dot3AnimatedStyle = useAnimatedStyle(() => {
    return {
      width: dot3Width.value,
      backgroundColor: interpolateColor(
        dot3Color.value,
        [0, 1],
        ['#3A3A3A', '#6E92FF']
      ),
    };
  });

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

  return (
    <ThemedView safeAndroid style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: s(32),
            paddingTop: s(60),
            paddingBottom: s(40),
          },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
      <Animated.View style={[styles.contentInner, fadeAnimatedStyle]}>
        <View style={[styles.phoneContainer, { marginBottom: s(24), minHeight: iphoneHeight }]}>
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
            <View style={[styles.videoContainer, { width: videoWidth, height: videoHeight, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: Colors.text, opacity: 0.5 }}>Video unavailable</Text>
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
            <View key="step-1" style={[styles.pagerPage, { gap: s(16), marginBottom: s(24) }]}>
              <GradientText
                text="Create or Join"
                colors={['#6E92FF', '#90FF91']}
                style={[styles.title, { fontSize: s(36), lineHeight: s(42) }]}
                secondLine="a lobby"
              />
              <Text style={[styles.description, { fontSize: s(18), lineHeight: s(26) }]}>
                One teammate creates a lobby{'\n'}Everyone else joins with a code
              </Text>
            </View>,
            <View key="step-2" style={[styles.pagerPage, { gap: s(16), marginBottom: s(24) }]}>
              <GradientText
                text="Vote together"
                colors={['#6E92FF', '#90FF91']}
                style={[styles.title, { fontSize: s(36), lineHeight: s(42) }]}
                secondLine="in real time"
              />
              <Text style={[styles.description, { fontSize: s(18), lineHeight: s(26) }]}>
                Pick the MVP and the loser together{'\n'}Live and in real time!
              </Text>
            </View>,
            <View key="step-3" style={[styles.pagerPage, { gap: s(16), marginBottom: s(24) }]}>
              <GradientText
                text="Reveal the results"
                colors={['#6E92FF', '#90FF91']}
                style={[styles.title, { fontSize: s(36), lineHeight: s(42) }]}
                secondLine="as one team"
              />
              <Text style={[styles.description, { fontSize: s(18), lineHeight: s(26) }]}>
                The host reveals the votes one by one then see the final ranking toghether
              </Text>
            </View>,
          ]}
        </SwipePager>

        <View style={[styles.paginationContainer, { marginBottom: s(24), gap: s(8) }]}>
          <Animated.View style={[styles.dot, { height: s(8), borderRadius: s(4) }, dot1AnimatedStyle]} />
          <Animated.View style={[styles.dot, { height: s(8), borderRadius: s(4) }, dot2AnimatedStyle]} />
          <Animated.View style={[styles.dot, { height: s(8), borderRadius: s(4) }, dot3AnimatedStyle]} />
        </View>

        <View style={[styles.buttonContainer, { marginBottom: s(16) }]}>
          <PrimaryButton 
            onPress={handleNext}
            style={[styles.nextButton, { paddingVertical: s(16) }]}
            textStyle={[styles.nextButtonText, { fontSize: s(20) }]}
          >
            {currentStep === 3 ? 'Start voting' : 'Next'}
          </PrimaryButton>
        </View>

        <PressableScale onPress={handleGoBack} style={styles.goBackContainer} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={[styles.goBackText, { fontSize: s(16) }]}>Go back</Text>
        </PressableScale>
      </Animated.View>
      </ScrollView>
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
  content: {
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
  buttonContainer: {
    width: '100%',
  },
  nextButton: {
    width: '100%',
  },
  nextButtonText: {
    fontWeight: 'bold',
  },
  goBackContainer: {
    paddingVertical: 8,
  },
  goBackText: {
    color: Colors.text,
    opacity: 0.7,
    fontFamily: defaultFontFamily,
  },
});
