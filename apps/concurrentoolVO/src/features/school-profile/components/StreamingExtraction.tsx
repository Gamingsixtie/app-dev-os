interface StreamingField {
  label: string;
  done: boolean;
}

interface StreamingExtractionProps {
  fields: StreamingField[];
}

/**
 * Progressive field display during SSE streaming extraction.
 * Shows checkmark (done), diamond (in progress), or circle (pending) per field.
 */
export default function StreamingExtraction({ fields }: StreamingExtractionProps) {
  // Find the first non-done field (the one currently in progress)
  const inProgressIndex = fields.findIndex(f => !f.done);

  return (
    <div className="flex flex-col gap-2 py-3">
      {fields.map((field, i) => {
        const isInProgress = i === inProgressIndex;
        const isDone = field.done;

        return (
          <div key={field.label} className="flex items-center gap-2">
            {isDone ? (
              // Green checkmark icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 text-green-700 flex-shrink-0"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : isInProgress ? (
              // Amber diamond icon with pulse animation
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 text-amber-700 flex-shrink-0 animate-pulse"
                aria-hidden="true"
              >
                <path d="M8 1.5l4.95 4.95a1.5 1.5 0 0 1 0 2.1L8 13.5l-4.95-4.95a1.5 1.5 0 0 1 0-2.1L8 1.5Z" />
              </svg>
            ) : (
              // Neutral circle icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 text-neutral-400 flex-shrink-0"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="4" />
              </svg>
            )}

            <span
              className={`text-sm font-semibold ${
                isDone
                  ? 'text-green-700'
                  : isInProgress
                    ? 'text-amber-700'
                    : 'text-neutral-400'
              }`}
            >
              {field.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Default streaming field labels in order.
 * Used by ConversationForm to initialize the streaming extraction display.
 */
export const STREAMING_FIELD_LABELS = [
  'Niveaus',
  'Leerlingen',
  'Modules & aanbieders',
  'Prijzen',
  'Contactpersonen',
  'Actiepunten',
  'Pipelinesignaal',
  'Verificatiepunten',
] as const;
