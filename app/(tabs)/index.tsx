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
  const { s } = useScale();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: s(16) + tabBarInset,
          paddingHorizontal: s(48),
        },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <GradientText
            text="MVP"
            style={[
              styles.display,
              {
                fontSize: s(100),
                lineHeight: s(108),
                letterSpacing: s(-2),
              },
            ]}
          />
        </View>
        <Text style={[styles.subtitle, { fontSize: s(20), lineHeight: s(26) }]}>
          Who is the most valuable player on your team?
        </Text>
        <View style={[styles.buttonContainer, { marginTop: s(32), gap: s(16) }]}>
          <PrimaryButton onPress={() => {router.push('/userInput?mode=create')}}>Create vote</PrimaryButton>
          <SecondaryButton onPress={() => {router.push('/userInput?mode=join')}}>Join vote</SecondaryButton>
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
    minHeight: 80,
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
