import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import type { ReportData } from '../../types';
import type { ReportSections } from '../dmu-filters';

interface SummarySectionProps {
  data: ReportData;
  sections: ReportSections;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// eslint-disable-next-line react-refresh/only-export-components -- PDF components are rarely dev-iterated; HMR loss acceptable
export function getSummaryBullets(data: ReportData, focus: ReportSections['summaryFocus']): string[] {
  const bullets: string[] = [];

  switch (focus) {
    case 'practical': {
      if (data.migration) {
        bullets.push(
          `${data.migration.totalTimeSavingsHours} uur tijdwinst per jaar door automatisering`,
        );
        if (data.migration.totalTimeSavingsValue > 0) {
          bullets.push(`Waarde tijdwinst: ${formatEuro(data.migration.totalTimeSavingsValue)} per jaar`);
        }
      }
      if (data.priceDifference !== null && data.priceDifference > 0) {
        bullets.push(`${formatEuro(data.priceDifference)} goedkoper dan de concurrentie`);
      }
      bullets.push('Minder handmatig werk bij data-import, rapportages en toetsplanning');
      break;
    }
    case 'strategic': {
      if (data.migration) {
        const yearValue = data.migration.totalAnnualValue;
        if (yearValue > 0) {
          bullets.push(`Totale jaarlijkse waarde: ${formatEuro(yearValue)}`);
          bullets.push(`Na 3 jaar: ${formatEuro(yearValue * 3)} totale besparing`);
        }
      }
      if (data.priceDifference !== null && data.priceDifference > 0) {
        bullets.push(`Prijsvoordeel: ${formatEuro(data.priceDifference)} per jaar t.o.v. concurrentie`);
      }
      bullets.push('Toekomstbestendig platform met doorontwikkeling');
      break;
    }
    case 'financial': {
      if (data.priceDifference !== null && data.priceDifference > 0) {
        bullets.push(`${formatEuro(data.priceDifference)} goedkoper per jaar`);
      }
      if (data.migration) {
        if (data.migration.breakEvenMonth !== null && data.migration.breakEvenMonth > 0) {
          bullets.push(`Break-even na ${data.migration.breakEvenMonth} maanden`);
        }
        if (data.migration.totalAnnualValue > 0) {
          bullets.push(`ROI 3 jaar: ${formatEuro(data.migration.totalAnnualValue * 3)}`);
        }
        if (data.migration.financialDifference > 0) {
          bullets.push(`Licentiekosten: ${formatEuro(data.migration.financialDifference)} lager per jaar`);
        }
      }
      break;
    }
    case 'balanced': {
      if (data.priceDifference !== null && data.priceDifference > 0) {
        bullets.push(`${formatEuro(data.priceDifference)} goedkoper dan de concurrentie`);
      }
      if (data.migration) {
        if (data.migration.totalTimeSavingsHours > 0) {
          bullets.push(`${data.migration.totalTimeSavingsHours} uur tijdwinst per jaar`);
        }
        if (data.migration.totalAnnualValue > 0) {
          bullets.push(`Totale jaarlijkse waarde: ${formatEuro(data.migration.totalAnnualValue)}`);
        }
      }
      break;
    }
  }

  return bullets.length > 0 ? bullets : ['Vergelijking op basis van publicatieprijzen'];
}

export function SummarySection({ data, sections }: SummarySectionProps) {
  const bullets = getSummaryBullets(data, sections.summaryFocus);

  return (
    <View>
      <Text style={styles.sectionTitle}>Samenvatting</Text>
      <View style={styles.summaryBox}>
        {bullets.map((bullet, i) => (
          <Text key={i} style={styles.summaryItem}>
            {'• '}{bullet}
          </Text>
        ))}
      </View>
    </View>
  );
}
