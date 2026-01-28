import { ResizeMode, Video } from 'expo-av';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { setOnboardingCompleted } from '@/services/onboardingStorage';

export default function OnboardingStep2() {
  const videoRef = useRef<Video>(null);
  const screenWidth = Dimensions.get('window').width;
  const [iphoneWidth, setIphoneWidth] = useState<number>(300);
  const [iphoneHeight, setIphoneHeight] = useState<number>(600);
  const [videoWidth, setVideoWidth] = useState<number>(250);
  const [videoHeight, setVideoHeight] = useState<number>(500);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [videoReady, setVideoReady] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [currentVideo, setCurrentVideo] = useState<'createLobby' | 'voting' | 'votingResults'>('createLobby');
  const [shouldLoop, setShouldLoop] = useState<boolean>(true);
  const fadeOpacity = useSharedValue(0);
  const titleTranslateX = useSharedValue(0);
  const descriptionTranslateX = useSharedValue(0);
  
  // Dot animations - start with step 1 active
  const dot1Width = useSharedValue(24);
  const dot2Width = useSharedValue(8);
  const dot3Width = useSharedValue(8);
  const dot1Color = useSharedValue(1);
  const dot2Color = useSharedValue(0);
  const dot3Color = useSharedValue(0);

  useEffect(() => {
    try {
      const imageSource = Image.resolveAssetSource(require('@/assets/images/iPhone17.png'));
      if (imageSource && imageSource.width && imageSource.height) {
        const aspectRatio = imageSource.height / imageSource.width;
        const maxWidth = screenWidth * 0.4;
        const calculatedWidth = Math.min(maxWidth, imageSource.width);
        const calculatedHeight = calculatedWidth * aspectRatio;
        setIphoneWidth(calculatedWidth);
        setIphoneHeight(calculatedHeight);
        
        setVideoWidth(calculatedWidth * 0.91);
        setVideoHeight(calculatedHeight * 0.97);
      } else {
        const fallbackWidth = screenWidth * 0.4;
        const fallbackHeight = fallbackWidth * 2;
        setIphoneWidth(fallbackWidth);
        setIphoneHeight(fallbackHeight);
        setVideoWidth(fallbackWidth * 0.91);
        setVideoHeight(fallbackHeight * 0.97);
      }
    } catch (error) {
      console.error('Error loading iPhone image:', error);
      const fallbackWidth = screenWidth * 0.5;
      const fallbackHeight = fallbackWidth * 2;
      setIphoneWidth(fallbackWidth);
      setIphoneHeight(fallbackHeight);
      setVideoWidth(fallbackWidth * 0.91);
      setVideoHeight(fallbackHeight * 0.97);
    }
  }, [screenWidth]);

  useEffect(() => {
    // Fade in animation
    fadeOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  // Animate dots when step changes
  useEffect(() => {
    // Animate dot widths
    dot1Width.value = withTiming(currentStep === 1 ? 24 : 8, { duration: 300 });
    dot2Width.value = withTiming(currentStep === 2 ? 24 : 8, { duration: 300 });
    dot3Width.value = withTiming(currentStep === 3 ? 24 : 8, { duration: 300 });
    
    // Animate dot colors (0 = inactive, 1 = active)
    dot1Color.value = withTiming(currentStep === 1 ? 1 : 0, { duration: 300 });
    dot2Color.value = withTiming(currentStep === 2 ? 1 : 0, { duration: 300 });
    dot3Color.value = withTiming(currentStep === 3 ? 1 : 0, { duration: 300 });
  }, [currentStep]);

  // Reset video ready state when video source changes
  useEffect(() => {
    setVideoReady(false);
  }, [currentVideo]);

  // When shouldLoop changes, update the current video's looping state
  useEffect(() => {
    if (videoRef.current && videoReady) {
      videoRef.current.setIsLoopingAsync(shouldLoop).catch((error) => {
        console.error('Error setting video looping:', error);
      });
    }
  }, [shouldLoop, videoReady]);

  const handleVideoLoad = async () => {
    try {
      setVideoReady(true);
      if (videoRef.current) {
        // Set looping based on shouldLoop state
        await videoRef.current.setIsLoopingAsync(shouldLoop);
        await videoRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error playing video:', error);
      setVideoError(true);
    }
  };

  const fadeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeOpacity.value,
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: titleTranslateX.value }],
    };
  });

  const descriptionAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: descriptionTranslateX.value }],
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

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    // Position new content off-screen to the right
    titleTranslateX.value = screenWidth;
    descriptionTranslateX.value = screenWidth;
    // Slide in from right
    titleTranslateX.value = withTiming(0, { duration: 300 });
    descriptionTranslateX.value = withTiming(0, { duration: 300 });
  };

  const goBackStep = (newStep: number, video: 'createLobby' | 'voting' | 'votingResults') => {
    setCurrentStep(newStep);
    setShouldLoop(true);
    setCurrentVideo(video);
    setVideoReady(false);
    // Position new content off-screen to the left
    titleTranslateX.value = -screenWidth;
    descriptionTranslateX.value = -screenWidth;
    // Slide in from left
    titleTranslateX.value = withTiming(0, { duration: 300 });
    descriptionTranslateX.value = withTiming(0, { duration: 300 });
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Immediately switch to voting video and start looping
      setShouldLoop(true);
      setCurrentVideo('voting');
      setVideoReady(false);
      
      // Slide out current content
      titleTranslateX.value = withTiming(-screenWidth, { duration: 300 });
      descriptionTranslateX.value = withTiming(-screenWidth, { duration: 300 }, () => {
        // Change step and slide in new content
        runOnJS(updateStep)(2);
      });
    } else if (currentStep === 2) {
      // Immediately switch to votingResults video and start looping
      setShouldLoop(true);
      setCurrentVideo('votingResults');
      setVideoReady(false);
      
      // Slide out current content
      titleTranslateX.value = withTiming(-screenWidth, { duration: 300 });
      descriptionTranslateX.value = withTiming(-screenWidth, { duration: 300 }, () => {
        // Change step and slide in new content
        runOnJS(updateStep)(3);
      });
    } else {
      await setOnboardingCompleted();
      router.push('/(tabs)');
    }
  };

  const handleGoBack = () => {
    if (currentStep === 3) {
      // Go back to step 2
      titleTranslateX.value = withTiming(screenWidth, { duration: 300 });
      descriptionTranslateX.value = withTiming(screenWidth, { duration: 300 }, () => {
        runOnJS(goBackStep)(2, 'voting');
      });
    } else if (currentStep === 2) {
      // Go back to step 1
      titleTranslateX.value = withTiming(screenWidth, { duration: 300 });
      descriptionTranslateX.value = withTiming(screenWidth, { duration: 300 }, () => {
        runOnJS(goBackStep)(1, 'createLobby');
      });
    } else {
      // On step 1, go back to previous screen
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.content, fadeAnimatedStyle]}>
        <View style={styles.phoneContainer}>
          {!videoError && (
            <View style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
              <Video
                key={currentVideo}
                ref={videoRef}
                source={
                  currentVideo === 'createLobby' 
                    ? require('@/assets/images/createLobby.mov')
                    : currentVideo === 'voting'
                    ? require('@/assets/images/voting.mov')
                    : require('@/assets/images/votingResults.mov')
                }
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                onLoad={handleVideoLoad}
                onError={(error) => {
                  console.error('Video error:', error);
                  setVideoError(true);
                }}
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

        <View style={styles.titleContainer}>
          <Animated.View style={[titleAnimatedStyle, { width: '100%', alignItems: 'center' }]}>
            {currentStep === 1 ? (
              <GradientText
                text="Create or Join"
                colors={['#6E92FF', '#90FF91']}
                style={styles.title}
                secondLine="a lobby"
              />
            ) : currentStep === 2 ? (
              <GradientText
                text="Vote together"
                colors={['#6E92FF', '#90FF91']}
                style={styles.title}
                secondLine="in real time"
              />
            ) : (
              <GradientText
                text="Reveal the results"
                colors={['#6E92FF', '#90FF91']}
                style={styles.title}
                secondLine="as one team"
              />
            )}
          </Animated.View>
        </View>

        <View style={styles.descriptionContainer}>
          <Animated.View style={[descriptionAnimatedStyle, { width: '100%', alignItems: 'center' }]}>
            <Text style={styles.description}>
              {currentStep === 1 
                ? "One teammate creates a lobby\nEveryone else joins with a code"
                : currentStep === 2
                ? "Pick the MVP and the loser together\nLive and in real time!"
                : "The host reveals the votes one by one then see the final ranking toghether"}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.paginationContainer}>
          <Animated.View style={[styles.dot, dot1AnimatedStyle]} />
          <Animated.View style={[styles.dot, dot2AnimatedStyle]} />
          <Animated.View style={[styles.dot, dot3AnimatedStyle]} />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton 
            onPress={handleNext}
            style={styles.nextButton}
            textStyle={styles.nextButtonText}
          >
            {currentStep === 3 ? 'Start voting' : 'Next'}
          </PrimaryButton>
        </View>

        <TouchableOpacity onPress={handleGoBack} style={styles.goBackContainer}>
          <Text style={styles.goBackText}>Go back</Text>
        </TouchableOpacity>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  phoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
    width: '100%',
    minHeight: 400,
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
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: 32,
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  description: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.7,
    fontFamily: defaultFontFamily,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  nextButton: {
    width: '100%',
    paddingVertical: 16,
  },
  nextButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  goBackContainer: {
    paddingVertical: 8,
  },
  goBackText: {
    fontSize: 16,
    color: Colors.text,
    opacity: 0.7,
    fontFamily: defaultFontFamily,
  },
});
