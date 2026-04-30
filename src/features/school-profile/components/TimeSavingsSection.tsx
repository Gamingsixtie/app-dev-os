import { useState } from 'react';
import type { TimeSavingResult } from '@/engine/migration';
import type { TimeSavingTask } from '@/models/migration';
import { TIME_SAVING_TASKS } from '@/models/migration';
import { EditableField } from './EditableField';
import { formatCurrency } from '@/lib/format';

interface TimeSavingsSectionProps {
  timeSavings: TimeSavingResult[];
  totalHours: number;
  totalValue: number;
  hourlyRate: number | null;
  hiddenTaskIds: string[];
  customTasks: TimeSavingTask[];
  onHoursChange: (taskId: string, hours: number | null) => void;
  onHourlyRateChange: (rate: number | null) => void;
  onAddCustomTask: (task: TimeSavingTask) => void;
  onRemoveCustomTask: (taskId: string) => void;
  onUpdateCustomTask: (taskId: string, updates: Partial<TimeSavingTask>) => void;
  onToggleHidden: (taskId: string) => void;
}

const STANDARD_IDS = new Set(TIME_SAVING_TASKS.map((t) => t.id));

export function TimeSavingsSection({
  timeSavings,
  totalHours,
  totalValue,
  hourlyRate,
  hiddenTaskIds,
  customTasks,
  onHoursChange,
  onHourlyRateChange,
  onAddCustomTask,
  onRemoveCustomTask,
  onUpdateCustomTask,
  onToggleHidden,
}: TimeSavingsSectionProps) {
  const hasRate = hourlyRate !== null && hourlyRate > 0;
  const filledCount = timeSavings.filter((t) => t.hoursPerYear !== null).length;
  const totalCount = timeSavings.length;
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newOld, setNewOld] = useState('');
  const [newNew, setNewNew] = useState('');

  const getDescription = (taskId: string) => {
    const std = TIME_SAVING_TASKS.find((t) => t.id === taskId);
    if (std) return std.description;
    const custom = customTasks.find((t) => t.id === taskId);
    return custom?.description ?? '';
  };

  const isCustom = (taskId: string) => !STANDARD_IDS.has(taskId);

  const handleAddTask = () => {
    if (!newLabel.trim()) return;
    const task: TimeSavingTask = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      oldMethodLabel: newOld.trim() || 'Handmatig',
      newMethodLabel: newNew.trim() || 'Automatisch',
      defaultHoursPerYear: 0,
      description: '',
      benefit: '',
    };
    onAddCustomTask(task);
    setNewLabel('');
    setNewOld('');
    setNewNew('');
    setAddingNew(false);
  };

  // Hidden standard tasks (shown as collapsed row to re-enable)
  const hiddenStandard = TIME_SAVING_TASKS.filter((t) => hiddenTaskIds.includes(t.id));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="text-lg font-semibold text-cito-primary">
          Tijdwinst nieuw platform
        </h3>
        <div className="flex items-center gap-3">
          {hasRate ? (
            <EditableField
              label="Uurtarief"
              value={hourlyRate}
              unit="EUR/uur"
              onChange={(v) => onHourlyRateChange(v)}
            />
          ) : (
            <button
              type="button"
              onClick={() => onHourlyRateChange(50)}
              className="text-sm text-cito-primary underline decoration-dashed underline-offset-2 hover:text-cito-accent"
            >
              Uurtarief invullen
            </button>
          )}
          {hasRate && (
            <button
              type="button"
              onClick={() => onHourlyRateChange(null)}
              className="text-xs text-neutral-400 hover:text-neutral-600"
              title="Uurtarief verwijderen"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Taak</th>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Oud</th>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Nieuw</th>
              <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">Uren/jaar</th>
              {hasRate && (
                <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">EUR/jaar</th>
              )}
              <th className="py-2 px-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {timeSavings.map((task, index) => (
              <tr key={task.taskId} className={index % 2 === 1 ? 'bg-neutral-50' : ''}>
                <td className="py-2 px-3">
                  {isCustom(task.taskId) ? (
                    <input
                      type="text"
                      value={task.taskLabel}
                      onChange={(e) => onUpdateCustomTask(task.taskId, { label: e.target.value })}
                      className="text-sm font-medium bg-transparent border-b border-dashed border-neutral-300 focus:border-cito-primary outline-none w-full"
                    />
                  ) : (
                    <div className="text-sm">{task.taskLabel}</div>
                  )}
                  <div className="text-xs text-neutral-400 mt-0.5">{getDescription(task.taskId)}</div>
                </td>
                <td className="py-2 px-3">
                  {isCustom(task.taskId) ? (
                    <input
                      type="text"
                      value={task.oldMethodLabel}
                      onChange={(e) => onUpdateCustomTask(task.taskId, { oldMethodLabel: e.target.value })}
                      className="text-sm text-neutral-500 bg-transparent border-b border-dashed border-neutral-300 focus:border-cito-primary outline-none w-full"
                    />
                  ) : (
                    <span className="text-sm text-neutral-500">{task.oldMethodLabel}</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  {isCustom(task.taskId) ? (
                    <input
                      type="text"
                      value={task.newMethodLabel}
                      onChange={(e) => onUpdateCustomTask(task.taskId, { newMethodLabel: e.target.value })}
                      className="text-sm text-neutral-500 bg-transparent border-b border-dashed border-neutral-300 focus:border-cito-primary outline-none w-full"
                    />
                  ) : (
                    <span className="text-sm text-neutral-500">{task.newMethodLabel}</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right">
                  {task.hoursPerYear !== null ? (
                    <div className="flex items-center justify-end gap-1">
                      <EditableField
                        label=""
                        value={task.hoursPerYear}
                        unit="uur"
                        onChange={(h) => onHoursChange(task.taskId, h)}
                      />
                      <button
                        type="button"
                        onClick={() => onHoursChange(task.taskId, null)}
                        className="text-xs text-neutral-300 hover:text-neutral-500 ml-1"
                        title="Uren wissen"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const defaultHours = TIME_SAVING_TASKS.find((t) => t.id === task.taskId)?.defaultHoursPerYear
                          ?? customTasks.find((t) => t.id === task.taskId)?.defaultHoursPerYear
                          ?? 8;
                        onHoursChange(task.taskId, defaultHours);
                      }}
                      className="text-sm text-cito-primary underline decoration-dashed underline-offset-2 hover:text-cito-accent"
                    >
                      Invullen
                    </button>
                  )}
                </td>
                {hasRate && (
                  <td className="py-2 px-3 text-sm text-right">
                    {task.hoursPerYear !== null ? formatCurrency(task.valuePerYear) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                )}
                <td className="py-2 px-3 text-right">
                  {isCustom(task.taskId) ? (
                    <button
                      type="button"
                      onClick={() => onRemoveCustomTask(task.taskId)}
                      className="text-xs text-neutral-300 hover:text-red-500"
                      title="Taak verwijderen"
                    >
                      ✕
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleHidden(task.taskId)}
                      className="text-xs text-neutral-300 hover:text-neutral-500"
                      title="Taak verbergen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t-2 border-neutral-300">
              <td colSpan={3} className="py-2 px-3 text-sm">
                Totaal
                <span className="font-normal text-xs text-neutral-400 ml-2">
                  ({filledCount} van {totalCount} taken)
                </span>
              </td>
              <td className="py-2 px-3 text-sm text-right">{totalHours} uur</td>
              {hasRate && (
                <td className="py-2 px-3 text-sm text-right">{formatCurrency(totalValue)}</td>
              )}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Hidden standard tasks — click to restore */}
      {hiddenStandard.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hiddenStandard.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggleHidden(t.id)}
              className="text-xs text-neutral-400 bg-neutral-50 border border-neutral-200 rounded px-2 py-1 hover:text-cito-primary hover:border-cito-primary/30"
            >
              + {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Add custom task */}
      {addingNew ? (
        <div className="mt-4 border border-dashed border-cito-primary/30 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Taaknaam"
              className="text-sm border border-neutral-200 rounded px-3 py-2 focus:ring-2 focus:ring-cito-accent/20 focus:border-cito-accent outline-none"
              autoFocus
            />
            <input
              type="text"
              value={newOld}
              onChange={(e) => setNewOld(e.target.value)}
              placeholder="Oude methode"
              className="text-sm border border-neutral-200 rounded px-3 py-2 focus:ring-2 focus:ring-cito-accent/20 focus:border-cito-accent outline-none"
            />
            <input
              type="text"
              value={newNew}
              onChange={(e) => setNewNew(e.target.value)}
              placeholder="Nieuwe methode"
              className="text-sm border border-neutral-200 rounded px-3 py-2 focus:ring-2 focus:ring-cito-accent/20 focus:border-cito-accent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddTask}
              disabled={!newLabel.trim()}
              className="text-sm font-semibold text-white bg-cito-primary rounded px-4 py-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Toevoegen
            </button>
            <button
              type="button"
              onClick={() => { setAddingNew(false); setNewLabel(''); setNewOld(''); setNewNew(''); }}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Annuleren
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingNew(true)}
          className="mt-4 text-sm text-cito-primary underline decoration-dashed underline-offset-2 hover:text-cito-accent"
        >
          + Eigen taak toevoegen
        </button>
      )}

      {!hasRate && (
        <p className="mt-3 text-xs text-neutral-400 italic">
          Vul een uurtarief in om de tijdwinst ook in euro's te zien
        </p>
      )}
    </div>
  );
}
