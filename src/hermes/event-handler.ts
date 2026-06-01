/**
 * Hermes Event Handler
 * 分析事件的状态机和事件处理逻辑
 */

import type {
  AnalysisState,
  AnalysisEvent,
  AnalysisAgent,
  TimelineEntry,
  AnalysisArtifact,
  ReportSection,
  Evidence,
} from './types'

// ===== 预定义Agent =====
export const financialAnalysisAgents: AnalysisAgent[] = [
  {
    id: 'orchestrator',
    name: '智能助手',
    role: '构建研究逻辑树、动态调度分析资源、监控报告合规性',
    status: 'pending',
    action: '等待智能分析服务响应',
    progress: 0,
    outputCount: 0,
  },
  {
    id: 'research',
    name: '资料检索员',
    role: '多源对齐财报基准数据、深度匹配外部投研资料',
    status: 'pending',
    action: '等待多源数据接入',
    progress: 0,
    outputCount: 0,
  },
  {
    id: 'notes',
    name: '附注解析员',
    role: '穿透式解析财报附注、关联非结构化证据片段',
    status: 'pending',
    action: '等待结构化解析',
    progress: 0,
    outputCount: 0,
  },
  {
    id: 'finance',
    name: '财务解读员',
    role: '量化核心财务指标、穿透异常波动底层归因',
    status: 'pending',
    action: '等待指标建模',
    progress: 0,
    outputCount: 0,
  },
  {
    id: 'audit',
    name: '风险审计员',
    role: '执行交叉验证程序、采纳并标注合规性证据',
    status: 'pending',
    action: '等待证据审计',
    progress: 0,
    outputCount: 0,
  },
  {
    id: 'report',
    name: '研报撰写员',
    role: '编排动态投研报告、随研究进度增量沉淀洞察',
    status: 'pending',
    action: '等待研报沉淀',
    progress: 0,
    outputCount: 0,
  },
]

// ===== 初始化 =====
export function createInitialAnalysisState(id: string): AnalysisState {
  return {
    id,
    status: 'planning',
    plan: '',
    timeline: [{ message: '智能助手正在构建研究思路并调度分析角色', agentId: 'orchestrator' }],
    agents: [],
    sections: [],
    evidenceByFinding: {},
  }
}

// ===== 状态判断 =====
export function shouldOpenAnalysisEventStream(state: AnalysisState | null, activeAnalysisId: string | null) {
  if (!state) return false
  if (state.status === 'completed' || state.status === 'failed' || state.status === 'waiting_action') return false
  return activeAnalysisId !== state.id
}

export function shouldRetryAnalysisEventStream(state: AnalysisState | null, retryCount: number, maxRetries = 6) {
  if (!state) return false
  if (state.status === 'completed' || state.status === 'failed' || state.status === 'waiting_action' || state.status === 'stream_interrupted') return false
  return retryCount < maxRetries
}

export function shouldQueueComposerMessage(state: AnalysisState | null) {
  return state?.status === 'planning' || state?.status === 'running' || state?.status === 'waiting_action'
}

// ===== 工具函数 =====
function upsertById<T extends { id: string }>(items: T[], next: T) {
  const exists = items.some(item => item.id === next.id)
  return exists ? items.map(item => item.id === next.id ? next : item) : [...items, next]
}

function appendArtifact(items: AnalysisArtifact[] = [], next: AnalysisArtifact) {
  const exists = items.some(item => item.id === next.id || (item.label === next.label && item.agentId === next.agentId))
  return exists ? items : [...items, next]
}

function appendTimeline(items: TimelineEntry[], next: TimelineEntry) {
  const last = items.at(-1)
  if (last?.type === 'hermes.output.delta' && next.type === 'hermes.output.delta') {
    const snippet = joinStreamFragments(last.snippet ?? '', next.snippet ?? '')
    return [...items.slice(0, -1), { ...last, ...next, snippet }]
  }
  if (last?.message === next.message && last.agentId === next.agentId && last.type === next.type && last.snippet === next.snippet) return items
  return [...items, next]
}

function joinStreamFragments(left: string, right: string) {
  if (!left) return right
  if (!right) return left
  if (/\s$/.test(left) || /^\s/.test(right)) return `${left}${right}`
  if (/^[,.;:!?，。；：！？、)\]}]/.test(right)) return `${left}${right}`
  if (/[(\[{]$/.test(left)) return `${left}${right}`
  if (/[A-Za-z0-9]$/.test(left) && /^[A-Za-z0-9]/.test(right)) return `${left} ${right}`
  return `${left}${right}`
}

function updateAgent(
  state: AnalysisState,
  agentId: string,
  patch: Partial<AnalysisAgent>,
  timelineEntry?: string | TimelineEntry,
): AnalysisState {
  const nextTimelineEntry = typeof timelineEntry === 'string'
    ? { message: timelineEntry, agentId }
    : timelineEntry

  return {
    ...state,
    agents: state.agents.map(agent => agent.id === agentId ? { ...agent, ...patch } : agent),
    timeline: nextTimelineEntry ? appendTimeline(state.timeline, nextTimelineEntry) : state.timeline,
  }
}

function agentName(state: AnalysisState, agentId: string) {
  return state.agents.find(agent => agent.id === agentId)?.name ?? agentId
}

// ===== 核心事件处理器 =====
/**
 * 分析事件的状态机处理
 * 根据事件类型更新分析状态
 */
export function reduceAnalysisEvent(state: AnalysisState, event: AnalysisEvent): AnalysisState {
  switch (event.type) {
    case 'hermes.run.started':
      if (state.runId === event.runId && state.agents.length > 0) {
        return {
          ...state,
          status: state.status === 'failed' ? state.status : 'running',
          runStatus: event.status,
          requiredAction: undefined,
          plan: state.plan || `正在组织研究流程：${event.input}`,
          timeline: appendTimeline(state.timeline, {
            message: '分析任务已启动',
            agentId: 'orchestrator',
            type: event.type,
            status: event.status,
          }),
        }
      }
      return {
        ...state,
        status: 'running',
        runId: event.runId,
        runStatus: event.status,
        requiredAction: undefined,
        plan: `正在组织研究流程：${event.input}`,
        agents: financialAnalysisAgents.map(agent => (
          agent.id === 'orchestrator'
            ? { ...agent, status: 'running', action: '正在组织研究流程', progress: 20 }
            : agent
        )),
        timeline: appendTimeline(state.timeline, {
          message: '分析任务已启动',
          agentId: 'orchestrator',
          type: event.type,
          status: event.status,
        }),
      }

    case 'hermes.output.delta':
      {
        const agentId = event.agentId ?? 'orchestrator'
        const patch = {
          status: 'running' as const,
          action: '实时同步中...',
          progress: Math.max(state.agents.find(agent => agent.id === agentId)?.progress ?? 0, 25),
          outputCount: (state.agents.find(agent => agent.id === agentId)?.outputCount ?? 0) + 1,
        }
        return updateAgent(state, agentId, patch, {
          message: '实时进展',
          agentId,
          type: event.type,
          snippet: event.text,
        })
      }

    case 'hermes.run.completed': {
      const nextState = {
        ...state,
        status: 'completed' as const,
        runStatus: 'completed',
        error: undefined,
        requiredAction: undefined,
        sections: upsertById(state.sections, {
          id: 'hermes-final-report',
          title: '最终报告',
          summary: '分析完成后输出的最终报告。',
          items: [event.output],
        }),
        artifacts: appendArtifact(state.artifacts, {
          id: `hermes-final-${state.runId ?? state.id}`,
          label: event.output,
          agentId: 'report',
          status: 'completed',
          snippet: event.output,
          progress: 100,
        }),
        timeline: appendTimeline(state.timeline, {
          message: '分析任务已完成',
          agentId: 'orchestrator',
          type: event.type,
          status: 'completed',
          snippet: event.output,
          progress: 100,
        }),
      }
      return {
        ...nextState,
        agents: nextState.agents.map(agent => ({
          ...agent,
          status: agent.status === 'failed' ? agent.status : 'completed',
          progress: agent.status === 'failed' ? agent.progress : 100,
        })),
      }
    }

    case 'plan.created':
      return {
        ...state,
        status: 'running',
        plan: event.plan,
        timeline: appendTimeline(state.timeline, {
          message: '智能助手已生成分析计划与研究路径',
          agentId: 'orchestrator',
          type: event.type,
        }),
        agents: event.agents.map(agent => ({
          ...agent,
          status: 'pending' as const,
          action: '正在构建逻辑树...',
          progress: 0,
          outputCount: 0,
        })),
      }

    case 'agent.started':
      return updateAgent(state, event.agentId, {
        status: 'running',
        action: event.action,
        progress: 8,
      }, {
        message: `${agentName(state, event.agentId)} 开始工作：${event.action}`,
        agentId: event.agentId,
        type: event.type,
        snippet: event.snippet,
      })

    case 'agent.progress':
      return updateAgent(state, event.agentId, {
        status: event.progress >= 100 ? 'completed' : 'running',
        action: event.action,
        progress: event.progress,
        outputCount: event.outputCount,
      }, {
        message: event.action,
        agentId: event.agentId,
        type: event.type,
        progress: event.progress,
        snippet: event.snippet,
      })

    case 'artifact.created':
      return {
        ...state,
        artifacts: appendArtifact(state.artifacts, {
          id: `artifact-${state.artifacts?.length ?? 0}-${event.label}`,
          label: event.label,
          agentId: event.agentId,
          snippet: event.label,
        }),
        timeline: appendTimeline(state.timeline, {
          message: event.label,
          agentId: event.agentId,
          type: event.type,
          snippet: event.label,
        }),
      }

    case 'report.section.updated':
      return {
        ...state,
        sections: upsertById(state.sections, event.section),
        timeline: appendTimeline(state.timeline, {
          message: `研报撰写角色更新「${event.section.title}」`,
          agentId: 'report',
        }),
      }

    case 'audit.checked':
      return {
        ...state,
        evidenceByFinding: {
          ...state.evidenceByFinding,
          [event.findingId]: event.evidence,
        },
        timeline: appendTimeline(state.timeline, {
          message: `风险审计员已采纳 ${event.evidence.title} 并标注合规性证据`,
          agentId: 'audit',
        }),
      }

    case 'analysis.completed':
      return {
        ...state,
        status: 'completed',
        error: undefined,
        requiredAction: undefined,
        agents: state.agents.map(agent => {
          if (agent.status === 'failed') return agent
          return {
            ...agent,
            status: 'completed' as const,
            progress: 100,
            action: agent.action === '等待调度' ? '完成任务调度' : agent.action,
          }
        }),
        timeline: appendTimeline(state.timeline, {
          message: '全流程分析已闭合，合规证据已锁定',
          agentId: 'report',
        }),
      }

    case 'analysis.requires_action':
      return {
        ...state,
        status: 'waiting_action',
        runStatus: 'requires_action',
        requiredAction: {
          message: event.message,
          agentId: event.agentId,
          toolName: event.toolName,
        },
        agents: event.agentId
          ? state.agents.map(agent => agent.id === event.agentId ? { ...agent, status: 'running', action: '等待用户授权继续' } : agent)
          : state.agents,
        timeline: appendTimeline(state.timeline, {
          message: event.message,
          agentId: event.agentId,
          type: event.type,
          status: 'requires_action',
          toolName: event.toolName,
        }),
      }

    case 'analysis.stream_interrupted':
      return {
        ...state,
        status: 'stream_interrupted',
        runStatus: 'running',
        requiredAction: undefined,
        error: event.message,
        timeline: appendTimeline(state.timeline, {
          message: event.message,
          agentId: 'orchestrator',
          type: event.type,
          status: 'stream_interrupted',
        }),
      }

    case 'analysis.failed':
      return {
        ...state,
        status: 'failed',
        runStatus: 'failed',
        requiredAction: undefined,
        error: event.message,
        agents: event.agentId
          ? state.agents.map(agent => agent.id === event.agentId ? { ...agent, status: 'failed', action: event.message } : agent)
          : state.agents,
        timeline: appendTimeline(state.timeline, {
          message: event.message,
          agentId: event.agentId,
        }),
      }

    default:
      return state
  }
}
