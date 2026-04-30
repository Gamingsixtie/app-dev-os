---
phase: 23-ai-concurrentieanalyse-streaming-fix
plan: 01
subsystem: api-ai-analysis
tags: [streaming, json-assembly, keepalive, model-cascade, health-check]
dependency_graph:
  requires: []
  provides: [server-side-json-assembly, sonnet-primary-cascade, opus-deep-mode, health-check-endpoint]
  affects: [ai-analysis-client, vercel-deployment]
tech_stack:
  added: []
  patterns: [server-side-json-assembly, keepalive-interval, model-cascade-with-deep-mode]
key_files:
  created:
    - api/ai-analysis/health.ts
  modified:
    - api/ai-analysis.ts
    - vercel.json
decisions:
  - "Server-side JSON assembly with jsonParts.join() replaces direct fragment forwarding"
  - "Sonnet as primary model, Haiku as fallback (reversed from original)"
  - "Opus available via deepAnalysis flag for deep analysis mode"
  - "5-second keepalive interval instead of event-driven spaces"
  - "maxDuration 300s for all AI endpoints (ai-analysis, ai-advice, ai-wizard-advice)"
metrics:
  duration: ~2min
  completed: 2026-03-28
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 23 Plan 01: Server-side JSON Assembly & Health Check Summary

Server-side JSON assembly with keepalive spaces, Sonnet-primary model cascade with Opus deep mode, max_tokens 16384, vercel.json maxDuration 300s, and health check endpoint.

## What Was Done

### Task 1: Server-side JSON assembly, model cascade, and config updates (a8e0c56)

Rewrote the POST handler in `api/ai-analysis.ts` to collect all `input_json_delta` fragments into a `jsonParts` array, then assemble, validate with `JSON.parse()`, and send the complete validated JSON to the client. Added a 5-second keepalive interval that sends spaces to prevent Vercel 504 timeouts.

Key changes:
- **Model cascade reversed**: `['claude-sonnet-4-6', 'claude-haiku-4-5-20251001']` -- Sonnet is now primary
- **Opus deep mode**: New `DEEP_MODELS` array `['claude-opus-4-6', 'claude-sonnet-4-6']` activated via `body.deepAnalysis` flag
- **max_tokens**: Increased from 4096 to 16384 to prevent truncation on complex school profiles
- **Server-side assembly**: `jsonParts.push()` -> `jsonParts.join('')` -> `JSON.parse()` -> `JSON.stringify()` -- no raw fragments forwarded
- **Keepalive**: `setInterval` every 5s with proper `clearInterval` cleanup in both success and error paths
- **Structured logging**: `[ai-analysis] [model] [status] [duration_ms]` format with char count
- **vercel.json**: Updated `maxDuration` to 300 for ai-analysis.ts, ai-advice.ts, ai-wizard-advice.ts; added health endpoint config

### Task 2: Health check endpoint (7f55087)

Created `api/ai-analysis/health.ts` with a GET endpoint that sends a minimal ping to Claude Haiku (max_tokens: 10) and returns API availability status. Returns 200 with model/duration/region on success, 503 with error details on failure.

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all functionality is fully wired.

## Verification Results

- `jsonParts.join` found in api/ai-analysis.ts line 491
- `claude-sonnet-4-6` is first in MODELS array (line 439)
- `max_tokens: 16384` confirmed (line 453)
- `maxDuration: 300` in vercel.json for all 3 AI endpoints
- `api/ai-analysis/health.ts` exists with GET export
- Build passes (only pre-existing untracked test file errors, unrelated to this plan)

## Self-Check: PASSED

- [x] api/ai-analysis.ts -- FOUND, modified with server-side assembly
- [x] api/ai-analysis/health.ts -- FOUND, created with GET endpoint
- [x] vercel.json -- FOUND, modified with maxDuration 300
- [x] Commit a8e0c56 -- FOUND
- [x] Commit 7f55087 -- FOUND
