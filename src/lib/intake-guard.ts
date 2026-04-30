import type { Conversation } from '@/db/types';
import type { useSchoolProfileStore } from '@/features/school-profile/store';

export type IntakeSource = 'wizard' | 'conversation' | 'both' | 'none';

export interface IntakeStatus {
  /** Zustand store already has levels or module setups from wizard */
  hasWizardData: boolean;
  /** A conversation with tag 'ai-intake' or 'ai-intake-wizard' exists */
  hasConversationIntake: boolean;
  /** Combined source indicator */
  source: IntakeSource;
  /** ISO date of the most recent AI intake conversation, if any */
  lastIntakeDate: string | null;
}

/**
 * Detects whether existing AI intake data is present for a school,
 * either from the wizard flow or the conversation/gesprekken flow.
 */
export function detectExistingIntake(
  store: ReturnType<typeof useSchoolProfileStore.getState>,
  conversations: Conversation[],
): IntakeStatus {
  const hasWizardData =
    store.levels.length > 0 || store.moduleSetups.length > 0;

  const intakeConversations = conversations.filter(
    (c) => c.tags.includes('ai-intake') || c.tags.includes('ai-intake-wizard'),
  );
  const hasConversationIntake = intakeConversations.length > 0;

  const lastIntakeDate =
    intakeConversations.length > 0
      ? intakeConversations.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0].date
      : null;

  let source: IntakeSource = 'none';
  if (hasWizardData && hasConversationIntake) source = 'both';
  else if (hasWizardData) source = 'wizard';
  else if (hasConversationIntake) source = 'conversation';

  return { hasWizardData, hasConversationIntake, source, lastIntakeDate };
}
