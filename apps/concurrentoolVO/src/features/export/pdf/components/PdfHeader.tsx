import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

interface PdfHeaderProps {
  title: string;
  schoolName: string;
  date: string;
}

export function PdfHeader({ title, schoolName, date }: PdfHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>
        {schoolName} — {date}
      </Text>
      <Text style={styles.headerConfidential}>
        Vertrouwelijk — opgesteld voor {schoolName}
      </Text>
    </View>
  );
}
