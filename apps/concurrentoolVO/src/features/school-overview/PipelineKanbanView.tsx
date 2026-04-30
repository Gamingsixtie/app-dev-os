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
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SchoolRecord } from '@/db/types';
import type { PipelineStatus } from '@/models/school';
import { PIPELINE_STATUSES, PIPELINE_STATUS_LABELS } from '@/models/school';
import { setPipelineStatus, validatePipelineTransition } from '@/db/operations';
import PipelineBadge from '@/components/ui/PipelineBadge';
import DmuProgressIndicator from './DmuProgressIndicator';
import LostDealDialog from '@/features/school-profile/components/LostDealDialog';
import PipelineReasonDialog from '@/features/school-profile/components/PipelineReasonDialog';
import type { LostDealInfo } from '@/db/types';

interface PipelineKanbanViewProps {
  schools: SchoolRecord[];
  cardMode: 'compact' | 'extended';
  onDeleteSchool: (school: SchoolRecord) => void;
}

const COLUMN_STYLES: Record<PipelineStatus, { headerBg: string; headerText: string }> = {
  prospect: { headerBg: 'bg-neutral-100', headerText: 'text-neutral-600' },
  'contact-gelegd': { headerBg: 'bg-blue-50', headerText: 'text-blue-700' },
  'demo-presentatie': { headerBg: 'bg-purple-50', headerText: 'text-purple-700' },
  offerte: { headerBg: 'bg-orange-50', headerText: 'text-orange-700' },
  gewonnen: { headerBg: 'bg-green-50', headerText: 'text-green-700' },
  verloren: { headerBg: 'bg-red-50', headerText: 'text-red-700' },
};

// Draggable school card for the kanban
function DraggableSchoolCard({
  school,
  cardMode,
}: {
  school: SchoolRecord;
  cardMode: 'compact' | 'extended';
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `school-${school.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const primaryContact = school.contacts?.find(c => c.isPrimary);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-neutral-200 rounded-lg p-3 cursor-grab active:cursor-grabbing touch-none"
    >
      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-[14px] font-semibold text-cito-primary truncate">
          {school.name}
        </h4>
        <PipelineBadge status={school.pipelineStatus} size="sm" />
        <DmuProgressIndicator contacts={school.contacts ?? []} />
      </div>
      {cardMode === 'extended' && (
        <div className="space-y-0.5 text-[12px] text-neutral-500">
          {primaryContact && (
            <p>Contact: {primaryContact.name}</p>
          )}
          {school.selectedModules.length > 0 && (
            <p>{school.selectedModules.length} modules</p>
          )}
        </div>
      )}
    </div>
  );
}

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
      className={`bg-white border border-neutral-200 rounded-b-lg p-4 min-h-[200px] flex flex-col gap-2 transition-colors ${
        isOver ? 'border-cito-primary border-dashed border-2' : ''
      }`}
    >
      {children}
    </div>
  );
}

interface PendingTransition {
  schoolId: string;
  school: SchoolRecord;
  fromStatus: PipelineStatus;
  toStatus: PipelineStatus;
  requiresReason: boolean;
  requiresLostDeal: boolean;
}

export default function PipelineKanbanView({
  schools,
  cardMode,
  onDeleteSchool: _onDeleteSchool,
}: PipelineKanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const schoolId = (active.id as string).replace('school-', '');
    const school = schools.find(s => s.id === schoolId);
    if (!school) return;

    const overId = over.id as string;

    // Determine target status - check if dropped on column or on another school card
    let targetStatus: PipelineStatus | null = null;

    for (const status of PIPELINE_STATUSES) {
      if (overId === status) {
        targetStatus = status;
        break;
      }
    }

    if (!targetStatus) {
      // Dropped on a school card - get its status
      const targetSchoolId = overId.replace('school-', '');
      const targetSchool = schools.find(s => s.id === targetSchoolId);
      if (targetSchool) {
        targetStatus = targetSchool.pipelineStatus;
      }
    }

    if (!targetStatus || targetStatus === school.pipelineStatus) return;

    const validation = validatePipelineTransition(school.pipelineStatus, targetStatus);
    if (!validation.allowed) return;

    if (validation.requiresLostDeal || validation.requiresReason) {
      setPendingTransition({
        schoolId,
        school,
        fromStatus: school.pipelineStatus,
        toStatus: targetStatus,
        requiresReason: validation.requiresReason,
        requiresLostDeal: validation.requiresLostDeal,
      });
      return;
    }

    // Direct transition - no dialog needed
    await setPipelineStatus(schoolId, targetStatus);
  };

  const handleReasonConfirm = async (reason: string) => {
    if (!pendingTransition) return;
    await setPipelineStatus(pendingTransition.schoolId, pendingTransition.toStatus, reason);
    setPendingTransition(null);
  };

  const handleLostDealConfirm = async (info: LostDealInfo) => {
    if (!pendingTransition) return;
    await setPipelineStatus(
      pendingTransition.schoolId,
      pendingTransition.toStatus,
      info.reason,
      info,
    );
    setPendingTransition(null);
  };

  const handleDialogCancel = () => {
    setPendingTransition(null);
  };

  const activeSchool = activeId
    ? schools.find(s => s.id === (activeId as string).replace('school-', ''))
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STATUSES.map(status => {
            const columnSchools = schools.filter(s => s.pipelineStatus === status);
            const style = COLUMN_STYLES[status];
            return (
              <div key={status} className="min-w-[250px] flex-shrink-0">
                {/* Column header */}
                <div
                  className={`${style.headerBg} ${style.headerText} px-4 py-2 rounded-t-lg text-[14px] font-semibold`}
                >
                  {PIPELINE_STATUS_LABELS[status]} ({columnSchools.length})
                </div>

                {/* Column body */}
                <DroppableColumn id={status}>
                  <SortableContext
                    items={columnSchools.map(s => `school-${s.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnSchools.map(school => (
                      <DraggableSchoolCard
                        key={school.id}
                        school={school}
                        cardMode={cardMode}
                      />
                    ))}
                  </SortableContext>

                  {columnSchools.length === 0 && (
                    <p className="text-[14px] text-neutral-400 text-center py-8">
                      Geen scholen
                    </p>
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeSchool && (
            <div className="shadow-lg opacity-90 rotate-2 min-w-[230px]">
              <DraggableSchoolCard school={activeSchool} cardMode={cardMode} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Pipeline transition dialogs */}
      {pendingTransition?.requiresLostDeal && (
        <LostDealDialog
          onConfirm={handleLostDealConfirm}
          onCancel={handleDialogCancel}
        />
      )}

      {pendingTransition && pendingTransition.requiresReason && !pendingTransition.requiresLostDeal && (
        <PipelineReasonDialog
          fromLabel={PIPELINE_STATUS_LABELS[pendingTransition.fromStatus]}
          toLabel={PIPELINE_STATUS_LABELS[pendingTransition.toStatus]}
          onConfirm={handleReasonConfirm}
          onCancel={handleDialogCancel}
        />
      )}
    </>
  );
}
