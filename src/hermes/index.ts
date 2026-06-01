/**
 * Hermes Integration - Unified Exports
 * 统一导出所有公共API
 */

// Types
export type {
  AnalysisStatus,
  AgentStatus,
  AuditStatus,
  AnalysisAgent,
  AnalysisArtifact,
  Evidence,
  ReportSection,
  TimelineEntry,
  AnalysisEvent,
  AnalysisState,
  SequencedSseAnalysisEvent,
  WorkspaceSource,
  WorkspaceGap,
  WorkspaceDraftFinding,
  AgentWorkspaceModel,
  AgentConsoleTraceKind,
  AgentConsoleTaskStatus,
  AgentConsoleTraceItem,
  AgentConsoleTask,
  WorkbenchMilestoneState,
  WorkbenchFocusMode,
  WorkbenchMilestone,
  StartAnalysisRequest,
  StartAnalysisResponse,
  RequiredAction,
} from './types'

// Event Handler
export {
  financialAnalysisAgents,
  createInitialAnalysisState,
  shouldOpenAnalysisEventStream,
  shouldRetryAnalysisEventStream,
  shouldQueueComposerMessage,
  reduceAnalysisEvent,
} from './event-handler'

// API Client
export {
  HermesClient,
  readSseAnalysisEvent,
  hermesClient,
} from './client'

export type { AnalysisEventStreamOptions } from './client'

// ===== AMC Integration =====

// AMC Agent Types & Constants
export type {
  AmcAgentId,
  AmcEvaluationEvent,
  AmcKnowledgeBase,
  AmcExternalDataSource,
  AmcEvaluationDimension,
  AmcReportFormat,
  AmcMcpIntegration,
} from './amc-agents'

export {
  amcEvaluationAgents,
  amcEvaluationDimensions,
  amcReportFormats,
  amcMcpIntegrations,
} from './amc-agents'

// AMC Event Handler
export type {
  AmcEvaluationStatus,
  AmcEvaluationState,
} from './amc-event-handler'

export {
  createInitialAmcEvaluationState,
  shouldOpenAmcEvaluationStream,
  shouldRetryAmcEvaluationStream,
  reduceAmcEvaluationEvent,
} from './amc-event-handler'

// AMC Client
export {
  AmcEvaluationClient,
} from './amc-client'

export type {
  StartAmcEvaluationRequest,
  AmcEvaluationOptions,
} from './amc-client'

// AMC Knowledge Base
export {
  AmcKnowledgeBaseClient,
  AmcExternalDataClient,
} from './amc-knowledge-base'

export type {
  KnowledgeEntry,
  KnowledgeBaseQuery,
  KnowledgeBaseResult,
} from './amc-knowledge-base'
