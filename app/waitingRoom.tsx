import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

const GRADIENT_COLORS = ['#6E92FF', '#90FF91'] as const;

// Mock participants data
const participants = [
  'casper', 
  'mathieu',
  'yannick',
  'bart',
  'samber',
  'lars',
  'daan',
  'natan',
  'franz',
];

export default function WaitingRoomScreen() {
  return (
    <ThemedView style={styles.container}>
      <SecondaryButton style={{ marginHorizontal: 56, top: -64 }} textStyle={{ fontSize: 16, fontWeight: 'bold' }} onPress={() => {}}>ID: 1234567890</SecondaryButton>
      <GradientText 
        text="Waiting for others to join" 
        style={{ fontSize: 40, fontWeight: 'bold', textAlign: 'center' }}
      />
      
      {/* Waiting Room Box */}
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0.42, y: 0.1 }}
        end={{ x: 0.5, y: 1.75 }}
        style={styles.boxBorder}
      >
        <View style={styles.boxInner}>
          <GradientText 
            text="Waiting room" 
            style={styles.boxTitle}
          />
          <ScrollView style={styles.participantsScroll} contentContainerStyle={styles.participantsGrid}>
            {participants.map((name, index) => (
              <Text key={index} style={styles.participantName}>{name}</Text>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <Text style={styles.waitingCount}>
        {participants.length} people are waiting
      </Text>
      <PrimaryButton style={{ marginHorizontal: 24, bottom: -64 }} textStyle={{ fontSize: 24, fontWeight: 'bold' }} onPress={() => {}}>start voting</PrimaryButton>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  boxBorder: {
    borderRadius: 20,
    padding: 2,
    marginTop: 80,
    width: '100%',
  },
  boxInner: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  boxTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  participantsScroll: {
    maxHeight: 140,
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  participantName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '500',
    width: '33%',
    textAlign: 'center',
    paddingVertical: 12,
  },
  waitingCount: {
    color: Colors.icon,
    fontSize: 16,
    marginTop: 16,
    bottom: -16,
  },
});
