import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import type { CitoProductAdvantage } from '@/data/cito-product-info';
import type { DmuTarget } from '../../types';
import { filterByDmuTags } from '@/features/export/utils/dmu-tag-filter';

interface ProductInfoSectionProps {
  advantages?: CitoProductAdvantage[];
  dmuTarget: DmuTarget;
}

export function ProductInfoSection({ advantages, dmuTarget }: ProductInfoSectionProps) {
  const filtered = advantages ? filterByDmuTags(advantages, dmuTarget) : [];

  if (filtered.length === 0) {
    return null;
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Relevante Cito-voordelen</Text>
      {filtered.map((adv, i) => (
        <View key={i}>
          <Text style={styles.advantageTitle}>{adv.advantage}</Text>
          <Text style={styles.advantageContext}>{adv.context}</Text>
          <Text style={styles.advantageSource}>Bron: {adv.source}</Text>
        </View>
      ))}
    </View>
  );
}
