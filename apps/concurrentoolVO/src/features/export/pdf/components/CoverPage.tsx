import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import type { DmuTarget, ReportType } from '../../types';

interface CoverPageProps {
  schoolName: string;
  date: string;
  dmuTarget: DmuTarget;
  reportType: ReportType;
}

const DMU_LABELS: Record<DmuTarget, string> = {
  coordinator: 'Coordinator',
  mt: 'MT / Directie',
  finance: 'Finance',
  generiek: 'Generiek',
};

const REPORT_TITLES: Record<ReportType, string> = {
  prijsvergelijking: 'Prijsvergelijking',
  waarderapport: 'Waarderapport',
  gecombineerd: 'Vergelijking & Waarde',
};

export function CoverPage({ schoolName, date, dmuTarget, reportType }: CoverPageProps) {
  return (
    <Page size="A4" style={styles.coverPage}>
      {/* Replace with <Image src={citoLogo} style={styles.coverLogo} /> when src/assets/cito-logo.png is provided */}
      <Text style={styles.coverLogoText}>Cito</Text>

      <Text style={styles.coverTitle}>{REPORT_TITLES[reportType]}</Text>
      <Text style={styles.coverSchoolName}>{schoolName}</Text>
      <View style={styles.coverAccentLine} />
      <Text style={styles.coverMeta}>{date}</Text>
      <Text style={styles.coverMeta}>Doelgroep: {DMU_LABELS[dmuTarget]}</Text>
      <Text style={styles.coverConfidential}>Vertrouwelijk — opgesteld voor {schoolName}</Text>
    </Page>
  );
}
