import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import type { DmuAssumption } from '@/data/dmu-assumptions';

interface IntroSectionProps {
  assumptions?: DmuAssumption[];
}

export function IntroSection({ assumptions }: IntroSectionProps) {
  if (!assumptions || assumptions.length === 0) {
    return null;
  }

  return (
    <View>
      <Text style={styles.introText}>{assumptions[0].introText}</Text>
    </View>
  );
}
