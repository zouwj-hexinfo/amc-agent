/**
 * AMC知识库管理模块
 * 管理7个不良资产评估专业知识库的访问和检索
 */

import type { AmcKnowledgeBase, AmcExternalDataSource } from './amc-agents'

// ===== 知识库类型定义 =====

export type KnowledgeEntry = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  source: string
  updatedAt: string
  relevanceScore?: number
}

export type KnowledgeBaseQuery = {
  keywords: string[]
  category?: string
  limit?: number
  minRelevance?: number
}

export type KnowledgeBaseResult = {
  query: KnowledgeBaseQuery
  source: AmcKnowledgeBase
  results: KnowledgeEntry[]
  totalResults: number
  executionTime: number
}

// ===== AMC知识库配置 =====

const knowledgeBaseConfig: Record<AmcKnowledgeBase, {
  name: string
  description: string
  categories: string[]
}> = {
  policy_regulations: {
    name: '政策法规库',
    description: '国家级政策法规、行业监管要求、不良资产处置相关规定',
    categories: ['银行法规', '不良资产处置', '风险管理', '披露要求', '监管指引'],
  },
  legal_knowledge: {
    name: '法律知识库',
    description: '法律条款、判例法律、合同法、担保法、执行法等专业法律知识',
    categories: ['合同法', '担保法', '执行法', '知识产权', '企业法'],
  },
  market_data: {
    name: '市场数据库',
    description: '行业市场数据、资产类别基准价格、市场行情数据',
    categories: ['房产价格', '机械设备', '股权价格', '行业对标', '市场指数'],
  },
  case_study: {
    name: '案例数据库',
    description: '不良资产处置案例、风险案例、成功案例，用于参考对标',
    categories: ['处置案例', '风险案例', '成功案例', '处置价格', '处置周期'],
  },
  valuation_methods: {
    name: '评估方法库',
    description: '资产估值方法、评估模型、计算公式、行业通用做法',
    categories: ['成本法', '市场法', '收益法', '清算价值', '抵押率计算'],
  },
  internal_guidelines: {
    name: '内规制度库',
    description: '公司内部制度、评估标准、风险等级划分、决策流程',
    categories: ['评估标准', '风险等级', '决策流程', '审批权限', '披露标准'],
  },
  industry_knowledge: {
    name: '行业知识库',
    description: '行业趋势分析、竞争格局研究、市场前景预判、行业指标',
    categories: ['行业趋势', '竞争分析', '市场前景', '行业指标', '风险因素'],
  },
}

// ===== 知识库客户端 =====

export class AmcKnowledgeBaseClient {
  private baseUrl: string
  private mockData: Map<AmcKnowledgeBase, KnowledgeEntry[]> = new Map()

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.initializeMockData()
  }

  /**
   * 初始化模拟数据（用于开发和测试）
   */
  private initializeMockData() {
    // 政策法规库示例
    this.mockData.set('policy_regulations', [
      {
        id: 'policy-001',
        title: '商业银行不良贷款认定标准',
        content: '根据银监会规定，贷款分为正常、关注、次级、可疑和损失五类...',
        category: '银行法规',
        tags: ['不良贷款', '认定标准', '分类'],
        source: '中国银行监督管理委员会',
        updatedAt: '2025-12-01',
      },
      {
        id: 'policy-002',
        title: '不良资产处置管理办法',
        content: '规定了不良资产的定义、分类、处置方式、披露要求等...',
        category: '不良资产处置',
        tags: ['不良资产', '处置', '监管'],
        source: '财政部',
        updatedAt: '2025-11-15',
      },
    ])

    // 法律知识库示例
    this.mockData.set('legal_knowledge', [
      {
        id: 'legal-001',
        title: '担保物权的实现程序',
        content: '担保物权包括抵押权、质权和留置权。其中抵押权的实现需要通过...',
        category: '担保法',
        tags: ['抵押权', '质权', '实现程序'],
        source: '《担保法》',
        updatedAt: '2025-10-01',
      },
    ])

    // 估值方法库示例
    this.mockData.set('valuation_methods', [
      {
        id: 'valuation-001',
        title: '不动产评估成本法',
        content: '成本法＝重置成本－累积折旧。用于评估建筑物等不动产资产...',
        category: '成本法',
        tags: ['成本法', '不动产', '重置成本'],
        source: '房地产估价规范',
        updatedAt: '2025-11-01',
      },
      {
        id: 'valuation-002',
        title: '企业资产评估市场法',
        content: '市场法＝参考资产价格×调整系数。通过市场上类似资产...',
        category: '市场法',
        tags: ['市场法', '参考价格', '调整系数'],
        source: '企业资产评估指南',
        updatedAt: '2025-11-01',
      },
    ])

    // 其他知识库保留为空，等待实际数据接入
    this.mockData.set('market_data', [])
    this.mockData.set('case_study', [])
    this.mockData.set('internal_guidelines', [])
    this.mockData.set('industry_knowledge', [])
  }

  /**
   * 在指定知识库中搜索
   */
  async searchKnowledgeBase(
    knowledgeBase: AmcKnowledgeBase,
    query: KnowledgeBaseQuery,
  ): Promise<KnowledgeBaseResult> {
    const startTime = Date.now()

    try {
      // 优先使用本地模拟数据
      const mockResults = this.mockData.get(knowledgeBase) || []

      if (mockResults.length > 0) {
        const filtered = this.filterEntries(mockResults, query)
        return {
          query,
          source: knowledgeBase,
          results: filtered.slice(0, query.limit || 10),
          totalResults: filtered.length,
          executionTime: Date.now() - startTime,
        }
      }

      // 尝试从后端API获取
      const response = await fetch(
        `${this.baseUrl}/api/knowledge-base/${knowledgeBase}/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(query),
        }
      )

      if (!response.ok) {
        throw new Error(`知识库查询失败: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        query,
        source: knowledgeBase,
        results: data.results || [],
        totalResults: data.total || 0,
        executionTime: Date.now() - startTime,
      }
    } catch (error) {
      console.error(`知识库 ${knowledgeBase} 查询失败:`, error)
      return {
        query,
        source: knowledgeBase,
        results: [],
        totalResults: 0,
        executionTime: Date.now() - startTime,
      }
    }
  }

  /**
   * 并行搜索多个知识库
   */
  async searchMultipleKnowledgeBases(
    knowledgeBases: AmcKnowledgeBase[],
    query: KnowledgeBaseQuery,
  ): Promise<KnowledgeBaseResult[]> {
    const results = await Promise.all(
      knowledgeBases.map(kb => this.searchKnowledgeBase(kb, query))
    )
    return results
  }

  /**
   * 获取知识库配置信息
   */
  getKnowledgeBaseInfo(knowledgeBase: AmcKnowledgeBase) {
    return knowledgeBaseConfig[knowledgeBase]
  }

  /**
   * 获取所有知识库列表
   */
  listKnowledgeBases(): Array<{
    id: AmcKnowledgeBase
    name: string
    description: string
    categories: string[]
  }> {
    return (Object.keys(knowledgeBaseConfig) as AmcKnowledgeBase[]).map(id => ({
      id,
      ...knowledgeBaseConfig[id],
    }))
  }

  /**
   * 过滤知识库条目
   */
  private filterEntries(entries: KnowledgeEntry[], query: KnowledgeBaseQuery): KnowledgeEntry[] {
    return entries.filter(entry => {
      // 分类过滤
      if (query.category && entry.category !== query.category) return false

      // 关键词匹配（任意关键词匹配即可）
      const matchesKeyword = query.keywords.length === 0 || query.keywords.some(keyword =>
        entry.title.includes(keyword) ||
        entry.content.includes(keyword) ||
        entry.tags.some(tag => tag.includes(keyword))
      )

      return matchesKeyword
    }).sort((a, b) => {
      // 按匹配度排序
      const aMatches = query.keywords.filter(kw => a.title.includes(kw) || a.tags.some(t => t.includes(kw))).length
      const bMatches = query.keywords.filter(kw => b.title.includes(kw) || b.tags.some(t => t.includes(kw))).length
      return bMatches - aMatches
    })
  }
}

// ===== 外部数据源客户端 =====

export class AmcExternalDataClient {
  private baseUrl: string

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  /**
   * 从企查查查询企业信息
   */
  async queryQicchacha(enterpriseId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/external/qichacha/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enterpriseId }),
        }
      )
      if (!response.ok) throw new Error(`企查查查询失败: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      console.error('企查查查询失败:', error)
      return null
    }
  }

  /**
   * 获取股票市场数据
   */
  async getStockMarketData(symbols: string[], metrics?: string[]) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/external/stock-market/data`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols, metrics }),
        }
      )
      if (!response.ok) throw new Error(`股票数据查询失败: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      console.error('股票数据查询失败:', error)
      return null
    }
  }

  /**
   * 搜索相似法律案例
   */
  async searchLegalCases(query: string, limit = 10) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/external/legal-cases/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit }),
        }
      )
      if (!response.ok) throw new Error(`法律案例搜索失败: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      console.error('法律案例搜索失败:', error)
      return null
    }
  }

  /**
   * 获取行业报告
   */
  async getIndustryReports(industry: string, reportType?: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/external/industry-reports`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry, reportType }),
        }
      )
      if (!response.ok) throw new Error(`行业报告获取失败: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      console.error('行业报告获取失败:', error)
      return null
    }
  }
}
