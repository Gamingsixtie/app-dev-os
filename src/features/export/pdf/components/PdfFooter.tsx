import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

export function PdfFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        Alle getoonde publicatieprijzen zijn bovengrenzen. De werkelijke prijs kan lager zijn.
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}
