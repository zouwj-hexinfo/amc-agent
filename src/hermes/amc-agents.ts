/**
 * AMC不良资产评估多智能体框架 - Agent定义
 * 适配Hermes框架的不良资产评估专家团队
 */

import type { AnalysisAgent, AnalysisEvent } from './types'

// ===== AMC评估Agent定义 =====

export type AmcAgentId =
  | 'legal_reviewer'      // 法律审查Agent
  | 'risk_assessor'       // 风险审查Agent
  | 'valuation_auditor'   // 评估审核Agent
  | 'industry_analyst'    // 行业分析Agent
  | 'orchestrator'        // 编排器Agent

export const amcEvaluationAgents: AnalysisAgent[] = [
  {
    id: 'orchestrator',
    name: '评估编排器',
    role: '分解评估任务、协调各专家团队、整合评估结果、消解评估冲突',
    status: 'pending',
    action: '等待资产基本信息输入',
    progress: 0,
    outputCount: 0,
  },
  {
    id: 'legal_reviewer',
    name: '法律审查专家',
    role: '执行尽职调查、进行产权核查、审查法律合规性、验证法规引用',
    status: 'pending',
    action: '等待资产信息和法律文件',
    progress: 0,
    outputCount: 0,
  },
  {
    id: 'risk_assessor',
    name: '风险评估专家',
    role: '评估信用风险、分析市场风险、识别流动性风险、评估处置方案',
    status: 'pending',
    action: '等待财务数据和市场信息',
    progress: 0,
    outputCount: 0,
  },
  {
    id: 'valuation_auditor',
    name: '评估审核专家',
    role: '选择估值方法、进行市场比较分析、执行收益法测算、计算抵押率',
    status: 'pending',
    action: '等待资产评估参数',
    progress: 0,
    outputCount: 0,
  },
  {
    id: 'industry_analyst',
    name: '行业分析专家',
    role: '分析行业趋势、评估竞争格局、研判市场环境、判断资产前景',
    status: 'pending',
    action: '等待行业背景信息',
    progress: 0,
    outputCount: 0,
  },
]

// ===== AMC特定事件类型 =====

export type AmcEvaluationEvent = AnalysisEvent | {
  type: 'amc.asset.intake'
  assetId: string
  assetType: string
  assetValue: number
  debtAmount?: number
  debtorInfo?: Record<string, unknown>
} | {
  type: 'amc.legal_review.completed'
  agentId: 'legal_reviewer'
  findings: {
    ownershipStatus: string        // 产权状态
    legalObstacles: string[]       // 法律障碍
    litigationRisk: string         // 诉讼风险等级
    complianceIssues: string[]     // 合规性问题
    recommendations: string        // 法律建议
  }
} | {
  type: 'amc.risk_assessment.completed'
  agentId: 'risk_assessor'
  findings: {
    creditRisk: string             // 信用风险评级
    marketRisk: string             // 市场风险评级
    liquidityRisk: string          // 流动性风险评级
    riskMitigation: string[]       // 风险缓释方案
  }
} | {
  type: 'amc.valuation_analysis.completed'
  agentId: 'valuation_auditor'
  findings: {
    valuationMethods: string[]     // 使用的估值方法
    liquidationValue: number       // 清算价值
    marketValue: number            // 市场价值
    mortgageRate: number           // 抵押率 %
    valuationReport: string        // 详细估值说明
  }
} | {
  type: 'amc.industry_analysis.completed'
  agentId: 'industry_analyst'
  findings: {
    industryTrend: string          // 行业趋势判断
    competitivePosition: string    // 竞争地位评估
    marketOutlook: string          // 市场前景预判
    recommendedAction: string      // 建议处置方案
  }
} | {
  type: 'amc.comprehensive_evaluation'
  overallRating: string            // 综合评级
  suggestedPrice: number           // 建议处置价格
  recoveryRate: number             // 预期回收率 %
  riskScore: number                // 综合风险评分
  disposalRecommendation: string   // 处置建议
} | {
  type: 'amc.conflict_detected'
  conflicts: Array<{
    agents: string[]
    issue: string
    resolution: string
  }>
} | {
  type: 'amc.report.generated'
  reportFormat: string             // 报告格式类型
  reportContent: string            // 完整报告内容
}

// ===== 知识库和外部数据源定义 =====

export type AmcKnowledgeBase =
  | 'policy_regulations'           // 政策法规库
  | 'legal_knowledge'              // 法律知识库
  | 'market_data'                  // 市场数据库
  | 'case_study'                   // 案例数据库
  | 'valuation_methods'            // 评估方法库
  | 'internal_guidelines'          // 内规制度库
  | 'industry_knowledge'           // 行业知识库

export type AmcExternalDataSource =
  | 'qichacha_api'                 // 企查查API - 企业信息查询
  | 'stock_market_api'             // 股票市场API - 市场行情数据
  | 'legal_case_database'          // 法律案例数据库
  | 'industry_report_service'      // 行业报告服务
  | 'credit_rating_service'        // 信用评级服务

// ===== AMC评估维度定义 =====

export type AmcEvaluationDimension = {
  id: string
  name: string
  description: string
  agents: AmcAgentId[]             // 参与评估的Agent
  dataSources: AmcKnowledgeBase[]  // 所需知识库
  externalApis: AmcExternalDataSource[]
  outputFields: string[]           // 评估输出字段
  scoringMethod: string            // 评分方法
}

export const amcEvaluationDimensions: AmcEvaluationDimension[] = [
  {
    id: 'legal_dimension',
    name: '法律维度',
    description: '产权清晰度、法律障碍、诉讼风险评估',
    agents: ['legal_reviewer', 'orchestrator'],
    dataSources: ['legal_knowledge', 'policy_regulations', 'case_study'],
    externalApis: ['qichacha_api', 'legal_case_database'],
    outputFields: [
      'ownershipClarity',           // 产权清晰度
      'legalObstacles',             // 法律障碍
      'litigationRisk',             // 诉讼风险
      'complianceStatus',           // 合规性
      'legalScore'                  // 法律评分
    ],
    scoringMethod: '加权平均法：产权清晰度(40%) + 法律障碍(30%) + 诉讼风险(30%)',
  },
  {
    id: 'risk_dimension',
    name: '风险维度',
    description: '信用风险、市场风险、流动性风险综合评估',
    agents: ['risk_assessor', 'orchestrator'],
    dataSources: ['market_data', 'industry_knowledge', 'case_study'],
    externalApis: ['stock_market_api', 'credit_rating_service'],
    outputFields: [
      'creditRisk',                 // 信用风险
      'marketRisk',                 // 市场风险
      'liquidityRisk',              // 流动性风险
      'riskMitigation',             // 风险缓释方案
      'riskScore'                   // 风险评分
    ],
    scoringMethod: '加权平均法：信用风险(40%) + 市场风险(35%) + 流动性风险(25%)',
  },
  {
    id: 'valuation_dimension',
    name: '估值维度',
    description: '资产估值、回收率预测、抵押率计算',
    agents: ['valuation_auditor', 'orchestrator'],
    dataSources: ['valuation_methods', 'market_data', 'case_study'],
    externalApis: ['stock_market_api'],
    outputFields: [
      'liquidationValue',           // 清算价值
      'marketValue',                // 市场价值
      'mortgageRate',               // 抵押率
      'recoveryRate',               // 回收率预测
      'valuationScore'              // 估值评分
    ],
    scoringMethod: '多方法估值：成本法 + 市场法 + 收益法加权平均',
  },
  {
    id: 'industry_dimension',
    name: '行业维度',
    description: '行业趋势、竞争格局、市场环境评估',
    agents: ['industry_analyst', 'orchestrator'],
    dataSources: ['industry_knowledge', 'market_data', 'policy_regulations'],
    externalApis: ['stock_market_api', 'industry_report_service'],
    outputFields: [
      'industryTrend',              // 行业趋势
      'competitivePosition',        // 竞争地位
      'marketOutlook',              // 市场前景
      'disposalStrategy',           // 处置策略
      'industryScore'               // 行业评分
    ],
    scoringMethod: '专家判断法+数据支撑',
  },
]

// ===== 评估报告格式定义 =====

export type AmcReportFormat = {
  type: 'executive_summary' | 'detailed_analysis' | 'investment_memo' | 'regulatory_filing'
  sections: string[]
  includeMetrics: string[]
  visualizations: boolean
}

export const amcReportFormats: Record<string, AmcReportFormat> = {
  executive_summary: {
    type: 'executive_summary',
    sections: [
      'assetOverview',              // 资产概览
      'keyFindings',                // 关键发现
      'riskAssessment',             // 风险评估摘要
      'valuation',                  // 估值摘要
      'recommendation'              // 处置建议
    ],
    includeMetrics: [
      'overallRating',
      'recoveryRate',
      'disposalPrice',
      'riskScore'
    ],
    visualizations: true,
  },
  detailed_analysis: {
    type: 'detailed_analysis',
    sections: [
      'executiveSummary',
      'assetDescription',           // 资产详细描述
      'legalAnalysis',              // 法律分析详述
      'riskAnalysis',               // 风险分析详述
      'valuationAnalysis',          // 估值分析详述
      'industryAnalysis',           // 行业分析详述
      'scenario',                   // 处置情景分析
      'conclusion',                 // 综合结论
      'appendix'                    // 附件和数据
    ],
    includeMetrics: [
      'allMetrics'
    ],
    visualizations: true,
  },
  investment_memo: {
    type: 'investment_memo',
    sections: [
      'investmentThesis',           // 投资逻辑
      'assetFundamentals',          // 资产基本面
      'valuation',                  // 估值分析
      'riskFactors',                // 风险因素
      'investmentReturn',           // 投资收益预测
      'recommendation'              // 投资建议
    ],
    includeMetrics: [
      'recoveryRate',
      'irr',                        // 内部收益率
      'paybackPeriod',              // 回本周期
      'riskAdjustedReturn'          // 风险调整收益
    ],
    visualizations: true,
  },
  regulatory_filing: {
    type: 'regulatory_filing',
    sections: [
      'assetDescription',
      'legalCompliance',            // 法律合规情况
      'riskDisclosure',             // 风险披露
      'valuation',
      'disposalPlan',               // 处置计划
      'regulatoryRequirements'      // 监管要求满足情况
    ],
    includeMetrics: [
      'overallRating',
      'riskScore',
      'recoveryRate',
      'complianceStatus'
    ],
    visualizations: false,
  },
}

// ===== MCP集成规范 =====

export type AmcMcpIntegration = {
  name: string
  provider: string
  capability: string
  dataModels: string[]
  updateFrequency: string
  queryMethods: string[]
  authRequired: boolean
}

export const amcMcpIntegrations: AmcMcpIntegration[] = [
  {
    name: 'qichacha',
    provider: '企查查',
    capability: '企业工商信息查询、股权结构、诉讼纠纷、失信记录',
    dataModels: ['Enterprise', 'Shareholder', 'LitigationCase', 'CreditRecord'],
    updateFrequency: 'real-time',
    queryMethods: ['queryByName', 'queryById', 'queryByKeyword', 'getTrusteeInfo'],
    authRequired: true,
  },
  {
    name: 'stock_market_api',
    provider: '股票市场数据',
    capability: '上市公司行情、财报数据、市场行业对标',
    dataModels: ['StockData', 'FinancialReport', 'MarketIndex'],
    updateFrequency: 'daily',
    queryMethods: ['getQuote', 'getHistoricalData', 'getFinancials', 'getIndustryComparables'],
    authRequired: false,
  },
  {
    name: 'legal_case_database',
    provider: '法律案例库',
    capability: '相似法律案例检索、判例参考、裁判规则',
    dataModels: ['LegalCase', 'JudgmentRule', 'CaseOutcome'],
    updateFrequency: 'weekly',
    queryMethods: ['searchBySimilarity', 'searchByJurisdiction', 'searchByOutcome'],
    authRequired: false,
  },
  {
    name: 'industry_report_service',
    provider: '行业报告服务',
    capability: '行业研究报告、市场数据、竞争分析',
    dataModels: ['IndustryReport', 'MarketData', 'CompetitiveAnalysis'],
    updateFrequency: 'monthly',
    queryMethods: ['getReport', 'getMarketData', 'getCompetitorAnalysis'],
    authRequired: true,
  },
]
