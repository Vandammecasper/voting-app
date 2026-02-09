import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { Colors, defaultFontFamily } from '@/constants/theme';

export default function WelcomeScreen() {
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const cardTranslateY = useSharedValue(0);
  const cardHeight = useSharedValue(380);
  const overlayHeight = useSharedValue(120);
  const ONBOARDINGIMAGE = false;

  useEffect(() => {
    const imageSource = Image.resolveAssetSource(require('@/assets/images/mvpMockup.png'));
    if (imageSource.width && imageSource.height) {
      const aspectRatio = imageSource.height / imageSource.width;
      setImageHeight(screenWidth * aspectRatio);
    } else {
      setImageHeight(screenWidth * 1.5);
    }
  }, [screenWidth]);

  // Reset animation when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      // Animate back to initial state when returning to this screen
      cardHeight.value = withTiming(380, { duration: 400 });
      overlayHeight.value = withTiming(120, { duration: 400 });
      cardTranslateY.value = withTiming(0, { duration: 400 });
    }, [])
  );

  const navigateToStep2 = () => {
    router.push('/onboarding/step2');
  };

  const handleContinue = () => {
    console.log('Continue button pressed');
    // Expand card to full screen height and slide up
    cardHeight.value = withTiming(screenHeight, { duration: 400 });
    overlayHeight.value = withTiming(screenHeight, { duration: 400 });
    cardTranslateY.value = withTiming(-screenHeight, {
      duration: 400,
    }, () => {
      // Navigate after animation completes
      runOnJS(navigateToStep2)();
    });
  };

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value,
      transform: [{ translateY: cardTranslateY.value }],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: overlayHeight.value,
    };
  });

  return (
    <View style={styles.container}>
      {ONBOARDINGIMAGE ? (
        <ImageBackground
          source={require('@/assets/images/mvpMockup.png')}
          style={[
            styles.backgroundImage,
            {
              width: screenWidth,
              height: imageHeight || screenWidth * 1.5,
            },
          ]}
          resizeMode="cover"
        >
          <Animated.View style={[styles.overlay, overlayAnimatedStyle]} pointerEvents="none" />
        </ImageBackground>
      ) : (
        <View
          style={[
            styles.backgroundImage,
            styles.logoContainer,
            {
              width: screenWidth,
              height: imageHeight || screenWidth * 1.5,
            },
          ]}
        >
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Animated.View style={[styles.overlay, overlayAnimatedStyle]} pointerEvents="none" />
        </View>
      )}
      <View style={styles.content}>
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <View style={styles.cardContent}>
            <View style={styles.titleContainer}>
              <GradientText
                text="Vote together"
                colors={['#6E92FF', '#90FF91']}
                style={styles.titlePart1}
                secondLine="after the match"
              />
            </View>
            
            <Text style={styles.description}>
              Pick the MVP and the loser{'\n'}of your team!
            </Text>

            <View style={styles.buttonContainer}>
              <PrimaryButton 
                onPress={handleContinue}
                style={styles.continueButton}
                textStyle={styles.continueButtonText}
              >
                Continue
              </PrimaryButton>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundImage: {
    alignSelf: 'flex-start',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logo: {
    width: 280,
    height: 280,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: Colors.background,
    zIndex: 1,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    minHeight: 400,
    overflow: 'visible',
  },
  card: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    paddingHorizontal: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    bottom: -64,
    overflow: 'visible',
    zIndex: 2,
  },
  cardContent: {
    width: '100%',
    paddingBottom: 32,
  },
  titleContainer: {
    marginBottom: 16,
  },
  titlePart1: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  titlePart2: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 0,
  },
  description: {
    fontSize: 18,
    opacity: 0.6,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: defaultFontFamily,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 14,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
