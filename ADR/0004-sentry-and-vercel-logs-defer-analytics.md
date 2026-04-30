# ADR-0004: Sentry for errors + Vercel built-in logs; defer product analytics

- **Status**: Accepted
- **Date**: 2026-04-28
- **Supersedes**: —

## Context

Solo developer, low-traffic apps, no SLA, no on-call rotation (see `code_context/runbook.md` § On-call). The project still needs a way to know when something breaks in production — without it, errors are invisible until a user complains. Product analytics (Posthog, Mixpanel) and full observability stacks (Datadog, Logtail, Better Stack) are tempting but each add setup time, monthly cost, and cognitive load. The question: what's the minimum observability that catches "broken" in production, and what can be deferred until concrete need surfaces?

## Decision

Use Sentry for error tracking (with stack traces + release tagging) and Vercel's built-in Functions logs for runtime logs. Defer Posthog / Mixpanel / Datadog / Logtail / Better Stack until a concrete product question or scale event makes one necessary.

## Alternatives considered

- **Datadog / New Relic**: full obs stack with logs + metrics + APM in one place. Overkill for solo low-traffic, cost-significant ($15+/host/month), time-cost on setup and dashboard tuning. Reconsider if the app reaches a scale where infra metrics matter.
- **Logtail / Better Stack**: log aggregator, free tier available — but Vercel's built-in logs already cover the current scale (search + 1-day retention on Hobby, longer on Pro). Adds a tool with no concrete pain solved.
- **Posthog / Mixpanel**: product analytics — valuable when there's a real question they answer ("does step X drop off?", "which feature is used most?"). Until that question is asked, the data they collect is noise.
- **Vercel logs only, no Sentry**: removes one tool — but Sentry catches stack traces tied to user/session/release, which Vercel logs don't. Errors are easy to miss without active alerting. Trade-off not worth it.
- **Chosen option (Sentry + Vercel logs)**: minimum viable observability — alerts on errors, logs for context, zero product-analytics overhead until needed.

## Consequences

- Positive: minimal setup, error alerts arrive in Sentry, near-free for solo scale (Sentry has a generous free tier), Vercel logs are already there.
- Negative: no product analytics until added later — can't answer "is feature X being used?" without querying the database manually. Vercel log retention is whatever the plan offers (not a long archive).
- Trade-offs we accept: reactive error monitoring (no preventive metrics) until traffic justifies more. Trigger to expand: a specific product question that requires event data, or scale where Vercel log retention is insufficient. When that happens, write a superseding ADR.

## Links

- Phase 4 — observability decision (architecture.md, Optie B)
- Code references: `code_context/architecture.md` § Observability, `code_context/runbook.md` § Observability, `code_context/runbook.md` § Disaster scenarios
- External docs: https://sentry.io, https://vercel.com/docs/observability
