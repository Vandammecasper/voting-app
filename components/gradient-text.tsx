import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, Text, TextStyle } from 'react-native';

import { defaultFontFamily } from '@/constants/theme';

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
  const textStyle = [style, { fontFamily: defaultFontFamily }];
  return (
    <MaskedView
      maskElement={
        <Text style={[...textStyle, { backgroundColor: 'transparent' }]}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={colors as [string, string]}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.56, y: 1 }}
      >
        <Text style={[...textStyle, { opacity: 0 }]}>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

