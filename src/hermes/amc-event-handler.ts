/**
 * AMC不良资产评估事件处理器
 * 适配Hermes框架的AMC评估工作流事件处理和状态机逻辑
 */

import type { AnalysisState, TimelineEntry } from './types'
import type { AmcEvaluationEvent, AmcAgentId } from './amc-agents'
import { amcEvaluationAgents } from './amc-agents'

// ===== 类型定义 =====

export type AmcEvaluationStatus =
  | 'idle'                    // 等待资产信息
  | 'intake'                  // 资产信息已收取
  | 'evaluating'              // 评估中
  | 'conflict_resolution'     // 冲突解决中
  | 'generating_report'       // 生成报告中
  | 'completed'               // 完成
  | 'failed'                  // 失败

export type AmcEvaluationState = {
  id: string
  evaluationId: string
  status: AmcEvaluationStatus

  // 资产信息
  asset: {
    id: string
    type: string
    value: number
    debtAmount?: number
    debtorInfo?: Record<string, unknown>
  } | null

  // 评估维度结果
  dimensions: {
    legal?: {
      ownershipStatus: string
      legalObstacles: string[]
      litigationRisk: string
      complianceIssues: string[]
      recommendations: string
    }
    risk?: {
      creditRisk: string
      marketRisk: string
      liquidityRisk: string
      riskMitigation: string[]
    }
    valuation?: {
      valuationMethods: string[]
      liquidationValue: number
      marketValue: number
      mortgageRate: number
      valuationReport: string
    }
    industry?: {
      industryTrend: string
      competitivePosition: string
      marketOutlook: string
      recommendedAction: string
    }
  }

  // 综合评估结果
  comprehensive?: {
    overallRating: string
    suggestedPrice: number
    recoveryRate: number
    riskScore: number
    disposalRecommendation: string
  }

  // 冲突信息
  conflicts?: Array<{
    agents: string[]
    issue: string
    resolution: string
  }>

  // 报告
  report?: {
    format: string
    content: string
    generatedAt: string
  }

  // Agent状态
  agents: AnalysisState['agents']

  // 时间线
  timeline: TimelineEntry[]

  // 错误信息
  error?: string

  // 评估统计
  stats: {
    startedAt: string
    completedAt?: string
    agentOutputCount: Record<AmcAgentId, number>
  }
}

// ===== 初始化 =====

export function createInitialAmcEvaluationState(evaluationId: string, asset: {
  id: string
  type: string
  value: number
  debtAmount?: number
  debtorInfo?: Record<string, unknown>
}): AmcEvaluationState {
  return {
    id: `amc-eval-${Date.now()}`,
    evaluationId,
    status: 'intake',
    asset,
    dimensions: {},
    agents: amcEvaluationAgents.map(agent => ({
      ...agent,
      status: 'pending' as const,
      action: '等待任务分配',
      progress: 0,
      outputCount: 0,
    })),
    timeline: [{
      message: '资产评估编排器已启动，等待评估任务分配',
      agentId: 'orchestrator',
    }],
    stats: {
      startedAt: new Date().toISOString(),
      agentOutputCount: {
        orchestrator: 0,
        legal_reviewer: 0,
        risk_assessor: 0,
        valuation_auditor: 0,
        industry_analyst: 0,
      },
    },
  }
}

// ===== 状态判断 =====

export function shouldOpenAmcEvaluationStream(state: AmcEvaluationState | null) {
  if (!state) return false
  if (state.status === 'completed' || state.status === 'failed') return false
  return true
}

export function shouldRetryAmcEvaluationStream(state: AmcEvaluationState | null, retryCount: number, maxRetries = 6) {
  if (!state) return false
  if (state.status === 'completed' || state.status === 'failed') return false
  return retryCount < maxRetries
}

// ===== 工具函数 =====

function updateAgent(
  state: AmcEvaluationState,
  agentId: AmcAgentId,
  patch: Partial<AnalysisState['agents'][0]>,
  timelineEntry?: string | TimelineEntry,
): AmcEvaluationState {
  const nextTimelineEntry = typeof timelineEntry === 'string'
    ? { message: timelineEntry, agentId }
    : timelineEntry

  return {
    ...state,
    agents: state.agents.map(agent => agent.id === agentId ? { ...agent, ...patch } : agent),
    timeline: nextTimelineEntry ? appendTimeline(state.timeline, nextTimelineEntry) : state.timeline,
  }
}

function appendTimeline(items: TimelineEntry[], next: TimelineEntry) {
  const last = items.at(-1)
  if (last?.message === next.message && last.agentId === next.agentId && last.type === next.type) return items
  return [...items, next]
}

function agentName(state: AmcEvaluationState, agentId: AmcAgentId) {
  return state.agents.find(agent => agent.id === agentId)?.name ?? agentId
}

// ===== 核心事件处理器 =====

/**
 * AMC评估事件的状态机处理
 * 根据事件类型更新评估状态
 */
export function reduceAmcEvaluationEvent(
  state: AmcEvaluationState,
  event: AmcEvaluationEvent
): AmcEvaluationState {
  switch (event.type) {
    case 'amc.asset.intake':
      return {
        ...state,
        status: 'evaluating',
        asset: {
          id: event.assetId,
          type: event.assetType,
          value: event.assetValue,
          debtAmount: event.debtAmount,
          debtorInfo: event.debtorInfo,
        },
        agents: state.agents.map(agent => (
          agent.id === 'orchestrator'
            ? { ...agent, status: 'running' as const, action: '正在分解评估任务', progress: 15 }
            : agent
        )),
        timeline: appendTimeline(state.timeline, {
          message: `资产已收取：${event.assetType}（价值: ¥${event.assetValue}）`,
          agentId: 'orchestrator',
          type: event.type,
        }),
      }

    case 'amc.legal_review.completed': {
      const nextState = updateAgent(state, event.agentId, {
        status: 'completed',
        action: '法律审查完成',
        progress: 100,
      }, {
        message: '法律审查完成',
        agentId: event.agentId,
        type: event.type,
        snippet: `诉讼风险: ${event.findings.litigationRisk}`,
      })
      return {
        ...nextState,
        dimensions: {
          ...nextState.dimensions,
          legal: event.findings,
        },
        stats: {
          ...nextState.stats,
          agentOutputCount: {
            ...nextState.stats.agentOutputCount,
            legal_reviewer: (nextState.stats.agentOutputCount.legal_reviewer ?? 0) + 1,
          },
        },
      }
    }

    case 'amc.risk_assessment.completed': {
      const nextState = updateAgent(state, event.agentId, {
        status: 'completed',
        action: '风险评估完成',
        progress: 100,
      }, {
        message: '风险评估完成',
        agentId: event.agentId,
        type: event.type,
        snippet: `信用风险: ${event.findings.creditRisk}`,
      })
      return {
        ...nextState,
        dimensions: {
          ...nextState.dimensions,
          risk: event.findings,
        },
        stats: {
          ...nextState.stats,
          agentOutputCount: {
            ...nextState.stats.agentOutputCount,
            risk_assessor: (nextState.stats.agentOutputCount.risk_assessor ?? 0) + 1,
          },
        },
      }
    }

    case 'amc.valuation_analysis.completed': {
      const nextState = updateAgent(state, event.agentId, {
        status: 'completed',
        action: '估值分析完成',
        progress: 100,
      }, {
        message: '估值分析完成',
        agentId: event.agentId,
        type: event.type,
        snippet: `市场价值: ¥${event.findings.marketValue}`,
      })
      return {
        ...nextState,
        dimensions: {
          ...nextState.dimensions,
          valuation: event.findings,
        },
        stats: {
          ...nextState.stats,
          agentOutputCount: {
            ...nextState.stats.agentOutputCount,
            valuation_auditor: (nextState.stats.agentOutputCount.valuation_auditor ?? 0) + 1,
          },
        },
      }
    }

    case 'amc.industry_analysis.completed': {
      const nextState = updateAgent(state, event.agentId, {
        status: 'completed',
        action: '行业分析完成',
        progress: 100,
      }, {
        message: '行业分析完成',
        agentId: event.agentId,
        type: event.type,
        snippet: `行业趋势: ${event.findings.industryTrend}`,
      })
      return {
        ...nextState,
        dimensions: {
          ...nextState.dimensions,
          industry: event.findings,
        },
        stats: {
          ...nextState.stats,
          agentOutputCount: {
            ...nextState.stats.agentOutputCount,
            industry_analyst: (nextState.stats.agentOutputCount.industry_analyst ?? 0) + 1,
          },
        },
      }
    }

    case 'amc.comprehensive_evaluation':
      return {
        ...state,
        comprehensive: {
          overallRating: event.overallRating,
          suggestedPrice: event.suggestedPrice,
          recoveryRate: event.recoveryRate,
          riskScore: event.riskScore,
          disposalRecommendation: event.disposalRecommendation,
        },
        agents: state.agents.map(agent => agent.id === 'orchestrator'
          ? { ...agent, status: 'running' as const, action: '综合评估完成，生成报告中', progress: 85 }
          : agent
        ),
        timeline: appendTimeline(state.timeline, {
          message: `综合评估完成：${event.overallRating}，建议价格: ¥${event.suggestedPrice}`,
          agentId: 'orchestrator',
          type: event.type,
        }),
      }

    case 'amc.conflict_detected':
      return {
        ...state,
        status: 'conflict_resolution',
        conflicts: event.conflicts,
        agents: state.agents.map(agent => agent.id === 'orchestrator'
          ? { ...agent, status: 'running' as const, action: '检测到评估冲突，正在解决', progress: 70 }
          : agent
        ),
        timeline: appendTimeline(state.timeline, {
          message: `检测到 ${event.conflicts.length} 个评估冲突，正在协调解决`,
          agentId: 'orchestrator',
          type: event.type,
        }),
      }

    case 'amc.report.generated':
      return {
        ...state,
        status: 'generating_report',
        report: {
          format: event.reportFormat,
          content: event.reportContent,
          generatedAt: new Date().toISOString(),
        },
        agents: state.agents.map(agent => agent.id === 'orchestrator'
          ? { ...agent, status: 'completed' as const, action: '评估报告已生成', progress: 100 }
          : agent
        ),
        timeline: appendTimeline(state.timeline, {
          message: `${event.reportFormat} 格式报告已生成`,
          agentId: 'orchestrator',
          type: event.type,
        }),
      }

    case 'analysis.completed':
      return {
        ...state,
        status: 'completed',
        error: undefined,
        stats: {
          ...state.stats,
          completedAt: new Date().toISOString(),
        },
        agents: state.agents.map(agent => ({
          ...agent,
          status: 'completed' as const,
          progress: 100,
        })),
        timeline: appendTimeline(state.timeline, {
          message: '不良资产评估已完成，所有维度评估已闭合',
          agentId: 'orchestrator',
        }),
      }

    case 'analysis.failed':
      return {
        ...state,
        status: 'failed',
        error: 'message' in event ? event.message : '评估失败',
        agents: ('agentId' in event && event.agentId)
          ? state.agents.map(agent => agent.id === event.agentId ? { ...agent, status: 'failed' as const } : agent)
          : state.agents,
        timeline: appendTimeline(state.timeline, {
          message: 'message' in event ? event.message : '评估失败',
          agentId: 'agentId' in event ? event.agentId : 'orchestrator',
        }),
      }

    default:
      return state
  }
}
