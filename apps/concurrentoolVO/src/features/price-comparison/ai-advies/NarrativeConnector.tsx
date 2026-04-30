/**
 * Visual connector between AI advice steps.
 * Shows a vertical line + brief text explaining how one step feeds into the next.
 */

interface NarrativeConnectorProps {
  text: string;
}

export function NarrativeConnector({ text }: NarrativeConnectorProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-2">
      <div className="w-px h-8 bg-neutral-200 ml-4" />
      <p className="text-xs text-neutral-400 italic">{text}</p>
    </div>
  );
}
