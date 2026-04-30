import { z } from 'zod';

export const RelevanceScore = z.enum(['hoog', 'midden', 'laag']);

export const CompetitorVulnerability = z.object({
  provider: z.enum(['dia', 'jij']),
  description: z.string(),
});

export const SchoolplanOpportunity = z.object({
  theme: z.string(),
  citoProduct: z.string(),
  moduleId: z.string(),
  explanation: z.string(),
  conversationTip: z.string(),
  relevance: RelevanceScore,
  quote: z.string(),
  competitorVulnerabilities: z.array(CompetitorVulnerability).default([]),
});

export const AlsoRelevantItem = z.object({
  citoProduct: z.string(),
  moduleId: z.string(),
  reason: z.string(),
  relevance: RelevanceScore,
});

export const SchoolplanAnalysisResult = z.object({
  isSchoolplan: z.boolean(),
  summary: z.string(),
  themes: z.array(z.string()),
  opportunities: z.array(SchoolplanOpportunity),
  alsoRelevant: z.array(AlsoRelevantItem).default([]),
});

export const OpportunityAnnotation = z.object({
  status: z.enum(['open', 'besproken', 'niet-relevant']),
  note: z.string().default(''),
  updatedAt: z.string(),
  updatedBy: z.string(),
});

export type RelevanceScore = z.infer<typeof RelevanceScore>;
export type CompetitorVulnerability = z.infer<typeof CompetitorVulnerability>;
export type SchoolplanOpportunity = z.infer<typeof SchoolplanOpportunity>;
export type AlsoRelevantItem = z.infer<typeof AlsoRelevantItem>;
export type SchoolplanAnalysisResult = z.infer<typeof SchoolplanAnalysisResult>;
export type OpportunityAnnotation = z.infer<typeof OpportunityAnnotation>;
