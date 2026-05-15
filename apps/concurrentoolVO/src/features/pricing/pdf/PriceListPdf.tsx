/**
 * PDF document template for the price-list export.
 *
 * Reuses `CITO_COLORS` from the existing export/pdf/ infrastructure so the price
 * list shares Cito-branding tokens with the school-report PDFs. Logo is text-only
 * ("CITO" in primary color) per D-18 — consistent with the existing PdfHeader
 * pattern which also uses text rather than an <Image>.
 *
 * Consumed lazily by PriceListExportButton via:
 *   const { pdf } = await import('@react-pdf/renderer');
 *   const { PriceListPdf } = await import('../pdf/PriceListPdf');
 *   const blob = await pdf(<PriceListPdf snapshot={snapshot} />).toBlob();
 */

import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { CITO_COLORS } from '@/features/export/pdf/styles';
import type { PriceListSnapshot } from '../export/price-list-snapshot';

interface PriceListPdfProps {
  snapshot: PriceListSnapshot;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: CITO_COLORS.textDark,
    backgroundColor: CITO_COLORS.white,
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: CITO_COLORS.primary,
    paddingBottom: 12,
  },
  brand: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: CITO_COLORS.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: CITO_COLORS.primary,
  },
  date: {
    fontSize: 10,
    color: CITO_COLORS.textMuted,
    marginTop: 4,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: CITO_COLORS.primary,
    color: CITO_COLORS.white,
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: CITO_COLORS.border,
    padding: 6,
  },
  colProvider: { width: '20%' },
  colType: { width: '25%' },
  colDesc: { width: '55%' },
  disclaimer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CITO_COLORS.border,
    color: CITO_COLORS.accent,
    fontFamily: 'Helvetica-Oblique',
    fontSize: 9,
  },
});

export function PriceListPdf({ snapshot }: PriceListPdfProps) {
  return (
    <Document title={snapshot.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>CITO</Text>
          <Text style={styles.title}>{snapshot.title}</Text>
          <Text style={styles.date}>{snapshot.dateLabel}</Text>
        </View>
        <View style={styles.tableHead}>
          <Text style={styles.colProvider}>Aanbieder</Text>
          <Text style={styles.colType}>Prijsmodel</Text>
          <Text style={styles.colDesc}>Beschrijving</Text>
        </View>
        {snapshot.rows.map((r) => (
          <View key={r.provider} style={styles.row} wrap={false}>
            <Text style={styles.colProvider}>{r.providerLabel}</Text>
            <Text style={styles.colType}>{r.pricingType}</Text>
            <Text style={styles.colDesc}>{r.description}</Text>
          </View>
        ))}
        <Text style={styles.disclaimer}>{snapshot.disclaimer}</Text>
      </Page>
    </Document>
  );
}
