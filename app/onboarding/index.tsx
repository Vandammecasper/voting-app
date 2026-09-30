import { router } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useScale } from '@/utils/scale';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { s, compact, height: screenHeight } = useScale();
  const logoSize = Math.min(s(compact ? 160 : 220), screenHeight * (compact ? 0.22 : 0.28));
  // ThemedView `safeAndroid` already pads Android; iOS still needs the home-indicator inset.
  const bottomPad = (Platform.OS === 'android' ? 0 : insets.bottom) + s(16);

  const handleContinue = () => {
    router.push('/onboarding/step2');
  };

  return (
    <ThemedView safeAndroid style={styles.container}>
      <View style={styles.logoArea}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />
      </View>

      <View
        style={[
          styles.bottomContent,
          {
            paddingHorizontal: s(28),
            paddingBottom: bottomPad,
            paddingTop: s(compact ? 12 : 24),
            gap: s(compact ? 12 : 20),
          },
        ]}
      >
        <GradientText
          text="Vote together"
          colors={['#6E92FF', '#90FF91']}
          style={[
            styles.title,
            {
              fontSize: s(compact ? 28 : 36),
              lineHeight: s(compact ? 34 : 42),
            },
          ]}
          secondLine="after the match"
        />

        <Text
          style={[
            styles.description,
            {
              fontSize: s(compact ? 15 : 18),
              lineHeight: s(compact ? 20 : 24),
            },
          ]}
        >
          Pick the MVP and the loser{'\n'}of your team!
        </Text>

        <PrimaryButton
          onPress={handleContinue}
          style={[styles.continueButton, { paddingVertical: s(compact ? 10 : 14) }]}
          textStyle={[styles.continueButtonText, { fontSize: s(compact ? 18 : 20) }]}
        >
          Continue
        </PrimaryButton>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
  },
  bottomContent: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
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
  continueButton: {
    width: '100%',
    marginTop: 4,
  },
  continueButtonText: {
    fontWeight: 'bold',
  },
});
