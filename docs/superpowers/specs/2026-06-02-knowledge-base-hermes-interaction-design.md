# Knowledge Base and Hermes Agent Interaction Design

Date: 2026-06-02
Status: Approved for specification review

## Context

AMC Agent already has two knowledge concepts:

- The application data model in `src/types.ts`, represented by `KnowledgeItem` categories: `policies`, `legal`, `market`, `cases`, `methodology`, `internal_policies`, `industry`, and `feedback`.
- A Hermes-oriented enum set in `src/hermes/amc-knowledge-base.ts`, represented by names such as `policy_regulations` and `legal_knowledge`.

The design keeps the application data model as the canonical knowledge model. The Hermes-oriented enum set is not expanded as the new design core. If existing callers still need compatibility, they should use explicit mapping and avoid leaking those names into new metadata, prompts, or UI.

Today, evaluation startup chooses knowledge base category names through `chooseKbsBasedOnIntent`, then passes those names into the Hermes prompt. It does not retrieve local knowledge, save citations, inject evidence snippets, or manage Hermes-generated knowledge writebacks. This design adds a backend orchestration layer to make knowledge usage auditable and controllable.

## Goals

- Use the application `KnowledgeItem` model as the only canonical knowledge base model.
- Support a hybrid Hermes interaction mode:
  - pre-run local retrieval and context injection;
  - in-run knowledge requests through a prompt protocol.
- Select knowledge categories automatically from project context, target Agent, and user instruction.
- Save a citation list with each analysis/evaluation.
- Allow Hermes to suggest new knowledge, but require confirmation or backend validation before anything becomes a formal `KnowledgeItem`.
- Keep Hermes API client code generic and keep AMC knowledge orchestration in server-side business logic.

## Non-Goals

- Do not implement vector search in the first version.
- Do not let Hermes write directly to `knowledge_items`.
- Do not replace the current Hermes run API or SSE pipeline.
- Do not make users manually select knowledge base categories in the first version.
- Do not migrate or delete `src/hermes/amc-knowledge-base.ts` in the first version unless an implementation step proves it is unused and safe to remove.

## Recommended Approach

Add a backend knowledge orchestration module, tentatively `server/knowledge-orchestrator.ts`.

The request flow becomes:

```text
App evaluate request
  -> server evaluate route
  -> KnowledgeOrchestrator
  -> Hermes run input
  -> Hermes Agent API
```

`KnowledgeOrchestrator` owns:

- automatic category and keyword planning;
- local `KnowledgeItem` retrieval;
- citation formatting;
- Hermes prompt protocol parsing;
- knowledge write suggestion capture.

`server/hermes.ts` remains a generic Hermes API client. It should not import AMC knowledge categories or retrieval logic.

## Data Model

### KnowledgeRetrievalPlan

Represents the local retrieval plan created before a Hermes run or in response to a Hermes in-run request.

Fields:

- `categories`: canonical `KnowledgeItem['category'][]`;
- `keywords`: strings extracted from project fields, user instruction, target Agent, and Hermes request;
- `limit`: maximum number of citations to return;
- `reason`: human-readable explanation for the selected categories and keywords;
- `source`: `pre_run` or `hermes_protocol_request`.

### KnowledgeCitation

Represents the auditable reference list saved with an analysis.

Fields:

- `id`: knowledge item ID;
- `category`: canonical knowledge category;
- `title`: knowledge item title;
- `source`: source label from the knowledge item;
- `tags`: knowledge item tags;
- `snippet`: short text used for prompt injection;
- `score`: retrieval score.

The citation list is saved in `analysis_records.metadata_json`. Final `EvaluationRecord` objects should also preserve enough citation metadata to display a "reference knowledge" list in the report view.

### KnowledgeWriteSuggestion

Represents a Hermes-proposed knowledge item that has not been accepted into the formal knowledge base.

Fields:

- `id`;
- `analysisId`;
- `runId`;
- `category`;
- `title`;
- `content`;
- `tags`;
- `source`;
- `reason`;
- `status`: `pending`, `approved`, `rejected`, or `invalid`;
- `createdAt`.

First-version storage can be analysis metadata if a dedicated table would be premature. Formal insertion into `knowledge_items` only happens after approval.

## Module Interface

The first version should prefer small functions over a large class:

- `buildKnowledgeRetrievalPlan(project, agentType, instruction)`
  - Selects canonical categories and keywords.
  - Enhances the current `chooseKbsBasedOnIntent` behavior.

- `retrieveKnowledge(plan, items)`
  - Searches `KnowledgeItem[]` from the local store.
  - Scores title, tags, category, source, and content matches.
  - Applies `limit` and returns `KnowledgeCitation[]`.

- `formatKnowledgeContext(citations)`
  - Builds a short Hermes prompt section.
  - Preserves citation IDs.
  - Handles empty results explicitly.

- `parseHermesKnowledgeProtocol(textOrEvent)`
  - Detects fenced JSON blocks for knowledge requests or write suggestions.
  - Validates canonical categories.
  - Returns typed parse results without throwing on bad model output.

- `buildKnowledgeSearchResponse(citations)`
  - Formats local retrieval results into a response block that can be fed back to Hermes or shown in the analysis timeline.

## Pre-Run Flow

When `/api/projects/:id/evaluate` starts:

1. Load the project and request body.
2. Build a `KnowledgeRetrievalPlan`.
3. Read local knowledge through `listKnowledgeItems()`.
4. Retrieve and score citations.
5. Format a concise knowledge context block.
6. Add the context and citation usage rules to `buildAmcRunInput`.
7. Create the Hermes run.
8. Save `knowledgePlan`, `knowledgeCitations`, and canonical `knowledgeBases` in `analysis_records.metadata`.

Hermes should be instructed to cite local knowledge by ID when it materially uses a retrieved item, and to distinguish local knowledge from facts found through other tools or model reasoning.

## In-Run Prompt Protocol

Hermes can request additional local knowledge with a fenced JSON block:

```json
{
  "type": "knowledge_search",
  "query": "轮候查封 抵押权 顺位",
  "categories": ["legal", "cases"],
  "limit": 5,
  "reason": "需要核验法律审查段落中的顺位判断"
}
```

The server detects this request in normalized Hermes output or progress events. It then:

1. Parses and validates the request.
2. Runs local retrieval against canonical `KnowledgeItem` data.
3. Stores the request and citations in analysis metadata.
4. Emits an analysis event or timeline entry so the UI can show the request.
5. Sends a knowledge response back to Hermes if the current Hermes API supports mid-run continuation.

If mid-run continuation is not available, the server still records the request and retrieval result. The UI should surface it as a pending knowledge supplement rather than failing the run.

## Knowledge Write Suggestion Protocol

Hermes can suggest a reusable knowledge item with a fenced JSON block:

```json
{
  "type": "knowledge_write_suggestion",
  "category": "feedback",
  "title": "商业物业空置率对司法处置折扣的影响",
  "content": "...",
  "tags": ["空置率", "司法处置", "折扣"],
  "reason": "本次评估形成可复用经验"
}
```

The backend must not insert this directly into `knowledge_items`. It saves the suggestion with `pending` status. Invalid category, empty title, or empty content marks the suggestion as `invalid`.

The existing paragraph tuning flow currently writes `feedback` items directly. This design does not require changing that flow in the first version, but future implementation should consider routing model-generated feedback through the same suggestion approval mechanism for consistency.

## Error Handling

### No Knowledge Hit

Do not block Hermes run startup. Inject an explicit empty-context note:

```text
本次未检索到本地知识依据，请区分事实、推断和待核查事项。
```

Save an empty citation list in metadata.

### Knowledge Context Too Long

Truncate the injected context by score, category priority, and snippet length. Keep full citation metadata in analysis metadata, but only inject short snippets into Hermes.

### Protocol Parse Failure

Do not fail the SSE stream or analysis. Save a `knowledge_protocol_parse_failed` metadata entry with a short raw excerpt and emit a user-facing timeline message.

### Invalid Write Suggestion

Mark the suggestion as `invalid` and do not create a `KnowledgeItem`.

### Hermes Continuation Unsupported

Record the in-run request and local retrieval result. Surface it in the UI as a pending knowledge supplement, and let the main run continue if possible.

## Testing

Unit tests should cover:

- `buildKnowledgeRetrievalPlan`
  - target Agent to category behavior;
  - project fields and user instruction keyword extraction;
  - canonical category output only.

- `retrieveKnowledge`
  - title, content, tag, category, and source matching;
  - ranking;
  - limit behavior;
  - empty results.

- `formatKnowledgeContext`
  - citation ID preservation;
  - snippet truncation;
  - empty result note.

- `parseHermesKnowledgeProtocol`
  - valid `knowledge_search`;
  - valid `knowledge_write_suggestion`;
  - multiple fenced JSON blocks;
  - malformed JSON;
  - invalid categories.

Integration tests should cover `/api/projects/:id/evaluate`:

- metadata includes `knowledgePlan`;
- metadata includes `knowledgeCitations`;
- metadata uses canonical `knowledgeBases`;
- Hermes input includes the local knowledge context section;
- existing behavior still creates an analysis record and a pending evaluation record.

## Open Implementation Notes

- `AnalysisRecord.metadata` needs typed optional fields for `knowledgePlan`, `knowledgeCitations`, `knowledgeRequests`, and `knowledgeWriteSuggestions`.
- `buildAmcRunInput` should accept a knowledge context string instead of rebuilding knowledge behavior internally.
- `chooseKbsBasedOnIntent` can be replaced or wrapped by `buildKnowledgeRetrievalPlan`.
- UI changes can be deferred unless the first implementation includes display of citation lists and pending suggestions.
- The existing dirty `index.html` worktree change is unrelated and should remain untouched.
