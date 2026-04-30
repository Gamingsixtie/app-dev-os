import { View, Text } from '@react-pdf/renderer';
import { styles, CITO_COLORS } from '../styles';
import type { MigrationResult } from '@/engine/migration';

interface ValueReportSectionProps {
  migration: MigrationResult;
  sectionType: 'timeSavings' | 'migration' | 'multiYear';
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function TimeSavingsTable({ migration }: { migration: MigrationResult }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Tijdwinst</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Taak</Text>
        <Text style={[styles.tableHeaderCell, { width: '30%', textAlign: 'right' }]}>Uren/jaar</Text>
        <Text style={[styles.tableHeaderCell, { width: '30%', textAlign: 'right' }]}>Waarde/jaar</Text>
      </View>

      {migration.timeSavings.map((ts, i) => (
        <View key={ts.taskId} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
          <Text style={[styles.tableCell, { width: '40%' }]}>{ts.taskLabel}</Text>
          <Text style={[styles.tableCell, { width: '30%', textAlign: 'right' }]}>
            {ts.hoursPerYear ?? 0} uur
          </Text>
          <Text style={[styles.tableCell, { width: '30%', textAlign: 'right' }]}>
            {ts.valuePerYear > 0 ? formatEuro(ts.valuePerYear) : '—'}
          </Text>
        </View>
      ))}

      <View style={styles.tableTotalRow}>
        <Text style={[styles.tableCellBold, { width: '40%' }]}>Totaal</Text>
        <Text style={[styles.tableCellBold, { width: '30%', textAlign: 'right' }]}>
          {migration.totalTimeSavingsHours} uur
        </Text>
        <Text style={[styles.tableCellBold, { width: '30%', textAlign: 'right' }]}>
          {migration.totalTimeSavingsValue > 0 ? formatEuro(migration.totalTimeSavingsValue) : '—'}
        </Text>
      </View>
    </View>
  );
}

function MigrationTable({ migration }: { migration: MigrationResult }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Migratie Business Case</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: '34%' }]}>Module</Text>
        <Text style={[styles.tableHeaderCell, { width: '22%', textAlign: 'right' }]}>Huidig</Text>
        <Text style={[styles.tableHeaderCell, { width: '22%', textAlign: 'right' }]}>Nieuw Cito</Text>
        <Text style={[styles.tableHeaderCell, { width: '22%', textAlign: 'right' }]}>Verschil</Text>
      </View>

      {migration.modules.map((mod, i) => (
        <View key={mod.moduleId} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
          <Text style={[styles.tableCell, { width: '34%' }]}>{mod.moduleName}</Text>
          <Text style={[styles.tableCell, { width: '22%', textAlign: 'right' }]}>
            {formatEuro(mod.oldTotalCost)}
          </Text>
          <Text style={[styles.tableCell, { width: '22%', textAlign: 'right' }]}>
            {formatEuro(mod.newTotalCost)}
          </Text>
          <Text
            style={[
              styles.tableCell,
              {
                width: '22%',
                textAlign: 'right',
                color: mod.annualDifference > 0 ? CITO_COLORS.positive : CITO_COLORS.negative,
              },
            ]}
          >
            {mod.annualDifference > 0 ? '+' : ''}{formatEuro(mod.annualDifference)}
          </Text>
        </View>
      ))}

      <View style={styles.tableTotalRow}>
        <Text style={[styles.tableCellBold, { width: '34%' }]}>Totaal</Text>
        <Text style={[styles.tableCellBold, { width: '22%', textAlign: 'right' }]}>
          {formatEuro(migration.totalOldCost)}
        </Text>
        <Text style={[styles.tableCellBold, { width: '22%', textAlign: 'right' }]}>
          {formatEuro(migration.totalNewCost)}
        </Text>
        <Text
          style={[
            styles.tableCellBold,
            {
              width: '22%',
              textAlign: 'right',
              color: migration.financialDifference > 0 ? CITO_COLORS.positive : CITO_COLORS.negative,
            },
          ]}
        >
          {migration.financialDifference > 0 ? '+' : ''}{formatEuro(migration.financialDifference)}
        </Text>
      </View>
    </View>
  );
}

function MultiYearTable({ migration }: { migration: MigrationResult }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Meerjarenprojectie</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Periode</Text>
        <Text style={[styles.tableHeaderCell, { width: '60%', textAlign: 'right' }]}>
          Cumulatieve besparing
        </Text>
      </View>

      {migration.multiYearProjection.map((entry, i) => (
        <View key={entry.year} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
          <Text style={[styles.tableCell, { width: '40%' }]}>{entry.year} jaar</Text>
          <Text style={[styles.tableCell, { width: '60%', textAlign: 'right' }]}>
            {formatEuro(entry.cumulativeSavings)}
          </Text>
        </View>
      ))}

      {migration.breakEvenMonth !== null && migration.breakEvenMonth > 0 && (
        <View style={[styles.summaryBox, { marginTop: 8 }]}>
          <Text style={styles.summaryItem}>
            Break-even na {migration.breakEvenMonth} maanden
            {migration.switchingCosts > 0
              ? ` (overstapkosten: ${formatEuro(migration.switchingCosts)})`
              : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export function ValueReportSection({ migration, sectionType }: ValueReportSectionProps) {
  switch (sectionType) {
    case 'timeSavings':
      return <TimeSavingsTable migration={migration} />;
    case 'migration':
      return <MigrationTable migration={migration} />;
    case 'multiYear':
      return <MultiYearTable migration={migration} />;
  }
}
