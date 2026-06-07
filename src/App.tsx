import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, PlusCircle, Scale, ShieldCheck, BarChart3, TrendingUp, 
  BookOpen, Terminal, ClipboardCheck, ArrowRight, CheckCircle2, 
  Clock, AlertTriangle, FileText, Upload, ChevronRight, ChevronLeft, Activity, 
  HelpCircle, ThumbsUp, RefreshCw, Layers, User, LogOut, Settings, ChevronDown, Paperclip, Send,
  Wand2, Copy, Check, MessageSquare, Square, X
} from "lucide-react";

import { 
  AMCProject, ProjectType, AgentType, 
  EvaluationRecord, KnowledgeItem, QccResult, StockResult, ProjectFile,
  ExecutionEvent, ExecutionStep, CommunicationBubble, KnowledgeWriteSuggestionReview, ReportRevision,
  AgentConfigBundle, AgentDomain, AgentRole, AgentWorkGroup, AgentWorkItem,
  InstructionIntentResult, OrchestratorMode
} from "./types";

import AgentSettings from "./components/AgentSettings";
import KnowledgeBaseView from "./components/KnowledgeBaseView";
import ExternalToolsView from "./components/ExternalToolsView";
import MarkdownRenderer from "./components/MarkdownRenderer";
import ReportViewer from "./components/ReportViewer";
import { FilesDrawer, ExecutionDrawer } from "./components/LeftDrawers";
import DocumentPreviewer from "./components/DocumentPreviewer";
import SystemHomePage from "./components/SystemHomePage";
import { currentBeijingDateTime, formatBeijingDateTime } from "./lib/time";

export const THEME_COLOR_MAPS: Record<string, { bg: string, text: string, border: string, badge: string, iconBg: string, activeTab: string, primaryBtn: string, linkText: string, inputRing: string, accentBg: string }> = {
  indigo: { bg: "bg-indigo-50/40", text: "text-indigo-700", border: "border-indigo-100", badge: "bg-indigo-50 text-indigo-700 border-indigo-200", iconBg: "bg-indigo-500/10 text-indigo-600", activeTab: "bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-bold shadow-3xs", primaryBtn: "bg-indigo-600 hover:bg-indigo-750 active:bg-indigo-850 text-white shadow-xs", linkText: "text-indigo-600 hover:text-indigo-800", inputRing: "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25", accentBg: "bg-indigo-600 text-white" },
  purple: { bg: "bg-purple-50/40", text: "text-purple-700", border: "border-purple-100", badge: "bg-purple-50 text-purple-700 border-purple-200", iconBg: "bg-purple-500/10 text-purple-600", activeTab: "bg-purple-50 border border-purple-200/80 text-purple-700 font-bold shadow-3xs", primaryBtn: "bg-purple-600 hover:bg-purple-755 active:bg-purple-855 text-white shadow-xs", linkText: "text-purple-600 hover:text-purple-800", inputRing: "focus:border-purple-500 focus:ring-1 focus:ring-purple-500/25", accentBg: "bg-purple-600 text-white" },
  emerald: { bg: "bg-emerald-50/40 text-emerald-800", text: "text-emerald-700", border: "border-emerald-100", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", iconBg: "bg-emerald-500/10 text-emerald-600", activeTab: "bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-bold shadow-3xs", primaryBtn: "bg-emerald-600 hover:bg-emerald-750 active:bg-indigo-850 text-white shadow-xs", linkText: "text-emerald-600 hover:text-emerald-800", inputRing: "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/25", accentBg: "bg-emerald-600 text-white" },
  amber: { bg: "bg-amber-50/40 text-amber-800", text: "text-amber-700", border: "border-amber-100", badge: "bg-amber-50 text-amber-700 border-amber-200", iconBg: "bg-amber-500/10 text-amber-600", activeTab: "bg-amber-50 border border-amber-200/80 text-amber-800 font-bold shadow-3xs", primaryBtn: "bg-amber-600 hover:bg-amber-750 active:bg-amber-855 text-white shadow-xs", linkText: "text-amber-600 hover:text-amber-800", inputRing: "focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25", accentBg: "bg-amber-600 text-white" },
  sky: { bg: "bg-sky-50/40", text: "text-sky-700", border: "border-sky-100", badge: "bg-sky-50 text-sky-700 border-sky-200", iconBg: "bg-sky-500/10 text-sky-600", activeTab: "bg-sky-50 border border-sky-200/80 text-sky-700 font-bold shadow-3xs", primaryBtn: "bg-sky-600 hover:bg-sky-750 active:bg-sky-850 text-white shadow-xs", linkText: "text-sky-600 hover:text-sky-850", inputRing: "focus:border-sky-500 focus:ring-1 focus:ring-sky-500/25", accentBg: "bg-sky-600 text-white" },
  cyan: { bg: "bg-cyan-50/40", text: "text-cyan-700", border: "border-cyan-100", badge: "bg-cyan-50 text-cyan-700 border-cyan-200", iconBg: "bg-cyan-500/10 text-cyan-600", activeTab: "bg-cyan-50 border border-cyan-200/80 text-cyan-700 font-bold shadow-3xs", primaryBtn: "bg-cyan-600 hover:bg-cyan-750 active:bg-cyan-850 text-white shadow-xs", linkText: "text-cyan-600 hover:text-cyan-850", inputRing: "focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/25", accentBg: "bg-cyan-600 text-white" },
  rose: { bg: "bg-rose-50/40 text-rose-800", text: "text-rose-700", border: "border-rose-100", badge: "bg-rose-50 text-rose-700 border-rose-200", iconBg: "bg-rose-500/10 text-rose-600", activeTab: "bg-rose-50 border border-rose-200/80 text-rose-700 font-bold shadow-3xs", primaryBtn: "bg-rose-600 hover:bg-rose-750 active:bg-rose-850 text-white shadow-xs", linkText: "text-rose-600 hover:text-rose-850", inputRing: "focus:border-rose-555 focus:ring-1 focus:ring-rose-500/25", accentBg: "bg-rose-600 text-white" }
};

export const BRAND_THEME_DETAILS: Record<string, {
  textPrimary: string;
  bgPrimary: string;
  borderPrimary: string;
  hoverBorder: string;
  avatarBg: string;
  avatarBgGradient: string;
  text500: string;
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  tabSelectedBorder: string;
  tabSelectedText: string;
}> = {
  indigo: {
    textPrimary: "text-indigo-400",
    bgPrimary: "bg-indigo-500",
    borderPrimary: "border-indigo-500/50",
    hoverBorder: "hover:border-indigo-500/50",
    avatarBg: "bg-indigo-600",
    avatarBgGradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
    text500: "text-indigo-500",
    badgeText: "text-indigo-300",
    badgeBg: "bg-indigo-500/10",
    badgeBorder: "border-indigo-500/20",
    tabSelectedBorder: "border-indigo-600",
    tabSelectedText: "text-indigo-600",
  },
  purple: {
    textPrimary: "text-purple-400",
    bgPrimary: "bg-purple-500",
    borderPrimary: "border-purple-500/50",
    hoverBorder: "hover:border-purple-500/50",
    avatarBg: "bg-purple-600",
    avatarBgGradient: "bg-gradient-to-br from-purple-500 to-indigo-600",
    text500: "text-purple-500",
    badgeText: "text-purple-300",
    badgeBg: "bg-purple-500/10",
    badgeBorder: "border-purple-500/20",
    tabSelectedBorder: "border-purple-600",
    tabSelectedText: "text-purple-600",
  },
  emerald: {
    textPrimary: "text-emerald-400",
    bgPrimary: "bg-emerald-500",
    borderPrimary: "border-emerald-500/50",
    hoverBorder: "hover:border-emerald-500/50",
    avatarBg: "bg-emerald-600",
    avatarBgGradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
    text500: "text-emerald-500",
    badgeText: "text-emerald-300",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/20",
    tabSelectedBorder: "border-emerald-600",
    tabSelectedText: "text-emerald-600",
  },
  amber: {
    textPrimary: "text-amber-400",
    bgPrimary: "bg-amber-500",
    borderPrimary: "border-amber-500/50",
    hoverBorder: "hover:border-amber-500/50",
    avatarBg: "bg-amber-600",
    avatarBgGradient: "bg-gradient-to-br from-amber-500 to-orange-600",
    text500: "text-amber-500",
    badgeText: "text-amber-300",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/20",
    tabSelectedBorder: "border-amber-600",
    tabSelectedText: "text-amber-600",
  },
  sky: {
    textPrimary: "text-sky-400",
    bgPrimary: "bg-sky-500",
    borderPrimary: "border-sky-500/50",
    hoverBorder: "hover:border-sky-500/50",
    avatarBg: "bg-sky-600",
    avatarBgGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
    text500: "text-sky-500",
    badgeText: "text-sky-305",
    badgeBg: "bg-sky-500/10",
    badgeBorder: "border-sky-500/20",
    tabSelectedBorder: "border-sky-600",
    tabSelectedText: "text-sky-600",
  },
  cyan: {
    textPrimary: "text-cyan-400",
    bgPrimary: "bg-cyan-500",
    borderPrimary: "border-cyan-500/50",
    hoverBorder: "hover:border-cyan-500/50",
    avatarBg: "bg-cyan-600",
    avatarBgGradient: "bg-gradient-to-br from-cyan-500 to-teal-600",
    text500: "text-cyan-500",
    badgeText: "text-cyan-300",
    badgeBg: "bg-cyan-500/10",
    badgeBorder: "border-cyan-500/20",
    tabSelectedBorder: "border-cyan-600",
    tabSelectedText: "text-cyan-600",
  },
  rose: {
    textPrimary: "text-rose-400",
    bgPrimary: "bg-rose-500",
    borderPrimary: "border-rose-500/50",
    hoverBorder: "hover:border-rose-500/50",
    avatarBg: "bg-rose-600",
    avatarBgGradient: "bg-gradient-to-br from-rose-500 to-pink-600",
    text500: "text-rose-500",
    badgeText: "text-rose-300",
    badgeBg: "bg-rose-500/10",
    badgeBorder: "border-rose-500/20",
    tabSelectedBorder: "border-rose-600",
    tabSelectedText: "text-rose-600",
  }
};

export const PROJECT_TYPES_CONFIG: Record<string, {
  label: string;
  icon: any;
  themeColor: string;
  fields: { key: string; label: string; placeholder: string; type: string; required?: boolean }[];
}> = {
  NPA_ACQUISITION: {
    label: "对公不良资产收购",
    icon: Building2,
    themeColor: "indigo",
    fields: [
      { key: "debtorName", label: "主债务人名称", placeholder: "例如：上海中合实业有限公司", type: "text", required: true },
      { key: "totalDebt", label: "债权本金 (万元)", placeholder: "例如：12500", type: "number", required: true },
      { key: "interestAndPenalty", label: "利息及罚息 (万元)", placeholder: "例如：1250", type: "number" },
      { key: "collateralType", label: "主要抵押标的描述", placeholder: "例如：商业地下建筑及写字楼底商（5500㎡）", type: "text" },
      { key: "collateralEstValue", label: "抵押物预估值 (万元)", placeholder: "例如：9800", type: "number" },
      { key: "guarantorDetails", label: "保证人担保及反担保情况", placeholder: "例如：控股股东赵中合及申弘置业提供无限连带保证担保", type: "text" }
    ]
  },
  NPA_TRANSFER: {
    label: "对公不良资产转让",
    icon: RefreshCw,
    themeColor: "purple",
    fields: [
      { key: "transferFloorPrice", label: "挂牌转让底价 (万元)", placeholder: "例如：8000", type: "number", required: true },
      { key: "assessmentDate", label: "评估基准日", placeholder: "例如：2026-03-31", type: "text" },
      { key: "listingExchange", label: "挂牌交易中心/场所", placeholder: "例如：上海联合产权交易所", type: "text" },
      { key: "targetBuyerRequirement", label: "意向受让方资格要求", placeholder: "例如：符合监管的合格机构投资者", type: "text" },
      { key: "registrationStatus", label: "挂牌登记进展情况", placeholder: "例如：已获董事会通过，正挂牌公示中", type: "text" }
    ]
  },
  DEBT_RESTRUCTURE: {
    label: "债务重组",
    icon: Scale,
    themeColor: "emerald",
    fields: [
      { key: "debtorName", label: "债务重组主体", placeholder: "例如：荣盛重工机电设备工程（常州）有限公司", type: "text", required: true },
      { key: "originalDebt", label: "重组前债务总额 (万元)", placeholder: "例如：8900", type: "number", required: true },
      { key: "exemptAmount", label: "本金规避/豁免金额 (万元)", placeholder: "例如：800", type: "number" },
      { key: "newInterestRate", label: "重组后执行年利率 (%)", placeholder: "例如：4.25", type: "number" },
      { key: "repaymentInstalments", label: "还款宽限及分期计划", placeholder: "例如：分3期，自重组基准日起第6、12、18个月等额偿还", type: "text" },
      { key: "newGuarantees", label: "新增补强担保措施", placeholder: "例如：常州工业发展投资母基金提供阶段性差额补足承诺", type: "text" }
    ]
  },
  BANKRUPTCY_REORG: {
    label: "破产重整",
    icon: AlertTriangle,
    themeColor: "amber",
    fields: [
      { key: "courtInCharge", label: "受理重整法院", placeholder: "例如：常州市中级人民法院", type: "text", required: true },
      { key: "administratorName", label: "重整破产管理人名称", placeholder: "例如：江苏中豪律师事务所管理人团队", type: "text" },
      { key: "restructuringInvestment", label: "拟注入重整投资款总额 (万元)", placeholder: "例如：15000", type: "number" },
      { key: "priorityDebts", label: "共益债及优先债权总计 (万元)", placeholder: "例如：8200", type: "number" },
      { key: "ordinaryRecoveryRatio", label: "预计普通债权清偿率预测 (%)", placeholder: "例如：12.5", type: "number" },
      { key: "planPassStatus", label: "重整草案过会表决结果", placeholder: "例如：第一次债权人会议表决通过并提请公告", type: "text" }
    ]
  },
  SUBSTANTIVE_REORG: {
    label: "实质性重组",
    icon: Layers,
    themeColor: "sky",
    fields: [
      { key: "restructuringCapital", label: "重组资产注入资金额 (万元)", placeholder: "例如：10000", type: "number", required: true },
      { key: "revitalizationScheme", label: "实物资产注入/盘活重塑方案", placeholder: "例如：在建工程改由市保障房平台接收，由AMC进行配套代建", type: "text" },
      { key: "counterpartyStructure", label: "交易对手及重组SPV架构", placeholder: "例如：信托计划 + 有限合伙SPV持股隔离", type: "text" },
      { key: "associatedFinancing", label: "共益债配套融资金额 (万元)", placeholder: "例如：4500", type: "number" },
      { key: "expectedGrossMargin", label: "预期复合盘活毛收益率 (%)", placeholder: "例如：15.0", type: "number" }
    ]
  },
  STANDARDIZED_DEBT: {
    label: "标准化债权投资",
    icon: TrendingUp,
    themeColor: "cyan",
    fields: [
      { key: "investmentTarget", label: "核心投资标的 / 证券代码", placeholder: "例如：信达租赁商用固定收益债/CMBS代码0981", type: "text", required: true },
      { key: "couponRate", label: "票面或产品预期年收益率 (%)", placeholder: "例如：5.8", type: "number" },
      { key: "creditRating", label: "最新大公主体/债务信用评级", placeholder: "例如：AAA 级", type: "text" },
      { key: "subscriptionAmount", label: "拟认购出资金额 (万元)", placeholder: "例如：5000", type: "number", required: true },
      { key: "maturityDate", label: "产品到期及本息退出安排", placeholder: "例如：自认购起36个月到期、按年偿息最后到期还本", type: "text" }
    ]
  },
  BATCH_PERSONAL_NPA: {
    label: "批量个人不良资产收购",
    icon: User,
    themeColor: "rose",
    fields: [
      { key: "totalAccounts", label: "资产包总共包含户数 (户)", placeholder: "例如：1150", type: "number", required: true },
      { key: "averageDue", label: "件均笔数欠款本息金额 (元)", placeholder: "例如：45000", type: "number" },
      { key: "acquisitionDiscount", label: "批量包整体收购折扣率 (%)", placeholder: "例如：1.8", type: "number" },
      { key: "collateralSecuredRatio", label: "其中抵押担保类件数占比 (%)", placeholder: "例如：15.0", type: "number" },
      { key: "outsourcingStrategy", label: "催收外包及线上绿色诉调策略", placeholder: "例如：委托省级优质电催行 + 批量线上纠纷调解促裁", type: "text" }
    ]
  }
};

function buildProjectTypesConfig(domains: AgentDomain[]) {
  if (!domains.length) return PROJECT_TYPES_CONFIG;
  return domains.reduce((acc, domain) => {
    const fallback = PROJECT_TYPES_CONFIG[domain.code] || PROJECT_TYPES_CONFIG.NPA_ACQUISITION;
    acc[domain.code] = {
      ...fallback,
      label: domain.status === 'inactive' ? `${domain.label}（已停用）` : domain.label,
      themeColor: domain.themeColor || fallback.themeColor,
      fields: domain.fields?.length ? domain.fields : fallback.fields,
    };
    return acc;
  }, {} as typeof PROJECT_TYPES_CONFIG);
}

export interface FolderCategory {
  id: string;
  name: string;
  subfolders: {
    id: string;
    name: string;
  }[];
}

export const DOCUMENT_TAXONOMY: FolderCategory[] = [
  {
    id: "00",
    name: "00 项目基础信息与通用资料",
    subfolders: [
      { id: "00.01", name: "00.01 项目台账" },
      { id: "00.02", name: "00.02 通用参考模板" }
    ]
  },
  {
    id: "01",
    name: "01 申报审批与内部决策",
    subfolders: [
      { id: "01.01", name: "01.01 立项与上会材料" },
      { id: "01.02", name: "01.02 内部决议与授权" }
    ]
  },
  {
    id: "02",
    name: "02 尽职调查与估值分析",
    subfolders: [
      { id: "02.01", name: "02.01 法律尽职调查" },
      { id: "02.02", name: "02.02 业务与财务尽调" },
      { id: "02.03", name: "02.03 估值测算底稿" },
      { id: "02.04", name: "02.04 估值报告与附件" }
    ]
  },
  {
    id: "03",
    name: "03 交易结构与参与主体",
    subfolders: [
      { id: "03.01", name: "03.01 资金方/投资人资料" },
      { id: "03.02", name: "03.02 合作方/处置方资料" },
      { id: "03.03", name: "03.03 目标债权与底层资产" }
    ]
  },
  {
    id: "04",
    name: "04 交易执行与协议管理",
    subfolders: [
      { id: "04.01", name: "04.01 正式交易协议" },
      { id: "04.02", name: "04.02 配套承诺与函件" }
    ]
  },
  {
    id: "05",
    name: "05 投后管理与退出",
    subfolders: [
      { id: "05.01", name: "05.01 投后管理报告" },
      { id: "05.02", name: "05.02 退出方案与执行" }
    ]
  }
];

export function getIntelligentKbNames(instruction: string, project: AMCProject | null): string[] {
  if (!project) return ["政策法规库", "法律知识库"];
  const categoriesSelected = new Set<string>();

  const textToAnalyze = `${instruction || ''} ${project.name || ''} ${project.description || ''}`.toLowerCase();

  // 1. policies
  if (/政策|法规|合规|规章|准入|国资|竞价|融资|平台|条例|纪要|红线|审查|审核/i.test(textToAnalyze)) {
    categoriesSelected.add("政策法规库");
  }

  // 2. legal
  if (/法律|民法典|保障|抵押|权属|纠纷|诉讼|保全|查封|轮候|第一顺位|工程|最高院|在建工程|顺位/i.test(textToAnalyze)) {
    categoriesSelected.add("法律知识库");
  }

  // 3. market
  if (/市场|价格|行情|折扣|商办|写字楼|底商|空置|二手|重置|变现|清偿|拍卖/i.test(textToAnalyze)) {
    categoriesSelected.add("市场数据库");
  }

  // 4. cases
  if (/案例|经验|借鉴|太仓|太仓某制造厂|划拨土地|成功案例|重组案|整合/i.test(textToAnalyze)) {
    categoriesSelected.add("案例数据库");
  }

  // 5. methodology
  if (/评估方法|方法|收益法|折现|折现率|还原率|公式|计算|算法|测算|ltv|公允/i.test(textToAnalyze)) {
    categoriesSelected.add("评估方法");
  }

  // 6. internal_policies
  if (/公司内规|内规|内控制度|制度|敞口|极值|门槛|风控|限额|额度|白名单/i.test(textToAnalyze)) {
    categoriesSelected.add("公司内规");
  }

  // 7. industry
  if (/工业|制造|先进制造|机械|机电|特种设备|环保|折旧|周期|去化/i.test(textToAnalyze)) {
    categoriesSelected.add("行业参考库");
  }

  // 8. feedback
  if (/反馈|修改|微调|修订|痕迹|纠正|人工作业/i.test(textToAnalyze)) {
    categoriesSelected.add("反馈知识库");
  }

  // Fallback defaults if none matched based on projectType
  if (categoriesSelected.size === 0) {
    if (project.projectType === 'NPA_ACQUISITION') {
      return ["政策法规库", "法律知识库", "市场数据库"];
    } else if (project.projectType === 'DEBT_RESTRUCTURE') {
      return ["法律知识库", "评估方法"];
    } else {
      return ["政策法规库", "法律知识库", "公司内规"];
    }
  }

  return Array.from(categoriesSelected);
}

const INITIAL_EXECUTION_EVENTS: ExecutionEvent[] = [
  {
    id: "evt-1-1",
    projectId: "proj-1",
    projectName: "上海闵行商业广场不良贷款包收购评估项目",
    user: "Lucky Ding",
    userRole: "首席信批合规官",
    userAvatar: "LD",
    timestamp: "2026-05-29 11:20:00",
    actionName: "启动多专家协作合议重整终审底稿大纲审核",
    orchestratorMode: "discuss",
    agentType: "orchestrator",
    instructionText: "对地上1-3层底商商铺的特殊物权限制及承建商施工拖欠款进行深度穿透，重新核定终极折让系数。",
    status: "completed",
    steps: [
      { step: "1", title: "指令解析与委员分拨对齐", desc: "智能解析控制台派发语境，确定工作任务及对公底层不良债权核心风险点", status: "completed" },
      { step: "2", title: "合规审查与专家自检检索", desc: "自动匹配信托规范法庭红线自检规则知识，提供上下文嵌入支持", status: "completed" },
      { step: "3", title: "委员在线辩论交叉审计", desc: "各常任代表（法务、估值、风控）启动实时交叉交叉辩论会商发言", status: "completed" },
      { step: "4", title: "品质评估与自反打分修正", desc: "首席品质控制专家针对法规及金融风控指标对合并草稿进行自我打分评估纠错", status: "completed" },
      { step: "5", title: "成果库封存与双向交付", desc: "融合各委员会审议批件，生成具有高可用信托参考性质的多页最终文告底稿", status: "completed" }
    ],
    communicationTranscripts: [
      { senderName: "综合规划专家", senderRole: "多智能体总协调", senderAvatar: "🌟", timestamp: "11:20:01", content: "收到并解读定制意图指令：深挖地上底商拖欠承建商工程款优先权抗辩风险。启动法律合规与资产估值交叉辩论。", bubbleType: 'leader' },
      { senderName: "法务合规专家", senderRole: "首席法审顾问", senderAvatar: "⚖️", timestamp: "11:20:15", content: "《民法典》第八百零七条赋予承建商建设工程价款优先受偿权，该受偿权绝对优先于银行的金融抵押担保物权。目前初步查证该项目拖欠施工款约480万元，直接导致首封顺位存在隐形让渡漏洞！", bubbleType: 'lawyer' },
      { senderName: "项目评估专家", senderRole: "中估协估值主管", senderAvatar: "📊", timestamp: "11:20:30", content: "收到法务反馈！基于480万优先权受偿清缴的剔除，商铺重估价值必须在原9800万基础上，额外追加 15.5% 的流动折价 and 清收溢价补偿，底盘重置调整到8280万元。", bubbleType: 'valuer' },
      { senderName: "风险审查专家", senderRole: "首席风险控制官", senderAvatar: "🚨", timestamp: "11:20:45", content: "抵押足值率（LTV）推演达到 83.2%，已超过内规准入门槛的 60% 警戒线。鉴于此，同意增设第二顺位全额反担保以及控股股东无限连带保证增强要求。", bubbleType: 'risk' },
      { senderName: "品质控制专家", senderRole: "终审品控官", senderAvatar: "🛡️", timestamp: "11:20:59", content: "通过辩论审议核验，品控报告自检文本完成，合规得分 91 分。已发布终审协同报告 V1.0 并打包存档。", bubbleType: 'leader' }
    ]
  },
  {
    id: "evt-1-2",
    projectId: "proj-1",
    projectName: "上海闵行商业广场不良贷款包收购评估项目",
    user: "系统安全哨兵",
    userRole: "自动合规审查插件",
    userAvatar: "SYS",
    timestamp: "2026-05-28 14:15:30",
    actionName: "底层交易数据合规红线词汇过滤匹配与安全拦截",
    orchestratorMode: "single",
    agentType: "law_review",
    instructionText: "执行自动安全合规词汇过滤和法庭轮候冻结一键审计。",
    status: "completed",
    steps: [
      { step: "1", title: "安全规则及涉诉词库匹配", desc: "匹配最高院关于不良案件审理规定中的敏感交易词汇", status: "completed" },
      { step: "2", title: "法律文本段落合法合规性过滤", desc: "审查物权冲突与司法管辖重叠", status: "completed" }
    ],
    communicationTranscripts: [
      { senderName: "法务合规专家", senderRole: "首席法审顾问", senderAvatar: "⚖️", timestamp: "14:15:31", content: "启动抵押物重叠轮候冻结核实。经查该地下建筑包含车位50个，车位已被另外3家债权人轮候查封，抵押登记顺位暂时无法对抗首封优先受偿！", bubbleType: 'lawyer' },
      { senderName: "系统安全哨兵", senderRole: "安全守护进程", senderAvatar: "🛡️", timestamp: "14:15:45", content: "安全审计提示：该写字楼底商未被另案直接采取首封措施，物权可正常受托受让。自动规则核验完毕（符合率 100%）。", bubbleType: 'leader' }
    ]
  },
  {
    id: "evt-2-1",
    projectId: "proj-2",
    projectName: "常州荣盛重工债权性重组及资产核估项目",
    user: "Lucky Ding",
    userRole: "首席信批合规官",
    userAvatar: "LD",
    timestamp: "2026-05-29 09:12:45",
    actionName: "动产与划拨工业地过户重组风险压力测试会商",
    orchestratorMode: "chain",
    agentType: "orchestrator",
    instructionText: "重点核查重整状态下工业划拨地平移为出让科创用地的审批合规路径与土地契税豁免可能性。",
    status: "completed",
    steps: [
      { step: "1", title: "地方产业引入及扶持政策识别", desc: "识别常州工业转型发展扶持名录及契税免征细则", status: "completed" },
      { step: "2", title: "平移过户法律障碍性审查", desc: "分析划拨用地在没有破产确权情况下的流转合规缺口", status: "completed" },
      { step: "3", title: "方案合并与本金豁免测算", desc: "合并并核算荣盛重工本金减免800万后的折现还原率", status: "completed" }
    ],
    communicationTranscripts: [
      { senderName: "综合规划专家", senderRole: "多智能体总协调", senderAvatar: "🌟", timestamp: "09:12:46", content: "分析常州荣盛重工业主主体重组情况。启动串行管线，优先调阅太仓典型重组案例库作为基准比照。", bubbleType: 'leader' },
      { senderName: "项目评估专家", senderRole: "估值分析专家", senderAvatar: "⚙️", timestamp: "09:13:00", content: "该项目的核心重型行吊属于国家特种装备。由于机电设备折旧率高达每年 12%，该动产快速变现折扣应设为 35% 极值。但重组方案中引入新能源产业基金，土地用途由传统的机械制造升级为绿色储能电池车间，这极大地提高了标的流动去化预期！", bubbleType: 'valuer' },
      { senderName: "法务合规专家", senderRole: "法律审查顾问", senderAvatar: "⚖️", timestamp: "09:13:15", content: "划拨土地变更为出让土地，必须征得自然资源规划局及经信委的双向批复。在重组过渡期，可由承接方（工业转型基金）进行配套代建，免征20%地方契税，该代建平移合法合规且无纠纷死角。", bubbleType: 'lawyer' },
      { senderName: "品质控制专家", senderRole: "终审品控官", senderAvatar: "🛡️", timestamp: "09:13:30", content: "品控自检通过，串行合意度达 94 分，报告正式归档。", bubbleType: 'leader' }
    ]
  },
  {
    id: "evt-2-2",
    projectId: "proj-2",
    projectName: "常州荣盛重工债权性重组及资产核估项目",
    user: "沈红英",
    userRole: "中估协估值主管",
    userAvatar: "沈",
    timestamp: "2026-05-27 18:30:11",
    actionName: "权属文书多头冻结及工业挂牌过户自测审查",
    orchestratorMode: "single",
    agentType: "evaluation",
    instructionText: "测算原址行吊及车间的评估重置净值。",
    status: "completed",
    steps: [
      { step: "1", title: "机器设备技术折旧核定", desc: "核定特种生产设备二手挂牌流通历史平均清偿水平", status: "completed" },
      { step: "2", title: "价值偏离系数重估核定", desc: "对受拖累车间估算市场流转折让对折数值", status: "completed" }
    ],
    communicationTranscripts: [
      { senderName: "项目评估专家", senderRole: "中估协估值主管", senderAvatar: "📊", timestamp: "18:30:12", content: "车间土地历史评估测算为 7100 万元。因荣盛重工机电涉及合同纠纷，我们在重估中加入 18% 诉讼溢折率。重整清算最终保守评定价为 5822 万元。", bubbleType: 'valuer' },
      { senderName: "品质控制专家", senderRole: "终审品控官", senderAvatar: "🛡️", timestamp: "18:30:35", content: "估值分析符合重估准则，已合并至最终成果库中。", bubbleType: 'leader' }
    ]
  }
];

type ResolvedRuntimeResponse = {
  source?: string;
  domainId?: string;
  domainName?: string;
  roleId?: string;
  roleName?: string;
  workItemId?: string;
  workItemName?: string;
};

function formatResolvedRuntime(runtime?: ResolvedRuntimeResponse | null) {
  if (!runtime) return "";
  if (runtime.roleName && runtime.workItemName) return `实际执行配置：${runtime.roleName} / ${runtime.workItemName}`;
  if (runtime.roleName) return `实际执行配置：${runtime.roleName}`;
  if (runtime.source === 'chain') return "实际执行配置：顺序执行固定链路，不锁定单一工作项";
  if (runtime.source === 'orchestrator') return "实际执行配置：中枢编排器统筹执行";
  return "";
}

export default function App() {
  const [projects, setProjects] = React.useState<AMCProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  
  // Real-time execution logs history state preseeded
  const [executionEvents, setExecutionEvents] = React.useState<ExecutionEvent[]>(INITIAL_EXECUTION_EVENTS);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  
  // User dropdown and modals
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);
  const [userNickname, setUserNickname] = React.useState("Lucky Ding");
  const [userRole, setUserRole] = React.useState("首席信批合规官");
  const [userAvatar, setUserAvatar] = React.useState("LD");
  const [userEmail, setUserEmail] = React.useState("lucky.ding@goupwith.com");
  const [overrideThemeBrand, setOverrideThemeBrand] = React.useState<string>("indigo");
  const [selectedMenuBg, setSelectedMenuBg] = React.useState<string>("#0A0F1D");

  // Temporary States for Settings Modal edit
  const [tempNickname, setTempNickname] = React.useState("Lucky Ding");
  const [tempAvatar, setTempAvatar] = React.useState("LD");
  const [tempRole, setTempRole] = React.useState("首席信批合规官");
  const [tempEmail, setTempEmail] = React.useState("lucky.ding@goupwith.com");
  const [tempThemeBrand, setTempThemeBrand] = React.useState("indigo");
  const [tempMenuBg, setTempMenuBg] = React.useState("#0A0F1D");
  const [tempMode, setTempMode] = React.useState<'work' | 'config'>('work');

  React.useEffect(() => {
    if (isSettingsOpen) {
      setTempNickname(userNickname);
      setTempAvatar(userAvatar);
      setTempRole(userRole);
      setTempEmail(userEmail);
      setTempThemeBrand(overrideThemeBrand);
      setTempMenuBg(selectedMenuBg);
      setTempMode(currentMode);
    }
  }, [isSettingsOpen]);
  
  // Knowledge base lists
  const [kbItems, setKbItems] = React.useState<KnowledgeItem[]>([]);
  const [knowledgeSuggestions, setKnowledgeSuggestions] = React.useState<KnowledgeWriteSuggestionReview[]>([]);
  
  // Agent prompt and settings configurations
  const [agentConfigBundle, setAgentConfigBundle] = React.useState<AgentConfigBundle>({
    domains: [],
    roles: [],
    workGroups: [],
    workItems: [],
  });

  // Tab switching state
  const [activeTab, setActiveTab] = React.useState<'workspace' | 'tools' | 'knowledge' | 'agents'>('workspace');
  const [workspaceSubTab, setWorkspaceSubTab] = React.useState<'dispatch' | 'execution' | 'outcome'>('dispatch');
  const [currentMode, setCurrentMode] = React.useState<'home' | 'work' | 'config'>('home');
  const [homeViewMode, setHomeViewMode] = React.useState<'card' | 'list'>('card');
  const [homeTypeFilter, setHomeTypeFilter] = React.useState<string | null>(null);

  // Workshop Workspace details state
  const [activeKbCategories, setActiveKbCategories] = React.useState<string[]>([
    "policies", "legal", "market", "cases", "methodology"
  ]);
  const [orchestratorMode, setOrchestratorMode] = React.useState<OrchestratorMode>('discuss');
  const [selectedAgent, setSelectedAgent] = React.useState<AgentType>('orchestrator');
  const [selectedAgentRoleId, setSelectedAgentRoleId] = React.useState<string>("");
  const [selectedAgentWorkItemId, setSelectedAgentWorkItemId] = React.useState<string>("");

  // Simulated Document attachment upload fields
  const [newFileName, setNewFileName] = React.useState("");
  const [newFileType, setNewFileType] = React.useState<ProjectFile['type']>("DD_Report");
  const [newFileSnippet, setNewFileSnippet] = React.useState("");

  // Evaluate execution triggers
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [isPlanningInstruction, setIsPlanningInstruction] = React.useState(false);
  const [isStoppingAnalysis, setIsStoppingAnalysis] = React.useState(false);
  const [activeAnalysisId, setActiveAnalysisId] = React.useState<string | null>(null);
  const [activeExecutionEventId, setActiveExecutionEventId] = React.useState<string | null>(null);
  const [instructionText, setInstructionText] = React.useState("");
  const [planningClarificationContext, setPlanningClarificationContext] = React.useState<{
    eventId: string;
    originalInstruction: string;
    assistantQuestion: string;
    previousSummary: string;
  } | null>(null);
  const [evalSuccessMessage, setEvalSuccessMessage] = React.useState<string | null>(null);
  const subscribedAnalysisIdsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (evalSuccessMessage) {
      const timer = setTimeout(() => {
        setEvalSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [evalSuccessMessage]);

  // Active workspace project
  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const projectTypesConfig = React.useMemo(() => buildProjectTypesConfig(agentConfigBundle.domains), [agentConfigBundle.domains]);
  const activeProjectDomains = React.useMemo(() => {
    const active = agentConfigBundle.domains.filter(domain => domain.status !== 'inactive');
    return active.length ? active : Object.entries(PROJECT_TYPES_CONFIG).map(([code, cfg]) => ({
      id: `fallback-${code}`,
      code,
      label: cfg.label,
      themeColor: cfg.themeColor,
      fields: cfg.fields,
      status: 'active' as const,
      createdAt: '',
      updatedAt: '',
    }));
  }, [agentConfigBundle.domains]);
  const currentProjType = currentProject?.projectType || 'NPA_ACQUISITION';
  const currentConfig = projectTypesConfig[currentProjType] || PROJECT_TYPES_CONFIG.NPA_ACQUISITION;
  const activeColorBrand = overrideThemeBrand || currentConfig.themeColor || 'indigo';
  const currentTheme = THEME_COLOR_MAPS[activeColorBrand] || THEME_COLOR_MAPS.indigo;
  const brandColors = BRAND_THEME_DETAILS[activeColorBrand] || BRAND_THEME_DETAILS.indigo;
  const currentAgentDomain = agentConfigBundle.domains.find(domain => domain.code === currentProjType) || agentConfigBundle.domains[0];
  const currentAgentRoles = agentConfigBundle.roles.filter(role => role.domainId === currentAgentDomain?.id && role.status !== 'inactive');
  const currentSelectedRole = currentAgentRoles.find(role => role.id === selectedAgentRoleId) || currentAgentRoles[0];
  const currentRoleWorkGroups = agentConfigBundle.workGroups.filter(group => group.roleId === currentSelectedRole?.id && group.status !== 'inactive');
  const currentRoleWorkItems = agentConfigBundle.workItems.filter(item => item.roleId === currentSelectedRole?.id && item.status !== 'inactive');
  const currentSelectedWorkItem = currentRoleWorkItems.find(item => item.id === selectedAgentWorkItemId) || currentRoleWorkItems[0];

  React.useEffect(() => {
    if (!currentAgentRoles.length) return;
    const role = currentAgentRoles.find(item => item.id === selectedAgentRoleId) || currentAgentRoles[0];
    if (role.id !== selectedAgentRoleId) {
      setSelectedAgentRoleId(role.id);
      setSelectedAgent(role.agentType);
    }
  }, [currentAgentDomain?.id, currentAgentRoles, selectedAgentRoleId]);

  React.useEffect(() => {
    if (!currentSelectedRole) return;
    const workItem = currentRoleWorkItems.find(item => item.id === selectedAgentWorkItemId) || currentRoleWorkItems[0];
    setSelectedAgentWorkItemId(workItem?.id || "");
  }, [currentSelectedRole?.id, currentRoleWorkItems, selectedAgentWorkItemId]);

  const themeActiveTab = 
    activeColorBrand === 'rose' ? "border-rose-600 bg-rose-50/50 text-rose-900 ring-1 ring-rose-500/25" :
    activeColorBrand === 'amber' ? "border-amber-600 bg-amber-50/50 text-amber-900 ring-1 ring-amber-500/25" :
    activeColorBrand === 'emerald' ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500/25 animate-in slide-in-from-top-1/2 duration-300" :
    activeColorBrand === 'purple' ? "border-purple-600 bg-purple-50/50 text-purple-900 ring-1 ring-purple-500/25" :
    activeColorBrand === 'cyan' ? "border-cyan-600 bg-cyan-50/50 text-cyan-900 ring-1 ring-cyan-500/25" :
    activeColorBrand === 'sky' ? "border-sky-600 bg-sky-50/50 text-sky-900 ring-1 ring-sky-500/25" :
    "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500/25";

  const themeActiveOption = 
    activeColorBrand === 'rose' ? "border-rose-600 bg-rose-50/50 text-rose-900 ring-1 ring-rose-500/25 font-bold shadow-xs" :
    activeColorBrand === 'amber' ? "border-amber-600 bg-amber-50/50 text-amber-900 ring-1 ring-amber-500/25 font-bold shadow-xs animate-in zoom-in-95 duration-200" :
    activeColorBrand === 'emerald' ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500/25 font-bold shadow-xs" :
    activeColorBrand === 'purple' ? "border-purple-600 bg-purple-50/50 text-purple-905 ring-1 ring-purple-500/25 font-bold shadow-xs" :
    activeColorBrand === 'cyan' ? "border-cyan-600 bg-cyan-50/50 text-cyan-900 ring-1 ring-cyan-500/25 font-bold shadow-xs" :
    activeColorBrand === 'sky' ? "border-sky-600 bg-sky-50/50 text-sky-900 ring-1 ring-sky-500/25 font-bold shadow-xs" :
    "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500/25 font-bold shadow-xs";

  // Selected Report item for gallery
  const [selectedReportKey, setSelectedReportKey] = React.useState<string>('orchestrator');
  const [selectedReportIndex, setSelectedReportIndex] = React.useState<number>(0);
  const [reportDisplayTab, setReportDisplayTab] = React.useState<'report' | 'agentTrace'>('report');

  // Paragraph selection, fine-tuning, and knowledge feedback tracking state
  const [selectedParagraphs, setSelectedParagraphs] = React.useState<string[]>([]);
  const [isTuningModalOpen, setIsTuningModalOpen] = React.useState(false);
  const [tuningInstruction, setTuningInstruction] = React.useState("");
  const [isTuningSubmitting, setIsTuningSubmitting] = React.useState(false);
  const [hoveredRevisionId, setHoveredRevisionId] = React.useState<string | null>(null);
  const [revisionsOffsets, setRevisionsOffsets] = React.useState<Record<string, number>>({});
  const [isLargeScreen, setIsLargeScreen] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Right side sliding drawers for Auditing and Compliance
  const [isRightDrawerOpen, setIsRightDrawerOpen] = React.useState(false);
  const [rightDrawerContent, setRightDrawerContent] = React.useState<'reflection' | 'audit' | null>(null);

  // Left side sliding drawers for Files and Execution records
  const [isLeftFilesOpen, setIsLeftFilesOpen] = React.useState(false);
  const [isLeftExecOpen, setIsLeftExecOpen] = React.useState(false);
  const [isCollabConsoleOpen, setIsCollabConsoleOpen] = React.useState(false);
  const collabConsoleRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isCollabConsoleOpen || typeof document === 'undefined') return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!collabConsoleRef.current?.contains(target)) {
        setIsCollabConsoleOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [isCollabConsoleOpen]);

  // Custom Toast Notifications for Sandboxed environment
  const [toasts, setToasts] = React.useState<Array<{ id: string; msg: string; type: 'success' | 'error' | 'info' }>>([]);
  const addToast = React.useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  type AnalysisSummary = {
    analysisId: string;
    projectId?: string;
    runId?: string;
    runStatus?: string;
    eventCount?: number;
    events?: Array<{ sequence?: number; event?: any }>;
    updatedAt?: string;
    prompt?: { request?: string };
    metadata?: {
      targetAgentKey?: string;
      orchestrationMode?: 'single' | 'chain' | 'discuss' | 'master-slave';
    };
    report?: { content?: string };
  };

  const buildUserInstructionBubble = React.useCallback((content: string, timestamp = "刚刚"): CommunicationBubble => ({
    senderName: userNickname || "Lucky Ding",
    senderRole: "用户输入",
    senderAvatar: userAvatar || "LD",
    timestamp,
    content,
    bubbleType: 'user',
  }), [userAvatar, userNickname]);

  const buildExecutionEventFromAnalysis = React.useCallback((record: AnalysisSummary, project: AMCProject): ExecutionEvent => {
    const runStatus = record.runStatus || 'running';
    const isCompleted = runStatus === 'completed';
    const isStopped = runStatus === 'cancelled' || runStatus === 'stopped';
    const isFailed = runStatus === 'failed' || runStatus === 'stream_interrupted';
    const isWaiting = runStatus === 'requires_action';
    const status: ExecutionEvent['status'] = isCompleted ? 'completed' : isStopped ? 'stopped' : isFailed ? 'failed' : 'active';
    const targetMode = record.metadata?.orchestrationMode || 'discuss';
    const request = record.prompt?.request || 'Hermes AMC 多Agent协作评估';
    const stepStatus = (step: string): ExecutionStep['status'] => {
      if (isCompleted) return 'completed';
      if (isFailed && (step === '4' || step === '5')) return 'pending';
      if (isWaiting && step === '3') return 'active';
      return step === '1' || step === '2' ? 'completed' : step === '3' ? 'active' : 'pending';
    };

    return {
      id: `analysis-${record.analysisId}`,
      projectId: project.id,
      projectName: project.name,
      user: userNickname || "Lucky Ding",
      userRole: userRole || "首席信批合规官",
      userAvatar: userAvatar || "LD",
      timestamp: formatBeijingDateTime(record.updatedAt || new Date()),
      actionName: `[Hermes事件流] ${request}`,
      orchestratorMode: targetMode,
      agentType: record.metadata?.targetAgentKey || 'orchestrator',
      instructionText: request,
      status,
      analysisId: record.analysisId,
      runId: record.runId,
      steps: [
        { step: "1", title: "指令解析与委员分拨对齐", desc: "已创建Hermes分析任务并保存analysis记录", status: stepStatus("1") },
        { step: "2", title: "合规审查与专家自检检索", desc: "Hermes Agent事件流已接入后端SSE通道", status: stepStatus("2") },
        { step: "3", title: targetMode === 'single' ? "专家独任智能决策审核" : "委员在线辩论交叉审计", desc: `已接收 ${record.eventCount || 0} 条分析事件`, status: stepStatus("3") },
        { step: "4", title: "品质评估与自反打分修正", desc: "等待Hermes完成最终报告或人工授权", status: stepStatus("4") },
        { step: "5", title: "成果库封存与双向交付", desc: isCompleted ? "最终报告已写入项目成果目录" : "报告完成后将自动写入成果目录", status: stepStatus("5") },
      ],
      communicationTranscripts: [
        buildUserInstructionBubble(request, formatBeijingDateTime(record.updatedAt || new Date())),
        {
          senderName: "Hermes Agent",
          senderRole: isCompleted ? "任务完成" : isStopped ? "用户停止" : isFailed ? "任务异常" : isWaiting ? "等待授权" : "运行恢复",
          senderAvatar: isFailed ? "!" : isStopped ? "■" : "H",
          timestamp: "刚刚",
          content: isCompleted
            ? `analysisId=${record.analysisId} 已完成，报告已进入成果目录。`
            : isStopped
              ? `analysisId=${record.analysisId} 已停止。`
            : isFailed
              ? `analysisId=${record.analysisId} 状态为 ${runStatus}，未生成本地模拟报告。`
              : isWaiting
                ? `analysisId=${record.analysisId} 需要人工授权后继续。`
                : `analysisId=${record.analysisId} 正在运行，已恢复事件订阅。`,
          bubbleType: 'leader',
        },
      ],
    };
  }, [buildUserInstructionBubble, userAvatar, userNickname, userRole]);

  // In-card confirmation id state for safe undoing without browser block modals
  const [confirmUndoId, setConfirmUndoId] = React.useState<string | null>(null);

  // Word-style persistent revision history
  const [revisions, setRevisions] = React.useState<ReportRevision[]>([]);

  // Proactive sync effect: Reset index and select active report categories automatically when projects or selections change
  React.useEffect(() => {
    if (currentProject && currentProject.evaluations) {
      const activeList = currentProject.evaluations[selectedReportKey] || [];
      if (activeList.length === 0) {
        // Find if there is any other key that actually has historical records
        const keys = ['orchestrator', 'law_review', 'evaluation', 'risk_review'];
        const firstActiveKey = keys.find(k => currentProject.evaluations[k] && currentProject.evaluations[k].length > 0);
        if (firstActiveKey) {
          setSelectedReportKey(firstActiveKey);
          setSelectedReportIndex(0);
        }
      } else if (selectedReportIndex >= activeList.length) {
        setSelectedReportIndex(0);
      }
    }
  }, [selectedProjectId, selectedReportKey, projects, currentProject]);

  // Safe reset when switching reports/versions
  React.useEffect(() => {
    setSelectedParagraphs([]);
  }, [selectedProjectId, selectedReportKey, selectedReportIndex]);

  // Synchronously compute the top offsets of revised paragraphs in the grid so review cards float adjacent to them
  const recalculateRevisionsOffsets = React.useCallback(() => {
    const root = document.getElementById("expert-reports-grid-root");
    if (!root) return;

    const rootRect = root.getBoundingClientRect();
    const projectRevs = revisions.filter(
      r => r.projectId === currentProject?.id && r.category === selectedReportKey
    );
    
    const newOffsets: Record<string, number> = {};
    projectRevs.forEach(rev => {
      const pEl = document.querySelector(`[data-paragraph-rev-id="${rev.id}"]`);
      if (pEl) {
        const pRect = pEl.getBoundingClientRect();
        newOffsets[rev.id] = pRect.top - rootRect.top;
      }
    });

    setRevisionsOffsets(newOffsets);
  }, [revisions, currentProject, selectedReportKey]);

  React.useEffect(() => {
    if (workspaceSubTab !== 'outcome') return;
    
    // Initial calculation
    recalculateRevisionsOffsets();

    const handleScrollUpdate = () => {
      requestAnimationFrame(recalculateRevisionsOffsets);
    };

    window.addEventListener("scroll", handleScrollUpdate, { capture: true, passive: true });
    window.addEventListener("resize", handleScrollUpdate, { passive: true });

    const docLayout = document.querySelector(".prose")?.parentElement;
    docLayout?.addEventListener("scroll", handleScrollUpdate, { passive: true });

    const syncInterval = setInterval(recalculateRevisionsOffsets, 300);

    return () => {
      window.removeEventListener("scroll", handleScrollUpdate, { capture: true });
      window.removeEventListener("resize", handleScrollUpdate);
      docLayout?.removeEventListener("scroll", handleScrollUpdate);
      clearInterval(syncInterval);
    };
  }, [workspaceSubTab, recalculateRevisionsOffsets]);

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = React.useState(false);

  // Manual Creation project fields
  const [isCreatingProject, setIsCreatingProject] = React.useState(false);
  const [newProjName, setNewProjName] = React.useState("");
  const [newProjCustomer, setNewProjCustomer] = React.useState("");
  const [newProjType, setNewProjType] = React.useState<ProjectType>("NPA_ACQUISITION");
  const [newProjDesc, setNewProjDesc] = React.useState("");
  const [newProjBusinessFields, setNewProjBusinessFields] = React.useState<Record<string, any>>({});

  // Initial files during creation
  const [initialFiles, setInitialFiles] = React.useState<{ file: File; name: string; type: ProjectFile['type']; contentSnippet: string; size: number }[]>([]);
  const [isInitialFileDragActive, setIsInitialFileDragActive] = React.useState(false);
  const [tempFileName, setTempFileName] = React.useState("");
  const [tempFileType, setTempFileType] = React.useState<ProjectFile['type']>("DD_Report");
  const [tempFileSnippet, setTempFileSnippet] = React.useState("");

  const [targetSubfolderIdForUpload, setTargetSubfolderIdForUpload] = React.useState<string | null>(null);
  const [previewFile, setPreviewFile] = React.useState<ProjectFile | null>(null);
  const subfolderFileInputRef = React.useRef<HTMLInputElement>(null);

  const inferInitialProjectFileType = (file: File): ProjectFile['type'] => {
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('财务') || lowerName.includes('账单') || lowerName.includes('审计') || lowerName.includes('financial') || lowerName.includes('money')) {
      return 'Financial';
    }
    if (lowerName.includes('物权') || lowerName.includes('查封') || lowerName.includes('裁决') || lowerName.includes('权属') || lowerName.includes('ownership') || lowerName.includes('law')) {
      return 'Ownership';
    }
    return 'DD_Report';
  };

  const appendInitialProjectFiles = (files: File[]) => {
    if (!files.length) return;
    setInitialFiles(prev => [
      ...prev,
      ...files.map(file => ({
        file,
        name: file.name,
        type: inferInitialProjectFileType(file),
        size: file.size,
        contentSnippet: "待创建项目后由后端解析入库",
      })),
    ]);
  };

  // Load baseline on startup
  const fetchAllData = async () => {
    try {
      const projRes = await fetch("/api/projects");
      const list: AMCProject[] = await projRes.json();
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }

      const kbRes = await fetch("/api/knowledge");
      const kbData: KnowledgeItem[] = await kbRes.json();
      setKbItems(kbData);

      const suggestionRes = await fetch("/api/knowledge/suggestions");
      if (suggestionRes.ok) {
        const suggestionData: KnowledgeWriteSuggestionReview[] = await suggestionRes.json();
        setKnowledgeSuggestions(suggestionData);
      }

      const agentConfigRes = await fetch("/api/agent-config");
      if (agentConfigRes.ok) {
        const agentConfigData: AgentConfigBundle = await agentConfigRes.json();
        setAgentConfigBundle(agentConfigData);
      }

      const revisionRes = await fetch("/api/revisions");
      if (revisionRes.ok) {
        const revisionData: ReportRevision[] = await revisionRes.json();
        setRevisions(revisionData);
      }

      const analysisRes = await fetch("/api/analysis/recent?limit=20");
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json() as { records?: AnalysisSummary[] };
        const projectById = new Map(list.map(project => [project.id, project]));
        const restoredEvents = (analysisData.records || [])
          .filter(record => record.analysisId && record.projectId && projectById.has(record.projectId))
          .map(record => buildExecutionEventFromAnalysis(record, projectById.get(record.projectId!)!));

        if (restoredEvents.length) {
          setExecutionEvents(prev => {
            const existingIds = new Set(prev.map(event => event.id));
            return [...restoredEvents.filter(event => !existingIds.has(event.id)), ...prev];
          });
          restoredEvents.forEach(event => {
            const analysisId = event.id.replace(/^analysis-/, "");
            void hydrateExecutionEventHistory(analysisId, event.id);
          });
        }

        const runningRecords = (analysisData.records || []).filter(record =>
          record.analysisId
          && record.projectId
          && projectById.has(record.projectId)
          && /^(queued|running|in_progress)$/i.test(record.runStatus || '')
        );
        runningRecords.forEach(record => {
          if (subscribedAnalysisIdsRef.current.has(record.analysisId)) return;
          const targetAgentKey = (record.metadata?.targetAgentKey || 'orchestrator') as AgentType;
          subscribeToEvaluationEvents(record.analysisId, `analysis-${record.analysisId}`, targetAgentKey);
        });
        if (runningRecords.length) {
          setIsEvaluating(true);
          setActiveAnalysisId(runningRecords[0].analysisId);
          setActiveExecutionEventId(`analysis-${runningRecords[0].analysisId}`);
        }
      }
    } catch (e) {
      console.error("Baseline fetch failed:", e);
    }
  };

  React.useEffect(() => {
    fetchAllData();
  }, []);

  const uploadProjectFile = async (projectId: string, fileType: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", fileType);
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "文件上传解析失败");
    return await res.json() as ProjectFile;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjCustomer) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjName,
          customerName: newProjCustomer,
          projectType: newProjType,
          description: newProjDesc,
          businessFields: newProjBusinessFields,
        })
      });
      const created: AMCProject = await res.json();
      const uploadedFiles: ProjectFile[] = [];
      for (const item of initialFiles) {
        uploadedFiles.push(await uploadProjectFile(created.id, item.type, item.file));
      }
      const hydratedProject: AMCProject = {
        ...created,
        files: [...(created.files || []), ...uploadedFiles],
        status: uploadedFiles.length && created.status === 'Draft' ? 'DataCollected' : created.status,
      };
      setProjects(prev => [hydratedProject, ...prev]);
      setSelectedProjectId(created.id);
      setCurrentMode('work');
      setIsCreatingProject(false);
      setIsProjectDrawerOpen(false);
      // reset fields
      setNewProjName("");
      setNewProjCustomer("");
      setNewProjDesc("");
      setNewProjBusinessFields({});
      setInitialFiles([]);
      setTempFileName("");
      setTempFileSnippet("");
      if (uploadedFiles.length) addToast(`项目已创建，${uploadedFiles.length} 个初始材料已上传并解析。`, "success");
    } catch (err) {
      console.error(err);
      addToast("项目创建或初始材料上传失败，请稍后重试。", "error");
    }
  };

  const [expandedFolders, setExpandedFolders] = React.useState<Record<string, boolean>>({
    "1": true,
    "1.1": true,
    "1.2": true,
    "2": true,
    "2.1": true,
    "2.2": true,
    "2.3": true,
    "2.4": true
  });

  const handleUploadFileToSubfolder = async (subfolderId: string, file: File) => {
    if (!currentProject) return;

    try {
      const addedFile = await uploadProjectFile(currentProject.id, subfolderId, file);

      setProjects(prev => prev.map(p => {
        if (p.id === currentProject.id) {
          const files = [...p.files, addedFile];
          const nextStatus = p.status === 'Draft' ? 'DataCollected' : p.status;
          return { ...p, files, status: nextStatus };
        }
        return p;
      }));
      addToast(addedFile.parseStatus === "parsed" ? "文件已上传并完成文本解析。" : `文件已上传，解析失败：${addedFile.parseError || "暂不支持该格式"}`, addedFile.parseStatus === "parsed" ? "success" : "error");
    } catch (err) {
      console.error("文件上传失败:", err);
      const message = err instanceof Error ? err.message : "请检查格式或稍后重试";
      addToast(
        /exceeds \d+ byte limit/i.test(message)
          ? `文件超过项目资料上传大小限制：${message}。可通过 PROJECT_FILE_MAX_BYTES 调整。`
          : `文件上传失败：${message}`,
        "error",
      );
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!currentProject) return;

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/files/${fileId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setProjects(prev => prev.map(p => {
          if (p.id === currentProject.id) {
            return { ...p, files: p.files.filter(f => f.id !== fileId) };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error("删除文件失败:", err);
    }
  };

  const handleAttachFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newFileName) return;

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFileName,
          size: Math.floor(Math.random() * 20000) + 5000,
          type: newFileType,
          contentSnippet: newFileSnippet || "该报告包含了最新的评估细则及抵押物情况。"
        })
      });
      const addedFile: ProjectFile = await res.json();
      
      setProjects(prev => prev.map(p => {
        if (p.id === currentProject.id) {
          const files = [...p.files, addedFile];
          const nextStatus = p.status === 'Draft' ? 'DataCollected' : p.status;
          return { ...p, files, status: nextStatus };
        }
        return p;
      }));

      // reset attachment states
      setNewFileName("");
      setNewFileSnippet("");
    } catch (err) {
      console.error(err);
    }
  };

  const isRunningAnalysisStatus = (status?: string) => /^(queued|running|in_progress)$/i.test(status || '');
  const isUserStoppedAnalysisEvent = (event: any) => event?.type === 'analysis.failed' && /用户已停止|已停止|停止Hermes/i.test(event?.message || '');

  const bubbleForHermesEvent = (event: any): CommunicationBubble | null => {
    const now = "刚刚";
    const withSource = (bubble: CommunicationBubble): CommunicationBubble => ({ ...bubble, sourceEventType: event.type });
    switch (event.type) {
      case 'hermes.run.started':
        return withSource({ senderName: "Hermes Agent", senderRole: "远端多Agent运行器", senderAvatar: "H", timestamp: now, content: `Hermes run 已启动：${event.runId || 'pending'}，状态 ${event.status || 'running'}。`, bubbleType: 'leader' });
      case 'plan.created':
        return withSource({ senderName: "评估编排器", senderRole: "任务规划", senderAvatar: "编", timestamp: now, content: event.plan || "Hermes 已创建AMC评估计划。", bubbleType: 'leader' });
      case 'agent.started':
        return withSource({ senderName: hermesAgentDisplayName(event.agentId), senderRole: "专家智能体", senderAvatar: hermesAgentAvatar(event.agentId), timestamp: now, content: event.action || "开始执行专家审查任务。", bubbleType: hermesAgentBubbleType(event.agentId) });
      case 'agent.progress':
        return withSource({ senderName: hermesAgentDisplayName(event.agentId), senderRole: "专家智能体", senderAvatar: hermesAgentAvatar(event.agentId), timestamp: now, content: `${event.action || "正在处理"}${event.snippet ? `：${event.snippet}` : ''}`, bubbleType: hermesAgentBubbleType(event.agentId) });
      case 'hermes.output.delta':
        return withSource({ senderName: hermesAgentDisplayName(event.agentId), senderRole: "报告流式输出", senderAvatar: hermesAgentAvatar(event.agentId), timestamp: now, content: event.text || "正在生成报告正文。", bubbleType: hermesAgentBubbleType(event.agentId) });
      case 'hermes.tool.progress':
        return withSource({ senderName: "Hermes 工具执行器", senderRole: event.toolName || "Tool", senderAvatar: "T", timestamp: now, content: event.label || "工具调用完成。", bubbleType: 'leader' });
      case 'artifact.created':
        return withSource({ senderName: hermesAgentDisplayName(event.agentId), senderRole: "成果产物", senderAvatar: hermesAgentAvatar(event.agentId), timestamp: now, content: event.label || "Hermes 已生成阶段性产物。", bubbleType: hermesAgentBubbleType(event.agentId) });
      case 'amc.report.generated':
        return withSource({ senderName: "评估编排器", senderRole: "报告生成", senderAvatar: "编", timestamp: now, content: "Hermes 已产出最终报告正文，正在写入项目成果目录。", bubbleType: 'leader' });
      case 'analysis.completed':
        return withSource({ senderName: "评估编排器", senderRole: "流程闭环", senderAvatar: "编", timestamp: now, content: "真实 Hermes 多Agent事件流已完成，成果已写入项目报告目录。", bubbleType: 'leader' });
      case 'analysis.failed':
        if (isUserStoppedAnalysisEvent(event)) {
          return withSource({ senderName: "Hermes Agent", senderRole: "用户停止", senderAvatar: "■", timestamp: now, content: event.message || "用户已停止 Hermes Agent 分析。", bubbleType: 'leader' });
        }
        return withSource({ senderName: "Hermes Agent", senderRole: "运行失败", senderAvatar: "!", timestamp: now, content: event.message || "Hermes Agent 运行失败。", bubbleType: 'leader' });
      case 'analysis.stream_interrupted':
      case 'analysis.requires_action':
        return withSource({ senderName: "Hermes Agent", senderRole: "需要处理", senderAvatar: "!", timestamp: now, content: event.message || "Hermes 事件流需要人工处理。", bubbleType: 'leader' });
      default:
        return null;
    }
  };

  const mergeCommunicationBubble = (items: CommunicationBubble[], event: any, bubble: CommunicationBubble) => {
    const last = items[items.length - 1];
    if (event.type !== 'hermes.output.delta') {
      if (last?.senderRole === bubble.senderRole && last.content === bubble.content) return items;
      return [...items, bubble];
    }
    if (!last || last.senderName !== bubble.senderName || last.senderRole !== bubble.senderRole) return [...items, bubble];
    const mergedContent = `${last.content}${bubble.content}`.slice(-5000);
    return [
      ...items.slice(0, -1),
      {
        ...last,
        timestamp: bubble.timestamp,
        content: mergedContent.length >= 5000 ? `...${mergedContent}` : mergedContent,
      },
    ];
  };

  const applyHermesEventToExecutionEvent = (evt: ExecutionEvent, event: any): ExecutionEvent => {
    const bubble = bubbleForHermesEvent(event);
    const isStopped = isUserStoppedAnalysisEvent(event);
    const stepPatch = evt.steps.map(step => {
      if (event.type === 'analysis.failed' || event.type === 'analysis.stream_interrupted') {
        return step.status === 'active' ? { ...step, status: 'pending' as const } : step;
      }
      if (event.type === 'plan.created' || event.type === 'agent.started' || event.type === 'agent.progress' || event.type === 'hermes.tool.progress' || event.type === 'hermes.output.delta' || event.type === 'artifact.created') {
        if (step.step === '3') return { ...step, status: 'active' as const };
        return step.step === '1' || step.step === '2' ? { ...step, status: 'completed' as const } : step;
      }
      if (event.type === 'hermes.run.completed' || event.type === 'amc.report.generated') {
        return step.step === '5'
          ? { ...step, status: 'active' as const }
          : { ...step, status: 'completed' as const };
      }
      if (event.type === 'analysis.completed') {
        return { ...step, status: 'completed' as const };
      }
      return step;
    });

    return {
      ...evt,
      status: event.type === 'analysis.failed' || event.type === 'analysis.stream_interrupted'
        ? (isStopped ? 'stopped' : 'failed')
        : event.type === 'analysis.completed'
          ? 'completed'
          : 'active',
      steps: stepPatch,
      communicationTranscripts: bubble ? mergeCommunicationBubble(evt.communicationTranscripts, event, bubble) : evt.communicationTranscripts,
    };
  };

  const updateExecutionFromHermesEvent = (eventId: string, event: any) => {
    setExecutionEvents(prev => prev.map(evt => evt.id === eventId ? applyHermesEventToExecutionEvent(evt, event) : evt));
  };

  const hydrateExecutionEventHistory = async (analysisId: string, eventId: string) => {
    try {
      const response = await fetch(`/api/analysis/${encodeURIComponent(analysisId)}`);
      if (!response.ok) return;
      const data = await response.json() as AnalysisSummary;
      const events = (data.events || [])
        .filter(item => item.event)
        .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
        .map(item => item.event);
      if (!events.length) return;
      setExecutionEvents(prev => prev.map(evt => {
        if (evt.id !== eventId) return evt;
        const userInstructionBubble = evt.instructionText
          ? [buildUserInstructionBubble(evt.instructionText, evt.timestamp)]
          : [];
        return events.reduce((next, event) => applyHermesEventToExecutionEvent(next, event), {
          ...evt,
          communicationTranscripts: userInstructionBubble,
        });
      }));
    } catch (error) {
      console.error("Hydrate Hermes event history failed:", error);
    }
  };

  const hermesAgentDisplayName = (agentId?: string) => {
    if (agentId === 'legal_reviewer') return '法律审查专家';
    if (agentId === 'valuation_auditor') return '估值审核专家';
    if (agentId === 'risk_assessor') return '风险评估专家';
    if (agentId === 'industry_analyst') return '行业分析专家';
    return '评估编排器';
  };

  const hermesAgentAvatar = (agentId?: string) => {
    if (agentId === 'legal_reviewer') return '法';
    if (agentId === 'valuation_auditor') return '估';
    if (agentId === 'risk_assessor') return '风';
    if (agentId === 'industry_analyst') return '行';
    return '编';
  };

  const hermesAgentBubbleType = (agentId?: string) => {
    if (agentId === 'legal_reviewer') return 'lawyer';
    if (agentId === 'valuation_auditor') return 'valuer';
    if (agentId === 'risk_assessor') return 'risk';
    return 'leader';
  };

  const subscribeToEvaluationEvents = (analysisId: string, eventId: string, targetAgentKey: AgentType) => {
    if (subscribedAnalysisIdsRef.current.has(analysisId)) return () => {};
    subscribedAnalysisIdsRef.current.add(analysisId);
    let afterSequence = 0;
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let source: EventSource | undefined;

    const connect = () => {
      if (closed) return;
      source = new EventSource(`/api/analysis/${encodeURIComponent(analysisId)}/events?after=${afterSequence}`);

      source.onmessage = async (message) => {
        if (closed) return;
        try {
          const payload = JSON.parse(message.data) as { sequence?: number; event?: any };
          if (payload.sequence !== undefined) afterSequence = Math.max(afterSequence, payload.sequence);
          const event = payload.event || payload;
          updateExecutionFromHermesEvent(eventId, event);
          if (event.type === 'analysis.completed') {
            closed = true;
            subscribedAnalysisIdsRef.current.delete(analysisId);
            source?.close();
            const projRes = await fetch("/api/projects");
            const list: AMCProject[] = await projRes.json();
            setProjects(list);
            setEvalSuccessMessage("✔ 真实 Hermes 多Agent事件流已完成，报告已写入成果目录。");
            setInstructionText("");
            setActiveTab('workspace');
            setWorkspaceSubTab('outcome');
            setSelectedReportKey(targetAgentKey);
            setSelectedReportIndex(0);
            setIsEvaluating(false);
            setActiveAnalysisId(prev => prev === analysisId ? null : prev);
            setActiveExecutionEventId(prev => prev === eventId ? null : prev);
          }
          if (event.type === 'analysis.failed' || event.type === 'analysis.stream_interrupted') {
            closed = true;
            subscribedAnalysisIdsRef.current.delete(analysisId);
            source?.close();
            const stoppedByUser = isUserStoppedAnalysisEvent(event);
            setEvalSuccessMessage(null);
            if (!stoppedByUser) addToast(event.message || "Hermes Agent 执行失败，未生成本地模拟报告。", "error");
            setIsEvaluating(false);
            setActiveAnalysisId(prev => prev === analysisId ? null : prev);
            setActiveExecutionEventId(prev => prev === eventId ? null : prev);
          }
          if (event.type === 'analysis.requires_action') {
            closed = true;
            subscribedAnalysisIdsRef.current.delete(analysisId);
            source?.close();
            addToast(event.message || "Hermes Agent 需要人工授权后继续。", "info");
            setIsEvaluating(false);
            setActiveAnalysisId(prev => prev === analysisId ? null : prev);
            setActiveExecutionEventId(prev => prev === eventId ? null : prev);
          }
        } catch (error) {
          console.error("Hermes SSE parse failed:", error);
        }
      };

      source.onerror = async () => {
        if (closed) return;
        source?.close();
        try {
          const response = await fetch(`/api/analysis/${encodeURIComponent(analysisId)}`);
          const data = response.ok ? await response.json() as AnalysisSummary : null;
          if (data?.events?.length) {
            await hydrateExecutionEventHistory(analysisId, eventId);
            afterSequence = Math.max(afterSequence, ...data.events.map(item => Number(item.sequence || 0)));
          }
          if (response.ok && data?.runStatus === 'completed') {
            closed = true;
            subscribedAnalysisIdsRef.current.delete(analysisId);
            setExecutionEvents(prev => prev.map(evt => evt.id === eventId
              ? { ...evt, status: 'completed', steps: evt.steps.map(step => ({ ...step, status: 'completed' as const })) }
              : evt));
            const projRes = await fetch("/api/projects");
            const list: AMCProject[] = await projRes.json();
            setProjects(list);
            setEvalSuccessMessage("✔ 真实 Hermes 多Agent事件流已完成，报告已写入成果目录。");
            setInstructionText("");
            setActiveTab('workspace');
            setWorkspaceSubTab('outcome');
            setSelectedReportKey(targetAgentKey);
            setSelectedReportIndex(0);
            setIsEvaluating(false);
            setActiveAnalysisId(prev => prev === analysisId ? null : prev);
            setActiveExecutionEventId(prev => prev === eventId ? null : prev);
            return;
          }
          if (response.ok && data?.runStatus === 'requires_action') {
            closed = true;
            subscribedAnalysisIdsRef.current.delete(analysisId);
            addToast("Hermes Agent 需要人工授权后继续。", "info");
            setIsEvaluating(false);
            setActiveAnalysisId(prev => prev === analysisId ? null : prev);
            setActiveExecutionEventId(prev => prev === eventId ? null : prev);
            return;
          }
          if (response.ok && isRunningAnalysisStatus(data?.runStatus)) {
            reconnectTimer = setTimeout(connect, 1500);
            return;
          }
        } catch (error) {
          console.error("Hermes SSE reconnect check failed:", error);
        }
        closed = true;
        subscribedAnalysisIdsRef.current.delete(analysisId);
        setExecutionEvents(prev => prev.map(evt => evt.id === eventId ? { ...evt, status: 'failed' } : evt));
        addToast(`Hermes 事件流连接中断，请稍后从 analysis ${analysisId} 恢复。已接收序号：${afterSequence}`, "error");
        setIsEvaluating(false);
        setActiveAnalysisId(prev => prev === analysisId ? null : prev);
        setActiveExecutionEventId(prev => prev === eventId ? null : prev);
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      subscribedAnalysisIdsRef.current.delete(analysisId);
      source?.close();
    };
  };

  const handleStopActiveAnalysis = async () => {
    if (!activeAnalysisId || isStoppingAnalysis) return;
    setIsStoppingAnalysis(true);
    try {
      const response = await fetch(`/api/analysis/${encodeURIComponent(activeAnalysisId)}/stop`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Hermes Agent 停止失败。");
      }

      const stoppedAnalysisId = activeAnalysisId;
      const stoppedEventId = activeExecutionEventId;
      subscribedAnalysisIdsRef.current.delete(stoppedAnalysisId);
      setExecutionEvents(prev => prev.map(evt => {
        const matches = evt.id === stoppedEventId || evt.analysisId === stoppedAnalysisId;
        if (!matches) return evt;
        return {
          ...evt,
          status: 'stopped',
          steps: evt.steps.map(step => step.status === 'active' ? { ...step, status: 'pending' as const } : step),
          communicationTranscripts: mergeCommunicationBubble(evt.communicationTranscripts, { type: 'analysis.failed' }, {
            senderName: "Hermes Agent",
            senderRole: "用户停止",
            senderAvatar: "■",
            timestamp: "刚刚",
            content: "用户已停止Hermes AMC评估。",
            bubbleType: 'leader',
          }),
        };
      }));
      setIsEvaluating(false);
      setActiveAnalysisId(null);
      setActiveExecutionEventId(null);
      addToast("已发送停止指令，Hermes Agent 分析已终止。", "info");
    } catch (error) {
      console.error("Hermes stop failed:", error);
      addToast(error instanceof Error ? error.message : "Hermes Agent 停止失败。", "error");
    } finally {
      setIsStoppingAnalysis(false);
    }
  };

  const buildEvaluationActionLabel = (mode: OrchestratorMode, instruction: string) => {
    let actionLabel = "";
    if (mode === 'single') {
      const name = currentSelectedRole?.name || "专家";
      actionLabel = `[指向指派] 由 ${name} 针对性执行审查并撰写报告`;
    } else if (mode === 'chain') {
      actionLabel = `[顺序执行] 启动法务合规、项目评估、风审汇总串行流程`;
    } else {
      actionLabel = `[智能规划] 根据指令意图智能推荐并执行智能体交叉会商`;
    }

    if (instruction) actionLabel += `（针对批示："${instruction.substring(0, 15)}..."）`;
    return actionLabel;
  };

  const buildLiveExecutionEvent = (
    eventId: string,
    mode: OrchestratorMode,
    eventInstruction: string,
    options?: { status?: ExecutionEvent['status']; planningOnly?: boolean },
  ): ExecutionEvent => {
    const timestampStr = currentBeijingDateTime();
    const planningOnly = Boolean(options?.planningOnly);
    return {
      id: eventId,
      projectId: currentProject!.id,
      projectName: currentProject!.name,
      user: userNickname || "Lucky Ding",
      userRole: userRole || "首席信批合规官",
      userAvatar: userAvatar || "LD",
      timestamp: timestampStr,
      actionName: planningOnly ? `[智能规划] 正在理解用户指令并判断后续操作` : buildEvaluationActionLabel(mode, eventInstruction),
      orchestratorMode: mode,
      agentType: selectedAgent,
      instructionText: eventInstruction || undefined,
      status: options?.status || 'active',
      steps: planningOnly ? [
        { step: "1", title: "智能规划意图理解", desc: "正在调用 Hermes 理解用户真实意图，判断是否需要启动评估", status: "active" },
        { step: "2", title: "信息完整性校验", desc: "等待意图理解结果，必要时将反问补充信息", status: "pending" },
        { step: "3", title: "正式评估任务创建", desc: "仅在意图明确且信息充分后创建 Hermes 分析任务", status: "pending" },
        { step: "4", title: "专家协作执行", desc: "正式任务启动后接入真实 Hermes 事件流", status: "pending" },
        { step: "5", title: "成果库封存与双向交付", desc: "报告完成后将自动写入成果目录", status: "pending" }
      ] : [
        { step: "1", title: "指令解析与委员分拨对齐", desc: "正在智能解析控制台派发语境，确定对公底层不良债权核心风险点", status: "completed" },
        { step: "2", title: "合规审查与专家自检检索", desc: "自动匹配信托规范及司法红线自检规则知识，并提供上下文嵌入支持", status: "completed" },
        { 
          step: "3", 
          title: mode === 'single' ? "专家独任智能决策审核" : "委员在线辩论交叉审计", 
          desc: mode === 'single' ? "由核心专家智能体独立针对底稿执行单兵合规深度解析" : "各常任代表（法务、估值、风控）启动实时交叉辩论会商发言", 
          status: "active" 
        },
        { step: "4", title: "品质评估与自反打分修正", desc: "首席品质控制专家针对法规及金融风控指标对合并草稿进行自我打分评估纠错", status: "pending" },
        { step: "5", title: "成果库封存与双向交付", desc: "融合各委员会审议批件，生成具有高可用信托参考性质的多页最终文告底稿", status: "pending" }
      ],
      communicationTranscripts: [
        buildUserInstructionBubble(eventInstruction || "启动当前项目 Hermes AMC 多Agent协作评估")
      ]
    };
  };

  const addExecutionBubble = (eventId: string, bubble: CommunicationBubble) => {
    setExecutionEvents(prev => prev.map(evt => evt.id === eventId
      ? { ...evt, communicationTranscripts: [...evt.communicationTranscripts, bubble] }
      : evt
    ));
  };

  const startEvaluationRun = async (
    eventId: string,
    runInstruction: string,
    intent?: InstructionIntentResult,
  ) => {
    if (!currentProject) return;
    setIsEvaluating(true);
    setActiveAnalysisId(null);
    setActiveExecutionEventId(null);
    setEvalSuccessMessage(null);
    setWorkspaceSubTab('execution');

    const selectedSkills = currentSelectedWorkItem?.definition.skills || [];

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: selectedAgent,
          selectedSkills,
          orchestratorMode: orchestratorMode,
          userInstruction: runInstruction,
          domainId: currentAgentDomain?.id,
          roleId: currentSelectedRole?.id,
          workItemId: currentSelectedWorkItem?.id,
          instructionIntent: intent,
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.analysisId) {
        const targetAgentKey = orchestratorMode !== 'single' ? 'orchestrator' : selectedAgent;
        const resolvedRuntime = data.resolvedRuntime as ResolvedRuntimeResponse | undefined;
        const resolvedRuntimeLine = formatResolvedRuntime(resolvedRuntime);
        setActiveAnalysisId(data.analysisId);
        setActiveExecutionEventId(eventId);
        setExecutionEvents(prev => prev.map(evt => {
          if (evt.id !== eventId) return evt;
          return {
            ...evt,
            status: 'active',
            actionName: buildEvaluationActionLabel(orchestratorMode, runInstruction),
            instructionText: runInstruction || evt.instructionText,
            steps: buildLiveExecutionEvent(evt.id, orchestratorMode, runInstruction).steps,
            analysisId: data.analysisId,
            runId: data.runId,
            communicationTranscripts: [
              ...evt.communicationTranscripts,
              {
                senderName: "Hermes Agent",
                senderRole: "远端多Agent运行器",
                senderAvatar: "H",
                timestamp: "刚刚",
                content: [`真实 Hermes 任务已创建，analysisId=${data.analysisId}，正在订阅事件流。`, resolvedRuntimeLine].filter(Boolean).join('\n'),
                bubbleType: 'leader',
              }
            ],
          };
        }));
        subscribeToEvaluationEvents(data.analysisId, eventId, targetAgentKey);
      } else {
        const message = data.message || data.error || "Hermes Agent API 启动失败，未生成本地模拟报告。";
        setExecutionEvents(prev => prev.map(evt => {
          if (evt.id === eventId) {
            return {
              ...evt,
              status: 'failed',
              communicationTranscripts: [
                ...evt.communicationTranscripts,
                { senderName: "Hermes Agent", senderRole: "启动失败", senderAvatar: "!", timestamp: "刚刚", content: message, bubbleType: 'leader' }
              ],
            };
          }
          return evt;
        }));
        addToast(message, "error");
        setIsEvaluating(false);
        setActiveAnalysisId(null);
        setActiveExecutionEventId(null);
      }
    } catch (err) {
      console.error(err);
      setExecutionEvents(prev => prev.map(evt => {
        if (evt.id === eventId) {
          return { ...evt, status: 'failed' };
        }
        return evt;
      }));
      addToast("Hermes Agent API 请求失败，未生成本地模拟报告。", "error");
      setIsEvaluating(false);
      setActiveAnalysisId(null);
      setActiveExecutionEventId(null);
    }
  };

  const handleSubmitInstruction = async () => {
    if (!currentProject || isPlanningInstruction) return;

    const submittedInstruction = instructionText.trim();
    setInstructionText("");
    setReportDisplayTab('agentTrace');

    if (orchestratorMode !== 'discuss') {
      const eventId = `evt-live-${Date.now()}`;
      const liveEvent = buildLiveExecutionEvent(eventId, orchestratorMode, submittedInstruction);
      setExecutionEvents(prev => [liveEvent, ...prev]);
      setSelectedEventId(eventId);
      setPlanningClarificationContext(null);
      await startEvaluationRun(eventId, submittedInstruction);
      return;
    }

    const eventId = planningClarificationContext?.eventId || `evt-live-${Date.now()}`;
    setIsPlanningInstruction(true);
    setActiveAnalysisId(null);
    setActiveExecutionEventId(null);
    setEvalSuccessMessage(null);
    setWorkspaceSubTab('execution');

    if (planningClarificationContext) {
      addExecutionBubble(eventId, buildUserInstructionBubble(submittedInstruction || "补充智能规划所需信息"));
      setExecutionEvents(prev => prev.map(evt => evt.id === eventId ? {
        ...evt,
        status: 'active',
        steps: evt.steps.map(step => step.step === "2"
          ? { ...step, title: "补充信息理解", desc: "已收到用户补充，正在重新判断是否可启动评估", status: "active" as const }
          : step.step === "1"
            ? { ...step, status: "completed" as const }
            : step
        ),
      } : evt));
    } else {
      const planningEvent = buildLiveExecutionEvent(eventId, 'discuss', submittedInstruction, { planningOnly: true });
      setExecutionEvents(prev => [planningEvent, ...prev]);
      setSelectedEventId(eventId);
    }

    try {
      const response = await fetch(`/api/projects/${currentProject.id}/instruction-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInstruction: submittedInstruction,
          orchestratorMode,
          domainId: currentAgentDomain?.id,
          roleId: currentSelectedRole?.id,
          workItemId: currentSelectedWorkItem?.id,
          clarificationContext: planningClarificationContext ? {
            eventId: planningClarificationContext.eventId,
            originalInstruction: planningClarificationContext.originalInstruction,
            assistantQuestion: planningClarificationContext.assistantQuestion,
            previousSummary: planningClarificationContext.previousSummary,
          } : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.intent) {
        throw new Error(data.message || data.error || "Hermes 智能规划意图解析失败。");
      }

      const intent = data.intent as InstructionIntentResult;
      const recommendedRole = intent.recommendedRoleId
        ? agentConfigBundle.roles.find(role => role.id === intent.recommendedRoleId)
        : null;
      const recommendedWorkItem = intent.recommendedWorkItemId
        ? agentConfigBundle.workItems.find(item => item.id === intent.recommendedWorkItemId)
        : null;
      const recommendationLine = intent.decision === 'start_evaluation' && (recommendedRole || recommendedWorkItem)
        ? `推荐执行配置：${recommendedRole?.name || "待确认专家"} / ${recommendedWorkItem?.name || "待确认工作项"}`
        : "";
      const plannerBubble: CommunicationBubble = {
        senderName: "智能规划助手",
        senderRole: intent.decision === 'ask_clarification' ? "需要补充" : intent.decision === 'reply_only' ? "仅回复" : "意图理解",
        senderAvatar: "规",
        timestamp: "刚刚",
        content: intent.decision === 'ask_clarification'
          ? (intent.clarificationQuestion || intent.reply)
          : [intent.summary, recommendationLine, intent.reply].filter(Boolean).join('\n\n'),
        bubbleType: 'leader',
      };

      if (intent.decision === 'ask_clarification') {
        setPlanningClarificationContext({
          eventId,
          originalInstruction: planningClarificationContext?.originalInstruction || submittedInstruction,
          assistantQuestion: intent.clarificationQuestion || intent.reply,
          previousSummary: intent.summary,
        });
        setExecutionEvents(prev => prev.map(evt => evt.id === eventId ? {
          ...evt,
          status: 'waiting_input',
          steps: evt.steps.map(step => {
            if (step.step === "1") return { ...step, status: "completed" as const };
            if (step.step === "2") return { ...step, title: "等待用户补充信息", desc: intent.clarificationQuestion || "智能规划需要更多信息后再决定是否启动评估", status: "active" as const };
            return step;
          }),
          communicationTranscripts: [...evt.communicationTranscripts, plannerBubble],
        } : evt));
        addToast("智能规划需要补充信息，已在执行记录中提出反问。", "info");
        return;
      }

      if (intent.decision === 'reply_only') {
        setPlanningClarificationContext(null);
        setExecutionEvents(prev => prev.map(evt => evt.id === eventId ? {
          ...evt,
          status: 'completed',
          actionName: "[智能规划] 已回复用户，本次未启动正式评估",
          steps: evt.steps.map(step => step.step === "1"
            ? { ...step, status: "completed" as const }
            : step.step === "2"
              ? { ...step, title: "非评估意图处理", desc: "智能规划判断本次只需回复，不创建 Hermes 分析任务", status: "completed" as const }
              : step
          ),
          communicationTranscripts: [...evt.communicationTranscripts, plannerBubble],
        } : evt));
        addToast("智能规划已回复，本次未启动正式评估。", "info");
        return;
      }

      setPlanningClarificationContext(null);
      setExecutionEvents(prev => prev.map(evt => evt.id === eventId ? {
        ...evt,
        status: 'active',
        communicationTranscripts: [...evt.communicationTranscripts, plannerBubble],
        steps: evt.steps.map(step => {
          if (step.step === "1" || step.step === "2") return { ...step, status: "completed" as const };
          if (step.step === "3") return { ...step, title: "正式评估任务创建", desc: "意图明确，正在创建 Hermes 分析任务", status: "active" as const };
          return step;
        }),
      } : evt));
      await startEvaluationRun(eventId, intent.normalizedInstruction || submittedInstruction, intent);
    } catch (error) {
      console.error("Hermes instruction planning failed:", error);
      const message = error instanceof Error ? error.message : "Hermes 智能规划意图解析失败。";
      setExecutionEvents(prev => prev.map(evt => evt.id === eventId ? {
        ...evt,
        status: 'failed',
        communicationTranscripts: [
          ...evt.communicationTranscripts,
          { senderName: "智能规划助手", senderRole: "解析失败", senderAvatar: "!", timestamp: "刚刚", content: message, bubbleType: 'leader' },
        ],
      } : evt));
      addToast(message, "error");
      setPlanningClarificationContext(null);
    } finally {
      setIsPlanningInstruction(false);
    }
  };

  const handleUpdateRecordStatus = async (recordId: string, status: 'Confirmed' | 'Rejected', notes?: string) => {
    if (!currentProject) return;
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/evaluations/${recordId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh project state
        const projRes = await fetch("/api/projects");
        const list: AMCProject[] = await projRes.json();
        setProjects(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // State to track if segment was copied successfully
  const [copySuccess, setCopySuccess] = React.useState(false);

  const handleToggleSelectText = (text: string) => {
    setSelectedParagraphs(prev => {
      if (prev.includes(text)) {
        return prev.filter(t => t !== text);
      } else {
        return [...prev, text];
      }
    });
  };

  const handleCopySelectedText = () => {
    if (selectedParagraphs.length === 0) return;
    navigator.clipboard.writeText(selectedParagraphs.join("\n"));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleQuickFeedback = async () => {
    if (selectedParagraphs.length === 0) return;
    try {
      const selectedTextStr = selectedParagraphs.join("\n");
      const newItem = {
        category: "feedback" as const,
        title: `快速划线确认: 关键句存证 - ${currentProject.name}`,
        content: `【立项名称】: ${currentProject.name}
【用户圈选片段】:
${selectedTextStr}

【存证备注】: 用户直接在报告中划线勾选，标记为专家审核认领之重要知识资产，已自动同步沉淀。`,
        tags: ["意见存证", "快速划线", currentProject.projectType || "General"],
        source: "报告段落意见确认"
      };

      await handleUpdateKnowledge(newItem);
      addToast("反馈成功！划线内容已在合规风控系统中留下修订痕迹，并沉淀入意见存证/反馈知识库。", "success");
      setSelectedParagraphs([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendParagraphTuning = async () => {
    if (selectedParagraphs.length === 0 || !tuningInstruction.trim()) return;
    setIsTuningSubmitting(true);
    try {
      const activeList = currentProject.evaluations[selectedReportKey] || [];
      const activeRecord = activeList[selectedReportIndex] as EvaluationRecord | undefined;
      if (!activeRecord) return;

      const res = await fetch(`/api/projects/${currentProject.id}/evaluations/${activeRecord.id}/tune`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText: selectedParagraphs.join("\n"),
          instruction: tuningInstruction
        })
      });

      const data = await res.json();
      if (data.success && data.record) {
        // Update local state by replacing the specific evaluation items
        setProjects(prev => prev.map(p => {
          if (p.id === currentProject.id) {
            const updated = { ...p };
            const evals = updated.evaluations[selectedReportKey] || [];
            updated.evaluations[selectedReportKey] = evals.map(rec => {
              if (rec.id === activeRecord.id) {
                return data.record;
              }
              return rec;
            });
            return updated;
          }
          return p;
        }));

        if (data.revision) {
          setRevisions(prev => [data.revision, ...prev.filter(item => item.id !== data.revision.id)]);
        }

        // Reset inputs and modal
        setSelectedParagraphs([]);
        setTuningInstruction("");
        setIsTuningModalOpen(false);

        // Fetch updated knowledge base
        const kbRes = await fetch("/api/knowledge");
        const kbData: KnowledgeItem[] = await kbRes.json();
        setKbItems(kbData);

        addToast("已成功微调报告！Hermes Agent 已完成段落修订，结果已同步收录至反馈知识库。", "success");
      } else {
        addToast(data.error || "Hermes Agent 段落微调失败，请稍后重试。", "error");
      }
    } catch (err) {
      console.error("Tuning submission failed:", err);
      addToast("网络错误，发送微调请求失败。", "error");
    } finally {
      setIsTuningSubmitting(false);
    }
  };

  const handleUndoRevision = async (revId: string, item: any) => {
    try {
      const activeList = currentProject.evaluations[selectedReportKey] || [];
      // Robust lookup: find the exact record this revision was created for
      const activeRecord = activeList.find(rec => rec.id === item.recordId) as EvaluationRecord | undefined;
      if (!activeRecord) {
        await fetch(`/api/revisions/${encodeURIComponent(revId)}`, { method: "DELETE" }).catch(() => null);
        setRevisions(prev => prev.filter(r => r.id !== revId));
        addToast("由于在当前报告类别中找不到对应的原稿记录，已直接删除该项修订记录。", "success");
        return;
      }

      let currentContent = activeRecord.content;
      let replaced = false;

      // 1. Normalize helpers for robust text containment and replacement matches
      const cleanText = (val: string) => (val || "").replace(/\r\n/g, "\n").trim();
      const normContent = currentContent.replace(/\r\n/g, "\n");
      const normTunedText = cleanText(item.tunedText);
      const normOriginalText = cleanText(item.originalText);

      // Case A: Is the append feedback response block present in the end of the report?
      // "### 📝 智能微调修订反馈响应\n> **针对原文片段**: ..."
      const appendBlockHeader = "### 📝 智能微调修订反馈响应";
      if (normContent.includes(appendBlockHeader) && normContent.includes(normTunedText)) {
        const headerIdx = normContent.indexOf(appendBlockHeader);
        if (headerIdx !== -1) {
          const delimiterIdx = normContent.lastIndexOf("---", headerIdx);
          if (delimiterIdx !== -1) {
            currentContent = normContent.substring(0, delimiterIdx).trim();
            replaced = true;
          } else {
            currentContent = normContent.substring(0, headerIdx).trim();
            replaced = true;
          }
        }
      }

      // Case B: Is the line-by-line fallback marker present?
      // "📌 **智能微调修订**：[tunedText]"
      if (!replaced && normTunedText) {
        const pinPrefix1 = `\n\n📌 **智能微调修订**：${normTunedText}`;
        const pinPrefix2 = `\n📌 **智能微调修订**：${normTunedText}`;
        const pinPrefix3 = `📌 **智能微调修订**：${normTunedText}`;
        
        if (normContent.includes(pinPrefix1)) {
          currentContent = normContent.replace(pinPrefix1, "");
          replaced = true;
        } else if (normContent.includes(pinPrefix2)) {
          currentContent = normContent.replace(pinPrefix2, "");
          replaced = true;
        } else if (normContent.includes(pinPrefix3)) {
          currentContent = normContent.replace(pinPrefix3, "");
          replaced = true;
        }
      }

      // Case C: Standard exact or fuzzy replacement of tuned text
      if (!replaced && normTunedText) {
        // Direct string match
        if (normContent.includes(normTunedText)) {
          currentContent = normContent.replace(normTunedText, normOriginalText);
          replaced = true;
        } 
        // Substring comparison (exact raw includes)
        else if (item.tunedText && currentContent.includes(item.tunedText)) {
          currentContent = currentContent.replace(item.tunedText, item.originalText || "");
          replaced = true;
        }
        // Sequence comparison line-by-line helper for robust multiline segments matching
        else {
          const searchLines = normTunedText.split("\n").map(l => l.trim()).filter(Boolean);
          const docLines = normContent.split("\n").map(l => l.trim());
          if (searchLines.length > 0 && docLines.length >= searchLines.length) {
            for (let i = 0; i <= docLines.length - searchLines.length; i++) {
              let matchCount = 0;
              for (let j = 0; j < searchLines.length; j++) {
                if (docLines[i + j].includes(searchLines[j]) || searchLines[j].includes(docLines[i + j])) {
                  matchCount++;
                }
              }
              if (matchCount === searchLines.length) {
                const orgLines = normContent.split("\n");
                orgLines.splice(i, searchLines.length, normOriginalText);
                currentContent = orgLines.join("\n");
                replaced = true;
                break;
              }
            }
          }
        }
      }

      // Case D: Fuzzy fallback by line-by-line removal
      if (!replaced && normTunedText) {
        const tunedLines = normTunedText.split("\n").map(l => l.trim()).filter(Boolean);
        let tempContent = currentContent;
        let lineMatchCount = 0;
        for (const line of tunedLines) {
          if (line.length > 10 && tempContent.includes(line)) {
            tempContent = tempContent.replace(line, "");
            lineMatchCount++;
          }
        }
        if (lineMatchCount > 0 && lineMatchCount >= Math.min(2, tunedLines.length)) {
          currentContent = tempContent + "\n\n" + (item.originalText || "");
          replaced = true;
        }
      }

      // Case E: Emergency Snapshot Restoration!
      // If we still can't patch or if text has shifted slightly, definitely restore original snapshot!
      if (!replaced && item.originalContentSnapshot) {
        currentContent = item.originalContentSnapshot;
        replaced = true;
      }

      // Update backend record content
      const res = await fetch(`/api/projects/${currentProject.id}/evaluations/${activeRecord.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: activeRecord.status,
          notes: activeRecord.notes,
          content: currentContent
        })
      });

      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.map(p => {
          if (p.id === currentProject.id) {
            const updated = { ...p };
            const evals = updated.evaluations[selectedReportKey] || [];
            updated.evaluations[selectedReportKey] = evals.map(rec => {
              if (rec.id === activeRecord.id) {
                return { ...rec, content: currentContent };
              }
              return rec;
            });
            return updated;
          }
          return p;
        }));

        await fetch(`/api/revisions/${encodeURIComponent(revId)}`, { method: "DELETE" }).catch(() => null);
        setRevisions(prev => prev.filter(r => r.id !== revId));
        addToast("该项历史修订已彻底撤销，正文已恢复为修改前原文，右侧卡片已移除。", "success");
      } else {
        addToast("撤回修订失败，请稍后重试。", "error");
      }
    } catch (err) {
      console.error("Undo revision failed:", err);
      addToast("撤销时网络连接异常。", "error");
    }
  };

  const reloadKnowledgeData = async () => {
    const [kbRes, suggestionRes] = await Promise.all([
      fetch("/api/knowledge"),
      fetch("/api/knowledge/suggestions"),
    ]);
    if (kbRes.ok) setKbItems(await kbRes.json());
    if (suggestionRes.ok) setKnowledgeSuggestions(await suggestionRes.json());
  };

  const handleUpdateKnowledge = async (newItem: Omit<KnowledgeItem, 'id'>) => {
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "知识条目创建失败");
      const added: KnowledgeItem = await res.json();
      setKbItems(prev => [...prev, added]);
      return added;
    } catch (err) {
      console.error(err);
      addToast("知识条目保存失败，请稍后重试。", "error");
      throw err;
    }
  };

  const handleEditKnowledge = async (id: string, item: Omit<KnowledgeItem, 'id'>) => {
    const res = await fetch(`/api/knowledge/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      addToast("知识条目更新失败。", "error");
      throw new Error((await res.json().catch(() => ({}))).error || "知识条目更新失败");
    }
    const updated: KnowledgeItem = await res.json();
    setKbItems(prev => prev.map(existing => existing.id === updated.id ? updated : existing));
    addToast("知识条目已更新。", "success");
    return updated;
  };

  const handleDeleteKnowledge = async (id: string) => {
    const res = await fetch(`/api/knowledge/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      addToast("知识条目删除失败。", "error");
      throw new Error((await res.json().catch(() => ({}))).error || "知识条目删除失败");
    }
    setKbItems(prev => prev.filter(item => item.id !== id));
    addToast("知识条目及附件已删除。", "success");
  };

  const handleUploadKnowledgeAttachments = async (id: string, files: File[]) => {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/knowledge/${encodeURIComponent(id)}/attachments`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `附件 ${file.name} 上传失败`);
    }
    await reloadKnowledgeData();
    addToast("附件已上传并完成解析入库。", "success");
  };

  const handleDeleteKnowledgeAttachment = async (knowledgeId: string, attachmentId: string) => {
    const res = await fetch(`/api/knowledge/${encodeURIComponent(knowledgeId)}/attachments/${encodeURIComponent(attachmentId)}`, { method: "DELETE" });
    if (!res.ok) {
      addToast("附件删除失败。", "error");
      throw new Error((await res.json().catch(() => ({}))).error || "附件删除失败");
    }
    await reloadKnowledgeData();
    addToast("附件已删除。", "success");
  };

  const handleApproveKnowledgeSuggestion = async (id: string) => {
    const res = await fetch(`/api/knowledge/suggestions/${encodeURIComponent(id)}/approve`, { method: "POST" });
    if (!res.ok) {
      addToast("建议入库失败。", "error");
      throw new Error((await res.json().catch(() => ({}))).error || "建议入库失败");
    }
    await reloadKnowledgeData();
    addToast("Hermes 建议已批准并写入正式知识库。", "success");
  };

  const handleRejectKnowledgeSuggestion = async (id: string) => {
    const res = await fetch(`/api/knowledge/suggestions/${encodeURIComponent(id)}/reject`, { method: "POST" });
    if (!res.ok) {
      addToast("建议拒绝失败。", "error");
      throw new Error((await res.json().catch(() => ({}))).error || "建议拒绝失败");
    }
    await reloadKnowledgeData();
    addToast("Hermes 建议已拒绝。", "success");
  };

  // Automated document tag selector
  const autotagFile = (fileName: string, content: string): string => {
    const text = (fileName + content).toLowerCase();
    if (text.includes("法律") || text.includes("合规") || text.includes("合同") || text.includes("纠纷")) return "权属合规与物权保障";
    if (text.includes("财务") || text.includes("资不抵债") || text.includes("报表") || text.includes("负债")) return "信用债务与合并财务流";
    if (text.includes("评估") || text.includes("资产重估") || text.includes("不动产") || text.includes("折扣")) return "实体资产估值";
    return "基础审查尽调明细";
  };

  // Quick external search bridge
  const handleSearchQcc = async (query: string): Promise<QccResult> => {
    const res = await fetch(`/api/qcc?query=${encodeURIComponent(query)}`);
    return res.json();
  };

  const handleSearchStock = async (query: string): Promise<StockResult> => {
    const res = await fetch(`/api/stock?query=${encodeURIComponent(query)}`);
    return res.json();
  };

  const activeList = (currentProject && currentProject.evaluations && currentProject.evaluations[selectedReportKey]) || [];
  const activeRecord = activeList[selectedReportIndex] as EvaluationRecord | undefined;

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      {/* Premium Navigation Header */}
      <header style={{ backgroundColor: selectedMenuBg, borderColor: 'rgba(255,255,255,0.08)' }} className="text-white px-5 py-3 border-b shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div 
          onClick={() => setCurrentMode('home')} 
          className="flex items-center gap-3 cursor-pointer group"
          title="返回系统首页"
        >
          <div className={`p-2 bg-gradient-to-tr from-${activeColorBrand}-600 to-${activeColorBrand}-500 rounded-lg text-white shadow-md shadow-${activeColorBrand}-900/40 group-hover:scale-105 transition-all duration-200`}>
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2 group-hover:text-indigo-200 transition-colors">
              AMCAgents
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors">AMC项目审查智能体系统</p>
          </div>
        </div>

        {/* Top-Right Header Tools & User Info */}
        <div className="flex items-center gap-4">
          {currentProject && (
            <button
              onClick={() => setIsProjectDrawerOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-755 border border-slate-700/60 hover:${brandColors.borderPrimary} rounded-xl cursor-pointer transition-all active:scale-[0.98] text-left outline-none`}
              title="点击打开项目池抽屉，切换或立项重组项目"
            >
              <span className={`text-[10px] ${brandColors.textPrimary} font-bold flex items-center gap-1 flex-shrink-0`}>
                <span className={`w-1.5 h-1.5 ${brandColors.bgPrimary} rounded-full animate-pulse`}></span>
                当前工作区：
              </span>
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-[155px] md:max-w-[220px]" title={currentProject.name}>
                {currentProject.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </button>
          )}

          <div className="border-l border-slate-800 h-6 hidden sm:block" />

          {/* User Profile */}
          <div className="relative">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
              title="个人设置与系统风格配置"
            >
              <div className={`w-7 h-7 rounded-full ${brandColors.avatarBgGradient} flex items-center justify-center font-bold text-white text-[11px] uppercase shadow-inner`}>
                {userAvatar}
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-semibold text-slate-200 leading-none">{userNickname}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 leading-none">{userEmail}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Primary Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* SIDEBAR REMOVED - NOW HOSTED IN THE RIGHT SIDE SLIDE-OUT DRAWER FOR FULL WIDTH SPACIOUS WORKSPACE */}

        {/* WORKSPACE & DETAILS workspace */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Active Tab Contents Area */}
          <div className={currentMode === 'work' && currentProject ? "flex-1 min-h-0 overflow-hidden p-3 flex flex-col" : "flex-1 p-3 overflow-y-auto"}>
            {evalSuccessMessage && (
              <div className="mb-4 py-3.5 px-5 bg-emerald-50/60 border border-emerald-300/80 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-3xs animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-800 leading-relaxed">{evalSuccessMessage}</span>
                </div>
                <button 
                  onClick={() => setEvalSuccessMessage(null)} 
                  className="text-emerald-500 hover:text-emerald-700 transition-colors p-1 cursor-pointer flex flex-col gap-[3px] ml-4 shrink-0"
                  title="关闭"
                >
                  <div className="w-4.5 h-[2.2px] bg-emerald-500/80 rounded-xs" />
                  <div className="w-4.5 h-[2.2px] bg-emerald-500/80 rounded-xs" />
                  <div className="w-4.5 h-[2.2px] bg-emerald-500/80 rounded-xs" />
                  <div className="w-4.5 h-[2.2px] bg-emerald-500/80 rounded-xs" />
                  <div className="w-4.5 h-[2.2px] bg-emerald-500/80 rounded-xs" />
                </button>
              </div>
            )}

            {/* SYSTEM HOME PAGE */}
            {currentMode === 'home' && (
              <SystemHomePage 
                projects={projects}
                homeTypeFilter={homeTypeFilter}
                setHomeTypeFilter={setHomeTypeFilter}
                homeViewMode={homeViewMode}
                setHomeViewMode={setHomeViewMode}
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={(id) => {
                  setSelectedProjectId(id);
                  // Also select a proper initial tab and index if a project is opened
                  setSelectedReportIndex(0);
                }}
                setCurrentMode={setCurrentMode}
                currentTheme={currentTheme}
                activeColorBrand={activeColorBrand}
                setIsProjectDrawerOpen={setIsProjectDrawerOpen}
                setIsCreatingProject={setIsCreatingProject}
                projectTypesConfig={projectTypesConfig}
              />
            )}

            {/* TAB 1: WORKSPACE PLATFORM */}
            {currentMode === 'work' && currentProject && (
              <div className="flex-1 min-h-0 flex flex-col gap-4">
                {/* 1. MAIN OUTCOMES VIEW: Using modular ReportViewer */}
                <ReportViewer
                  currentProject={currentProject}
                  displayTab={reportDisplayTab}
                  setDisplayTab={setReportDisplayTab}
                  selectedReportKey={selectedReportKey}
                  setSelectedReportKey={setSelectedReportKey}
                  selectedReportIndex={selectedReportIndex}
                  setSelectedReportIndex={setSelectedReportIndex}
                  revisions={revisions}
                  hoveredRevisionId={hoveredRevisionId}
                  setHoveredRevisionId={setHoveredRevisionId}
                  isRightDrawerOpen={isRightDrawerOpen}
                  setIsRightDrawerOpen={setIsRightDrawerOpen}
                  rightDrawerContent={rightDrawerContent}
                  setRightDrawerContent={setRightDrawerContent}
                  selectedParagraphs={selectedParagraphs}
                  setSelectedParagraphs={setSelectedParagraphs}
                  tuningInstruction={tuningInstruction}
                  setTuningInstruction={setTuningInstruction}
                  isTuningSubmitting={isTuningSubmitting}
                  handleSendParagraphTuning={handleSendParagraphTuning}
                  handleUpdateRecordStatus={handleUpdateRecordStatus}
                  revisionsOffsets={revisionsOffsets}
                  isLargeScreen={isLargeScreen}
                  confirmUndoId={confirmUndoId}
                  setConfirmUndoId={setConfirmUndoId}
                  handleUndoRevision={handleUndoRevision}
                  currentTheme={currentTheme}
                  executionEvents={executionEvents}
                />

                {/* 2. AMC 专家意见定制化指令下达区 */}
	                <div className="mx-auto w-full md:min-w-[700px] max-w-[1100px] shrink-0 bg-white p-4 border border-slate-200 rounded-2xl shadow-xs space-y-3 text-left max-h-[42vh] overflow-visible">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className={`w-4 h-4 ${currentTheme.text}`} />
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                        AMC 专家意见定制化指令下达区
                      </h4>
                    </div>
                    
	                    <div ref={collabConsoleRef} className="relative flex items-center gap-2">
	                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">规划指派:</span>
	                      <button
	                        type="button"
	                        onClick={() => setIsCollabConsoleOpen(prev => !prev)}
	                        className={`max-w-[360px] truncate text-[10.5px] font-extrabold px-3 py-1 rounded-full border hover:bg-opacity-90 active:scale-98 transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer select-none ${currentTheme.badge}`}
	                      >
	                        {orchestratorMode === 'discuss' ? "🤖 智能规划 (按意图调用)" : 
	                         orchestratorMode === 'single' ? `👤 指定专家 (${currentSelectedRole?.name || "法务合规岗"} / ${currentSelectedWorkItem?.name || "默认工作项"})` :
	                         "⛓️ 顺序执行 (固定流程)"}
	                      </button>
	                      {isCollabConsoleOpen && (
	                        <div className="absolute right-0 bottom-full z-40 mb-2 w-[520px] max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-bottom-1 duration-150">
	                          <div className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white" />
	                          <div className="relative space-y-3">
	                            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
	                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">规划指派设置</span>
	                              <button
	                                type="button"
	                                onClick={() => setIsCollabConsoleOpen(false)}
	                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
	                                title="关闭规划指派设置"
	                              >
	                                <X className="h-3.5 w-3.5" />
	                              </button>
	                            </div>

	                            <div className="space-y-1.5 text-left">
	                              <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">规划机制</label>
	                              <div className="grid grid-cols-3 gap-1.5">
	                                {[
	                                  { mode: 'discuss', label: "智能规划", desc: "按意图调用" },
	                                  { mode: 'single', label: "指定专家", desc: "人工指定" },
	                                  { mode: 'chain', label: "顺序执行", desc: "固定流程" }
	                                ].map(w => (
	                                  <button
	                                    key={w.mode}
	                                    type="button"
	                                    onClick={() => {
	                                      setOrchestratorMode(w.mode as OrchestratorMode);
	                                      if (w.mode === 'single') {
	                                        setSelectedAgent('law_review');
	                                      } else {
	                                        setSelectedAgent('orchestrator');
	                                      }
	                                    }}
	                                    className={`rounded-lg border px-2 py-2 text-center transition-all ${
	                                      orchestratorMode === w.mode
	                                        ? `${currentTheme.accentBg} border-transparent font-bold shadow-xs`
	                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
	                                    }`}
	                                  >
	                                    <div className="text-[11px] font-extrabold">{w.label}</div>
	                                    <div className={`mt-0.5 text-[8px] font-semibold ${orchestratorMode === w.mode ? "text-white/80" : "text-slate-400"}`}>{w.desc}</div>
	                                  </button>
	                                ))}
	                              </div>
	                            </div>

	                            {orchestratorMode === 'single' ? (
	                              <div className="space-y-1.5 text-left animate-in fade-in duration-150">
	                                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">专家选择</label>
	                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
	                                  {currentAgentRoles.map(role => {
	                                    const isSelected = selectedAgentRoleId === role.id;
	                                    return (
	                                      <button
	                                        key={role.id}
	                                        type="button"
	                                        onClick={() => {
	                                          setSelectedAgentRoleId(role.id);
	                                          setSelectedAgent(role.agentType);
	                                          const firstWorkItem = agentConfigBundle.workItems.find(item => item.roleId === role.id && item.status !== 'inactive');
	                                          setSelectedAgentWorkItemId(firstWorkItem?.id || "");
	                                        }}
	                                        className={`rounded-lg border px-2 py-2 text-center text-[11px] font-bold transition-all ${
	                                          isSelected
	                                            ? `${currentTheme.accentBg} border-transparent shadow-3xs`
	                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
	                                        }`}
	                                      >
	                                        <span className="line-clamp-1">{role.name}</span>
	                                      </button>
	                                    );
	                                  })}
	                                </div>
	                                <label className="block pt-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">工作项选择</label>
	                                {currentRoleWorkItems.length ? (
	                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
	                                    {currentRoleWorkItems.map(item => {
	                                      const isSelected = currentSelectedWorkItem?.id === item.id;
	                                      return (
	                                        <button
	                                          key={item.id}
	                                          type="button"
	                                          onClick={() => setSelectedAgentWorkItemId(item.id)}
	                                          className={`rounded-lg border px-2.5 py-2 text-left transition-all ${
	                                            isSelected
	                                              ? `${currentTheme.accentBg} border-transparent shadow-3xs`
	                                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
	                                          }`}
	                                        >
	                                          <div className="line-clamp-1 text-[11px] font-extrabold">{item.name}</div>
	                                          <div className={`mt-0.5 line-clamp-2 text-[8.5px] font-semibold leading-snug ${isSelected ? "text-white/80" : "text-slate-400"}`}>
	                                            {item.description || "使用该工作项定义、知识资产与成果模板执行"}
	                                          </div>
	                                        </button>
	                                      );
	                                    })}
	                                  </div>
	                                ) : (
	                                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] font-semibold text-amber-800">
	                                    当前专家暂无可用工作项，请先在智能体配置中维护。
	                                  </div>
	                                )}
	                              </div>
	                            ) : (
	                              <div className="space-y-1.5 text-left animate-in fade-in duration-150">
	                                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">执行流程</label>
	                                {orchestratorMode === 'chain' && (
	                                  <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-150 bg-slate-50 px-2.5 py-2 text-[10px] font-semibold text-slate-600">
	                                    <span className="rounded-md bg-indigo-50 px-2 py-1 font-extrabold text-indigo-900">法务合规</span>
	                                    <span>→</span>
	                                    <span className="rounded-md bg-blue-50 px-2 py-1 font-extrabold text-blue-900">项目评估</span>
	                                    <span>→</span>
	                                    <span className="rounded-md bg-emerald-50 px-2 py-1 font-extrabold text-emerald-900">风审汇总</span>
	                                  </div>
	                                )}
	                                {orchestratorMode === 'discuss' && (
	                                  <div className="flex items-center gap-2 rounded-lg border border-slate-150 bg-slate-50 px-2.5 py-2 text-[10.5px] font-semibold text-slate-700">
	                                    <span className="text-sm">🔮</span>
	                                    <span>按本次指令意图智能调度对应专家。</span>
	                                  </div>
	                                )}
	                                {orchestratorMode === 'master-slave' && (
	                                  <div className="rounded-lg border border-slate-150 bg-slate-50 px-2.5 py-2 text-[10.5px] font-semibold leading-relaxed text-slate-600">
	                                    中枢统括派单，并联核实关键底稿与底层模型。
	                                  </div>
	                                )}
	                              </div>
	                            )}
	                          </div>
	                        </div>
		                      )}
		                    </div>
		                  </div>

	                  <div className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={instructionText}
                        onChange={(e) => setInstructionText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
                          e.preventDefault();
                          if (isEvaluating || isPlanningInstruction || isStoppingAnalysis) return;
                          void handleSubmitInstruction();
                        }}
                        placeholder="请输入本次特别审议的专家意见指引（例如：‘请法务专家核实债务人多头诉讼，限缩抵押率安全线’），系统将对智能研判做重点对准修正，不填则默认标准规划输出..."
                        className="instruction-input-scrollbar-hidden w-full text-xs font-medium text-slate-700 bg-slate-50/55 hover:bg-slate-50/80 focus:bg-white p-3 pr-14 pb-12 border border-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl transition-all h-24 resize-none leading-relaxed text-left"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (isEvaluating) {
                            void handleStopActiveAnalysis();
                          } else if (!isPlanningInstruction) {
                            void handleSubmitInstruction();
                          } else {
                            setWorkspaceSubTab('execution');
                          }
                        }}
                        disabled={isStoppingAnalysis || isPlanningInstruction || (isEvaluating && !activeAnalysisId)}
                        aria-label={isPlanningInstruction ? "正在智能规划" : isEvaluating ? (activeAnalysisId ? "停止分析" : "正在调度委员研判") : "下达指令"}
                        title={isPlanningInstruction ? "正在智能规划..." : isEvaluating ? (activeAnalysisId ? (isStoppingAnalysis ? "正在停止..." : "停止分析") : "正在调度委员研判...") : "下达指令"}
                        className={`absolute bottom-3 right-3 h-9 w-9 rounded-xl ${isEvaluating ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800" : `bg-${activeColorBrand}-600 hover:bg-${activeColorBrand}-700`} text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-md cursor-pointer select-none active:scale-95`}
                      >
                        {isPlanningInstruction ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isEvaluating ? (
                          <>
                            {isStoppingAnalysis ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Square className="w-3.5 h-3.5" />
                            )}
                          </>
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

                      {/* Right Slide Drawer Overlay (Self-Reflection and Sensitive words Compliance Audit) */}
                      <AnimatePresence>
                        {isRightDrawerOpen && (
                          <>
                            {/* Backdrop */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setIsRightDrawerOpen(false)}
                              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 cursor-pointer"
                            />

                            {/* Drawer panel */}
                            <motion.div
                              initial={{ x: "100%" }}
                              animate={{ x: 0 }}
                              exit={{ x: "100%" }}
                              transition={{ type: "spring", damping: 25, stiffness: 220 }}
                              className="fixed right-0 top-0 h-full w-[460px] max-w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50"
                            >
                              {/* Drawer Header */}
                              <div className="px-5 py-4.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {rightDrawerContent === 'reflection' ? (
                                    <>
                                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                      <div>
                                        <h3 className="font-bold text-slate-800 text-sm">首席品控官自我反思评级</h3>
                                        <p className="text-[9px] text-gray-400">Chief Quality Control Audit Reflection Board</p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                                      <div>
                                        <h3 className="font-bold text-slate-800 text-sm">敏感词汇与内容脱敏自检</h3>
                                        <p className="text-[9px] text-gray-400">Content Compliance & Mask Audit Logs</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setIsRightDrawerOpen(false)}
                                  className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-850 rounded-full cursor-pointer transition-colors font-bold"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* Drawer Body - Scrollable */}
                              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {rightDrawerContent === 'reflection' && activeRecord.reflection && (
                                  <div className="space-y-6">
                                    <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-md border border-slate-800 relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
                                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                                          🛡️ 品控多维打评分数
                                        </span>
                                        <span className="text-3xl font-black text-emerald-400 font-mono">${activeRecord.reflection.score || 85}分</span>
                                      </div>
                                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                        大模型品控审校引擎 (Chief Auditor) 根据当前生成文本的主客观推论连贯、司法判例契合等核心指标打分。门槛通过红线极值为 <span className="text-white font-black underline decoration-indigo-400">70分</span>：
                                      </p>
                                    </div>

                                    {/* Dimension Metrics */}
                                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
                                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        📐 多维审计评估得分
                                      </span>

                                      <div className="space-y-3">
                                        <div>
                                          <div className="flex justify-between text-xs text-slate-700 font-semibold">
                                            <span>内容完整度 (Completeness):</span>
                                            <span>${activeRecord.reflection.completeness}%</span>
                                          </div>
                                          <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
                                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${activeRecord.reflection.completeness}%` }} />
                                          </div>
                                        </div>

                                        <div>
                                          <div className="flex justify-between text-xs text-slate-700 font-semibold">
                                            <span>司法核验契合 (Compliance):</span>
                                            <span>${activeRecord.reflection.compliance}%</span>
                                          </div>
                                          <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
                                            <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${activeRecord.reflection.compliance}%` }} />
                                          </div>
                                        </div>

                                        <div>
                                          <div className="flex justify-between text-xs text-slate-700 font-semibold">
                                            <span>推导深度及防流折让 (Depth):</span>
                                            <span>${activeRecord.reflection.depth}%</span>
                                          </div>
                                          <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
                                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${activeRecord.reflection.depth}%` }} />
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Highlights Area */}
                                    <div className="space-y-2">
                                      <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                        <span>🟢</span> 优秀亮点指标 (Pros)
                                      </span>
                                      <ul className="space-y-2">
                                        {(activeRecord.reflection.pros || []).map((p, i) => (
                                          <li key={i} className="text-xs text-slate-700 leading-relaxed p-2.5 bg-emerald-50/20 border border-emerald-100/60 rounded-xl flex items-start gap-2">
                                            <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">•</span>
                                            <span>{p}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Suggestions Area */}
                                    <div className="space-y-2 border-t border-slate-100 pt-4.5">
                                      <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                                        <span>🟡</span> 专家整改优化方向 (Audit Suggestions)
                                      </span>
                                      <div className="p-3 bg-amber-50/20 border border-amber-100 rounded-xl text-xs text-slate-700 leading-relaxed font-normal">
                                        {activeRecord.reflection.suggestions}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {rightDrawerContent === 'audit' && (
                                  <div className="space-y-6">
                                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 text-xs leading-relaxed">
                                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        🛡️ 风险监测说明
                                      </span>
                                      <p className="text-slate-600">
                                        系统自动通过对大模型和专家智能体输出进行多重安全合规和敏感词拦截，识别可能危害资产归档安全的企业内部客户资料、敏感价格红线口径或存在重大法和不合规条款。
                                      </p>
                                    </div>

                                    <div className="space-y-3">
                                      <span className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                                        检测审计报告
                                      </span>

                                      {activeRecord.sensitiveWordsFlagged && activeRecord.sensitiveWordsFlagged.length > 0 ? (
                                        <div className="space-y-3">
                                          <div className="p-4 bg-rose-50 border border-rose-150 rounded-xl text-xs text-rose-800 space-y-2">
                                            <span className="font-extrabold block text-sm">🚨 发现高风险内容拦截：</span>
                                            <p className="text-[11px]">发现以下不合规或未充分脱敏的司法资产红线词：</p>
                                            <div className="space-y-1 mt-2">
                                              {activeRecord.sensitiveWordsFlagged.map((f, i) => (
                                                <div key={i} className="font-mono bg-white/75 px-2.5 py-1 rounded inline-block text-[10px] border border-rose-200 mr-2 mb-2">
                                                  {{f}}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                          <p className="text-[10px] text-slate-400 select-none">
                                            提示：对于被标记的不合规敏感词，建议立即使用智能微调功能，指示模型重新撰写，过滤去这些高风险合规死角。
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="p-5 bg-emerald-50/50 border border-emerald-150 rounded-2xl flex items-start gap-3">
                                          <span className="text-xl">✓</span>
                                          <div>
                                            <h4 className="text-xs font-bold text-emerald-800">未检测到任何高危敏感保密红线</h4>
                                            <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                                              本次生成的评估报告中，完全不包含需要强制脱敏或人工剥离的企业内部机密、隐匿负债、或未披露关联瑕疵。评定可安全对外呈报。
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Drawer Footer */}
                              <div className="px-5 py-4 bg-slate-50 border-t border-slate-205 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setIsRightDrawerOpen(false)}
                                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs transition-colors"
                                >
                                  关闭面板
                                </button>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>

            {/* CONFIGURATION MODE PAGE TABS */}
            {currentMode === 'config' && (
              <div className="space-y-6">
                {/* Banner Header */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm p-6 sm:p-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/60 via-slate-50/80 to-transparent z-0 pointer-events-none" />
                  
                  {/* Subtle decorative grid/lights */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-3">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-slate-300/10 ${currentTheme.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        activeColorBrand === 'purple' ? 'bg-purple-500' :
                        activeColorBrand === 'emerald' ? 'bg-emerald-500' :
                        activeColorBrand === 'amber' ? 'bg-amber-500' :
                        activeColorBrand === 'sky' ? 'bg-sky-500' :
                        activeColorBrand === 'cyan' ? 'bg-cyan-500' :
                        activeColorBrand === 'rose' ? 'bg-rose-500' :
                        'bg-indigo-500'
                      }`} />
                      系统智能配置面板
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight font-sans flex items-center gap-2">
                      <Settings className={`w-5 h-5 animate-spin-slow ${
                        activeColorBrand === 'purple' ? 'text-purple-600' :
                        activeColorBrand === 'emerald' ? 'text-emerald-600' :
                        activeColorBrand === 'amber' ? 'text-amber-600' :
                        activeColorBrand === 'sky' ? 'text-sky-600' :
                        activeColorBrand === 'cyan' ? 'text-cyan-600' :
                        activeColorBrand === 'rose' ? 'text-rose-600' :
                        'text-indigo-600'
                      }`} />
                      系统智能微调与配置
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed font-semibold">
                      在此页签定制化您的专家学者参数、系统专属政企知识底座、以及第三方外部数据集成集成微调组件。
                    </p>
                  </div>
                </div>

                {/* Sub-tabs header switches */}
                <div className="flex border-b border-slate-205 flex-wrap gap-1">
                  <button
                    onClick={() => setActiveTab('agents')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer select-none ${
                      activeTab === 'agents'
                        ? `${brandColors.tabSelectedBorder} ${brandColors.tabSelectedText} font-extrabold`
                        : "border-transparent text-slate-500 hover:text-slate-755 hover:border-slate-300 font-semibold"
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>专家管理</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer select-none ${
                      activeTab === 'knowledge'
                        ? `${brandColors.tabSelectedBorder} ${brandColors.tabSelectedText} font-extrabold`
                        : "border-transparent text-slate-500 hover:text-slate-755 hover:border-slate-300 font-semibold"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>知识管理</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('tools')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer select-none ${
                      activeTab === 'tools'
                        ? `${brandColors.tabSelectedBorder} ${brandColors.tabSelectedText} font-extrabold`
                        : "border-transparent text-slate-500 hover:text-slate-755 hover:border-slate-300 font-semibold"
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>数据整合</span>
                  </button>
                </div>

                {/* Container */}
                <div className="mt-4">
                  {activeTab === 'agents' && (
	                    <AgentSettings
	                      bundle={agentConfigBundle}
	                      knowledgeItems={kbItems}
	                      onRefresh={fetchAllData}
	                      currentTheme={currentTheme}
	                      activeColorBrand={activeColorBrand}
	                    />
                  )}

                  {activeTab === 'knowledge' && (
                    <KnowledgeBaseView
                      items={kbItems}
                      suggestions={knowledgeSuggestions}
                      onAddNewItem={handleUpdateKnowledge}
                      onUpdateItem={handleEditKnowledge}
                      onDeleteItem={handleDeleteKnowledge}
                      onUploadAttachments={handleUploadKnowledgeAttachments}
                      onDeleteAttachment={handleDeleteKnowledgeAttachment}
                      onApproveSuggestion={handleApproveKnowledgeSuggestion}
                      onRejectSuggestion={handleRejectKnowledgeSuggestion}
                      currentTheme={currentTheme}
                    />
                  )}

                  {activeTab === 'tools' && (
                    <ExternalToolsView
                      onSearchQcc={handleSearchQcc}
                      onSearchStock={handleSearchStock}
                      currentTheme={currentTheme}
                    />
                  )}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* 磁吸式悬浮左侧垂直滑动按钮 (Magnetic floating tab buttons for Left Drawers) */}
      {currentMode === 'work' && currentProject && (
        <div className="fixed left-0 top-[28%] z-40 flex flex-col gap-2 pointer-events-none select-none">
          {/* Button 1: 项目资料 */}
          <button
            onClick={() => {
              setIsLeftFilesOpen(true);
              setIsLeftExecOpen(false);
            }}
            className={`pointer-events-auto flex items-center justify-center gap-1.5 bg-${activeColorBrand}-600 shadow-${activeColorBrand}-950/20 hover:bg-${activeColorBrand}-700 text-white font-extrabold text-[10.5px] py-4 px-2 rounded-r-xl border border-l-0 border-${activeColorBrand}-500/30 shadow-md cursor-pointer transition-all [writing-mode:vertical-lr] tracking-widest text-center hover:translate-x-1 duration-200 active:scale-95`}
          >
            <span className="-rotate-90 sm:rotate-0 mb-1 text-xs">📂</span>
            <span>项目资料</span>
          </button>

          {/* Button 2: 执行记录 */}
          <button
            onClick={() => {
              setIsLeftExecOpen(true);
              setIsLeftFilesOpen(false);
            }}
            className={`pointer-events-auto flex items-center justify-center gap-1.5 bg-${activeColorBrand}-600 shadow-${activeColorBrand}-950/20 hover:bg-${activeColorBrand}-700 text-white font-extrabold text-[10.5px] py-4 px-2 rounded-r-xl border border-l-0 border-${activeColorBrand}-500/30 shadow-md cursor-pointer transition-all [writing-mode:vertical-lr] tracking-widest text-center hover:translate-x-1 duration-200 active:scale-95`}
          >
            <span className="-rotate-90 sm:rotate-0 mb-1 text-xs">⚡</span>
            <span>执行记录</span>
          </button>
        </div>
      )}

      {/* Drawer 1: Project Materials File tree structure */}
      {currentProject && (
        <FilesDrawer
          isOpen={isLeftFilesOpen}
          onClose={() => setIsLeftFilesOpen(false)}
          currentProject={currentProject}
          expandedFolders={expandedFolders}
          setExpandedFolders={setExpandedFolders}
          subfolderFileInputRef={subfolderFileInputRef}
          setTargetSubfolderIdForUpload={setTargetSubfolderIdForUpload}
          setPreviewFile={setPreviewFile}
          handleDeleteFile={handleDeleteFile}
          setSelectedReportKey={(key) => {
            setSelectedReportKey(key);
            setSelectedReportIndex(0);
            setReportDisplayTab('report');
          }}
          setSelectedReportIndex={setSelectedReportIndex}
          currentTheme={currentTheme}
        />
      )}
      <input
        ref={subfolderFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
          const files = Array.from(event.currentTarget.files || []) as File[];
          const targetFolder = targetSubfolderIdForUpload;
          event.currentTarget.value = "";
          if (!targetFolder || files.length === 0) return;
          for (const file of files) {
            await handleUploadFileToSubfolder(targetFolder, file);
          }
          setTargetSubfolderIdForUpload(null);
        }}
      />

      {/* Drawer 2: Agent Steppers & Real-time Execution progress */}
      {currentProject && (
        <ExecutionDrawer
          isOpen={isLeftExecOpen}
          onClose={() => setIsLeftExecOpen(false)}
          isEvaluating={isEvaluating}
          orchestratorMode={orchestratorMode}
          instructionText={instructionText}
          currentProject={currentProject}
          currentTheme={currentTheme}
          events={executionEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
        />
      )}

      {/* User Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="text-base">👤</span>
                <span>个人设置与系统风格配置</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] scrollbar-thin">
              {/* Avatar Live Preview Card */}
              <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4.5 flex items-center gap-4.5 shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg tracking-wider shadow-md uppercase shrink-0 transition-colors"
                     style={{ backgroundColor: tempThemeBrand === 'indigo' ? '#2563eb' : tempThemeBrand === 'amber' ? '#d97706' : '#059669' }}>
                  {tempAvatar || "LD"}
                </div>
                <div className="text-left space-y-1">
                  <h2 className="font-extrabold text-[#0f172a] text-base leading-none">
                    {tempNickname || "Lucky Ding"}
                  </h2>
                  <p className="text-xs font-semibold text-slate-550 leading-none">
                    {tempRole || "首席信批合规官"}
                  </p>
                  <p className="text-xs font-medium text-slate-400 leading-none">
                    {tempEmail || "lucky.ding@goupwith.com"}
                  </p>
                </div>
              </div>

              {/* Form: Select Mode */}
              <div className="space-y-3.5 text-left">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span>⚙️</span>
                  <span>选择系统运行模式（设置后根据模式自动切换对应界面）</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Work Mode Option */}
                  <button
                    type="button"
                    onClick={() => setTempMode("work")}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-[106px] ${
                      tempMode === "work"
                        ? "bg-indigo-50/20 border-blue-500 ring-1 ring-blue-500 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                          <ClipboardCheck className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-800">工作模式</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        tempMode === "work" ? "border-blue-600 text-blue-600" : "border-slate-300"
                      }`}>
                        {tempMode === "work" && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                      智能合规核校工作平台下，进行不良重组、信批方案核校、全流程审阅与微调修改。
                    </div>
                  </button>

                  {/* Config Mode Option */}
                  <button
                    type="button"
                    onClick={() => setTempMode("config")}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-[106px] ${
                      tempMode === "config"
                        ? "bg-indigo-50/20 border-blue-500 ring-1 ring-blue-500 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                          <Settings className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-800">配置模式</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        tempMode === "config" ? "border-blue-600 text-blue-600" : "border-slate-300"
                      }`}>
                        {tempMode === "config" && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                      可定制专家智能体、自建多模式本地及政企知识底座、并微调第三方外部数据整合系统。
                    </div>
                  </button>
                </div>
              </div>

              {/* Form: Choose Color theme */}
              <div className="space-y-3 text-left">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span>🎨</span>
                  <span>选择系统配色风格（主色）</span>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {/* Blue Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setTempThemeBrand("indigo");
                      setTempMenuBg("#0A0F1D");
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      tempThemeBrand === "indigo"
                        ? "bg-indigo-50/30 border-blue-500 ring-1 ring-blue-500 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block shrink-0 animate-pulse" />
                      <span className="text-xs font-bold text-[#1e293b]">科技深邃蓝</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      默认合规红线核验安全主题
                    </div>
                  </button>

                  {/* Gold Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setTempThemeBrand("amber");
                      setTempMenuBg("#1F1A0F");
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      tempThemeBrand === "amber"
                        ? "bg-amber-50/30 border-amber-600 ring-1 ring-amber-500 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block shrink-0 animate-pulse" />
                      <span className="text-xs font-bold text-[#1e293b]">财富尊享金</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      高端AMC评估报告专属风格
                    </div>
                  </button>

                  {/* Green Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setTempThemeBrand("emerald");
                      setTempMenuBg("#091E14");
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      tempThemeBrand === "emerald"
                        ? "bg-emerald-50/30 border-emerald-500 ring-1 ring-emerald-500 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0 animate-pulse" />
                      <span className="text-xs font-bold text-[#1e293b]">翡翠合规绿</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      ESG绿色环保与稳健金融风格
                    </div>
                  </button>
                </div>
              </div>

              {/* Form: Choose Header/Menu bg */}
              <div className="space-y-3 text-left">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span>🎨</span>
                  <span>与 {
                    tempThemeBrand === 'indigo' ? '科技深邃蓝' : 
                    tempThemeBrand === 'amber' ? '财富尊享金' : '翡翠合规绿'
                  } 适配的菜单背景</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-medium -mt-1.5 leading-snug">
                  已根据您选择的主色匹配了3种最完美的金融机构尊享菜单颜色，请选择：
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(tempThemeBrand === 'indigo' 
                    ? [
                        { name: "极客深空蓝", color: "#0A0F1D", desc: "商务科技极客质感" },
                        { name: "深海洋板岩", color: "#141C2F", desc: "低偏振沉静商务感" },
                        { name: "极北冷寒冬", color: "#091322", desc: "高稳健精细审慎" }
                      ]
                    : tempThemeBrand === 'amber'
                    ? [
                        { name: "琥珀尊爵金", color: "#1F1A0F", desc: "高净值财富典雅质感" },
                        { name: "皇家贵族褐", color: "#2A2215", desc: "经典重组稳重基调" },
                        { name: "黑金御前使", color: "#12110D", desc: "超高端私行领袖风范" }
                      ]
                    : [
                        { name: "翡翠森岭绿", color: "#091E14", desc: "ESG绿色低碳永续观" },
                        { name: "孔雀石墨黛", color: "#0E1B15", desc: "沉中求稳的中枢审美" },
                        { name: "磐石苍烟青", color: "#101C17", desc: "常青金融之磐石底色" }
                      ]
                  ).map((opt) => {
                    const isSelected = tempMenuBg === opt.color;
                    return (
                      <button
                        key={opt.color}
                        type="button"
                        onClick={() => setTempMenuBg(opt.color)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "bg-slate-50 border-blue-500 ring-1 ring-blue-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="w-2.5 h-2.5 rounded-full block shrink-0 border border-slate-250" style={{ backgroundColor: opt.color }} />
                          <span className="text-xs font-bold text-slate-800">{opt.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium leading-tight mb-1">
                          {opt.desc}
                        </div>
                        <div className="text-[9px] font-mono font-bold text-[#64748b] uppercase">
                          {opt.color}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-medium leading-snug">登出后将锁屏，登录后您的草稿与变动会保留在浏览器中。</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsLogoutConfirmOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs hover:-translate-y-0.5"
                >
                  <LogOut className="w-3.5 h-3.5 animate-pulse" />
                  <span>安全登出</span>
                </button>
              </div>
              
              <div className="flex justify-end gap-2.5 pt-1">
                <button 
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-150 rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setUserNickname(tempNickname);
                    setUserAvatar(tempAvatar);
                    setUserRole(tempRole);
                    setUserEmail(tempEmail);
                    setOverrideThemeBrand(tempThemeBrand);
                    setSelectedMenuBg(tempMenuBg);
                    setCurrentMode(tempMode);
                    if (tempMode === 'work') {
                      setActiveTab('workspace');
                    } else {
                      setActiveTab('agents');
                    }
                    setIsSettingsOpen(false);
                    setEvalSuccessMessage(`✓ 系统配置已即时应用。当前已成功切换至：${tempMode === 'work' ? '工作模式' : '配置模式'}。`);
                  }}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md active:shadow-xs hover:-translate-y-0.5 cursor-pointer"
                  style={{ backgroundColor: tempThemeBrand === 'indigo' ? undefined : tempThemeBrand === 'amber' ? '#d97706' : '#059669' }}
                >
                  应用保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 border border-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-5 h-5 text-red-600 animate-pulse" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">确定要安全登出系统吗？</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                安全退出后，您当前会话的不良重组评估及草稿自检进度可能会由于浏览器缓存释放而重置。
              </p>
            </div>
            
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex justify-center gap-2.5">
              <button 
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                返回工作台
              </button>
              <button 
                onClick={() => {
                  setIsLogoutConfirmOpen(false);
                  // Quick simulate logout feedback via system message banner
                  setEvalSuccessMessage("✓ 已安全登出。工作区已解密冻结，输入口令后可重新加载。");
                }}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
              >
                确定安全退出
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Document Preview Drawer - Rich Interactive Document Viewer Component */}
      {previewFile && (
        <DocumentPreviewer 
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          currentTheme={currentTheme}
        />
      )}

      {/* Legacy modal removed in favor of inline paragraph micro-tuning input */}
      
      {/* Absolute Toast Notifications (highly customized, responsive and non-blocking in sandboxed environment) */}
      <div className="fixed left-1/2 top-24 z-[9999] flex w-[min(92vw,520px)] -translate-x-1/2 flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl shadow-xl border text-xs font-medium flex items-start gap-2.5 pointer-events-auto animate-in slide-in-from-top-3 fade-in duration-300 ${
              t.type === 'success' 
                ? 'bg-slate-900/95 border-slate-800 text-emerald-400 backdrop-blur-md' 
                : t.type === 'error' 
                ? 'bg-red-950/95 border-red-900 text-red-300 backdrop-blur-md' 
                : 'bg-slate-900/95 border-slate-800 text-sky-400 backdrop-blur-md'
            }`}
          >
            {t.type === 'success' && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0 mt-1.5" />}
            {t.type === 'error' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse flex-shrink-0 mt-1.5" />}
            {t.type === 'info' && <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse flex-shrink-0 mt-1.5" />}
            <span className="flex-1 leading-relaxed text-slate-200">{t.msg}</span>
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-500 hover:text-white transition-colors p-0.5 ml-1 text-[10px]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Drawer Overlay Backdrop */}
      {isProjectDrawerOpen && (
        <>
          <div 
            onClick={() => setIsProjectDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[150] transition-opacity duration-350 pointer-events-auto"
          />
          <div className="fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-white shadow-2xl z-[160] flex flex-col border-l border-slate-200 transition-transform duration-350 ease-in-out transform translate-x-0 pointer-events-auto">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-${activeColorBrand}-50 text-${activeColorBrand}-600`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">收购重组项目池</h3>
                  <p className="text-[10px] text-slate-400 font-medium font-sans">当前共收录 {projects.length} 个不良及重组资产项目</p>
                </div>
              </div>
              <button 
                onClick={() => setIsProjectDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="关闭抽屉"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Quick action: Create new project inside drawer */}
            <div className="px-5 py-3 bg-indigo-50/20 border-b border-indigo-50/40 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">没找到对应项目？</span>
              <button
                onClick={() => setIsCreatingProject(!isCreatingProject)}
                className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCreatingProject 
                    ? "bg-slate-250 text-slate-700 hover:bg-slate-300" 
                    : `${currentTheme.primaryBtn} text-white`
                }`}
              >
                {isCreatingProject ? (
                  <>
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>查看项目列表</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>立项新不良包评估</span>
                  </>
                )}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 min-h-0 flex flex-col">
              {isCreatingProject ? (
                /* CREATE FORM */
                <form onSubmit={handleCreateProject} className="space-y-4 flex-1 flex flex-col min-h-0 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>✍</span> 新建评估项目档案
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">项目全称 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newProjName}
                      onChange={e => setNewProjName(e.target.value)}
                      placeholder="例：闵行2号不良资产重组评估"
                      className={`w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-${activeColorBrand}-500 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-${activeColorBrand}-500/20 font-semibold text-slate-800`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">提请委托方/客户名称 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newProjCustomer}
                      onChange={e => setNewProjCustomer(e.target.value)}
                      placeholder="委托方AMC机构"
                      className={`w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-${activeColorBrand}-500 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-${activeColorBrand}-500/20 font-semibold text-slate-800`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">业务项目类型</label>
                    <select
                      value={newProjType}
                      onChange={e => {
                        const val = e.target.value as ProjectType;
                        setNewProjType(val);
                        setNewProjBusinessFields({});
                      }}
                      className={`w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-${activeColorBrand}-500/25 focus:outline-none font-semibold text-slate-700`}
                    >
                      {activeProjectDomains.map(domain => (
                        <option key={domain.id} value={domain.code}>{domain.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Upload widget inside form */}
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                       <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                        <Upload className={`w-3.5 h-3.5 text-${activeColorBrand}-600`} />
                        项目资料与佐证材料上传
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-705">
                        已添加 {initialFiles.length} 份
                      </span>
                    </div>

                    <input
                      type="file"
                      id="drawer-initial-files-upload-input"
                      multiple
                      className="hidden"
	                      onChange={(e) => {
	                        const files = e.target.files;
	                        if (!files) return;
	                        appendInitialProjectFiles(Array.from(files));
	                        e.target.value = '';
	                      }}
	                    />

	                    <label
	                      htmlFor="drawer-initial-files-upload-input"
	                      onDragEnter={(e) => {
	                        e.preventDefault();
	                        e.stopPropagation();
	                        setIsInitialFileDragActive(true);
	                      }}
	                      onDragOver={(e) => {
	                        e.preventDefault();
	                        e.stopPropagation();
	                        e.dataTransfer.dropEffect = 'copy';
	                        setIsInitialFileDragActive(true);
	                      }}
	                      onDragLeave={(e) => {
	                        e.preventDefault();
	                        e.stopPropagation();
	                        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
	                        setIsInitialFileDragActive(false);
	                      }}
	                      onDrop={(e) => {
	                        e.preventDefault();
	                        e.stopPropagation();
	                        setIsInitialFileDragActive(false);
	                        appendInitialProjectFiles(Array.from(e.dataTransfer.files || []));
	                      }}
	                      className={`flex flex-col items-center justify-center border border-dashed rounded-xl p-5 bg-white cursor-pointer transition-all text-center select-none ${
	                        isInitialFileDragActive
	                          ? `${currentTheme.badge} border-${activeColorBrand}-500 ring-2 ring-${activeColorBrand}-500/15`
	                          : `border-slate-250 hover:bg-slate-50/50 hover:border-${activeColorBrand}-500`
	                      }`}
	                    >
	                      <Upload className={`w-5 h-5 mb-1 ${isInitialFileDragActive ? `text-${activeColorBrand}-600` : 'text-slate-400'}`} />
	                      <span className="text-[11px] font-bold text-slate-700">{isInitialFileDragActive ? '松开即可添加文件' : '点击或将文件拖至此处上传'}</span>
	                      <span className="text-[9px] text-slate-400 mt-0.5">支持财务、物权、尽调及合同资信档案</span>
	                    </label>

                    {initialFiles.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-150 pt-2 shadow-inner">
                        <span className="block text-[9px] font-extrabold text-slate-500">📋 待上传文件清单：</span>
                        <div className="space-y-1 max-h-[110px] overflow-y-auto pr-0.5">
                          {initialFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-1.5 bg-white border border-slate-150 rounded text-[10px] text-slate-600 gap-1.5">
                              <div className="flex items-center gap-1.5 truncate flex-1 leading-tight">
                                <FileText className={`w-3.5 h-3.5 text-${activeColorBrand}-600 opacity-70 flex-shrink-0`} />
                                <div className="flex flex-col truncate">
                                  <span className="truncate font-semibold text-slate-700" title={file.name}>{file.name}</span>
                                  <span className="text-[8px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <select
                                  value={file.type}
                                  onChange={(e) => {
                                    const newType = e.target.value as ProjectFile['type'];
                                    setInitialFiles(prev => {
                                      const cloned = [...prev];
                                      cloned[idx] = { ...cloned[idx], type: newType };
                                      return cloned;
                                    });
                                  }}
                                  className="text-[9px] text-slate-600 border border-slate-200 rounded px-1 bg-slate-50 font-semibold focus:outline-none"
                                >
                                  <option value="DD_Report">尽职调查</option>
                                  <option value="Financial">企业财务</option>
                                  <option value="Ownership">首查封物权</option>
                                  <option value="Other">其他相关</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInitialFiles(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="text-red-500 hover:text-red-700 font-extrabold px-1 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">项目简介描述</label>
                    <textarea
                      value={newProjDesc}
                      onChange={e => setNewProjDesc(e.target.value)}
                      rows={4}
                      required
                      placeholder="请概括说明该笔不良资产包背景、核心抵押或投资重组标的情况..."
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white resize-y min-h-[90px] leading-relaxed transition-all font-semibold text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-[0.99] cursor-pointer mt-auto bg-${activeColorBrand}-600 hover:bg-${activeColorBrand}-700`}
                  >
                    创设档案并初始化评估池
                  </button>
                </form>
              ) : (
                /* PROJECT LIST */
                <div className="space-y-3 flex-1 overflow-y-auto pr-1 text-left">
                  {projects.map((proj) => {
                    const isActive = proj.id === selectedProjectId;
                    const evaluationsList = Object.values(proj.evaluations) as any[];
                    const reportsCount = evaluationsList.reduce((acc: number, curr: any) => acc + curr.length, 0);

                    const projConfig = projectTypesConfig[proj.projectType] || PROJECT_TYPES_CONFIG.NPA_ACQUISITION;

                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setCurrentMode('work');
                          setIsProjectDrawerOpen(false); // Switch and auto close drawer
                          addToast(`已成功切换到工作区：${proj.name}`, "info");
                        }}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all relative flex flex-col gap-2 ${
                          isActive
                            ? `border-${activeColorBrand}-600 bg-${activeColorBrand}-50/20 ring-1 ring-${activeColorBrand}-500/10 shadow-sm`
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-105 hover:border-slate-200"
                        }`}
                      >
                        {isActive && (
                          <div className={`absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase text-white shadow-xs bg-${activeColorBrand}-600`}>
                            <span>当前活跃</span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className={`text-[8.5px] font-bold uppercase tracking-widest bg-${activeColorBrand}-50 border border-${activeColorBrand}-100 text-${activeColorBrand}-700 px-2 py-0.5 rounded`}>
                              {projConfig.label}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-800 text-xs tracking-tight line-clamp-1">{proj.name}</h3>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed" title={proj.description}>
                            {proj.description || "暂无描述"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100/80 pt-2.5 mt-1">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            proj.status === 'Draft' ? "bg-amber-55 text-amber-800 bg-amber-50" :
                            proj.status === 'DataCollected' ? "bg-cyan-55 text-cyan-800 bg-cyan-50" :
                            proj.status === 'Active' ? "bg-emerald-55 text-emerald-800 bg-emerald-50" : "bg-purple-55 text-purple-800 bg-purple-50"
                          }`}>
                            {proj.status === 'Draft' ? '待收集' :
                             proj.status === 'DataCollected' ? '自检齐备' :
                             proj.status === 'Active' ? '评估活跃' : '合规待确认'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded border border-slate-100">
                            📄 报告版本: <strong className="text-slate-700">{reportsCount}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Helper Banner */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-2 font-medium">
              <span className="text-xs">💡</span>
              <span className="text-left">点击任意项目卡片，系统将自适应调派专属智能专家体并精确加载对应知识底稿。</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// SVG CONNECTOR LINES FOR DOCUMENT REVISIONS
// ==========================================
function SVGConnectorLines({ 
  revisions, 
  hoveredRevisionId, 
  projectId, 
  category 
}: { 
  revisions: any[]; 
  hoveredRevisionId: string | null; 
  projectId: string; 
  category: string; 
}) {
  const [lines, setLines] = React.useState<Array<{ 
    id: string; 
    bracketD: string;
    connectD: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    pTop: number;
    pBottom: number;
    isHovered: boolean; 
  }>>([]);
  
  const recalculate = React.useCallback(() => {
    const root = document.getElementById("expert-reports-grid-root");
    if (!root) return;

    const rootRect = root.getBoundingClientRect();
    const filteredRevs = revisions.filter(r => r.projectId === projectId && r.category === category);
    const calculatedLines: any[] = [];

    filteredRevs.forEach(rev => {
      const pEl = document.querySelector(`[data-paragraph-rev-id="${rev.id}"]`);
      const cEl = document.querySelector(`[data-card-rev-id="${rev.id}"]`);
      
      if (pEl && cEl) {
        const pRect = pEl.getBoundingClientRect();
        const cRect = cEl.getBoundingClientRect();

        // Coordinates mapped relative to the root elements container
        const x1 = pRect.right - rootRect.left;
        const y1 = (pRect.top + pRect.bottom) / 2 - rootRect.top;
        const pTop = pRect.top - rootRect.top;
        const pBottom = pRect.bottom - rootRect.top;

        const x2 = cRect.left - rootRect.left;
        const y2 = (cRect.top + cRect.bottom) / 2 - rootRect.top;

        const isHovered = hoveredRevisionId === rev.id;

        // Left vertical bracket style on the paragraph's edge: offset by 4px
        const offsetLeft = 4;
        const startX = x1 + offsetLeft;
        const bracketD = `M ${startX} ${pTop + 2} L ${startX} ${pBottom - 2}`;

        // Bezier connection sprouting from selection right-edge center to card left-edge center
        const midX = (startX + x2) / 2;
        const connectD = `M ${startX} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

        calculatedLines.push({
          id: rev.id,
          bracketD,
          connectD,
          x1: startX,
          y1,
          x2,
          y2,
          pTop,
          pBottom,
          isHovered
        });
      }
    });

    setLines(calculatedLines);
  }, [revisions, hoveredRevisionId, projectId, category]);

  React.useEffect(() => {
    // Initial draw
    recalculate();

    const handleScrollUpdate = () => {
      requestAnimationFrame(recalculate);
    };

    // Capture scrolling anywhere to refresh position bounds dynamically
    window.addEventListener("scroll", handleScrollUpdate, { capture: true, passive: true });
    window.addEventListener("resize", handleScrollUpdate, { passive: true });

    // Internal scroll watchers
    const docLayout = document.querySelector(".prose")?.parentElement;
    const historyLayout = document.querySelector("[max-h-\\[500px\\]]");
    docLayout?.addEventListener("scroll", handleScrollUpdate, { passive: true });
    historyLayout?.addEventListener("scroll", handleScrollUpdate, { passive: true });

    // Periodic sync backup
    const syncInterval = setInterval(recalculate, 300);

    return () => {
      window.removeEventListener("scroll", handleScrollUpdate, { capture: true });
      window.removeEventListener("resize", handleScrollUpdate);
      docLayout?.removeEventListener("scroll", handleScrollUpdate);
      historyLayout?.removeEventListener("scroll", handleScrollUpdate);
      clearInterval(syncInterval);
    };
  }, [recalculate]);

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full z-15 overflow-visible">
      <defs>
        <filter id="svg-wire-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {lines.map(line => (
        <g key={line.id} className="transition-all duration-150">
          {/* Paragraph vertical side bracket glow indicator */}
          {line.isHovered && (
            <path
              d={line.bracketD}
              fill="none"
              stroke="#fb7185"
              strokeWidth="5"
              strokeOpacity="0.4"
              filter="url(#svg-wire-glow)"
            />
          )}
          {/* Paragraph vertical side bracket bar */}
          <path
            d={line.bracketD}
            fill="none"
            stroke={line.isHovered ? "#f43f5e" : "#10b981"}
            strokeWidth={line.isHovered ? "3.5" : "2.5"}
            className="transition-all duration-150"
          />

          {/* Connection curve shadow glow */}
          {line.isHovered && (
            <path
              d={line.connectD}
              fill="none"
              stroke="#fb7185"
              strokeWidth="5"
              strokeOpacity="0.3"
              filter="url(#svg-wire-glow)"
            />
          )}
          {/* Connection curve core */}
          <path
            d={line.connectD}
            fill="none"
            stroke={line.isHovered ? "#e11d48" : "#cbd5e1"}
            strokeWidth={line.isHovered ? "2.5" : "1.5"}
            strokeDasharray={line.isHovered ? "none" : "3.5 3.5"}
            className="transition-all duration-150"
          />

          {/* Bracket endpoints markers */}
          <circle
            cx={line.x1}
            cy={line.pTop + 2}
            r={line.isHovered ? "4" : "2.5"}
            fill={line.isHovered ? "#e11d48" : "#10b981"}
          />
          <circle
            cx={line.x1}
            cy={line.pBottom - 2}
            r={line.isHovered ? "4" : "2.5"}
            fill={line.isHovered ? "#e11d48" : "#10b981"}
          />

          {/* Curved track source & target core joints */}
          <circle
            cx={line.x1}
            cy={line.y1}
            r={line.isHovered ? "5" : "3.5"}
            fill={line.isHovered ? "#e11d48" : "#059669"}
          />
          <circle
            cx={line.x2}
            cy={line.y2}
            r={line.isHovered ? "5" : "3.5"}
            fill={line.isHovered ? "#e11d48" : "#475569"}
          />
        </g>
      ))}
    </svg>
  );
}
