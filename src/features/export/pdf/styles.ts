import { StyleSheet } from '@react-pdf/renderer';

export const CITO_COLORS = {
  primary: '#003082',
  accent: '#FF6600',
  background: '#F8F9FA',
  textDark: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  positive: '#16A34A',
  negative: '#DC2626',
  white: '#FFFFFF',
} as const;

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: CITO_COLORS.textDark,
    backgroundColor: CITO_COLORS.white,
  },
  // Header
  header: {
    marginBottom: 24,
    borderBottomWidth: 3,
    borderBottomColor: CITO_COLORS.primary,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: CITO_COLORS.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: CITO_COLORS.textMuted,
  },
  headerConfidential: {
    fontSize: 9,
    color: CITO_COLORS.accent,
    marginTop: 8,
    fontFamily: 'Helvetica-Oblique',
  },
  // Sections
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: CITO_COLORS.primary,
    marginBottom: 10,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: CITO_COLORS.border,
    paddingBottom: 4,
  },
  // Summary
  summaryBox: {
    backgroundColor: CITO_COLORS.background,
    padding: 14,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: CITO_COLORS.accent,
  },
  summaryItem: {
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 1.5,
  },
  summaryHighlight: {
    fontFamily: 'Helvetica-Bold',
    color: CITO_COLORS.primary,
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: CITO_COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 2,
    marginBottom: 1,
  },
  tableHeaderCell: {
    color: CITO_COLORS.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: CITO_COLORS.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: CITO_COLORS.border,
    backgroundColor: CITO_COLORS.background,
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: CITO_COLORS.background,
    borderTopWidth: 2,
    borderTopColor: CITO_COLORS.primary,
    marginTop: 2,
  },
  tableCell: {
    fontSize: 9,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: CITO_COLORS.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: CITO_COLORS.textMuted,
  },
  pageNumber: {
    fontSize: 7,
    color: CITO_COLORS.textMuted,
    textAlign: 'right',
  },
  // Chart
  chartContainer: {
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 9,
    color: CITO_COLORS.textMuted,
    marginBottom: 8,
    textAlign: 'center',
  },
  // Cover page
  coverPage: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: CITO_COLORS.white,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverLogo: {
    maxWidth: 180,
    maxHeight: 60,
    marginBottom: 48,
  },
  coverLogoText: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: CITO_COLORS.primary,
    marginBottom: 48,
  },
  coverTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: CITO_COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  coverSchoolName: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: CITO_COLORS.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  coverAccentLine: {
    width: 60,
    height: 3,
    backgroundColor: CITO_COLORS.accent,
    marginBottom: 24,
  },
  coverMeta: {
    fontSize: 12,
    color: CITO_COLORS.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  coverConfidential: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
    color: CITO_COLORS.accent,
    marginTop: 32,
    textAlign: 'center',
  },
  // Intro section
  introText: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
    color: CITO_COLORS.textDark,
    marginBottom: 16,
  },
  // Product info section
  advantageTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: CITO_COLORS.textDark,
    marginBottom: 2,
  },
  advantageContext: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: CITO_COLORS.textDark,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  advantageSource: {
    fontSize: 8,
    fontFamily: 'Helvetica-Oblique',
    color: CITO_COLORS.textMuted,
    marginBottom: 8,
  },
  // Disclaimer
  disclaimer: {
    marginTop: 24,
    padding: 10,
    backgroundColor: CITO_COLORS.background,
    borderRadius: 3,
  },
  disclaimerText: {
    fontSize: 8,
    color: CITO_COLORS.textMuted,
    fontFamily: 'Helvetica-Oblique',
    lineHeight: 1.5,
  },
});
