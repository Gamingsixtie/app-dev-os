import { View, Text } from '@react-pdf/renderer';
import { styles, CITO_COLORS } from '../styles';
import type { DmuTarget, ReportData } from '../../types';
import { filterByDmuTags, tagSchoolplanOpportunity } from '@/features/export/utils/dmu-tag-filter';

interface SchoolplanSectionProps {
  opportunities: ReportData['schoolplanOpportunities'];
  dmuTarget?: DmuTarget;
}

const STATUS_COLORS: Record<string, string> = {
  open: CITO_COLORS.accent,
  besproken: CITO_COLORS.positive,
  'niet-relevant': CITO_COLORS.textMuted,
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  besproken: 'Besproken',
  'niet-relevant': 'Niet relevant',
};

export function SchoolplanSection({ opportunities, dmuTarget }: SchoolplanSectionProps) {
  // Tag and filter opportunities by DMU role
  const filtered = opportunities
    ? (dmuTarget && dmuTarget !== 'generiek'
      ? opportunities
          .map(opp => ({ ...opp, tags: opp.tags ?? tagSchoolplanOpportunity(opp) }))
          .filter(opp => filterByDmuTags([opp], dmuTarget).length > 0)
      : opportunities)
    : [];

  if (filtered.length === 0) {
    return null;
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Schoolplan Kansen</Text>
      {filtered.map((opp, i) => (
        <View
          key={i}
          style={{
            marginBottom: 8,
            padding: 8,
            backgroundColor: CITO_COLORS.background,
            borderRadius: 3,
            borderLeftWidth: 2,
            borderLeftColor: STATUS_COLORS[opp.status] ?? CITO_COLORS.textMuted,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: CITO_COLORS.primary }}>
              {opp.theme}
            </Text>
            <Text
              style={{
                fontSize: 7,
                color: STATUS_COLORS[opp.status] ?? CITO_COLORS.textMuted,
                fontFamily: 'Helvetica-Bold',
              }}
            >
              {STATUS_LABELS[opp.status] ?? opp.status}
            </Text>
          </View>
          <Text style={{ fontSize: 9, color: CITO_COLORS.textMuted, marginBottom: 2 }}>
            {opp.citoProduct}
          </Text>
          <Text style={{ fontSize: 8, color: CITO_COLORS.textDark, lineHeight: 1.4 }}>
            {opp.explanation}
          </Text>
        </View>
      ))}
    </View>
  );
}
