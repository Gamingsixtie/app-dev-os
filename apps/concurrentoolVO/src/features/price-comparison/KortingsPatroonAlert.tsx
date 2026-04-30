import type { DiscountPattern } from '@/engine/discount-patterns';

interface KortingsPatroonAlertProps {
  patterns: DiscountPattern[];
  visibleProviders: string[];
}

/**
 * Yellow info banner showing detected discount patterns.
 * Only shows patterns for providers that are visible in the current comparison.
 */
export function KortingsPatroonAlert({ patterns, visibleProviders }: KortingsPatroonAlertProps) {
  // Filter to only show patterns for visible providers
  const visiblePatterns = patterns.filter((p) =>
    visibleProviders.includes(p.provider),
  );

  if (visiblePatterns.length === 0) return null;

  return (
    <div className="space-y-2">
      {visiblePatterns.map((pattern) => (
        <div
          key={`${pattern.provider}:${pattern.moduleId}`}
          className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm text-yellow-800"
        >
          <span className="font-medium capitalize">{pattern.provider}</span>{' '}
          biedt gemiddeld{' '}
          <span className="font-semibold">{Math.round(pattern.averageDiscount)}%</span>{' '}
          korting{' '}
          <span className="text-yellow-700">
            (gebaseerd op {pattern.schoolCount} scholen)
          </span>
        </div>
      ))}
    </div>
  );
}
