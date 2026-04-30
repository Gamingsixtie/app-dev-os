import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { Contact, Conversation, SystemEvent, PlannedTouchpoint } from '@/db/types';
import {
  DMU_POSITION_ORDER,
  SCHOOL_YEAR_MONTHS,
  SCHOOL_YEAR_MONTH_SHORT,
  SCHOOL_YEAR_MONTH_LABELS,
  getSchoolYearStartYear,
  getSchoolYearMonthIndex,
  schoolYearMonthToCalendar,
} from '@/models/school';
import DMUBadge from '@/components/ui/DMUBadge';
import EngagementBadge from '@/components/ui/EngagementBadge';

interface SchoolYearPlannerProps {
  contacts: Contact[];
  conversations: Conversation[];
  systemEvents: SystemEvent[];
  plannedTouchpoints: PlannedTouchpoint[];
  onCreateTouchpoint: (data: { contactId: string; schoolYearStart: number; monthIndex: number; note?: string }) => void;
  onUpdateTouchpoint: (touchpointId: string, data: Partial<Pick<PlannedTouchpoint, 'note' | 'status' | 'monthIndex'>>) => void;
  onDeleteTouchpoint: (touchpointId: string) => void;
  onQuickMark?: (contactId: string, date: string) => void;
  onCreateConversation?: (data: { contactId: string; date: string; content: string; tags: string[] }) => void;
}

interface MonthActivity {
  conversationCount: number;
  hasStatusChange: boolean;
}

type ContactMonthMap = Map<string, Map<number, MonthActivity>>;
type Selection = { contactId: string; monthIdx: number } | null;

/** Build a map of contactId -> monthIndex -> activity for a given school year */
function buildActivityMap(
  conversations: Conversation[],
  systemEvents: SystemEvent[],
  startYear: number,
): ContactMonthMap {
  const map: ContactMonthMap = new Map();

  const getOrCreate = (contactId: string, monthIdx: number): MonthActivity => {
    if (!map.has(contactId)) map.set(contactId, new Map());
    const contactMap = map.get(contactId)!;
    if (!contactMap.has(monthIdx)) contactMap.set(monthIdx, { conversationCount: 0, hasStatusChange: false });
    return contactMap.get(monthIdx)!;
  };

  for (const conv of conversations) {
    const date = new Date(conv.date);
    const convStartYear = getSchoolYearStartYear(date);
    if (convStartYear !== startYear) continue;
    const monthIdx = getSchoolYearMonthIndex(date);
    const activity = getOrCreate(conv.contactId, monthIdx);
    activity.conversationCount += 1;
  }

  for (const event of systemEvents) {
    if (event.eventType !== 'engagement_changed') continue;
    const contactId = event.metadata?.contactId;
    if (!contactId) continue;
    const date = new Date(event.timestamp);
    const evtStartYear = getSchoolYearStartYear(date);
    if (evtStartYear !== startYear) continue;
    const monthIdx = getSchoolYearMonthIndex(date);
    const activity = getOrCreate(contactId, monthIdx);
    activity.hasStatusChange = true;
  }

  return map;
}

/** Get available school years from conversations + planned touchpoints */
function getAvailableYears(conversations: Conversation[], touchpoints: PlannedTouchpoint[]): number[] {
  const years = new Set<number>();
  for (const conv of conversations) years.add(getSchoolYearStartYear(new Date(conv.date)));
  for (const tp of touchpoints) years.add(tp.schoolYearStart);
  years.add(getSchoolYearStartYear(new Date()));
  return [...years].sort((a, b) => b - a);
}

// ──────────────────────────────────────────────
// Detail Panel — shown below the table when a cell is selected
// ──────────────────────────────────────────────

interface DetailPanelProps {
  contact: Contact;
  monthLabel: string;
  monthIdx: number;
  conversations: Conversation[];
  touchpoints: PlannedTouchpoint[];
  onCreateConversation?: (content: string) => void;
  onCreateTouchpoint: (note: string) => void;
  onCompleteTouchpoint: (id: string) => void;
  onSkipTouchpoint: (id: string) => void;
  onDeleteTouchpoint: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onMoveTouchpoint: (id: string, newMonthIdx: number) => void;
  onClose: () => void;
}

function DetailPanel({
  contact,
  monthLabel,
  monthIdx: _monthIdx,
  conversations,
  touchpoints,
  onCreateConversation,
  onCreateTouchpoint,
  onCompleteTouchpoint,
  onSkipTouchpoint,
  onDeleteTouchpoint,
  onUpdateNote,
  onMoveTouchpoint,
  onClose,
}: DetailPanelProps) {
  const [newConvContent, setNewConvContent] = useState('');
  const [newPlanNote, setNewPlanNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [movingId, setMovingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the textarea when the panel opens
  useEffect(() => {
    // Small delay so the panel animation finishes first
    const timer = setTimeout(() => textareaRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [contact.id]);

  const plannedTouchpoints = touchpoints.filter(tp => tp.status === 'planned');
  const completedTouchpoints = touchpoints.filter(tp => tp.status === 'completed');
  const skippedTouchpoints = touchpoints.filter(tp => tp.status === 'skipped');

  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const handleSubmitConversation = () => {
    if (!onCreateConversation || !newConvContent.trim()) return;
    onCreateConversation(newConvContent.trim());
    setNewConvContent('');
  };

  const handleSubmitPlan = () => {
    if (!newPlanNote.trim()) return;
    onCreateTouchpoint(newPlanNote.trim());
    setNewPlanNote('');
  };

  return (
    <div className="bg-white border border-cito-primary/20 rounded-xl shadow-lg mt-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-cito-primary/5 to-transparent border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cito-primary/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-cito-primary" viewBox="0 0 16 16" fill="none">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1z" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 4v4l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-neutral-900">{contact.name}</span>
              {contact.jobTitle && <span className="text-[13px] text-neutral-500">{contact.jobTitle}</span>}
              <DMUBadge position={contact.dmuPosition} />
              <EngagementBadge status={contact.engagementStatus} size="sm" />
            </div>
            <span className="text-[13px] text-neutral-500">{monthLabel}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Content — two-column on desktop */}
      <div className="grid md:grid-cols-2 gap-0 md:divide-x md:divide-neutral-100">

        {/* Left column: Log a conversation */}
        <div className="p-5">
          <h4 className="text-[13px] font-semibold text-cito-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M2 3h12v8H5l-3 2.5V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            Contactmoment vastleggen
          </h4>

          {onCreateConversation && (
            <div className="mb-4">
              <textarea
                ref={textareaRef}
                value={newConvContent}
                onChange={e => setNewConvContent(e.target.value)}
                placeholder="Waar ging het gesprek over? bv. Offerte besproken, akkoord op VAS-module..."
                className="w-full text-[14px] px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cito-primary/30 focus:border-cito-primary resize-none placeholder:text-neutral-400"
                rows={3}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitConversation(); }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-neutral-400">Ctrl+Enter om op te slaan</span>
                <button
                  type="button"
                  onClick={handleSubmitConversation}
                  disabled={!newConvContent.trim()}
                  className="text-[13px] px-4 py-1.5 bg-cito-primary text-white rounded-lg hover:bg-cito-primary/90 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Vastleggen
                </button>
              </div>
            </div>
          )}

          {/* Existing conversations */}
          {sortedConversations.length > 0 && (
            <div>
              <p className="text-[12px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Eerdere gesprekken ({sortedConversations.length})
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {sortedConversations.map(conv => (
                  <div key={conv.id} className="px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-medium text-neutral-500">
                        {new Date(conv.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {conv.tags.includes('quick-mark') && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5 font-medium">snel markering</span>
                      )}
                    </div>
                    <p className="text-[13px] text-neutral-700 leading-relaxed">
                      {conv.content === '[Gesproken]' ? (
                        <span className="italic text-neutral-400">Gesproken — geen notitie toegevoegd</span>
                      ) : (
                        conv.content
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Planning & touchpoints */}
        <div className="p-5 border-t md:border-t-0 border-neutral-100">
          <h4 className="text-[13px] font-semibold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h10v12H3z" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6 1v2M10 1v2M3 6h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Planning
          </h4>

          {/* Add planned touchpoint */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlanNote}
                onChange={e => setNewPlanNote(e.target.value)}
                placeholder="bv. Offerte bespreken, demo inplannen..."
                className="flex-1 text-[14px] px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 placeholder:text-neutral-400"
                onKeyDown={e => { if (e.key === 'Enter') handleSubmitPlan(); }}
              />
              <button
                type="button"
                onClick={handleSubmitPlan}
                disabled={!newPlanNote.trim()}
                className="text-[13px] px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                Inplannen
              </button>
            </div>
          </div>

          {/* Planned touchpoints */}
          {plannedTouchpoints.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-[12px] font-medium text-neutral-400 uppercase tracking-wide">
                Gepland ({plannedTouchpoints.length})
              </p>
              {plannedTouchpoints.map(tp => (
                <div key={tp.id} className="border border-amber-200 bg-amber-50/50 rounded-lg p-3">
                  {editingId === tp.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        className="w-full text-[13px] px-2 py-1.5 border border-neutral-200 rounded-lg"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') { onUpdateNote(tp.id, editNote); setEditingId(null); } }}
                      />
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => { onUpdateNote(tp.id, editNote); setEditingId(null); }} className="text-[12px] px-3 py-1 bg-cito-primary text-white rounded-lg hover:bg-cito-primary/90">Opslaan</button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-[12px] px-3 py-1 text-neutral-500 hover:text-neutral-700">Annuleer</button>
                      </div>
                    </div>
                  ) : movingId === tp.id ? (
                    <div className="space-y-2">
                      <p className="text-[12px] text-neutral-600 font-medium">Verplaats naar:</p>
                      <div className="grid grid-cols-6 gap-1">
                        {SCHOOL_YEAR_MONTHS.map((m, idx) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => { onMoveTouchpoint(tp.id, idx); setMovingId(null); }}
                            className={`text-[11px] px-1 py-1.5 rounded-lg font-medium ${
                              idx === tp.monthIndex
                                ? 'bg-amber-400 text-white'
                                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300'
                            }`}
                          >
                            {SCHOOL_YEAR_MONTH_SHORT[m]}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => setMovingId(null)} className="text-[11px] text-neutral-500 hover:text-neutral-700">Annuleer</button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[14px] text-neutral-800 mb-2 leading-snug">
                        {tp.note || <span className="italic text-neutral-400">Geen notitie</span>}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => onCompleteTouchpoint(tp.id)} className="text-[12px] px-2.5 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium">Afgerond</button>
                        <button type="button" onClick={() => onSkipTouchpoint(tp.id)} className="text-[12px] px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200">Overslaan</button>
                        <button type="button" onClick={() => setMovingId(tp.id)} className="text-[12px] px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200">Verplaats</button>
                        <button type="button" onClick={() => { setEditingId(tp.id); setEditNote(tp.note); }} className="text-[12px] px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200">Bewerk</button>
                        <button type="button" onClick={() => onDeleteTouchpoint(tp.id)} className="text-[12px] px-2.5 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">Verwijder</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Completed */}
          {completedTouchpoints.length > 0 && (
            <div className="mb-3">
              <p className="text-[12px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5">Afgerond</p>
              {completedTouchpoints.map(tp => (
                <div key={tp.id} className="flex items-center gap-1.5 text-[13px] text-emerald-600 py-0.5">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {tp.note || 'Contactmoment'}
                </div>
              ))}
            </div>
          )}

          {/* Skipped */}
          {skippedTouchpoints.length > 0 && (
            <div>
              <p className="text-[12px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5">Overgeslagen</p>
              {skippedTouchpoints.map(tp => (
                <div key={tp.id} className="text-[13px] text-neutral-400 line-through py-0.5">
                  {tp.note || 'Contactmoment'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export default function SchoolYearPlanner({
  contacts,
  conversations,
  systemEvents,
  plannedTouchpoints,
  onCreateTouchpoint,
  onUpdateTouchpoint,
  onDeleteTouchpoint,
  onQuickMark,
  onCreateConversation,
}: SchoolYearPlannerProps) {
  const currentStartYear = getSchoolYearStartYear(new Date());
  const [selectedStartYear, setSelectedStartYear] = useState(currentStartYear);
  const [selection, setSelection] = useState<Selection>(null);
  const [quickMarkFlash, setQuickMarkFlash] = useState<Set<string>>(new Set());

  const handleQuickMark = useCallback((contactId: string, monthIdx: number) => {
    if (!onQuickMark) return;
    const { year, jsMonth } = schoolYearMonthToCalendar(monthIdx, selectedStartYear);
    const date = `${year}-${String(jsMonth + 1).padStart(2, '0')}-01`;
    onQuickMark(contactId, date);

    const key = `${contactId}-${monthIdx}`;
    setQuickMarkFlash(prev => new Set(prev).add(key));
    setTimeout(() => {
      setQuickMarkFlash(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 1500);
  }, [onQuickMark, selectedStartYear]);

  const availableYears = useMemo(
    () => getAvailableYears(conversations, plannedTouchpoints),
    [conversations, plannedTouchpoints],
  );

  const activityMap = useMemo(
    () => buildActivityMap(conversations, systemEvents, selectedStartYear),
    [conversations, systemEvents, selectedStartYear],
  );

  const touchpointsByContactMonth = useMemo(() => {
    const map = new Map<string, Map<number, PlannedTouchpoint[]>>();
    for (const tp of plannedTouchpoints) {
      if (tp.schoolYearStart !== selectedStartYear) continue;
      if (!map.has(tp.contactId)) map.set(tp.contactId, new Map());
      const contactMap = map.get(tp.contactId)!;
      if (!contactMap.has(tp.monthIndex)) contactMap.set(tp.monthIndex, []);
      contactMap.get(tp.monthIndex)!.push(tp);
    }
    return map;
  }, [plannedTouchpoints, selectedStartYear]);

  const conversationsByContactMonth = useMemo(() => {
    const map = new Map<string, Map<number, Conversation[]>>();
    for (const conv of conversations) {
      const date = new Date(conv.date);
      const convStartYear = getSchoolYearStartYear(date);
      if (convStartYear !== selectedStartYear) continue;
      const monthIdx = getSchoolYearMonthIndex(date);
      if (!map.has(conv.contactId)) map.set(conv.contactId, new Map());
      const contactMap = map.get(conv.contactId)!;
      if (!contactMap.has(monthIdx)) contactMap.set(monthIdx, []);
      contactMap.get(monthIdx)!.push(conv);
    }
    return map;
  }, [conversations, selectedStartYear]);

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => DMU_POSITION_ORDER[a.dmuPosition] - DMU_POSITION_ORDER[b.dmuPosition]),
    [contacts],
  );

  const currentMonthIndex = selectedStartYear === currentStartYear
    ? getSchoolYearMonthIndex(new Date())
    : -1;

  const schoolYearLabel = `${selectedStartYear}-${selectedStartYear + 1}`;

  const monthTotals = useMemo(() => {
    return SCHOOL_YEAR_MONTHS.map((_, idx) => {
      let convCount = 0;
      let plannedCount = 0;
      for (const contact of sortedContacts) {
        const activity = activityMap.get(contact.id)?.get(idx);
        if (activity && activity.conversationCount > 0) convCount += activity.conversationCount;
        const tps = touchpointsByContactMonth.get(contact.id)?.get(idx);
        if (tps) plannedCount += tps.filter(tp => tp.status === 'planned').length;
      }
      return { convCount, plannedCount };
    });
  }, [sortedContacts, activityMap, touchpointsByContactMonth]);

  const canGoPrev = availableYears.includes(selectedStartYear - 1) || selectedStartYear - 1 >= currentStartYear - 3;
  const canGoNext = selectedStartYear < currentStartYear;

  const handleCellClick = (contactId: string, monthIdx: number) => {
    if (selection?.contactId === contactId && selection?.monthIdx === monthIdx) {
      setSelection(null);
    } else {
      setSelection({ contactId, monthIdx });
    }
  };

  const handleCreateTouchpoint = (contactId: string, monthIdx: number, note: string) => {
    onCreateTouchpoint({ contactId, schoolYearStart: selectedStartYear, monthIndex: monthIdx, note });
  };

  const handleCreateConversation = (contactId: string, monthIdx: number, content: string) => {
    if (!onCreateConversation) return;
    const { year, jsMonth } = schoolYearMonthToCalendar(monthIdx, selectedStartYear);
    const date = `${year}-${String(jsMonth + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    onCreateConversation({ contactId, date, content, tags: [] });
  };

  // Resolve selected contact for detail panel
  const selectedContact = selection ? contacts.find(c => c.id === selection.contactId) : null;

  if (contacts.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
        <p className="text-[16px] font-semibold text-neutral-700 mb-1">Geen contactpersonen</p>
        <p className="text-[14px] text-neutral-500">Voeg contactpersonen toe om de schooljaar-planning te gebruiken.</p>
      </div>
    );
  }

  return (
    <div>
      {/* School year selector */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold text-neutral-900">Schooljaar {schoolYearLabel}</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSelectedStartYear(y => y - 1)} disabled={!canGoPrev} className="h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Vorig schooljaar">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="text-[14px] text-neutral-600 min-w-[90px] text-center">{schoolYearLabel}</span>
          <button type="button" onClick={() => setSelectedStartYear(y => y + 1)} disabled={!canGoNext} className="h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Volgend schooljaar">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-[12px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-cito-primary bg-cito-primary/10 rounded-full w-5 h-5 inline-flex items-center justify-center">1</span>
          Gesprekken
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full w-5 h-5 inline-flex items-center justify-center">!</span>
          Gepland
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Afgerond
        </span>
        <span className="flex items-center gap-1.5 text-neutral-400">
          Klik op een cel om details te zien
        </span>
      </div>

      {/* Desktop: table view */}
      <div className="hidden md:block bg-white rounded-lg border border-neutral-200 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-neutral-50">
              <th className="text-left text-[13px] font-semibold text-neutral-700 px-3 py-2.5 sticky left-0 bg-neutral-50 z-10 min-w-[160px] border-r border-neutral-200">Contact</th>
              {SCHOOL_YEAR_MONTHS.map((month, idx) => (
                <th key={month} className={`text-center text-[13px] font-semibold px-1.5 py-2.5 min-w-[56px] ${idx === currentMonthIndex ? 'text-cito-primary bg-[color:var(--color-cito-primary)]/5' : 'text-neutral-700'}`}>
                  {SCHOOL_YEAR_MONTH_SHORT[month]}
                  {idx === currentMonthIndex && <div className="h-0.5 bg-cito-primary rounded-full mt-1 mx-1" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedContacts.map(contact => {
              const contactActivity = activityMap.get(contact.id);
              const contactTouchpoints = touchpointsByContactMonth.get(contact.id);

              return (
                <tr key={contact.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2.5 sticky left-0 bg-white z-10 border-r border-neutral-200">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-neutral-900 truncate max-w-[90px]">{contact.name}</span>
                      <DMUBadge position={contact.dmuPosition} />
                    </div>
                  </td>
                  {SCHOOL_YEAR_MONTHS.map((month, idx) => {
                    const activity = contactActivity?.get(idx);
                    const touchpoints = contactTouchpoints?.get(idx) ?? [];
                    const plannedTps = touchpoints.filter(tp => tp.status === 'planned');
                    const completedTps = touchpoints.filter(tp => tp.status === 'completed');
                    const isCurrentMonth = idx === currentMonthIndex;
                    const isSelected = selection?.contactId === contact.id && selection?.monthIdx === idx;
                    const hasContent = (activity && (activity.conversationCount > 0 || activity.hasStatusChange)) || touchpoints.length > 0;

                    // Build tooltip text from conversations
                    const cellConvs = conversationsByContactMonth.get(contact.id)?.get(idx);
                    const tooltip = cellConvs?.map(c => c.content === '[Gesproken]' ? 'Gesproken' : c.content.slice(0, 50)).join('\n');

                    return (
                      <td
                        key={month}
                        className={`px-1 py-2.5 text-center relative group/cell ${
                          isCurrentMonth ? 'bg-[color:var(--color-cito-primary)]/5' : ''
                        } ${isSelected ? 'bg-cito-primary/10 ring-2 ring-inset ring-cito-primary/40' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleCellClick(contact.id, idx)}
                          title={tooltip}
                          className={`w-full min-h-[36px] rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                            isSelected
                              ? 'bg-cito-primary/10 shadow-sm'
                              : hasContent
                                ? 'hover:bg-neutral-100'
                                : 'hover:bg-neutral-50'
                          } ${quickMarkFlash.has(`${contact.id}-${idx}`) ? 'animate-pulse bg-emerald-50' : ''}`}
                        >
                          {activity && activity.conversationCount > 0 && (
                            <span className="text-[11px] font-semibold text-cito-primary bg-cito-primary/10 rounded-full w-5 h-5 inline-flex items-center justify-center">
                              {activity.conversationCount}
                            </span>
                          )}
                          {plannedTps.length > 0 && (
                            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full w-5 h-5 inline-flex items-center justify-center">!</span>
                          )}
                          {completedTps.length > 0 && (
                            <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          )}
                          {activity?.hasStatusChange && (
                            <EngagementBadge status={contact.engagementStatus} size="sm" />
                          )}
                          {!hasContent && (
                            <span className="text-neutral-300 group-hover/cell:text-neutral-400 text-[14px] leading-none">+</span>
                          )}
                        </button>
                        {/* Quick-mark button */}
                        {onQuickMark && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleQuickMark(contact.id, idx); }}
                            className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center shadow-sm hover:bg-emerald-600"
                            title="Snel markeren: gesproken"
                            aria-label={`Markeer als gesproken: ${contact.name}`}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Totals row */}
            <tr className="border-t-2 border-neutral-200 bg-neutral-50">
              <td className="px-3 py-2 sticky left-0 bg-neutral-50 z-10 border-r border-neutral-200">
                <span className="text-[13px] font-semibold text-neutral-600">Totaal</span>
              </td>
              {SCHOOL_YEAR_MONTHS.map((month, idx) => {
                const totals = monthTotals[idx];
                const isCurrentMonth = idx === currentMonthIndex;
                return (
                  <td key={month} className={`px-1 py-2 text-center ${isCurrentMonth ? 'bg-[color:var(--color-cito-primary)]/5' : ''}`}>
                    <div className="flex flex-col items-center gap-0.5">
                      {totals.convCount > 0 ? (
                        <span className="text-[12px] font-semibold text-neutral-600">{totals.convCount}</span>
                      ) : (
                        <span className="text-[12px] text-neutral-300">-</span>
                      )}
                      {totals.plannedCount > 0 && (
                        <span className="text-[10px] text-amber-500">{totals.plannedCount} gepland</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* "Nog niet benaderd" notice */}
      {!selection && sortedContacts.some(c => {
        const hasActivity = activityMap.get(c.id)?.size;
        const hasTouchpoints = touchpointsByContactMonth.get(c.id)?.size;
        return !hasActivity && !hasTouchpoints;
      }) && (
        <div className="hidden md:block mt-3 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg">
          <p className="text-[13px] text-neutral-500">
            <span className="font-semibold">Nog niet benaderd/gepland: </span>
            {sortedContacts
              .filter(c => {
                const hasActivity = activityMap.get(c.id)?.size;
                const hasTouchpoints = touchpointsByContactMonth.get(c.id)?.size;
                return !hasActivity && !hasTouchpoints;
              })
              .map(c => c.name)
              .join(', ')}
          </p>
        </div>
      )}

      {/* Desktop: Detail panel below table */}
      {selection && selectedContact && (
        <div className="hidden md:block">
          <DetailPanel
            key={`${selection.contactId}-${selection.monthIdx}`}
            contact={selectedContact}
            monthLabel={`${SCHOOL_YEAR_MONTH_LABELS[SCHOOL_YEAR_MONTHS[selection.monthIdx]]} ${schoolYearMonthToCalendar(selection.monthIdx, selectedStartYear).year}`}
            monthIdx={selection.monthIdx}
            conversations={conversationsByContactMonth.get(selection.contactId)?.get(selection.monthIdx) ?? []}
            touchpoints={touchpointsByContactMonth.get(selection.contactId)?.get(selection.monthIdx) ?? []}
            onCreateConversation={onCreateConversation ? content => handleCreateConversation(selection.contactId, selection.monthIdx, content) : undefined}
            onCreateTouchpoint={note => handleCreateTouchpoint(selection.contactId, selection.monthIdx, note)}
            onCompleteTouchpoint={id => onUpdateTouchpoint(id, { status: 'completed' })}
            onSkipTouchpoint={id => onUpdateTouchpoint(id, { status: 'skipped' })}
            onDeleteTouchpoint={onDeleteTouchpoint}
            onUpdateNote={(id, note) => onUpdateTouchpoint(id, { note })}
            onMoveTouchpoint={(id, newMonthIdx) => { onUpdateTouchpoint(id, { monthIndex: newMonthIdx }); }}
            onClose={() => setSelection(null)}
          />
        </div>
      )}

      {/* Mobile: month cards */}
      <div className="md:hidden space-y-4">
        {SCHOOL_YEAR_MONTHS.map((month, idx) => {
          const isCurrentMonth = idx === currentMonthIndex;
          const { year } = schoolYearMonthToCalendar(idx, selectedStartYear);

          // Contacts with any activity or touchpoints this month
          const relevantContacts = sortedContacts.filter(c => {
            const activity = activityMap.get(c.id)?.get(idx);
            const tps = touchpointsByContactMonth.get(c.id)?.get(idx);
            const hasActivity = activity && (activity.conversationCount > 0 || activity.hasStatusChange);
            const hasTouchpoints = tps && tps.length > 0;
            return hasActivity || hasTouchpoints;
          });

          if (relevantContacts.length === 0 && !isCurrentMonth) return null;

          return (
            <div
              key={month}
              className={`rounded-lg border p-4 ${
                isCurrentMonth ? 'border-cito-primary/40 bg-cito-primary/5' : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-[14px] font-semibold ${isCurrentMonth ? 'text-cito-primary' : 'text-neutral-700'}`}>
                  {SCHOOL_YEAR_MONTH_LABELS[month]} {year}
                </h4>
                {isCurrentMonth && (
                  <span className="text-[11px] font-semibold text-cito-primary bg-cito-primary/10 rounded-full px-2 py-0.5">Nu</span>
                )}
              </div>

              {relevantContacts.length === 0 ? (
                <p className="text-[13px] text-neutral-400">Geen activiteit</p>
              ) : (
                <div className="space-y-2">
                  {relevantContacts.map(contact => {
                    const activity = activityMap.get(contact.id)?.get(idx);
                    const tps = touchpointsByContactMonth.get(contact.id)?.get(idx) ?? [];
                    const plannedCount = tps.filter(tp => tp.status === 'planned').length;
                    const isSelected = selection?.contactId === contact.id && selection?.monthIdx === idx;

                    return (
                      <div key={contact.id}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCellClick(contact.id, idx)}
                            className={`flex-1 flex items-center justify-between p-2 rounded-lg transition-colors text-left ${
                              isSelected ? 'bg-cito-primary/10 ring-1 ring-cito-primary/30' : 'hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-medium text-neutral-900">{contact.name}</span>
                              <DMUBadge position={contact.dmuPosition} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {activity && activity.conversationCount > 0 && (
                                <span className="text-[11px] font-semibold text-cito-primary bg-cito-primary/10 rounded-full w-5 h-5 inline-flex items-center justify-center">{activity.conversationCount}</span>
                              )}
                              {plannedCount > 0 && (
                                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full w-5 h-5 inline-flex items-center justify-center">!</span>
                              )}
                              <EngagementBadge status={contact.engagementStatus} size="sm" />
                            </div>
                          </button>
                          {onQuickMark && (
                            <button
                              type="button"
                              onClick={() => handleQuickMark(contact.id, idx)}
                              className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 hover:bg-emerald-600 transition-colors"
                              title="Gesproken"
                              aria-label={`Markeer als gesproken: ${contact.name}`}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                          )}
                        </div>
                        {/* Inline detail panel for mobile */}
                        {isSelected && (
                          <DetailPanel
                            key={`mobile-${contact.id}-${idx}`}
                            contact={contact}
                            monthLabel={`${SCHOOL_YEAR_MONTH_LABELS[month]} ${year}`}
                            monthIdx={idx}
                            conversations={conversationsByContactMonth.get(contact.id)?.get(idx) ?? []}
                            touchpoints={tps}
                            onCreateConversation={onCreateConversation ? content => handleCreateConversation(contact.id, idx, content) : undefined}
                            onCreateTouchpoint={note => handleCreateTouchpoint(contact.id, idx, note)}
                            onCompleteTouchpoint={id => onUpdateTouchpoint(id, { status: 'completed' })}
                            onSkipTouchpoint={id => onUpdateTouchpoint(id, { status: 'skipped' })}
                            onDeleteTouchpoint={onDeleteTouchpoint}
                            onUpdateNote={(id, note) => onUpdateTouchpoint(id, { note })}
                            onMoveTouchpoint={(id, newMonthIdx) => { onUpdateTouchpoint(id, { monthIndex: newMonthIdx }); }}
                            onClose={() => setSelection(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Contacts without activity this month */}
              {sortedContacts.filter(c => !relevantContacts.includes(c)).length > 0 && (
                <div className="mt-2 pt-2 border-t border-neutral-100">
                  <details className="text-[12px] text-neutral-500">
                    <summary className="cursor-pointer hover:text-neutral-700">
                      Overige contacten ({sortedContacts.length - relevantContacts.length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {sortedContacts.filter(c => !relevantContacts.includes(c)).map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleCellClick(c.id, idx)}
                          className="w-full text-left flex items-center gap-1.5 p-1.5 rounded hover:bg-neutral-50"
                        >
                          <span className="text-[12px] text-neutral-600">{c.name}</span>
                          <DMUBadge position={c.dmuPosition} />
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          );
        })}

        {/* Uncontacted on mobile */}
        {sortedContacts.some(c => {
          const hasActivity = activityMap.get(c.id)?.size;
          const hasTouchpoints = touchpointsByContactMonth.get(c.id)?.size;
          return !hasActivity && !hasTouchpoints;
        }) && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <h4 className="text-[14px] font-semibold text-neutral-600 mb-2">Nog niet benaderd/gepland</h4>
            <div className="space-y-1.5">
              {sortedContacts
                .filter(c => {
                  const hasActivity = activityMap.get(c.id)?.size;
                  const hasTouchpoints = touchpointsByContactMonth.get(c.id)?.size;
                  return !hasActivity && !hasTouchpoints;
                })
                .map(contact => (
                  <div key={contact.id} className="flex items-center gap-1.5">
                    <span className="text-[13px] text-neutral-700">{contact.name}</span>
                    <DMUBadge position={contact.dmuPosition} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
