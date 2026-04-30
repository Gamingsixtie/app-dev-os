import { useSchoolProfileStore } from '../school-profile/store';
import { useSchoolplanAnalysis } from '@/hooks/useSchoolplanAnalysis';
import { useParams, Link } from '@tanstack/react-router';

/**
 * Banner shown at the top of the comparison page.
 * - No schoolplan: suggests doing the analysis first
 * - Schoolplan complete: shows compact summary with opportunity count
 */
export function SchoolplanBanner() {
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const { slug } = useParams({ strict: false }) as { slug?: string };
  const { data: analysis, isLoading } = useSchoolplanAnalysis(activeSchoolId ?? '');

  if (isLoading || !slug) return null;

  const isComplete = analysis?.analysis_status === 'complete';
  const hasOpportunities = isComplete && analysis.opportunities.length > 0;

  // No schoolplan uploaded — show suggestion
  if (!analysis || analysis.analysis_status === 'pending') {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-600"
              aria-hidden="true"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-purple-800">
              Tip: doe eerst de schoolplananalyse
            </h3>
            <p className="text-sm text-purple-700 mt-1 leading-relaxed">
              Upload het schoolplan om automatisch Cito-kansen te identificeren. Dit verrijkt de
              vergelijking met argumenten vanuit de schoolvisie.
            </p>
            <Link
              to="/scholen/$slug/schoolplan"
              params={{ slug }}
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-purple-700 hover:text-purple-900 underline decoration-dashed underline-offset-2"
            >
              Schoolplan uploaden
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Schoolplan complete — show compact summary
  if (isComplete && hasOpportunities) {
    const opportunityCount = analysis.opportunities.length;
    const themeList = analysis.themes.slice(0, 3).join(', ');

    return (
      <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-5 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-600"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[15px] font-semibold text-purple-800">
                Schoolplan geanalyseerd
              </h3>
              <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                {opportunityCount} {opportunityCount === 1 ? 'kans' : 'kansen'}
              </span>
            </div>
            <p className="text-sm text-purple-700 leading-relaxed">
              {analysis.summary.length > 160
                ? analysis.summary.slice(0, 160).trim() + '...'
                : analysis.summary}
            </p>
            {themeList && (
              <p className="text-xs text-purple-500 mt-2">
                Thema's: {themeList}
                {analysis.themes.length > 3 && ` +${analysis.themes.length - 3}`}
              </p>
            )}
          </div>
          <Link
            to="/scholen/$slug/schoolplan"
            params={{ slug }}
            className="flex-shrink-0 text-xs font-semibold text-purple-600 hover:text-purple-800 underline decoration-dashed underline-offset-2"
          >
            Bekijk details
          </Link>
        </div>
      </div>
    );
  }

  // Failed or other status — don't show anything
  return null;
}
