import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import type { ComparisonResult, ProviderKey } from '../../engine/price-comparison';
import { PROVIDER_LABELS } from '../../engine/price-comparison';
import { formatCurrency, formatCurrencyCompact } from '../../lib/format';
import { useSchoolProfileStore } from '../school-profile/store';
import { usePriceComparisonStore } from './store';

// ─── Provider brand colors (consistent with rest of app) ──────────────────────

const CHART_COLORS: Record<string, string> = {
  cito: '#003082',
  dia: '#FF6600',
  jij: '#22C55E',
  saqi: '#8B5CF6',
  naOverstap: '#003082',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartDataPoint {
  module: string;
  moduleId: string;
  cito: number | null;
  dia: number | null;
  jij: number | null;
  saqi: number | null;
  naOverstap: number | null;
  citoPerStudent: number | null;
  diaPerStudent: number | null;
  jijPerStudent: number | null;
  saqiPerStudent: number | null;
}

interface ComparisonChartProps {
  result: ComparisonResult;
  onBarClick?: (moduleId: string) => void;
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | null;
    dataKey: string;
    payload: ChartDataPoint;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-lg p-3.5 min-w-[180px]">
      <p className="text-[13px] font-semibold text-neutral-800 mb-2 pb-1.5 border-b border-neutral-100">
        {label}
      </p>
      <div className="space-y-2">
        {payload.map((entry) => {
          if (entry.value == null) return null;
          const color = CHART_COLORS[entry.dataKey] ?? '#6B7280';
          const perStudentKey =
            `${entry.dataKey}PerStudent` as keyof ChartDataPoint;
          const perStudent = entry.payload[perStudentKey] as number | null;

          return (
            <div key={entry.dataKey} className="flex items-start gap-2">
              <span
                className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-neutral-500">
                    {entry.name}
                  </span>
                  <span className="text-[13px] font-semibold text-neutral-800 tabular-nums">
                    {formatCurrency(entry.value)}
                  </span>
                </div>
                {perStudent != null && (
                  <span className="text-[11px] text-neutral-400 tabular-nums">
                    {formatCurrency(perStudent)} per leerling
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Custom legend ────────────────────────────────────────────────────────────

function ChartLegend({ providers }: { providers: { key: string; label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-3">
      {providers.map((p) => (
        <div key={p.key} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-[3px]"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-[12px] font-medium text-neutral-600">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Compact value label renderer ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBarLabel(props: any) {
  const { x = 0, y = 0, width = 0, value } = props;
  if (value == null || value === 0) return null;

  return (
    <text
      x={Number(x) + Number(width) / 2}
      y={Number(y) - 6}
      fill="#6B7280"
      textAnchor="middle"
      fontSize={10}
      fontWeight={500}
    >
      {formatCurrencyCompact(Number(value))}
    </text>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ComparisonChart({ result, onBarClick }: ComparisonChartProps) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );

  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const hybridResult = usePriceComparisonStore((s) => s.hybridResult);

  // Dynamic visibility: only show providers that have data
  const showJij = moduleSetups.some((s) => s.currentProvider === 'jij');
  const showNaOverstap = (hybridResult?.modules.length ?? 0) > 0;
  const showSaqi = result.modules.some((m) => m.providers.saqi !== null);

  const visibleProviders: ProviderKey[] = ['cito', 'dia'];
  if (showJij) visibleProviders.push('jij');
  if (showSaqi) visibleProviders.push('saqi');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const data: ChartDataPoint[] = useMemo(
    () =>
      result.modules.map((mod) => {
        const hybridMod = hybridResult?.modules.find(
          (m) => m.moduleId === mod.moduleId,
        );
        return {
          module: mod.moduleName,
          moduleId: mod.moduleId,
          cito: mod.providers.cito?.totalCost ?? null,
          dia: mod.providers.dia?.totalCost ?? null,
          jij: mod.providers.jij?.totalCost ?? null,
          saqi: mod.providers.saqi?.totalCost ?? null,
          naOverstap: hybridMod?.citoCost ?? null,
          citoPerStudent: mod.providers.cito?.pricePerStudent ?? null,
          diaPerStudent: mod.providers.dia?.pricePerStudent ?? null,
          jijPerStudent: mod.providers.jij?.pricePerStudent ?? null,
          saqiPerStudent: mod.providers.saqi?.pricePerStudent ?? null,
        };
      }),
    [result.modules, hybridResult],
  );

  const isMobile = windowWidth < 640;
  const isNarrow = windowWidth < 480;
  const barSize = isMobile ? 18 : 28;
  const showValueLabels = !isMobile && data.length <= 6;

  const handleBarClick = useCallback(
    (data: ChartDataPoint) => {
      onBarClick?.(data.moduleId);
    },
    [onBarClick],
  );

  // Build legend items
  const legendItems = [
    { key: 'cito', label: PROVIDER_LABELS.cito, color: CHART_COLORS.cito },
    { key: 'dia', label: PROVIDER_LABELS.dia, color: CHART_COLORS.dia },
    ...(showJij ? [{ key: 'jij', label: PROVIDER_LABELS.jij, color: CHART_COLORS.jij }] : []),
    ...(showSaqi ? [{ key: 'saqi', label: PROVIDER_LABELS.saqi, color: CHART_COLORS.saqi }] : []),
    ...(showNaOverstap ? [{ key: 'naOverstap', label: 'Na overstap', color: '#7B9BC8' }] : []),
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={isMobile ? 280 : 340}>
        <BarChart
          data={data}
          barSize={barSize}
          barGap={2}
          barCategoryGap="20%"
          margin={{ top: showValueLabels ? 24 : 8, right: 8, bottom: 4, left: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f0f0f0"
          />
          <XAxis
            dataKey="module"
            tick={{ fontSize: isNarrow ? 11 : 13, fill: '#6B7280' }}
            angle={isNarrow ? -45 : 0}
            textAnchor={isNarrow ? 'end' : 'middle'}
            axisLine={false}
            tickLine={false}
            height={isNarrow ? 60 : 30}
          />
          <YAxis
            tickFormatter={(value: number) => formatCurrencyCompact(value)}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 48, 130, 0.04)', radius: 4 }}
          />

          {/* Cito */}
          <Bar
            dataKey="cito"
            name={PROVIDER_LABELS.cito}
            fill={CHART_COLORS.cito}
            radius={[4, 4, 0, 0]}
            onClick={(_data: unknown, index: number) =>
              handleBarClick(data[index])
            }
            style={{ cursor: onBarClick ? 'pointer' : undefined }}
          >
            {showValueLabels && (
              <LabelList dataKey="cito" content={renderBarLabel} />
            )}
          </Bar>

          {/* DIA */}
          <Bar
            dataKey="dia"
            name={PROVIDER_LABELS.dia}
            fill={CHART_COLORS.dia}
            radius={[4, 4, 0, 0]}
          >
            {showValueLabels && (
              <LabelList dataKey="dia" content={renderBarLabel} />
            )}
          </Bar>

          {/* JIJ */}
          {visibleProviders.includes('jij') && (
            <Bar
              dataKey="jij"
              name={PROVIDER_LABELS.jij}
              fill={CHART_COLORS.jij}
              radius={[4, 4, 0, 0]}
            >
              {showValueLabels && (
                <LabelList dataKey="jij" content={renderBarLabel} />
              )}
            </Bar>
          )}

          {/* SAQI */}
          {visibleProviders.includes('saqi') && (
            <Bar
              dataKey="saqi"
              name={PROVIDER_LABELS.saqi}
              fill={CHART_COLORS.saqi}
              radius={[4, 4, 0, 0]}
            >
              {showValueLabels && (
                <LabelList dataKey="saqi" content={renderBarLabel} />
              )}
            </Bar>
          )}

          {/* Na overstap (hybrid) */}
          {showNaOverstap && (
            <Bar
              dataKey="naOverstap"
              name="Na overstap"
              fill="#7B9BC8"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      <ChartLegend providers={legendItems} />
    </div>
  );
}
