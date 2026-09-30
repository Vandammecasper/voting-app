import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { defaultFontFamily } from '@/constants/theme';
import { useTabSceneBottomInset } from '@/hooks/useTabSceneBottomInset';
import { useScale } from '@/utils/scale';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabSceneBottomInset();
  const { s, compact } = useScale();
  const titleSize = s(compact ? 72 : 100);
  const subtitleSize = s(compact ? 16 : 20);

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: s(compact ? 8 : 16) + tabBarInset,
          paddingHorizontal: s(compact ? 28 : 48),
        },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { minHeight: compact ? 48 : 80 }]}>
          <GradientText
            text="MVP"
            style={[
              styles.display,
              {
                fontSize: titleSize,
                lineHeight: titleSize * 1.05,
                letterSpacing: s(compact ? -1.5 : -2),
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.subtitle,
            {
              fontSize: subtitleSize,
              lineHeight: subtitleSize * 1.3,
            },
          ]}
        >
          Who is the most valuable player on your team?
        </Text>
        <View
          style={[
            styles.buttonContainer,
            {
              marginTop: s(compact ? 20 : 32),
              gap: s(compact ? 12 : 16),
            },
          ]}
        >
          <PrimaryButton onPress={() => {router.push('/userInput?mode=create')}}>
            Create vote
          </PrimaryButton>
          <SecondaryButton onPress={() => {router.push('/userInput?mode=join')}}>
            Join vote
          </SecondaryButton>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  display: {
    fontWeight: 'bold',
  },
  subtitle: {
    fontWeight: '500',
    textAlign: 'center',
    color: '#6E92FF',
    letterSpacing: -0.3,
    fontFamily: defaultFontFamily,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 8,
  },
});
