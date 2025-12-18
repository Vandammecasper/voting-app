import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, Text, TextStyle } from 'react-native';

interface GradientTextProps {
  text: string;
  colors?: string[];
  style?: StyleProp<TextStyle>;
}

export function GradientText({ 
  text, 
  colors = ['#6E92FF', '#90FF91'],
  style 
}: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: 'transparent' }]}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={colors as [string, string]}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.56, y: 1 }}
      >
        <Text style={[style, { opacity: 0 }]}>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

