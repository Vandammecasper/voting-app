import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { UI_SPRING } from '@/constants/motion';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScale } from '@/utils/scale';

export default function WelcomeScreen() {
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const { s, width: screenWidth, height: screenHeight } = useScale();
  const cardHeightValue = Math.round(Math.min(380, screenHeight * 0.42));
  const overlayHeightValue = Math.round(Math.min(120, screenHeight * 0.14));
  const logoSize = s(280);
  const cardTranslateY = useSharedValue(0);
  const cardHeight = useSharedValue(cardHeightValue);
  const overlayHeight = useSharedValue(overlayHeightValue);
  const reduceMotion = useReducedMotion();
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

  useFocusEffect(
    useCallback(() => {
      if (reduceMotion) {
        cardHeight.value = withTiming(cardHeightValue, { duration: 200 });
        overlayHeight.value = withTiming(overlayHeightValue, { duration: 200 });
        cardTranslateY.value = withTiming(0, { duration: 200 });
        return;
      }
      cardHeight.value = withSpring(cardHeightValue, UI_SPRING);
      overlayHeight.value = withSpring(overlayHeightValue, UI_SPRING);
      cardTranslateY.value = withSpring(0, UI_SPRING);
    }, [cardHeight, cardHeightValue, cardTranslateY, overlayHeight, overlayHeightValue, reduceMotion])
  );

  const handleContinue = () => {
    router.push('/onboarding/step2');
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
    <ThemedView safeAndroid style={styles.container}>
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
            style={{ width: logoSize, height: logoSize }}
            resizeMode="contain"
          />
          <Animated.View style={[styles.overlay, overlayAnimatedStyle]} pointerEvents="none" />
        </View>
      )}
      <View style={[styles.content, { minHeight: cardHeightValue + s(20) }]}>
        <Animated.View
          style={[
            styles.card,
            cardAnimatedStyle,
            {
              borderTopLeftRadius: s(32),
              borderTopRightRadius: s(32),
              paddingTop: s(32),
              paddingHorizontal: s(32),
              bottom: -s(64),
            },
          ]}
        >
          <View style={[styles.cardContent, { paddingBottom: s(32) }]}>
            <View style={[styles.titleContainer, { marginBottom: s(16) }]}>
              <GradientText
                text="Vote together"
                colors={['#6E92FF', '#90FF91']}
                style={[
                  styles.titlePart1,
                  {
                    fontSize: s(36),
                    lineHeight: s(42),
                    marginBottom: s(4),
                  },
                ]}
                secondLine="after the match"
              />
            </View>
            
            <Text
              style={[
                styles.description,
                {
                  fontSize: s(18),
                  lineHeight: s(24),
                  marginBottom: s(24),
                },
              ]}
            >
              Pick the MVP and the loser{'\n'}of your team!
            </Text>

            <View style={[styles.buttonContainer, { marginTop: s(8) }]}>
              <PrimaryButton 
                onPress={handleContinue}
                style={[styles.continueButton, { paddingVertical: s(14) }]}
                textStyle={[styles.continueButtonText, { fontSize: s(20) }]}
              >
                Continue
              </PrimaryButton>
            </View>
          </View>
        </Animated.View>
      </View>
    </ThemedView>
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
    overflow: 'visible',
  },
  card: {
    backgroundColor: Colors.background,
    width: '100%',
    overflow: 'visible',
    zIndex: 2,
  },
  cardContent: {
    width: '100%',
  },
  titleContainer: {},
  titlePart1: {
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  description: {
    opacity: 0.6,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
  },
  continueButtonText: {
    fontWeight: 'bold',
  },
});
