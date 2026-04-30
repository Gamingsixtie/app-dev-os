import type { ExportConfig, ReportType, DmuTarget } from '../types';
import type { DmuAssumption } from '@/data/dmu-assumptions';
import { AssumptionsEditor } from './AssumptionsEditor';

interface ExportConfigPanelProps {
  config: ExportConfig;
  onChange: (config: ExportConfig) => void;
  assumptions?: DmuAssumption[];
  defaultAssumptions?: DmuAssumption[];
  onAssumptionsChange?: (assumptions: DmuAssumption[]) => void;
}

const REPORT_OPTIONS: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'prijsvergelijking',
    label: 'Prijsvergelijking',
    description: 'Cito vs. concurrentie — prijzen per module',
  },
  {
    value: 'waarderapport',
    label: 'Waarderapport',
    description: 'Tijdwinst, migratie en meerjarenprojectie',
  },
  {
    value: 'gecombineerd',
    label: 'Gecombineerd rapport',
    description: 'Prijsvergelijking + waarderapport in één document',
  },
];

const DMU_OPTIONS: { value: DmuTarget; label: string; description: string }[] = [
  {
    value: 'generiek',
    label: 'Generiek',
    description: 'Standaard volgorde — geschikt voor iedereen',
  },
  {
    value: 'coordinator',
    label: 'Coördinator',
    description: 'Nadruk op tijdwinst en dagelijks gebruik',
  },
  {
    value: 'mt',
    label: 'MT / Directie',
    description: 'Nadruk op strategische waarde en lange termijn',
  },
  {
    value: 'finance',
    label: 'Finance',
    description: "Nadruk op euro's, ROI en break-even",
  },
];

export function ExportConfigPanel({
  config,
  onChange,
  assumptions,
  defaultAssumptions,
  onAssumptionsChange,
}: ExportConfigPanelProps) {
  return (
    <div className="space-y-6">
      {/* Report type */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Rapporttype</h3>
        <div className="space-y-2">
          {REPORT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                config.reportType === opt.value
                  ? 'border-cito-primary bg-cito-primary/5'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <input
                type="radio"
                name="reportType"
                value={opt.value}
                checked={config.reportType === opt.value}
                onChange={() => onChange({ ...config, reportType: opt.value })}
                className="mt-0.5 accent-cito-primary"
              />
              <div>
                <div className="text-sm font-medium text-neutral-800">{opt.label}</div>
                <div className="text-xs text-neutral-500">{opt.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* DMU target */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Doelgroep (DMU)</h3>
        <div className="space-y-2">
          {DMU_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                config.dmuTarget === opt.value
                  ? 'border-cito-primary bg-cito-primary/5'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <input
                type="radio"
                name="dmuTarget"
                value={opt.value}
                checked={config.dmuTarget === opt.value}
                onChange={() => onChange({ ...config, dmuTarget: opt.value })}
                className="mt-0.5 accent-cito-primary"
              />
              <div>
                <div className="text-sm font-medium text-neutral-800">{opt.label}</div>
                <div className="text-xs text-neutral-500">{opt.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Assumptions editor */}
      {assumptions && defaultAssumptions && onAssumptionsChange && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Aannames</h3>
          <AssumptionsEditor
            assumptions={assumptions}
            defaults={defaultAssumptions}
            onChange={onAssumptionsChange}
          />
        </div>
      )}
    </div>
  );
}
