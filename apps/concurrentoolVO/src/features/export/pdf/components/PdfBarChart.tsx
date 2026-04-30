import { Svg, Rect, Text, G, Line } from '@react-pdf/renderer';
import { View, Text as PdfText } from '@react-pdf/renderer';
import { styles, CITO_COLORS } from '../styles';

export interface BarChartItem {
  label: string;
  value: number;
  color: string;
}

export interface BarLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
  value: number;
  formattedValue: string;
}

export interface BarLayoutResult {
  bars: BarLayout[];
  chartHeight: number;
  chartWidth: number;
  yAxisX: number;
}

const eurFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/**
 * Pure function that calculates bar positions and dimensions.
 * Extracted for unit testing without @react-pdf/renderer dependencies.
 */
export function calculateBarLayout(
  data: BarChartItem[],
  width = 400,
  height = 180,
): BarLayoutResult {
  const yAxisX = 55;
  const chartHeight = height - 30;
  const chartWidth = width - yAxisX - 10;

  if (data.length === 0) {
    return { bars: [], chartHeight, chartWidth, yAxisX };
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const barGap = 8;
  const barWidth = (chartWidth - barGap * (data.length + 1)) / data.length;

  const bars: BarLayout[] = data.map((item, i) => {
    const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
    const x = yAxisX + barGap + i * (barWidth + barGap);
    const y = chartHeight - barHeight;

    return {
      x,
      y,
      width: barWidth,
      height: barHeight,
      color: item.color,
      label: item.label,
      value: item.value,
      formattedValue: eurFormatter.format(item.value),
    };
  });

  return { bars, chartHeight, chartWidth, yAxisX };
}

/** Provider color mapping */
export const PROVIDER_CHART_COLORS: Record<string, string> = {
  cito: CITO_COLORS.primary,    // #003082
  dia: CITO_COLORS.accent,      // #FF6600
  jij: '#4CAF50',
  saqi: '#9C27B0',
};

interface PdfBarChartProps {
  data: BarChartItem[];
  width?: number;
  height?: number;
  title?: string;
}

export function PdfBarChart({ data, width = 400, height = 180, title }: PdfBarChartProps) {
  const layout = calculateBarLayout(data, width, height);

  return (
    <View style={styles.chartContainer}>
      {title && <PdfText style={styles.chartTitle}>{title}</PdfText>}
      <Svg width={width} height={height}>
        {/* Y-axis line */}
        <Line
          x1={layout.yAxisX}
          y1={0}
          x2={layout.yAxisX}
          y2={layout.chartHeight}
          style={{ strokeWidth: 1 }}
          stroke={CITO_COLORS.border}
        />
        {/* Bars */}
        {layout.bars.map((bar, i) => (
          <G key={i}>
            <Rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.color}
            />
            {/* Value label above bar */}
            <Text
              x={bar.x + bar.width / 2}
              y={bar.y - 4}
              style={{ fontSize: 7, textAnchor: 'middle' }}
              fill={CITO_COLORS.textDark}
            >
              {bar.formattedValue}
            </Text>
            {/* Label below bar */}
            <Text
              x={bar.x + bar.width / 2}
              y={layout.chartHeight + 12}
              style={{ fontSize: 7, textAnchor: 'middle' }}
              fill={CITO_COLORS.textMuted}
            >
              {bar.label}
            </Text>
          </G>
        ))}
      </Svg>
    </View>
  );
}
