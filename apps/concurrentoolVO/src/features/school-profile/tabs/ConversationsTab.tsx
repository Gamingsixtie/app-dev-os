import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useContacts } from '@/hooks/useContacts';
import { useConversations, useDeleteConversation } from '@/hooks/useConversations';
import { useActions, useCreateAction } from '@/hooks/useActions';
import { useSchools } from '@/hooks/useSchools';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { buildTimeline } from '@/models/timeline';
import type { Conversation } from '@/db/types';
import Timeline from '@/features/school-profile/components/Timeline';
import ConversationForm from '@/features/school-profile/components/ConversationForm';
import ActionKanban from '@/features/school-profile/components/ActionKanban';

export default function ConversationsTab() {
  const activeSchoolId = useSchoolProfileStore(s => s.activeSchoolId);
  const [conversationFormOpen, setConversationFormOpen] = useState(false);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { slug } = useParams({ strict: false }) as { slug?: string };

  const { data: contacts = [] } = useContacts(activeSchoolId ?? '');
  const { data: conversations = [] } = useConversations(activeSchoolId ?? '');
  const { data: actions = [] } = useActions(activeSchoolId ?? '');
  const { data: schools = [] } = useSchools();
  const createActionMutation = useCreateAction();
  const deleteConversationMutation = useDeleteConversation();

  if (!activeSchoolId) return null;

  // Find the current school record for DiffView comparison
  const school = schools.find(s => s.id === activeSchoolId);

  // System events are no longer embedded in school record; use empty array for now
  const systemEvents: never[] = [];

  // Build timeline events
  const timelineEvents = useMemo(
    () => buildTimeline(conversations, systemEvents),
    [conversations, systemEvents],
  );

  // Collect existing tags for autocomplete
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    conversations.forEach(c => c.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [conversations]);

  const handleEditConversation = (conversation: Conversation) => {
    setEditingConversation(conversation);
    setConversationFormOpen(true);
  };

  const handleAddConversation = () => {
    setEditingConversation(null);
    setConversationFormOpen(true);
  };

  const handleSaved = () => {
    setConversationFormOpen(false);
    setEditingConversation(null);
  };

  const handleNavigateToComparison = useCallback(() => {
    if (slug) {
      navigate({ to: '/scholen/$slug/vergelijking', params: { slug } });
    }
  }, [navigate, slug]);

  const handleCreateAction = async (conversationId?: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    const title = conv
      ? `Vervolg: ${conv.content.slice(0, 50)}${conv.content.length > 50 ? '...' : ''}`
      : 'Nieuwe actie';
    setActionError(null);
    createActionMutation.mutate(
      {
        schoolId: activeSchoolId,
        data: { title, conversationId: conversationId ?? null },
      },
      {
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : 'Actie aanmaken mislukt');
        },
      },
    );
  };

  const handleDeleteConversation = (conversationId: string) => {
    deleteConversationMutation.mutate({
      schoolId: activeSchoolId,
      conversationId,
    });
  };

  return (
    <div className="space-y-10">
      {/* Gesprekken section */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-neutral-900 border-l-4 border-cito-primary pl-3 flex items-center gap-2">
            Gesprekken
            <span className="bg-cito-primary/10 text-cito-primary text-[14px] font-semibold px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={handleAddConversation}
            className="h-[44px] px-4 text-[14px] font-semibold bg-cito-accent text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            + Gesprek vastleggen
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Zoek op tekst, contactpersoon of tag..."
            className="h-[44px] w-full border border-neutral-200 rounded-lg px-4 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary"
          />
        </div>

        {/* Conversation form */}
        {conversationFormOpen && (
          <ConversationForm
            conversation={editingConversation ?? undefined}
            schoolId={activeSchoolId}
            contacts={contacts}
            existingTags={existingTags}
            onClose={() => {
              setConversationFormOpen(false);
              setEditingConversation(null);
            }}
            onSaved={handleSaved}
            onNavigateToComparison={handleNavigateToComparison}
            school={school}
            actions={actions}
          />
        )}

        {/* Timeline */}
        <Timeline
          events={timelineEvents}
          contacts={contacts}
          searchQuery={searchQuery}
          onEditConversation={handleEditConversation}
          onCreateAction={handleCreateAction}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Acties section */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h2 className="text-[20px] font-semibold text-neutral-900 border-l-4 border-cito-accent pl-3 flex items-center gap-2 mb-4">
          Acties
          <span className="bg-cito-accent/10 text-cito-accent text-[14px] font-semibold px-2 py-0.5 rounded-full">
            {actions.length}
          </span>
        </h2>

        {actionError && (
          <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {actionError}
          </div>
        )}

        <ActionKanban
          actions={actions}
          conversations={conversations}
          schoolId={activeSchoolId}
          onAddAction={handleCreateAction}
        />
      </div>
    </div>
  );
}
