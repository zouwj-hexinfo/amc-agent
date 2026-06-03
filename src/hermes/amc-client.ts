/**
 * AMC评估客户端
 * 基于HermesClient包装的AMC特定评估API客户端
 */

import { HermesClient } from './client'
import type { StartAnalysisRequest } from './types'
import type { AmcEvaluationEvent } from './amc-agents'

export type KnowledgeBaseQuery = {
  keywords: string[]
  category?: string
  limit?: number
  minRelevance?: number
}

// ===== AMC评估请求类型 =====

export type StartAmcEvaluationRequest = {
  assetId: string
  assetType: string
  assetValue: number
  debtAmount?: number
  debtorInfo?: Record<string, unknown>
  evaluationDimensions?: Array<'legal_dimension' | 'risk_dimension' | 'valuation_dimension' | 'industry_dimension'>
  reportFormat?: 'executive_summary' | 'detailed_analysis' | 'investment_memo' | 'regulatory_filing'
  knowledgeBasesToUse?: string[]
}

export type AmcEvaluationOptions = {
  maxRetries?: number
  retryDelayMs?: (count: number) => number
  timeout?: number
  enableConflictResolution?: boolean
}

// ===== AMC评估客户端 =====

export class AmcEvaluationClient {
  private baseUrl: string
  private hermesClient: HermesClient
  private evaluationSubscriptions: Map<string, () => void> = new Map()

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.hermesClient = new HermesClient(baseUrl)
  }

  /**
   * 启动不良资产评估
   */
  async startEvaluation(request: StartAmcEvaluationRequest) {
    try {
      // 构建内部分析请求
      const analysisRequest: StartAnalysisRequest = {
        company: request.assetType,
        year: new Date().getFullYear(),
        reportType: request.reportFormat || 'detailed_analysis',
        request: `评估资产 ${request.assetId}（${request.assetType}，价值¥${request.assetValue}）`,
      }

      // 启动Hermes分析
      const response = await this.hermesClient.startAnalysis(analysisRequest)

      // 发送资产收取事件
      await this.sendEvent(response.analysisId, {
        type: 'amc.asset.intake',
        assetId: request.assetId,
        assetType: request.assetType,
        assetValue: request.assetValue,
        debtAmount: request.debtAmount,
        debtorInfo: request.debtorInfo,
      })

      return {
        evaluationId: response.analysisId,
        status: 'started',
        assetId: request.assetId,
      }
    } catch (error) {
      throw new Error(`启动AMC评估失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 订阅评估事件流
   */
  subscribeToEvaluationEvents(
    evaluationId: string,
    options?: {
      onEvent?: (event: AmcEvaluationEvent) => void
      onComplete?: () => void
      onError?: (error: Error) => void
      maxRetries?: number
    }
  ) {
    const unsubscribe = this.hermesClient.subscribeToAnalysisEvents(evaluationId, {
      onEvent: (event) => {
        options?.onEvent?.(event as AmcEvaluationEvent)
      },
      onComplete: options?.onComplete,
      onError: options?.onError,
      maxRetries: options?.maxRetries,
    })

    // 保存订阅以便后续清理
    this.evaluationSubscriptions.set(evaluationId, unsubscribe)

    return unsubscribe
  }

  /**
   * 发送评估事件（用于事件驱动的工作流）
   */
  async sendEvent(evaluationId: string, event: AmcEvaluationEvent) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/analysis/${evaluationId}/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        }
      )

      if (!response.ok) {
        throw new Error(`发送事件失败: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`发送AMC事件失败:`, error)
      throw error
    }
  }

  /**
   * 加载评估结果
   */
  async loadEvaluation(evaluationId: string) {
    try {
      const result = await this.hermesClient.loadAnalysis(evaluationId)
      return {
        evaluation: result.analysis,
        eventCount: result.eventCount,
      }
    } catch (error) {
      throw new Error(`加载评估结果失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取评估报告
   */
  async getEvaluationReport(
    evaluationId: string,
    format: 'executive_summary' | 'detailed_analysis' | 'investment_memo' | 'regulatory_filing' = 'detailed_analysis'
  ) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/analysis/${evaluationId}/report?format=${format}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      )

      if (!response.ok) {
        throw new Error(`获取报告失败: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`获取评估报告失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 查询知识库
   */
  async queryKnowledgeBase(knowledgeBase: string, query: KnowledgeBaseQuery) {
    try {
      const params = new URLSearchParams();
      if (query.category || knowledgeBase) params.set('category', query.category || knowledgeBase);
      if (query.keywords.length) params.set('q', query.keywords.join(' '));
      const response = await fetch(`${this.baseUrl}/api/knowledge?${params.toString()}`);
      if (!response.ok) throw new Error(`知识库查询失败: ${response.statusText}`);
      const results = await response.json();
      const limited = Array.isArray(results) ? results.slice(0, query.limit || 10) : [];
      return {
        query,
        source: knowledgeBase,
        results: limited,
        totalResults: Array.isArray(results) ? results.length : 0,
        executionTime: 0,
      };
    } catch (error) {
      throw new Error(`知识库查询失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取企业信息
   */
  async queryEnterpriseInfo(enterpriseId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/qcc?query=${encodeURIComponent(enterpriseId)}`)
      if (!response.ok) throw new Error(`企查查查询失败: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      throw new Error(`企业信息查询失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取市场数据
   */
  async getMarketData(symbols: string[], metrics?: string[]) {
    try {
      const results = await Promise.all(symbols.map(async symbol => {
        const response = await fetch(`${this.baseUrl}/api/stock?query=${encodeURIComponent(symbol)}`)
        if (!response.ok) throw new Error(`股票数据查询失败: ${response.statusText}`)
        return await response.json()
      }))
      return { symbols, metrics, results }
    } catch (error) {
      throw new Error(`市场数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 搜索相似法律案例
   */
  async searchLegalCases(query: string, limit = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge?category=cases&q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error(`法律案例搜索失败: ${response.statusText}`)
      const results = await response.json()
      return { query, limit, results: Array.isArray(results) ? results.slice(0, limit) : [] }
    } catch (error) {
      throw new Error(`法律案例搜索失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取行业报告
   */
  async getIndustryReports(industry: string, reportType?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge?category=industry&q=${encodeURIComponent(industry)}`)
      if (!response.ok) throw new Error(`行业报告获取失败: ${response.statusText}`)
      const results = await response.json()
      return { industry, reportType, results }
    } catch (error) {
      throw new Error(`行业报告获取失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取知识库列表
   */
  listKnowledgeBases() {
    return [
      { id: 'policies', name: '政策法规库', categories: ['政策法规'] },
      { id: 'legal', name: '法律知识库', categories: ['法律审查'] },
      { id: 'market', name: '市场数据库', categories: ['市场行情'] },
      { id: 'cases', name: '案例数据库', categories: ['处置案例'] },
      { id: 'methodology', name: '评估方法库', categories: ['估值方法'] },
      { id: 'internal_policies', name: '内规制度库', categories: ['内部制度'] },
      { id: 'industry', name: '行业知识库', categories: ['行业研究'] },
      { id: 'feedback', name: '反馈知识库', categories: ['报告反馈'] },
    ]
  }

  /**
   * 发送对话消息
   */
  async sendMessage(conversationId: string | null, evaluationId: string, message: string) {
    try {
      return await this.hermesClient.sendMessage(conversationId, evaluationId, message)
    } catch (error) {
      throw new Error(`发送消息失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 订阅对话流
   */
  subscribeToComposerStream(
    conversationId: string | null,
    evaluationId: string,
    message: string,
    callbacks?: {
      onDelta?: (text: string) => void
      onComplete?: (reply: string) => void
      onError?: (error: Error) => void
    }
  ) {
    return this.hermesClient.subscribeToComposerStream(
      conversationId,
      evaluationId,
      message,
      callbacks
    )
  }

  /**
   * 清理资源
   */
  cleanup(evaluationId?: string) {
    if (evaluationId) {
      const unsubscribe = this.evaluationSubscriptions.get(evaluationId)
      if (unsubscribe) {
        unsubscribe()
        this.evaluationSubscriptions.delete(evaluationId)
      }
    } else {
      // 清理所有订阅
      this.evaluationSubscriptions.forEach(unsubscribe => unsubscribe())
      this.evaluationSubscriptions.clear()
    }
  }
}
