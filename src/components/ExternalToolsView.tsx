import React from "react";
import { QccResult, StockResult } from "../types";
import { 
  Terminal, Search, AlertOctagon, TrendingDown, TrendingUp, 
  Building2, ExternalLink, X, Gavel, ShieldAlert, MapPin, Database, Sparkles, CheckCircle2, ArrowRight
} from "lucide-react";

interface ExternalToolsViewProps {
  onSearchQcc: (query: string) => Promise<QccResult>;
  onSearchStock: (query: string) => Promise<StockResult>;
  currentTheme?: any;
}

interface McpServerConfig {
  key: string;
  name: string;
  identifier: string;
  desc: string;
  icon: any;
  status: "ONLINE" | "STANDBY";
  category: string;
  latency: string;
  methods: string[];
}

export default function ExternalToolsView({ onSearchQcc, onSearchStock, currentTheme }: ExternalToolsViewProps) {
  const brandKey = React.useMemo(() => {
    if (!currentTheme) return "indigo";
    const txt = currentTheme.text || "";
    if (txt.includes("emerald")) return "emerald";
    if (txt.includes("purple")) return "purple";
    if (txt.includes("amber")) return "amber";
    if (txt.includes("sky")) return "sky";
    if (txt.includes("cyan")) return "cyan";
    if (txt.includes("rose")) return "rose";
    return "indigo";
  }, [currentTheme]);

  // Brand utility classes configurations
  const brand = React.useMemo(() => {
    const config: Record<string, {
      text: string;
      textHover: string;
      bg: string;
      bgHover: string;
      badge: string;
      badgeOn: string;
      borderActive: string;
      ring: string;
      iconBgSelected: string;
      iconBgNormal: string;
      link: string;
    }> = {
      indigo: {
        text: "text-indigo-600",
        textHover: "group-hover:text-indigo-700",
        bg: "bg-indigo-600",
        bgHover: "hover:bg-indigo-505 active:bg-indigo-700 bg-indigo-600",
        badge: "text-indigo-600 bg-indigo-50 border-indigo-200/60",
        badgeOn: "bg-indigo-505 bg-indigo-500",
        borderActive: "border-indigo-600 ring-1 ring-indigo-500/25",
        ring: "focus:ring-indigo-500",
        iconBgSelected: "bg-indigo-600 border-indigo-500 text-white",
        iconBgNormal: "bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-400",
        link: "text-indigo-600"
      },
      purple: {
        text: "text-purple-600",
        textHover: "group-hover:text-purple-700",
        bg: "bg-purple-600",
        bgHover: "hover:bg-purple-505 active:bg-purple-700 bg-purple-600",
        badge: "text-purple-600 bg-purple-50 border-purple-200/60",
        badgeOn: "bg-purple-500",
        borderActive: "border-purple-600 ring-1 ring-purple-500/25",
        ring: "focus:ring-purple-500",
        iconBgSelected: "bg-purple-600 border-purple-500 text-white",
        iconBgNormal: "bg-purple-50 border-purple-100 text-purple-600 group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-400",
        link: "text-purple-600"
      },
      emerald: {
        text: "text-emerald-600",
        textHover: "group-hover:text-emerald-700",
        bg: "bg-emerald-600",
        bgHover: "hover:bg-emerald-505 active:bg-emerald-700 bg-emerald-600",
        badge: "text-emerald-600 bg-emerald-50 border-emerald-200/60",
        badgeOn: "bg-emerald-500",
        borderActive: "border-emerald-600 ring-1 ring-emerald-500/25",
        ring: "focus:ring-emerald-500",
        iconBgSelected: "bg-emerald-600 border-emerald-500 text-white",
        iconBgNormal: "bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400",
        link: "text-emerald-600"
      },
      amber: {
        text: "text-amber-600",
        textHover: "group-hover:text-amber-700",
        bg: "bg-amber-600",
        bgHover: "hover:bg-amber-505 active:bg-amber-700 bg-amber-600",
        badge: "text-amber-600 bg-amber-50 border-amber-200/60",
        badgeOn: "bg-amber-500",
        borderActive: "border-amber-600 ring-1 ring-amber-500/25",
        ring: "focus:ring-amber-500",
        iconBgSelected: "bg-amber-600 border-amber-500 text-white",
        iconBgNormal: "bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-400",
        link: "text-amber-600"
      },
      sky: {
        text: "text-sky-600",
        textHover: "group-hover:text-sky-700",
        bg: "bg-sky-600",
        bgHover: "hover:bg-sky-505 active:bg-sky-700 bg-sky-600",
        badge: "text-sky-600 bg-sky-50 border-sky-200/60",
        badgeOn: "bg-sky-505 bg-sky-500",
        borderActive: "border-sky-600 ring-1 ring-sky-500/25",
        ring: "focus:ring-sky-500",
        iconBgSelected: "bg-sky-600 border-sky-500 text-white",
        iconBgNormal: "bg-sky-50 border-sky-100 text-sky-600 group-hover:bg-sky-500 group-hover:text-white group-hover:border-sky-400",
        link: "text-sky-600"
      },
      cyan: {
        text: "text-cyan-600",
        textHover: "group-hover:text-cyan-700",
        bg: "bg-cyan-600",
        bgHover: "hover:bg-cyan-505 active:bg-cyan-700 bg-cyan-600",
        badge: "text-cyan-600 bg-cyan-50 border-cyan-200/60",
        badgeOn: "bg-cyan-505 bg-cyan-500",
        borderActive: "border-cyan-600 ring-1 ring-cyan-500/25",
        ring: "focus:ring-cyan-500",
        iconBgSelected: "bg-cyan-600 border-cyan-500 text-white",
        iconBgNormal: "bg-cyan-50 border-cyan-100 text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white group-hover:border-cyan-400",
        link: "text-cyan-600"
      },
      rose: {
        text: "text-rose-600",
        textHover: "group-hover:text-rose-700",
        bg: "bg-rose-600",
        bgHover: "hover:bg-rose-505 active:bg-rose-700 bg-rose-600",
        badge: "text-rose-600 bg-rose-50 border-rose-200/60",
        badgeOn: "bg-rose-505 bg-rose-500",
        borderActive: "border-rose-600 ring-1 ring-rose-500/25",
        ring: "focus:ring-rose-500",
        iconBgSelected: "bg-rose-600 border-rose-500 text-white",
        iconBgNormal: "bg-rose-50 border-rose-100 text-rose-600 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-455 group-hover:border-rose-400",
        link: "text-rose-600"
      }
    };
    return config[brandKey] || config.indigo;
  }, [brandKey]);

  // Main MCP Search State
  const [qccQuery, setQccQuery] = React.useState("上海中合实业有限公司");
  const [qccResult, setQccResult] = React.useState<QccResult | null>(null);
  const [qccLoading, setQccLoading] = React.useState(false);

  const [stockQuery, setStockQuery] = React.useState("上海中合");
  const [stockResult, setStockResult] = React.useState<StockResult | null>(null);
  const [stockLoading, setStockLoading] = React.useState(false);

  // Additional mock MCP servers state
  const [creditQuery, setCreditQuery] = React.useState("上海中合实业有限公司");
  const [creditResult, setCreditResult] = React.useState<any | null>({
    status: "经营异常 (存在高危风险)",
    abnormalLogs: [
      { reason: "未按照《企业信息公示暂行条例》第八条规定的期限公示年度报告", date: "2025/11/12", dept: "上海市市场监督管理局" },
      { reason: "通过登记的住所或者经营场所无法联系", date: "2025/12/04", dept: "徐汇区市场监督管理局" }
    ],
    pledges: "股权质押 5000 万股 (出质给某商业银行)",
    taxLevel: "B级信用度"
  });
  const [creditLoading, setCreditLoading] = React.useState(false);

  const [caseQuery, setCaseQuery] = React.useState("上海中合 优先受偿权");
  const [caseResult, setCaseResult] = React.useState<any | null>({
    caseNo: "(2024)最高法民终884号",
    court: "最高人民法院",
    summary: "上海中合实业在重合查封拍卖款项分配执行异议之诉中败诉，法庭判定第二顺位查封债权在首封及担保物权清算重组前不得优先变现。",
    legalKeyword: "《民事诉讼法》第231条 • 轮候查封变价优先分配要件审查",
    matchScore: "95%"
  });
  const [caseLoading, setCaseLoading] = React.useState(false);

  const [valuationQuery, setValuationQuery] = React.useState("上海市闵行区莘庄写字楼");
  const [valuationResult, setValuationResult] = React.useState<any | null>({
    basePriceSquareMeter: "￥19,500/㎡",
    forcedSaleDiscount: "0.65",
    estimatedDisposalValue: "￥12,675/㎡ (快速流拍安全边界)",
    peerAnalyses: [
      { name: "中中金融广场司法处置案", dealPrice: "￥11,800/㎡", discount: "0.60" },
      { name: "绿地融创中心双重重叠拍卖案", dealPrice: "￥12,200/㎡", discount: "0.62" }
    ]
  });
  const [valuationLoading, setValuationLoading] = React.useState(false);

  const [ragQuery, setRagQuery] = React.useState("上海化债 2026 政府专项置换");
  const [ragResult, setRagResult] = React.useState<any | null>({
    matchedDoc: "《上海市地方金融管理局：AMC受让政企融资性债务安全边界指引》",
    coreRules: [
      "地方政府平台平台隐性负债严禁采用直融性底层重构，需配合持牌 AMC 进场作实物资产和应收账款债转股处理。",
      "政企平台置换期地方金融办提供不超过 1.2x 额度的长期专项债券保障，返点兑付支持不涉及政府兜底免责条款。"
    ],
    relevance: "0.91"
  });
  const [ragLoading, setRagLoading] = React.useState(false);

  // Active drawer state
  const [activeMcpKey, setActiveMcpKey] = React.useState<string | null>(null);

  const [logs, setLogs] = React.useState<string[]>([
    "💡 Tip: 欢迎来到数据整合中心。点击下方任意 MCP 协议伺服连接，即可唤出右侧手动测试控制台，并在本地终端模拟 RAG 调用流！"
  ]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`].slice(-8));
  };

  const handleQccSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qccQuery) return;
    setQccLoading(true);
    addLog(`正在触发 MCP 工具调用: qcc-company.search("${qccQuery}")`);
    try {
      const res = await onSearchQcc(qccQuery);
      setQccResult(res);
      addLog(`MCP 成功接收企查查数据。法代人: ${res.legalPerson} | 发现高危诉讼: ${res.risks.filter(r => r.type === 'HIGH').length}笔`);
    } catch (e) {
      addLog(`企查查查询出现异常: ${(e as Error).message}`);
    } finally {
      setQccLoading(false);
    }
  };

  const handleStockSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockQuery) return;
    setStockLoading(true);
    addLog(`发送 HTTP RPC 外部获取: stock-api.fetchQuote("${stockQuery}")`);
    try {
      const res = await onSearchStock(stockQuery);
      setStockResult(res);
      addLog(`获取股价信息成功。现价: ${res.price} | 变幅: ${res.change}%`);
    } catch (e) {
      addLog(`证券库获取失败: ${(e as Error).message}`);
    } finally {
      setStockLoading(false);
    }
  };

  const handleCreditSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreditLoading(true);
    addLog(`正在调用公信力 MCP 工具: credit-system.fetchData("${creditQuery}")`);
    setTimeout(() => {
      setCreditResult({
        status: creditQuery.includes("中合") ? "经营异常 (存在高危风险)" : "守信存续企业 (未见公示异常)",
        abnormalLogs: creditQuery.includes("中合") ? [
          { reason: "未按照《企业信息公示暂行条例》第八条规定的期限公示年度报告", date: "2025/11/12", dept: "上海市市场监督管理局" },
          { reason: "通过登记的住所或者经营场所无法联系", date: "2025/12/04", dept: "徐汇区市场监督管理局" }
        ] : [],
        pledges: creditQuery.includes("中合") ? "股权质押 5000 万股 (出质给某商业银行)" : "无已知股权质押",
        taxLevel: creditQuery.includes("中合") ? "B级信用度" : "A级纳税主体"
      });
      setCreditLoading(false);
      addLog(`[credit-system] 成功回执! 目标企业核查风险指数已锁定。`);
    }, 800);
  };

  const handleCaseSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCaseLoading(true);
    addLog(`正在调用裁判文书检索工具: case-search-engine.queryTerm("${caseQuery}")`);
    setTimeout(() => {
      setCaseResult({
        caseNo: `(2024)民初字第${Math.floor(Math.random() * 2000 + 100)}号`,
        court: caseQuery.includes("最高") ? "最高人民法院" : "上海市高级人民法院",
        summary: `关于 ${caseQuery} 的裁判逻辑提取完毕：在合规重整执行异议纠纷分配中，判决限制了非第一优先顺位质权人直融变价权利。`,
        legalKeyword: "《民事诉讼法解释》相关条款适用判定意见",
        matchScore: "94%"
      });
      setCaseLoading(false);
      addLog(`[court-case] 检索解析成功! BM25 智能相关系数重构完毕。`);
    }, 700);
  };

  const handleValuationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setValuationLoading(true);
    addLog(`正在调用司法折价测算服务: mcp-valuation.runEstimator("${valuationQuery}")`);
    setTimeout(() => {
      setValuationResult({
        basePriceSquareMeter: "￥21,000/㎡",
        forcedSaleDiscount: "0.68",
        estimatedDisposalValue: "￥14,280/㎡",
        peerAnalyses: [
          { name: "同区域法拍可比大宗交易A", dealPrice: "￥13,500/㎡", discount: "0.65" },
          { name: "周边两公里抵债变价竞拍案例", dealPrice: "￥14,900/㎡", discount: "0.70" }
        ]
      });
      setValuationLoading(false);
      addLog(`[valuation] 本地流拍折损曲线估计计算成功。估价合理置信区间：0.65 - 0.70`);
    }, 900);
  };

  const handleRagSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setRagLoading(true);
    addLog(`正在连结公干政务政策文件库: government-policies.semanticMatch("${ragQuery}")`);
    setTimeout(() => {
      setRagResult({
        matchedDoc: `《关于 ${ragQuery.split(" ")[0] || "地方"} 化解融资平台隐性债务与持牌资产管理公司配合路径意见》`,
        coreRules: [
          "各级政府负债不得再次采用金融衍生品做展期逃废，须通过重构方案剥离主营项目实物变现。",
          "配合置换期内提供最高 1.5x 回流贴息承诺保护，免受外部直接一揽子限制高消费阻断。"
        ],
        relevance: "0.94"
      });
      setRagLoading(false);
      addLog(`[policies-rag] 语义匹配完毕。嵌入向量检索返回前2条强干预政策。`);
    }, 850);
  };

  // Autoload on mount
  React.useEffect(() => {
    onSearchQcc("上海中合实业有限公司").then(res => setQccResult(res));
    onSearchStock("上海中合").then(res => setStockResult(res));
  }, []);

  const mcpServers: McpServerConfig[] = [
    {
      key: "qcc",
      name: "企查查工商风险穿透服务",
      identifier: "qy-qcc-resolver (v1.2)",
      desc: "一键穿透查下受让标的公司工商状态、股东关系结构以及涉诉执行高危信用阻断风险。",
      icon: Building2,
      status: "ONLINE",
      category: "工商/司法",
      latency: "145ms",
      methods: ["qcc-company.search", "qcc-company.shareholders", "qcc-company.litigations"]
    },
    {
      key: "stock",
      name: "证券交易所多源大盘行情重估",
      identifier: "securities-market-feed (v2.1)",
      desc: "抓取债务重整或破产整合期间A股/H股限制交易主体的即时清算价、扣非PE及市值行情异动。",
      icon: TrendingUp,
      status: "ONLINE",
      category: "证券/市值",
      latency: "82ms",
      methods: ["stock-api.fetchQuote", "stock-api.fetchFiancialOverview"]
    },
    {
      key: "credit",
      name: "全国企业信用异常及黑名单穿透",
      identifier: "national-enterprise-credit (v1.0)",
      desc: "自动监测目标债务主体是否列入严重违法失信名单、未公示报告记录、存续异常等红线限制。",
      icon: ShieldAlert,
      status: "ONLINE",
      category: "信用/限制",
      latency: "192ms",
      methods: ["credit-system.fetchData", "credit-system.isAbnormalShip"]
    },
    {
      key: "case",
      name: "最高院裁判文书要件智能监测",
      identifier: "judicial-court-case-analytics (v3.0)",
      desc: "基于深度NLP词法分析最高法院分配首封、轮候查封、第二顺位拍卖与查封限制判例归属要点。",
      icon: Gavel,
      status: "ONLINE",
      category: "司法判例",
      latency: "230ms",
      methods: ["case-search-engine.queryTerm", "case-search-engine.extractGist"]
    },
    {
      key: "valuation",
      name: "大宗划拨土地与司法流拍折损估算",
      identifier: "realestate-valuation-estimator (v1.1)",
      desc: "输入指定地段大宗物流、办公、工业特拍折损模型，按拍卖流拍折价预测资产残值乘数安全性。",
      icon: MapPin,
      status: "STANDBY",
      category: "重组评估",
      latency: "310ms",
      methods: ["mcp-valuation.runEstimator", "mcp-valuation.compareHistory"]
    },
    {
      key: "rag",
      name: "政企一揽子化债政策联邦RAG仓储",
      identifier: "multi-agent-federal-rag (v4.0)",
      desc: "对接国家发改委、各省市级财政局化解政企涉诉债务红头指令文件，进行高精度实时语义切片检索。",
      icon: Database,
      status: "ONLINE",
      category: "政策合规",
      latency: "115ms",
      methods: ["government-policies.semanticMatch", "government-policies.getRerankList"]
    }
  ];

  return (
    <div className="bg-slate-50/75 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col relative text-left">
      {/* Decorative gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r from-${brandKey}-50/30 via-slate-50/40 to-transparent pointer-events-none z-0`} />

      {/* Title Header */}
      <div className={`relative z-10 p-5 border-b border-slate-200/80 bg-gradient-to-r from-${brandKey}-50/60 via-slate-50/80 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Terminal className={`w-4 h-4 inline mr-1 animate-pulse ${brand.text}`} />
            外部第三方 MCP 与多源数据集成控制台 (Integrations panel)
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">当法律、评估风险专家智能体工作时，后台将自动调起下方分布式连接的 MCP 协议接口以支撑决策。</p>
        </div>
        <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0 self-start sm:self-auto border ${brand.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${brand.badgeOn}`} />
          6 个金融级 MCP 微伺服协议正激活
        </div>
      </div>

      <div className="relative z-10 flex-1 p-5 lg:p-6 overflow-y-auto bg-white/40 flex flex-col justify-between space-y-6">
        
        {/* MCP Grid Cards */}
        <div>
          <div className="mb-3 flex items-center gap-1 text-xs font-extrabold text-slate-800">
            <Sparkles className={`w-3.5 h-3.5 ${brand.text}`} />
            <span>检测到当前环境下已连接 of the MCP 服务器：(点击卡片一键运行手动集成测试)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mcpServers.map((server) => {
              const Icon = server.icon;
              return (
                <div
                  key={server.key}
                  onClick={() => {
                    setActiveMcpKey(server.key);
                    addLog(`已打开远程 MCP 调试端子: ${server.name} [${server.identifier}]`);
                  }}
                  className={`group relative p-5 border rounded-2xl cursor-pointer transition-all duration-200 text-left flex flex-col justify-between min-h-[160px] ${
                    activeMcpKey === server.key 
                      ? `${brand.borderActive} bg-${brandKey}-50/10 shadow-xs` 
                      : `border-slate-200 bg-white hover:border-${brandKey}-300 hover:shadow-xs`
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-xl border transition-all ${
                          activeMcpKey === server.key 
                            ? brand.iconBgSelected
                            : brand.iconBgNormal
                        }`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className={`font-extrabold text-slate-900 text-xs tracking-tight transition-colors ${brand.textHover}`}>{server.name}</h4>
                          <span className="text-[9px] font-mono text-slate-400 font-bold tracking-tight block">{server.identifier}</span>
                        </div>
                      </div>
                      <span className={`text-[8.5px] px-1.5 py-0.5 rounded-md font-bold ${
                        server.status === "ONLINE" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/55" 
                          : "bg-amber-50 text-amber-700 border border-amber-200/55"
                      }`}>
                        {server.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed line-clamp-2">
                      {server.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold font-mono">
                    <span className="text-slate-500">延时: {server.latency}</span>
                    <span className={`flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ${brand.link}`}>
                      手动调试测试 <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MCP logs screen at Bottom */}
        <div className="mt-4 border border-slate-200 bg-slate-900 text-teal-300 p-4.5 rounded-2xl font-mono text-[11px] min-h-[170px] max-h-[220px] flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
              <span className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className={`w-3.5 h-3.5 text-${brandKey}-400`} />
                ⚡ SYSTEM AGENT-ORCHESTRATION PIPELINE TERMINAL LOGS
              </span>
              <span className="text-[9px] text-slate-500 font-extrabold">STATUS: LISTEN_9080_LIVE</span>
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-24 pr-1 font-semibold text-teal-300/90 text-[10px]">
              {logs.map((log, index) => (
                <div key={index} className="leading-relaxed whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 mt-2 border-t border-slate-850 pt-2 font-bold font-mono flex justify-between">
            <span>MCP Protocol Ver: 1.0.4 • TLS Tunnel Encrypted</span>
            <span>Port 9080 Mapped • PID: 13904</span>
          </div>
        </div>

      </div>

      {/* --- RIGHT DRAWER SLIDE PANELS --- */}
      {/* Background Dim Backdrop */}
      {activeMcpKey && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity duration-300 cursor-pointer"
          onClick={() => setActiveMcpKey(null)}
        />
      )}

      {/* Drawer Container */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[500px] bg-slate-50 border-l border-slate-200 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
        activeMcpKey ? "translate-x-0" : "translate-x-full"
      }`}>
        
        {/* Close Button Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold font-mono">
              MCP-SERVER
            </span>
            <span className="text-xs font-extrabold text-slate-800">手动集成调试</span>
          </div>
          <button 
            onClick={() => setActiveMcpKey(null)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Container - Scrollable */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          
          {activeMcpKey === "qcc" && (
            <div className="space-y-5">
              {/* Introduction header */}
              <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 p-4 rounded-xl border border-indigo-100/60">
                <span className="font-extrabold text-xs text-indigo-800 block">企查查工商风险穿透服务</span>
                <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">ID: qy-qcc-resolver</span>
                <p className="text-slate-500 font-semibold text-[11px] leading-relaxed mt-2">
                  对目标受让资管项下的负债主体/平台企业进行工商注册地位核验，抓获实际股权控制链条并输出多维度民事、高消被限制风险监测结果。
                </p>
              </div>

              {/* Form Input */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                <form onSubmit={handleQccSearch} className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">输入调试企业全称</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={qccQuery}
                      onChange={e => setQccQuery(e.target.value)}
                      placeholder="例如：上海中合实业有限公司"
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                    <button 
                      type="submit"
                      disabled={qccLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {qccLoading ? "执行中..." : "进行穿透"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Dynamic Outputs */}
              {qccResult && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">MCP 回持实时数据包</span>
                  
                  {/* Basic table */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">企业工商根信息 (BASE_META)</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">{qccResult.regStatus}</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4 text-xs font-medium">
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-0.5">注册名称</span>
                        <span className="text-slate-800 font-extrabold">{qccQuery}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-0.5">法定代表人</span>
                        <span className="text-slate-800 font-extrabold">{qccResult.legalPerson}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-0.5">注册资金</span>
                        <span className="text-slate-800 font-extrabold">{qccResult.regCapital}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-0.5">成立日期</span>
                        <span className="text-slate-800 font-extrabold">{qccResult.establishDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shareholders */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                    <span className="block text-xs font-bold text-slate-800">关联持股与实际穿透穿图</span>
                    <div className="space-y-2">
                      {qccResult.shareholders.map((sh, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                          <span className="text-xs text-slate-800 font-extrabold">{sh.name}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-50 border border-indigo-150 rounded-full text-indigo-700">{sh.ratio}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Litigation Risks */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                    <span className="block text-xs font-bold text-slate-800 flex items-center gap-1">
                      <AlertOctagon className="w-4 h-4 text-rose-500" />
                      当前涉诉与限制消费黑历史监测 (High-Risk)
                    </span>
                    <div className="space-y-2">
                      {qccResult.risks.map((risk, i) => (
                        <div key={i} className="p-3 border border-red-100 bg-red-50/15 rounded-lg text-xs leading-relaxed space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-red-800">{risk.title}</span>
                            <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">{risk.type === 'HIGH' ? '特紧被执限制' : '关联民商司法'}</span>
                          </div>
                          <p className="text-slate-600 font-semibold">{risk.desc}</p>
                          <span className="block text-[9px] text-slate-400 font-mono text-right">{risk.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMcpKey === "stock" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 p-4 rounded-xl border border-indigo-100/60">
                <span className="font-extrabold text-xs text-indigo-800 block">证券交易所多源大盘行情重估 Feed</span>
                <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">ID: securities-market-feed</span>
                <p className="text-slate-500 font-semibold text-[11px] leading-relaxed mt-2">
                  自动拉取在股票证券交易所公开上市、违约、或涉入反向收购重组阶段目标代码的每日收盘估计算模型。
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                <form onSubmit={handleStockSearch} className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">输入证券代码或名称关键字</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={stockQuery}
                      onChange={e => setStockQuery(e.target.value)}
                      placeholder="例如：上海中合 或 荣盛机电"
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                    <button 
                      type="submit"
                      disabled={stockLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {stockLoading ? "读取中" : "拉取数据"}
                    </button>
                  </div>
                </form>
              </div>

              {stockResult && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">MCP 实时行情回传</span>
                  
                  <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl text-slate-200 font-mono space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold">关联证券</span>
                        <span className="text-sm font-extrabold text-slate-50">{stockResult.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-bold">代码</span>
                        <span className="text-slate-300 font-extrabold">{stockResult.code}</span>
                      </div>
                    </div>

                    <div className="border-t border-b border-indigo-950 py-3 flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] text-slate-400">重估建议公允参考价</span>
                        <span className="text-2xl font-black text-rose-500 font-mono">￥{stockResult.price}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400">今日波动幅</span>
                        <span className={`font-bold ${stockResult.change >= 0 ? "text-emerald-450" : "text-rose-500"}`}>
                          {stockResult.change >= 0 ? "+" : ""}{stockResult.change}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-400 font-semibold">
                      <div>
                        <span>总股池市值:</span>
                        <span className="block text-slate-50 font-bold mt-0.5">{stockResult.marketCap}</span>
                      </div>
                      <div>
                        <span>换手交易量:</span>
                        <span className="block text-slate-50 font-bold mt-0.5">{stockResult.volume}</span>
                      </div>
                      <div>
                        <span>扣非估盈比 PE:</span>
                        <span className="block text-slate-50 font-bold mt-0.5">{stockResult.peRatio}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMcpKey === "credit" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 p-4 rounded-xl border border-indigo-100/60">
                <span className="font-extrabold text-xs text-indigo-800 block">全国企业信用异常及黑名单穿透</span>
                <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">ID: national-enterprise-credit</span>
                <p className="text-slate-500 font-semibold text-[11px] leading-relaxed mt-2">
                  自动监测失信被执行人员名单以及地方市场监督局、保监局、证监局重大行政处罚、未申报年度合规报表导致的经营黑名单。
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                <form onSubmit={handleCreditSearch} className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">输入拟核验主体/平台公司</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={creditQuery}
                      onChange={e => setCreditQuery(e.target.value)}
                      placeholder="例如：上海中合实业有限公司"
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                    <button 
                      type="submit"
                      disabled={creditLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer animate-in"
                    >
                      {creditLoading ? "爬网穿透中..." : "一键核查"}
                    </button>
                  </div>
                </form>
              </div>

              {creditResult && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">MCP CREDIT ENVELOPING</span>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4 text-xs font-semibold">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800">国家网络信用雷达检测</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-extrabold">{creditResult.status}</span>
                    </div>

                    <div className="space-y-3 text-slate-700">
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-1">信用评价等级</span>
                        <span className="text-slate-800 font-extrabold">{creditResult.taxLevel}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-400 mb-1">是否存在股权质押冻结</span>
                        <span className="text-slate-800 font-extrabold block bg-slate-50 p-2 rounded-md border border-slate-100 text-[11px] leading-relaxed font-mono">{creditResult.pledges}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-400 mb-2">列入经营异常名录事实记录 ({creditResult.abnormalLogs.length})</span>
                        <div className="space-y-2">
                          {creditResult.abnormalLogs.length > 0 ? (
                            creditResult.abnormalLogs.map((log: any, i: number) => (
                              <div key={i} className="p-3 bg-red-50/10 border border-red-100 rounded-lg space-y-1">
                                <span className="text-red-800 font-extrabold text-[11px] block">{log.reason}</span>
                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono font-bold pt-1">
                                  <span>处罚机关: {log.dept}</span>
                                  <span>发布时间: {log.date}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 italic font-medium">无明显黑名单列入历史</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMcpKey === "case" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 p-4 rounded-xl border border-indigo-100/60">
                <span className="font-extrabold text-xs text-indigo-805 text-indigo-800 block">最高院裁判文书要件智能监测</span>
                <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">ID: judicial-court-case-analytics</span>
                <p className="text-slate-500 font-semibold text-[11px] leading-relaxed mt-2">
                  对接国家司法判例全库。针对重合保全查封拍卖中发生的抵押优先权纠纷展开最高院终审裁判主文提纯，作为智能代理合规核准基。
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                <form onSubmit={handleCaseSearch} className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">法律主张或事实抗辩全文检索</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={caseQuery}
                      onChange={e => setCaseQuery(e.target.value)}
                      placeholder="例如：最高司法 首封轮候 判定分配"
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                    <button 
                      type="submit"
                      disabled={caseLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {caseLoading ? "多机检索中..." : "语义检索"}
                    </button>
                  </div>
                </form>
              </div>

              {caseResult && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">MCP JUDICIAL MATCH ENVELOPE</span>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4 text-xs font-semibold leading-relaxed">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Gavel className="w-4 h-4 text-indigo-600" />
                        高院司法裁判匹配要点
                      </span>
                      <span className="text-[9.5px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150 font-bold">命中率: {caseResult.matchScore}</span>
                    </div>

                    <div className="space-y-3.5 text-slate-700">
                      <div>
                        <span className="block text-[10px] text-slate-400">诉讼案号与归宿法院</span>
                        <span className="text-slate-800 font-extrabold text-xs">{caseResult.caseNo} ({caseResult.court})</span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-400">法律条文要件依据</span>
                        <span className="text-slate-800 font-extrabold text-xs block bg-slate-50 p-2.5 rounded border border-slate-100 font-mono">{caseResult.legalKeyword}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-400">裁判主旨概要提纯</span>
                        <p className="text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-100 leading-relaxed font-semibold italic text-[11px]">
                          "{caseResult.summary}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMcpKey === "valuation" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 p-4 rounded-xl border border-indigo-100/60">
                <span className="font-extrabold text-xs text-indigo-800 block">大宗资产及变拍强制流流押预测</span>
                <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">ID: realestate-valuation-estimator</span>
                <p className="text-slate-500 font-semibold text-[11px] leading-relaxed mt-2">
                  运用地方各级特拍公开数据集，计算大宗写字楼、物流仓储、出让工业土建由于二次、三次流拍产生的实际处置估价折扣系数。
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                <form onSubmit={handleValuationSearch} className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">输入标的房地产大宗名称/地块地址</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={valuationQuery}
                      onChange={e => setValuationQuery(e.target.value)}
                      placeholder="例如：上海市闵行区莘庄办公写字楼"
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                    <button 
                      type="submit"
                      disabled={valuationLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {valuationLoading ? "折算法估中..." : "预测重估"}
                    </button>
                  </div>
                </form>
              </div>

              {valuationResult && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">MCP ESTIMATION EXCERPT</span>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4 text-xs font-semibold leading-relaxed">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        司法特定拍卖流拍折扣测算
                      </span>
                    </div>

                    <div className="space-y-3 text-slate-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] text-slate-400">当地挂牌公允底价</span>
                          <span className="text-slate-800 font-extrabold text-xs font-mono">{valuationResult.basePriceSquareMeter}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">流排预计折水系</span>
                          <span className="text-rose-600 font-black text-xs font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-100 inline-block">{valuationResult.forcedSaleDiscount} (1审折扣)</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-400">强制执行最终司法变现保守处置估合理定价</span>
                        <span className="text-indigo-700 font-black text-sm block font-mono">{valuationResult.estimatedDisposalValue}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-400 mb-1.5">周边对标大宗变价处置成功案例判据 ({valuationResult.peerAnalyses.length})</span>
                        <div className="space-y-2">
                          {valuationResult.peerAnalyses.map((peer: any, i: number) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-150 font-semibold text-[11px]">
                              <div>
                                <span className="font-extrabold text-slate-800 block text-xs">{peer.name}</span>
                                <span className="text-slate-400 block text-[9px] mt-0.5">清处置均单价: {peer.dealPrice}</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">折算: {peer.discount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMcpKey === "rag" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 p-4 rounded-xl border border-indigo-100/60">
                <span className="font-extrabold text-xs text-indigo-805 text-indigo-800 block font-normal">多源政策联邦化债指令 RAG 底座</span>
                <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">ID: government-policies</span>
                <p className="text-slate-500 font-semibold text-[11px] leading-relaxed mt-2">
                  分布式对接发改委、各地财政办化债白皮文件，支持嵌入式多路向量再排序以提供智能顾问专家库的底层依据。
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                <form onSubmit={handleRagSearch} className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">搜索语义关键字/红头政规条例名称</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={ragQuery}
                      onChange={e => setRagQuery(e.target.value)}
                      placeholder="例如：平台融资 置换专项债券 地方AMC限制"
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                    <button 
                      type="submit"
                      disabled={ragLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {ragLoading ? "向量检索中..." : "实时匹配"}
                    </button>
                  </div>
                </form>
              </div>

              {ragResult && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">MCP FEDERAL-RAG RESCUE MATCH</span>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4 text-xs font-semibold leading-relaxed text-slate-700">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-indigo-600" />
                        化债合规语义政策返回
                      </span>
                      <span className="text-[9.5px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150 font-bold">Rerank: {ragResult.relevance}</span>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <span className="block text-[10px] text-slate-400">检索源文件名称</span>
                        <span className="text-slate-800 font-extrabold text-xs block">{ragResult.matchedDoc}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-400 mb-2">匹配段落知识点依据</span>
                        <div className="space-y-2">
                          {ragResult.coreRules.map((rule: string, idx: number) => (
                            <div key={idx} className="p-3 bg-indigo-50/10 border border-indigo-100/60 rounded-lg text-[11px] leading-relaxed italic text-slate-650">
                              <span className="font-extrabold text-indigo-700 mr-1.5 font-mono">#{idx + 1}</span>
                              "{rule}"
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
