interface SchoolplanSummaryProps {
  summary: string;
}

/**
 * AI-generated summary card for the analyzed schoolplan.
 */
export default function SchoolplanSummary({ summary }: SchoolplanSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-cito-primary">Samenvatting</h3>
      <p className="text-sm text-neutral-700 italic mt-2">{summary}</p>
    </div>
  );
}
