import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useUpdateAction, useCreateAction, useDeleteAction } from '@/hooks/useActions';
import type { ActionItem as ActionItemType, Conversation } from '@/db/types';
import ActionItemCard from '@/features/school-profile/components/ActionItem';

interface ActionKanbanProps {
  actions: ActionItemType[];
  conversations: Conversation[];
  schoolId: string;
  onAddAction: (conversationId?: string) => void;
}

type ColumnStatus = 'todo' | 'in-progress' | 'done';

// Column header SVG icons
function ClipboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function PlayCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

const COLUMNS: { status: ColumnStatus; label: string; headerBg: string; headerText: string; Icon: () => React.ReactElement; emptyText: string }[] = [
  { status: 'todo', label: 'Te doen', headerBg: 'bg-amber-50', headerText: 'text-amber-800', Icon: ClipboardIcon, emptyText: 'Geen openstaande acties \u2014 typ een actie hieronder' },
  { status: 'in-progress', label: 'In uitvoering', headerBg: 'bg-blue-50', headerText: 'text-blue-800', Icon: PlayCircleIcon, emptyText: 'Nog geen acties in uitvoering \u2014 versleep een kaart hiernaartoe' },
  { status: 'done', label: 'Afgerond', headerBg: 'bg-green-50', headerText: 'text-green-800', Icon: CheckCircleIcon, emptyText: 'Nog geen afgeronde acties \u2014 versleep een afgeronde actie hiernaartoe' },
];

function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`bg-white border border-neutral-200 rounded-b-lg p-2 min-h-[120px] flex flex-col gap-2 transition-colors ${
        isOver ? 'border-cito-primary border-dashed border-2' : ''
      }`}
    >
      {children}
    </div>
  );
}

export default function ActionKanban({
  actions,
  conversations,
  schoolId,
  onAddAction: _onAddAction,
}: ActionKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingTitle, setAddingTitle] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  const updateActionMutation = useUpdateAction();
  const createActionMutation = useCreateAction();
  const deleteActionMutation = useDeleteAction();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const actionId = active.id as string;
    const overId = over.id as string;

    // Determine target column
    let targetStatus: ColumnStatus | null = null;

    // Check if dropped on a column
    for (const col of COLUMNS) {
      if (overId === col.status) {
        targetStatus = col.status;
        break;
      }
    }

    // Check if dropped on another action item
    if (!targetStatus) {
      const targetAction = actions.find(a => a.id === overId);
      if (targetAction) {
        targetStatus = targetAction.status;
      }
    }

    if (!targetStatus) return;

    const currentAction = actions.find(a => a.id === actionId);
    if (!currentAction || currentAction.status === targetStatus) return;

    updateActionMutation.mutate({
      schoolId,
      actionId,
      data: {
        status: targetStatus,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleAddAction = () => {
    if (!addingTitle.trim()) return;
    setMutationError(null);
    createActionMutation.mutate(
      { schoolId, data: { title: addingTitle.trim() } },
      {
        onSuccess: () => {
          setAddingTitle('');
        },
        onError: (err) => {
          setMutationError(err instanceof Error ? err.message : 'Actie aanmaken mislukt');
        },
      },
    );
  };

  const handleDeleteAction = (id: string) => {
    deleteActionMutation.mutate({ schoolId, actionId: id });
  };

  const activeAction = activeId ? actions.find(a => a.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {mutationError && (
        <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {mutationError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const columnActions = actions.filter(a => a.status === col.status);
          const { Icon } = col;
          return (
            <div key={col.status}>
              {/* Column header with icon */}
              <div
                className={`${col.headerBg} ${col.headerText} px-3 py-2 rounded-t-lg text-[14px] font-semibold flex items-center gap-1.5`}
              >
                <Icon />
                {col.label} ({columnActions.length})
              </div>

              {/* Column body */}
              <DroppableColumn id={col.status}>
                <SortableContext
                  items={columnActions.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnActions.map(action => (
                    <ActionItemCard
                      key={action.id}
                      action={action}
                      conversations={conversations}
                      schoolId={schoolId}
                      onDelete={handleDeleteAction}
                    />
                  ))}
                </SortableContext>

                {columnActions.length === 0 && (
                  <div className="border border-dashed border-neutral-200 rounded-lg py-6 text-center">
                    <p className="text-xs text-neutral-400 px-2">{col.emptyText}</p>
                  </div>
                )}

                {/* Always-visible inline input in todo column (D-09) */}
                {col.status === 'todo' && (
                  <div className="flex gap-1.5 mt-1">
                    <input
                      type="text"
                      value={addingTitle}
                      onChange={e => setAddingTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddAction();
                        if (e.key === 'Escape') setAddingTitle('');
                      }}
                      placeholder="Nieuwe actie..."
                      className="h-[36px] flex-1 border border-neutral-200 rounded-lg px-2 text-[14px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddAction}
                      disabled={!addingTitle.trim() || createActionMutation.isPending}
                      className="h-[36px] px-3 text-[14px] font-semibold bg-cito-accent text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      Toevoegen
                    </button>
                  </div>
                )}
              </DroppableColumn>
            </div>
          );
        })}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeAction && (
          <div className="shadow-lg opacity-90 rotate-2">
            <ActionItemCard
              action={activeAction}
              conversations={conversations}
              schoolId={schoolId}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
