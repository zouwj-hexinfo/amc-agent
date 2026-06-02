# Knowledge Base and Hermes Agent Interaction Implementation Plan

Date: 2026-06-02
Spec: `docs/superpowers/specs/2026-06-02-knowledge-base-hermes-interaction-design.md`

## Scope

Implement the first version of the backend knowledge orchestration layer described in the approved design:

- canonical application knowledge categories only;
- pre-run retrieval and Hermes context injection;
- citation metadata persistence;
- prompt-protocol parsing for in-run knowledge search and write suggestions;
- tests for the new orchestration logic and evaluate-route integration.

Do not implement vector search, direct Hermes writes to `knowledge_items`, or a new UI approval workflow in this first pass.

## Phase 1: Types and Metadata Shape

1. Extend `AnalysisRecord.metadata` in `server/store.ts`.
   - Add optional fields:
     - `knowledgePlan`;
     - `knowledgeCitations`;
     - `knowledgeRequests`;
     - `knowledgeWriteSuggestions`.
   - Keep existing metadata fields compatible.

2. Define local orchestration types in a new backend module.
   - Add `KnowledgeRetrievalPlan`.
   - Add `KnowledgeCitation`.
   - Add `KnowledgeWriteSuggestion`.
   - Add parse result types for Hermes protocol blocks.

Completion checks:

- TypeScript accepts metadata reads and writes.
- Existing metadata fields still work unchanged.

## Phase 2: Knowledge Orchestrator Module

Create `server/knowledge-orchestrator.ts`.

Implement:

1. `buildKnowledgeRetrievalPlan(project, agentType, instruction)`
   - Use canonical `KnowledgeItem['category']` values only.
   - Preserve current default categories: `policies`, `legal`, `methodology`, `internal_policies`.
   - Add `market`, `industry`, and `cases` based on agent type and keywords.
   - Extract keywords from project name, debtor name, collateral type, project type, description, file snippets, and user instruction.

2. `retrieveKnowledge(plan, items)`
   - Score title, tags, source, category, and content matches.
   - Prefer category matches from the plan.
   - Apply a bounded `limit`.
   - Return `KnowledgeCitation[]`.

3. `formatKnowledgeContext(citations)`
   - Output a stable prompt section with citation IDs.
   - Truncate snippets.
   - Emit an explicit empty-result note when no citations exist.

4. `parseHermesKnowledgeProtocol(textOrEvent)`
   - Parse fenced JSON blocks.
   - Support `knowledge_search`.
   - Support `knowledge_write_suggestion`.
   - Validate categories against canonical categories.
   - Return errors as parse results, not thrown exceptions.

5. `buildKnowledgeSearchResponse(citations)`
   - Format retrieval results as a compact response for Hermes or timeline display.

Completion checks:

- The module has no dependency on React or browser APIs.
- The module does not import `src/hermes/amc-knowledge-base.ts`.
- Empty, malformed, and overlong inputs are handled deterministically.

## Phase 3: Evaluate Route Integration

Update `/api/projects/:id/evaluate` in `server/index.ts`.

1. Replace direct `chooseKbsBasedOnIntent` usage with `buildKnowledgeRetrievalPlan`.
2. Retrieve local knowledge from `listKnowledgeItems()`.
3. Build citations and prompt context.
4. Pass the context into `buildAmcRunInput`.
5. Save these metadata fields when creating the analysis record:
   - `knowledgePlan`;
   - `knowledgeCitations`;
   - canonical `knowledgeBases`.
6. Preserve `EvaluationRecord.usedKnowledgeBases` as canonical category values.

Update `buildAmcRunInput`.

- Accept an optional knowledge context string.
- Include citation usage instructions.
- Keep project and file summary formatting stable.

Completion checks:

- Starting an evaluation still creates a Hermes run.
- Created analysis metadata includes plan and citations.
- Pending evaluation records still appear in the same shape expected by the frontend.

## Phase 4: Hermes Protocol Detection

Integrate prompt-protocol parsing into the Hermes event handling path.

1. Inspect normalized Hermes output/progress events in the server event append flow.
2. Parse possible `knowledge_search` and `knowledge_write_suggestion` blocks.
3. For `knowledge_search`:
   - create a retrieval plan with source `hermes_protocol_request`;
   - retrieve matching local citations;
   - append the request and citations to analysis metadata;
   - emit or append a user-facing analysis event/timeline entry if the existing event model supports it.
4. For `knowledge_write_suggestion`:
   - validate the suggestion;
   - store it as `pending` or `invalid`;
   - do not write to `knowledge_items`.
5. If mid-run Hermes continuation is unavailable, record the result and continue the run without failure.

Completion checks:

- Bad protocol blocks do not break SSE.
- Valid protocol blocks are persisted in metadata.
- No code path automatically creates a `KnowledgeItem` from a Hermes suggestion.

## Phase 5: Tests

Add focused backend tests. Use the repository's existing test runner conventions if present; otherwise add Bun test files with minimal setup.

Unit tests:

1. `buildKnowledgeRetrievalPlan`
   - default categories;
   - `evaluation` agent adds `market`;
   - `industry` agent adds `industry`;
   - risk/legal keywords add `cases`;
   - output categories are canonical only.

2. `retrieveKnowledge`
   - title match;
   - tag match;
   - content match;
   - score ordering;
   - limit enforcement;
   - empty result behavior.

3. `formatKnowledgeContext`
   - citation IDs are present;
   - long snippets are truncated;
   - empty note is present.

4. `parseHermesKnowledgeProtocol`
   - valid search block;
   - valid write suggestion block;
   - multiple fenced blocks;
   - malformed JSON;
   - invalid categories.

Integration tests:

1. Evaluate-route startup persists `knowledgePlan`.
2. Evaluate-route startup persists `knowledgeCitations`.
3. Hermes input includes the local knowledge section.
4. `usedKnowledgeBases` uses canonical category names.

Completion checks:

- Tests pass locally.
- Tests do not require a live Hermes API unless mocked.

## Phase 6: Verification and Cleanup

1. Run typecheck/build.
2. Run backend tests.
3. Confirm no unrelated files are modified.
4. Inspect metadata written by a mocked or local evaluation startup path.
5. Document any known limitation around mid-run Hermes continuation.

## Suggested Implementation Order

1. Add the orchestrator module and unit tests.
2. Extend metadata typing.
3. Integrate pre-run retrieval into evaluate route.
4. Add evaluate-route integration tests.
5. Add protocol parsing integration.
6. Run full verification.

This order keeps the risky Hermes event integration until after the deterministic retrieval and pre-run flow are already tested.
