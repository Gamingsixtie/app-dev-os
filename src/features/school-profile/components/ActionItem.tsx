import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ActionItem as ActionItemType, Conversation } from '@/db/types';
import { useUpdateAction } from '@/hooks/useActions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

// Action type color map
const ACTION_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  bellen: { bg: 'bg-blue-100', text: 'text-blue-700' },
  mailen: { bg: 'bg-purple-100', text: 'text-purple-700' },
  offerte: { bg: 'bg-amber-100', text: 'text-amber-700' },
  'intern overleg': { bg: 'bg-neutral-100', text: 'text-neutral-700' },
};

const DEFAULT_TYPE_COLORS = { bg: 'bg-neutral-100', text: 'text-neutral-600' };

const PRESET_TYPES = ['bellen', 'mailen', 'offerte', 'intern overleg'];

interface ActionItemProps {
  action: ActionItemType;
  conversations: Conversation[];
  schoolId: string;
  onDelete: (id: string) => void;
}

export default function ActionItemCard({
  action,
  conversations,
  schoolId,
  onDelete,
}: ActionItemProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(action.title);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [customType, setCustomType] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  const updateAction = useUpdateAction();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Auto-focus title input on edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Close type dropdown on outside click
  useEffect(() => {
    if (!showTypeDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
        setCustomType('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTypeDropdown]);

  // Save title on blur or Enter
  const saveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== action.title) {
      updateAction.mutate({
        schoolId,
        actionId: action.id,
        data: { title: trimmed, updatedAt: new Date().toISOString() },
      });
    } else {
      setEditTitle(action.title);
    }
    setIsEditingTitle(false);
  };

  const cancelEdit = () => {
    setEditTitle(action.title);
    setIsEditingTitle(false);
  };

  // Set action type
  const setType = (type: string) => {
    updateAction.mutate({
      schoolId,
      actionId: action.id,
      data: { type, updatedAt: new Date().toISOString() },
    });
    setShowTypeDropdown(false);
    setCustomType('');
  };

  // Set due date
  const setDueDate = (dueDate: string | null) => {
    updateAction.mutate({
      schoolId,
      actionId: action.id,
      data: { dueDate, updatedAt: new Date().toISOString() },
    });
  };

  // Find linked conversation
  const linkedConversation = action.conversationId
    ? conversations.find(c => c.id === action.conversationId)
    : null;

  const linkedDate = linkedConversation
    ? new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'numeric',
      }).format(new Date(linkedConversation.date))
    : null;

  // Created date
  const createdDate = new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(action.createdAt));

  // Overdue check
  const isOverdue = action.dueDate
    ? new Date(action.dueDate) < new Date(new Date().toISOString().slice(0, 10))
    : false;

  const dueDateFormatted = action.dueDate
    ? new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(action.dueDate))
    : null;

  // Type colors
  const typeColors = action.type
    ? ACTION_TYPE_COLORS[action.type] ?? DEFAULT_TYPE_COLORS
    : null;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white border rounded-lg p-3 flex items-start gap-2 hover:shadow-sm hover:border-neutral-300 transition-all group ${
          isOverdue ? 'border-red-300' : 'border-neutral-200'
        }`}
      >
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex-shrink-0 w-[44px] h-[44px] flex items-center justify-center text-neutral-400 cursor-grab active:cursor-grabbing touch-none"
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
            <circle cx="3" cy="2" r="1.5" />
            <circle cx="9" cy="2" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="9" cy="8" r="1.5" />
            <circle cx="3" cy="14" r="1.5" />
            <circle cx="9" cy="14" r="1.5" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          {/* Inline editable title */}
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') cancelEdit();
              }}
              placeholder="Actietitel..."
              className="w-full text-[14px] font-semibold text-neutral-700 border border-cito-primary rounded px-1 focus:outline-none focus:ring-1 focus:ring-cito-primary"
            />
          ) : (
            <p
              onClick={() => {
                setEditTitle(action.title);
                setIsEditingTitle(true);
              }}
              className="text-[14px] font-semibold text-neutral-700 cursor-text hover:bg-neutral-50 rounded px-1 -mx-1"
            >
              {action.title}
            </p>
          )}

          {/* Type label chip */}
          {action.type && typeColors && (
            <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${typeColors.bg} ${typeColors.text}`}>
              {action.type}
            </span>
          )}

          {/* Type setter — shows on hover if no type set */}
          {!action.type && (
            <div className="relative" ref={typeDropdownRef}>
              <button
                type="button"
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="mt-1 text-xs text-neutral-400 hover:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                + Type
              </button>
              {showTypeDropdown && (
                <div className="absolute left-0 top-6 z-10 bg-white border border-neutral-200 rounded-lg shadow-lg p-2 min-w-[160px]">
                  {PRESET_TYPES.map(t => {
                    const colors = ACTION_TYPE_COLORS[t] ?? DEFAULT_TYPE_COLORS;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded hover:bg-neutral-50 ${colors.text}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                  <div className="border-t border-neutral-100 mt-1 pt-1">
                    <input
                      type="text"
                      value={customType}
                      onChange={e => setCustomType(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && customType.trim()) {
                          setType(customType.trim());
                        }
                      }}
                      placeholder="Vrij type..."
                      className="w-full text-xs px-2 py-1 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-cito-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Deadline */}
          <div className="mt-1 flex items-center gap-1">
            {action.dueDate ? (
              <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-neutral-500'}`}>
                {/* Calendar icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {dueDateFormatted}
                <button
                  type="button"
                  onClick={() => setDueDate(null)}
                  aria-label="Deadline verwijderen"
                  className="ml-0.5 text-neutral-400 hover:text-neutral-600"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ) : (
              <label className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Deadline
                <input
                  type="date"
                  className="sr-only"
                  onChange={e => {
                    if (e.target.value) setDueDate(e.target.value);
                  }}
                />
              </label>
            )}
          </div>

          {/* Linked conversation + created date */}
          <div className="mt-1 flex items-center gap-3">
            {linkedDate && (
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8L2 8L2 4" />
                  <path d="M12 7A5 5 0 1 0 7 12" />
                </svg>
                Gesprek {linkedDate}
              </span>
            )}
            <span className="text-xs text-neutral-400">{createdDate}</span>
          </div>
        </div>

        {/* Delete with modal confirmation */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 2L10 10M10 2L2 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Actie verwijderen"
        body="Weet u zeker dat u deze actie wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
        confirmLabel="Actie verwijderen"
        cancelLabel="Actie bewaren"
        onConfirm={() => {
          onDelete(action.id);
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
