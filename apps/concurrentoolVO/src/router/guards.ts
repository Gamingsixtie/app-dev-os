import { getSchoolBySlug } from '@/db/operations';
import type { SchoolRecord } from '@/db/types';

export interface SmartRedirectResult {
  to: string;
  params?: Record<string, string>;
}

export async function getSmartRedirect(
  schoolCount: number,
  firstSchoolSlug?: string,
): Promise<SmartRedirectResult> {
  if (schoolCount === 1 && firstSchoolSlug) {
    return {
      to: '/scholen/$slug/wizard/$step',
      params: { slug: firstSchoolSlug, step: '1' },
    };
  }
  return { to: '/scholen' };
}

export async function checkSchoolExists(
  slug: string,
): Promise<SchoolRecord | undefined> {
  const school = await getSchoolBySlug(slug);
  return school ?? undefined;
}
