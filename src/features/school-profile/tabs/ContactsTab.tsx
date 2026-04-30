import { useState, useMemo } from 'react';
import { useContacts, useDeleteContact } from '@/hooks/useContacts';
import { useConversations, useCreateConversation } from '@/hooks/useConversations';
import { useSystemEvents } from '@/hooks/useSystemEvents';
import { usePlannedTouchpoints, useCreatePlannedTouchpoint, useUpdatePlannedTouchpoint, useDeletePlannedTouchpoint } from '@/hooks/usePlannedTouchpoints';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { DMU_POSITIONS } from '@/models/school';
import type { Contact } from '@/db/types';
import ContactCard from '@/features/school-profile/components/ContactCard';
import ContactForm from '@/features/school-profile/components/ContactForm';
import ContactGroupHeader from '@/features/school-profile/components/ContactGroupHeader';
import CustomerJourneyTimeline from '@/features/school-profile/components/CustomerJourneyTimeline';
import SchoolYearPlanner from '@/features/school-profile/components/SchoolYearPlanner';

type ViewMode = 'dmu' | 'timeline' | 'schooljaar';

export default function ContactsTab() {
  const activeSchoolId = useSchoolProfileStore(s => s.activeSchoolId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('contacts-view-mode') as ViewMode) ?? 'dmu';
  });

  const { data: contacts = [] } = useContacts(activeSchoolId ?? '');
  const { data: conversations = [] } = useConversations(activeSchoolId ?? '');
  const { data: systemEvents = [] } = useSystemEvents(activeSchoolId ?? '');
  const { data: plannedTouchpoints = [] } = usePlannedTouchpoints(activeSchoolId ?? '');
  const deleteContactMutation = useDeleteContact();
  const createTouchpoint = useCreatePlannedTouchpoint();
  const updateTouchpoint = useUpdatePlannedTouchpoint();
  const deleteTouchpoint = useDeletePlannedTouchpoint();
  const createConversation = useCreateConversation();

  // Group contacts by DMU role, only non-empty groups
  const groupedContacts = useMemo(() => {
    return DMU_POSITIONS
      .filter(role => contacts.some(c => c.dmuPosition === role))
      .map(role => ({
        role,
        contacts: contacts.filter(c => c.dmuPosition === role),
      }));
  }, [contacts]);

  if (!activeSchoolId) return null;

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('contacts-view-mode', mode);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingContact(null);
    setFormOpen(true);
  };

  const handleDelete = async (contact: Contact) => {
    deleteContactMutation.mutate({ schoolId: activeSchoolId, contactId: contact.id });
  };

  const handleSaved = () => {
    setFormOpen(false);
    setEditingContact(null);
  };

  const getDeleteInfo = (contactId: string) => {
    const linkedConversations = conversations.filter(c => c.contactId === contactId).length;
    return {
      canDelete: linkedConversations === 0,
      linkedConversations,
    };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-semibold text-neutral-900">
          Contactpersonen ({contacts.length})
        </h2>
        <button
          type="button"
          onClick={handleAdd}
          className="h-[44px] px-4 text-[14px] font-semibold bg-cito-accent text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          + Contact toevoegen
        </button>
      </div>

      {/* View toggle */}
      <div className="mb-6" role="tablist">
        <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden max-sm:w-full">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'dmu'}
            onClick={() => handleViewChange('dmu')}
            className={`h-[44px] px-4 text-[14px] font-semibold transition-colors max-sm:flex-1 ${
              viewMode === 'dmu'
                ? 'bg-cito-primary text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            DMU-overzicht
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'timeline'}
            onClick={() => handleViewChange('timeline')}
            className={`h-[44px] px-4 text-[14px] font-semibold transition-colors max-sm:flex-1 ${
              viewMode === 'timeline'
                ? 'bg-cito-primary text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            Klantreis
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'schooljaar'}
            onClick={() => handleViewChange('schooljaar')}
            className={`h-[44px] px-4 text-[14px] font-semibold transition-colors max-sm:flex-1 ${
              viewMode === 'schooljaar'
                ? 'bg-cito-primary text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            Schooljaar
          </button>
        </div>
      </div>

      {/* DMU-overzicht view */}
      {viewMode === 'dmu' && (
        <>
          {contacts.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
              <p className="text-[16px] font-semibold text-neutral-700 mb-1">
                Geen contactpersonen
              </p>
              <p className="text-[14px] text-neutral-500">
                Voeg contactpersonen toe via de Contacten-tab om het DMU-beslissingsoverzicht te gebruiken.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {groupedContacts.map(({ role, contacts: groupContacts }) => (
                <ContactGroupHeader
                  key={role}
                  role={role}
                  count={groupContacts.length}
                >
                  {groupContacts.map(contact => {
                    const { canDelete, linkedConversations } = getDeleteInfo(contact.id);
                    return (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        canDelete={canDelete}
                        linkedConversations={linkedConversations}
                      />
                    );
                  })}
                </ContactGroupHeader>
              ))}
            </div>
          )}
        </>
      )}

      {/* Klantreis (timeline) view */}
      {viewMode === 'timeline' && (
        <CustomerJourneyTimeline
          schoolId={activeSchoolId}
          contacts={contacts}
          conversations={conversations}
          systemEvents={systemEvents}
        />
      )}

      {/* Schooljaar (matrix) view */}
      {viewMode === 'schooljaar' && (
        <SchoolYearPlanner
          contacts={contacts}
          conversations={conversations}
          systemEvents={systemEvents}
          plannedTouchpoints={plannedTouchpoints}
          onCreateTouchpoint={data => createTouchpoint.mutate({ schoolId: activeSchoolId, data })}
          onUpdateTouchpoint={(touchpointId, data) => updateTouchpoint.mutate({ schoolId: activeSchoolId, touchpointId, data })}
          onDeleteTouchpoint={touchpointId => deleteTouchpoint.mutate({ schoolId: activeSchoolId, touchpointId })}
          onQuickMark={(contactId, date) => createConversation.mutate({
            schoolId: activeSchoolId,
            data: { contactId, date, content: '[Gesproken]', tags: ['quick-mark'] },
          })}
          onCreateConversation={data => createConversation.mutate({
            schoolId: activeSchoolId,
            data,
          })}
        />
      )}

      {/* Contact form slide-over */}
      {formOpen && (
        <ContactForm
          contact={editingContact ?? undefined}
          schoolId={activeSchoolId}
          onClose={() => {
            setFormOpen(false);
            setEditingContact(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
