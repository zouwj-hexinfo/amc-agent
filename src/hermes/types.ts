/**
 * Hermes Integration Types
 * 财务分析多Agent协作框架的事件和状态类型定义
 */

// ===== 分析状态 =====
export type AnalysisStatus = 'idle' | 'planning' | 'running' | 'waiting_action' | 'stream_interrupted' | 'completed' | 'failed'
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed'
export type AuditStatus = '已核验' | '待核验' | '口径冲突'

// ===== Agent相关 =====
export type AnalysisAgent = {
  id: string
  name: string
  role: string
  status: AgentStatus
  action: string
  progress: number
  outputCount: number
}

// ===== 工件和证据 =====
export type AnalysisArtifact = {
  id: string
  label: string
  agentId?: string
  status?: string
  snippet?: string
  progress?: number
}

export type Evidence = {
  id: string
  page: number
  source: string
  title: string
  excerpt: string
  status: AuditStatus
}

export type ReportSection = {
  id: string
  title: string
  items: string[]
  summary?: string
}

// ===== Timeline事件 =====
export type TimelineEntry = {
  message: string
  agentId?: string
  type?: string
  status?: string
  timestamp?: string
  toolName?: string
  snippet?: string
  progress?: number
}

// ===== Hermes事件类型 =====
export type AnalysisEvent =
  | {
      type: 'plan.created'
      plan: string
      agents: Array<{ id: string; name: string; role: string }>
    }
  | { type: 'agent.started'; agentId: string; action: string; snippet?: string }
  | { type: 'agent.progress'; agentId: string; action: string; progress: number; outputCount: number; snippet?: string }
  | { type: 'artifact.created'; agentId?: string; label: string }
  | { type: 'audit.checked'; findingId: string; status: 'verified' | 'pending' | 'conflict'; evidence: Evidence }
  | { type: 'report.section.updated'; section: ReportSection }
  | { type: 'hermes.run.started'; runId: string; status: string; input: string }
  | { type: 'hermes.tool.progress'; toolName: string; label: string }
  | { type: 'hermes.output.delta'; text: string; agentId?: string }
  | { type: 'hermes.run.completed'; output: string }
  | { type: 'analysis.requires_action'; agentId?: string; message: string; toolName?: string }
  | { type: 'analysis.stream_interrupted'; message: string }
  | { type: 'analysis.completed' }
  | { type: 'analysis.failed'; agentId?: string; message: string }

// ===== 分析状态 =====
export type AnalysisState = {
  id: string
  status: AnalysisStatus
  runId?: string
  runStatus?: string
  plan: string
  timeline: TimelineEntry[]
  agents: AnalysisAgent[]
  sections: ReportSection[]
  evidenceByFinding: Record<string, Evidence>
  artifacts?: AnalysisArtifact[]
  error?: string
  requiredAction?: {
    message: string
    agentId?: string
    toolName?: string
  }
}

// ===== SSE事件 =====
export type SequencedSseAnalysisEvent = {
  sequence?: number
  event: AnalysisEvent
}

// ===== Agent工作区 =====
export type WorkspaceSource = {
  id: string
  title: string
  source: string
  page?: number
  status?: AuditStatus
  excerpt?: string
}

export type WorkspaceGap = {
  id: string
  label: string
  detail?: string
}

export type WorkspaceDraftFinding = {
  id: string
  title: string
  detail?: string
  evidenceIds?: string[]
}

export type AgentWorkspaceModel = {
  agentId: string
  title: string
  sources: WorkspaceSource[]
  gaps: WorkspaceGap[]
  draftFindings: WorkspaceDraftFinding[]
}

// ===== Agent控制台 =====
export type AgentConsoleTraceKind = 'search' | 'read' | 'tool' | 'artifact' | 'finding' | 'blocker'
export type AgentConsoleTaskStatus = 'pending' | 'waiting' | 'running' | 'blocked' | 'completed' | 'failed'

export type AgentConsoleTraceItem = {
  id: string
  kind: AgentConsoleTraceKind
  label: string
  detail?: string
  timestamp?: string
  evidenceIds?: string[]
}

export type AgentConsoleTask = {
  id: string
  agentId: string
  title: string
  status: AgentConsoleTaskStatus
  goal: string
  progress?: number
  outputCount?: number
  summary?: string
  trace: AgentConsoleTraceItem[]
  workspace: AgentWorkspaceModel
}

// ===== 里程碑 =====
export type WorkbenchMilestoneState = 'pending' | 'active' | 'completed'
export type WorkbenchFocusMode = 'process' | 'report'

export type WorkbenchMilestone = {
  id: 'plan' | 'research' | 'recognition' | 'analysis' | 'audit' | 'report'
  label: string
  state: WorkbenchMilestoneState
}

// ===== API请求/响应 =====
export type StartAnalysisRequest = {
  company: string
  year: number
  reportType: string
  request: string
  uploads?: Array<{ uploadId: string; fileName: string; mimeType: string; size: number }>
}

export type StartAnalysisResponse = {
  analysisId: string
  eventCount?: number
}

export type RequiredAction = {
  message: string
  agentId?: string
  toolName?: string
}
