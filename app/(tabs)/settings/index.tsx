import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';

const REPORT_EMAIL = 'caspervandamme03@gmail.com';
const REPORT_SUBJECT = 'MVP vote issue report';
const SUPPORT_URL = 'https://mvpvote.vercel.app/support';
const PRIVACY_URL = 'https://mvpvote.vercel.app/privacy';
const USER_AGREEMENT_URL = 'https://mvpvote.vercel.app/terms';

function openMailto() {
  const encodedSubject = encodeURIComponent(REPORT_SUBJECT);
  Linking.openURL(`mailto:${REPORT_EMAIL}?subject=${encodedSubject}`).catch(() => {});
}

function openSupport() {
  Linking.openURL(SUPPORT_URL).catch(() => {});
}

function openPrivacy() {
  Linking.openURL(PRIVACY_URL).catch(() => {});
}

function openUserAgreement() {
  Linking.openURL(USER_AGREEMENT_URL).catch(() => {});
}

interface SettingsButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function SettingsButton({ icon, label, onPress }: SettingsButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Ionicons name={icon} size={24} color={Colors.icon} style={styles.icon} />
      <Text style={styles.buttonLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={Colors.icon} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.buttons}>
        <SettingsButton
          icon="bulb-outline"
          label="Feature request"
          onPress={() => router.push('/(tabs)/settings/feature-requests')}
        />
        <SettingsButton
          icon="mail-outline"
          label="Report an issue"
          onPress={openMailto}
        />
        <SettingsButton
          icon="help-circle-outline"
          label="Support page"
          onPress={openSupport}
        />
        <SettingsButton
          icon="shield-outline"
          label="Privacy policy"
          onPress={openPrivacy}
        />
        <SettingsButton
          icon="document-text-outline"
          label="User agreement"
          onPress={openUserAgreement}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: defaultFontFamily,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttons: {
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#363636',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  icon: {
    marginRight: 14,
  },
  buttonLabel: {
    flex: 1,
    fontSize: 17,
    color: Colors.text,
    fontFamily: defaultFontFamily,
  },
});
