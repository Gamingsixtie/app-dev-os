import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import type { ComparisonResult, ProviderKey } from '@/engine/price-comparison';
import { PROVIDER_LABELS } from '@/engine/price-comparison';

interface PriceComparisonSectionProps {
  comparison: ComparisonResult;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const COL_WIDTHS = { module: '30%', cito: '17.5%', dia: '17.5%', jij: '17.5%', saqi: '17.5%' };
const PROVIDERS: ProviderKey[] = ['cito', 'dia', 'jij', 'saqi'];

export function PriceComparisonSection({ comparison }: PriceComparisonSectionProps) {
  // Only show providers that have at least one module with pricing
  const activeProviders = PROVIDERS.filter((p) =>
    comparison.modules.some((m) => m.providers[p] !== null),
  );

  return (
    <View>
      <Text style={styles.sectionTitle}>Prijsvergelijking</Text>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: COL_WIDTHS.module }]}>Module</Text>
        {activeProviders.map((p) => (
          <Text
            key={p}
            style={[
              styles.tableHeaderCell,
              { width: COL_WIDTHS[p], textAlign: 'right' },
            ]}
          >
            {PROVIDER_LABELS[p]}
          </Text>
        ))}
      </View>

      {/* Table rows */}
      {comparison.modules.map((mod, i) => (
        <View key={mod.moduleId} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
          <Text style={[styles.tableCell, { width: COL_WIDTHS.module }]}>
            {mod.moduleName}
          </Text>
          {activeProviders.map((p) => {
            const cost = mod.providers[p];
            return (
              <Text
                key={p}
                style={[
                  styles.tableCell,
                  { width: COL_WIDTHS[p], textAlign: 'right' },
                ]}
              >
                {cost ? formatEuro(cost.totalCost) : '—'}
              </Text>
            );
          })}
        </View>
      ))}

      {/* Totals row */}
      <View style={styles.tableTotalRow}>
        <Text style={[styles.tableCellBold, { width: COL_WIDTHS.module }]}>Totaal per jaar</Text>
        {activeProviders.map((p) => (
          <Text
            key={p}
            style={[
              styles.tableCellBold,
              { width: COL_WIDTHS[p], textAlign: 'right' },
            ]}
          >
            {formatEuro(comparison.totals[p])}
          </Text>
        ))}
      </View>

      {/* Differences */}
      <View style={{ marginTop: 8 }}>
        {comparison.differences.citoVsDia !== null && (
          <Text style={[styles.tableCell, { marginBottom: 2 }]}>
            Verschil Cito vs DIA: {formatEuro(comparison.differences.citoVsDia)}
            {comparison.differences.citoVsDia < 0 ? ' (Cito goedkoper)' : ''}
          </Text>
        )}
        {comparison.differences.citoVsJij !== null && (
          <Text style={[styles.tableCell, { marginBottom: 2 }]}>
            Verschil Cito vs JIJ: {formatEuro(comparison.differences.citoVsJij)}
            {comparison.differences.citoVsJij < 0 ? ' (Cito goedkoper)' : ''}
          </Text>
        )}
        {comparison.differences.citoVsSaqi !== null && (
          <Text style={styles.tableCell}>
            Verschil Cito vs SAQI: {formatEuro(comparison.differences.citoVsSaqi)}
            {comparison.differences.citoVsSaqi < 0 ? ' (Cito goedkoper)' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}
