import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useTabSceneBottomInset } from '@/hooks/useTabSceneBottomInset';

const REPORT_EMAIL = 'caspervandamme03@gmail.com';
/** Shown as the email subject when users tap “Report an issue”. */
const BUG_REPORT_SUBJECT = '[MVP vote] Bug report';
const SUPPORT_URL = 'https://mvpvote.vercel.app/support';
const PRIVACY_URL = 'https://mvpvote.vercel.app/privacy';
const USER_AGREEMENT_URL = 'https://mvpvote.vercel.app/terms';

function openBugReportMail() {
  const params = [
    `subject=${encodeURIComponent(BUG_REPORT_SUBJECT)}`,
    `body=${encodeURIComponent(
      'Please describe what went wrong and how we can reproduce it:\n\n'
    )}`,
  ].join('&');
  Linking.openURL(`mailto:${REPORT_EMAIL}?${params}`).catch(() => {});
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
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.button}
    >
      <View style={styles.buttonInner}>
        <Ionicons name={icon} size={24} color={Colors.icon} style={styles.icon} />
        <Text style={styles.buttonLabel}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.icon} />
      </View>
    </PressableScale>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabSceneBottomInset();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          paddingBottom: tabBarInset,
        },
      ]}
    >
      <Text style={styles.title}>Settings</Text>
      <View style={styles.buttons}>
        <SettingsButton
          icon="people-outline"
          label="Teams"
          onPress={() => router.push('/(tabs)/settings/teams' as Href)}
        />
        <SettingsButton
          icon="bulb-outline"
          label="Feature request"
          onPress={() => router.push('/(tabs)/settings/feature-requests')}
        />
        <SettingsButton
          icon="mail-outline"
          label="Report an issue"
          onPress={openBugReportMail}
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: defaultFontFamily,
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  buttons: {
    gap: 8,
  },
  button: {
    backgroundColor: '#363636',
    borderRadius: 12,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
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
