import React from "react";
import { 
  FileText, X, Search, ZoomIn, ZoomOut, RotateCw, Trash2, Printer, 
  Download, FileCheck2, ShieldCheck, HelpCircle, Columns, Sidebar, 
  Award, AlertTriangle, Eye, Settings, FileSpreadsheet, Lock, List
} from "lucide-react";
import { ProjectFile } from "../types";

interface DocumentPreviewerProps {
  file: ProjectFile;
  onClose: () => void;
  currentTheme?: any;
}

export default function DocumentPreviewer({ file, onClose, currentTheme }: DocumentPreviewerProps) {
  const [viewMode, setViewMode] = React.useState<"pdf" | "word">("pdf");
  const [zoom, setZoom] = React.useState<number>(100);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedPage, setSelectedPage] = React.useState<number>(1);
  const [rotation, setRotation] = React.useState<number>(0);
  const [showSidebar, setShowSidebar] = React.useState<boolean>(true);
  const [isSealed, setIsSealed] = React.useState<boolean>(true);
  const [copied, setCopied] = React.useState<boolean>(false);

  // Generate structured multi-page section mock-ups based on real file properties for exceptional realistic view
  const docPages = React.useMemo(() => {
    const defaultText = file.contentSnippet || "该资产文件为提请评估时初始关联的项目必要佐证材料。";
    
    // Check if borrower financial statement & debt penetration file
    const isFinancialPenetrate = file.name.includes("财务报表") || file.name.includes("借款主体财务报表及负债穿透");

    if (isFinancialPenetrate) {
      return [
        {
          pageNum: 1,
          title: "中合实业资产重组及债务清收专项自查底稿",
          subTitle: "SECTION I: 借款主体财务核心指标与穿透透视",
          date: "2026年05月29日汇编",
          securityLevel: "绝密 (Top Secret)",
          content: [
            "中合实业合并财务报表口径下最新核准数据分析报告，重点聚焦于资产侵蚀及资不抵债风险核准。",
            "经深度穿透审计，其公开合并报表显示总资产折合人民币 14.2 亿元，扣除折旧及抵押担保残值后，可变现净值仅余 5.8 亿元。",
            "合并报表底册显示核心资产负债率攀升至 [112%]，该指标已严重突破破产重整红线极值。本金及计提利息缺口极大，流动性资本公积已全部掏空，呈现实质性 [严重资不抵债] 状态，财务底层自我修复及还款源已彻底干涸。"
          ],
          table: {
            headers: ["审计核心指标", "账面总额(万元)", "评估还原额(万元)", "穿透剔除/偏离率", "内规状态"],
            rows: [
              ["流动资产总额", "34,200", "12,900", "-62.2% (流失严重)", "⚠️ 极度高风险"],
              ["有息非流动负债", "82,500", "82,500", "0.0% (刚性债务)", "🚨 限期清算"],
              ["合并资产负债率", "112.0%", "142.5%", "+30.5% (穿透调计)", "🛑 爆表/超限"],
              ["应纳税及留底退税", "4,120", "2,980", "-27.6% (扣划纠纷)", "⚠️ 轮候提取"]
            ]
          },
          annotation: {
            author: "⚖️ 首席法务顾问",
            role: "Legal Advisor",
            text: "严重警告：中合实业合并报表底下的非资产负债率已录得112%，严重资不抵债。必须穿透审查实际控制人向关联第三方恶意掏空和利益平移的线索，以此拉平其反担保代位求偿对抗权益！",
            pos: "top-4 shadow-md bg-rose-50 border-rose-200 text-rose-900"
          }
        },
        {
          pageNum: 2,
          title: "中合实业资产重组及债务清收专项自查底稿",
          subTitle: "SECTION II: 股东司法涉诉纠纷、轮候冻结与权益冲突排查",
          date: "2026年05月29日汇编",
          securityLevel: "绝密 (Top Secret)",
          content: [
            "股东及实际控制人担保抗辩与资产主权合规性核实底册。",
            "经调取关联诉讼底稿，控股股东涉嫌买卖合同纠纷、民间借贷担保纠纷等 [涉诉诉讼纠纷达 12 起]，目前查明主债务未履行对价判决达人民币 3.8 亿元。",
            "核心股权已由 [多家地方法院司法限高、轮候冻结]。根据《民法典》及AMC司法冻结不良处置红线，任何意图通过非诉协商平移股权转让或划转的通道均被堵死，变现必须进入破产重整司法强拍程序，顺位对抗阻力极高。"
          ],
          lititations: [
            { caseNo: "(2025)沪0112民初8954号", court: "上海市闵行区人民法院", status: "轮候冻结中", amount: "1,200万元" },
            { caseNo: "(2025)苏04民初3120号", court: "江苏省常州市中级人民法院", status: "股权已首封", amount: "8,500万元" },
            { caseNo: "(2026)京0105民初1142号", court: "北京市朝阳区人民法院", status: "查封及限高", amount: "4,600万元" }
          ],
          annotation: {
            author: "📊 资产评估专家",
            role: "Valuation Specialist",
            text: "估值预置：由于股权全部遭遇多头轮候查封，底盘资产（特别是地上商铺部分）在产权上遭遇严重分割瑕疵。在AMC清收模型中，必须直接下调其抵押价值折价系数 25%，并要求提供独立无涉诉关联的第三方联合反担保！",
            pos: "top-20 shadow-md bg-amber-50 border-amber-200 text-amber-900"
          }
        },
        {
          pageNum: 3,
          title: "中合实业资产重组及债务清收专项自查底稿",
          subTitle: "SECTION III: 经营现金流、受托支付及特定监管账户核查意见",
          date: "2026年05月29日汇编",
          securityLevel: "绝密 (Top Secret)",
          content: [
            "经营流水审计表明：[经营性现金流自2024年Q3起持续为负数]，无法覆盖当前的最低付息周转要求。",
            "前置分析显示，该公司在基本户之外私自违规向两个异地一般户进行流水切划，涉嫌隐匿主营收款。鉴于监管缺失，托管行已向公积金和税局出书面预警。",
            "在重组及未来代建的退出路径中，必须强力推行 [全额封闭监管资金管理托管体系]，所有回笼销售款必须先划归AMC指定控制的一级监管账户，执行不可撤销的一票否定受托支付。"
          ],
          annotation: {
            author: "🚨 首席风控委员会",
            role: "Risk Management",
            text: "风控对策：鉴于其经营性现金链完全断裂，我们决不可单方面听信地方接收平台的平移方案。对于代建投入，需由地方城投提供足值存量土地进行土地第一顺位抵押并办理强执行证，否则一票否决白名单准入！",
            pos: "bottom-10 shadow-md bg-indigo-50 border-indigo-200 text-indigo-900"
          }
        }
      ];
    } else {
      // General file formatting
      return [
        {
          pageNum: 1,
          title: "资产项目佐证材料及合规核算文书",
          subTitle: `SECTION I: 文件归类 - ${file.type || "其他补充材料"}`,
          date: file.uploadedAt || "2026年05月29日",
          securityLevel: "安全加密受托 (Confidential)",
          content: [
            `本文件原始文件名：${file.name}`,
            `文件大小：${(file.size / 1024).toFixed(2)} KB`,
            "以下为智能解译与原始文本对照，提取重点资产特征语境：",
            defaultText
          ],
          annotation: {
            author: "🛡️ 终审品控官",
            role: "QC Editor",
            text: "品控自检：文档字面格式转换成功。提取重点关键词与底层抵押要旨吻合，同意归档进入工作流成果。未发现敏感外流文本风险点。",
            pos: "top-4 shadow bg-slate-50 border-slate-250 text-slate-800"
          }
        }
      ];
    }
  }, [file]);

  const activePageData = docPages.find(p => p.pageNum === selectedPage) || docPages[0];

  // Helper to highlight searched term
  const renderHighlightedText = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 text-slate-900 border border-yellow-300 rounded-xs px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const fullText = docPages.map(p => `${p.subTitle}\n${p.content.join("\n")}`).join("\n\n");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="online-previewer-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-[9999] animate-in fade-in duration-300 font-sans">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-slate-100 h-full w-[85%] max-w-[1200px] shadow-2xl border-l border-slate-200 flex flex-col transform animate-in slide-in-from-right duration-300 overflow-hidden">
        
        {/* UPPER PRIMARY TITLE BAR (Double decker detailed bar) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-lg shrink-0">
              <FileCheck2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="truncate text-left">
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded border border-indigo-500/30 font-mono">
                  {file.type === "supplementary" || file.id.includes("supp") ? "1-1.2 补充材料" : "1-1.1 初始申报资料"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ID: {file.id}</span>
                {isSealed && (
                  <span className="text-[9px] bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 font-bold px-1.5 py-0.2 rounded flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-2.5 h-2.5" /> 已通过司法真伪存证核准
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5 mt-0.5 truncate">
                <span>{file.name}</span>
                <span className="text-[11px] font-normal text-slate-400 font-mono">({(file.size / 1024).toFixed(1)} KB)</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Switch Tabs */}
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center gap-0.5 mr-2">
              <button 
                onClick={() => setViewMode("pdf")}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'pdf' 
                    ? "bg-slate-700 text-white shadow-xs" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span>PDF 签章版格式</span>
              </button>
              <button 
                onClick={() => setViewMode("word")}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'word' 
                    ? "bg-slate-700 text-white shadow-xs" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-indigo-505 shrink-0 bg-blue-500" />
                <span>Word 设计对照版</span>
              </button>
            </div>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-700"
              title="关闭预览"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INTERACTIVE FILE VIEWER CONTROL TOOLBAR */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none">
          
          {/* Left panel: outline sidebar toggle & page controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-1.5 rounded-lg border transition-all ${
                showSidebar 
                  ? "bg-slate-100 border-slate-300 text-slate-700 font-bold" 
                  : "bg-white border-slate-200 text-slate-400 hover:text-slate-650"
              }`}
              title="显示/隐藏缩略图侧边栏"
            >
              <Sidebar className="w-4 h-4" />
            </button>
            
            <span className="w-px h-5 bg-slate-200 mx-1"></span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                disabled={selectedPage === 1}
                onClick={() => setSelectedPage(p => Math.max(1, p - 1))}
                className="p-1 px-2 text-xs border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent font-bold"
              >
                ◀ 上一页
              </button>
              <span className="text-xs font-mono px-2 text-slate-700 font-bold">
                第 {selectedPage} / {docPages.length} 页
              </span>
              <button
                disabled={selectedPage === docPages.length}
                onClick={() => setSelectedPage(p => Math.min(docPages.length, p + 1))}
                className="p-1 px-2 text-xs border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent font-bold"
              >
                下一页 ▶
              </button>
            </div>
          </div>

          {/* Center panel: search & text highlighted */}
          <div className="flex items-center gap-2 flex-1 max-w-xs min-w-[150px]">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="在本文书中一键检索关键词..."
                className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 transition-all font-medium placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-[10px] font-bold text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right panel: zoom & action shortcuts */}
          <div className="flex items-center gap-2">
            {/* Zoom scale */}
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => setZoom(z => Math.max(50, z - 25))}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
                title="缩小"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono px-1 font-bold text-slate-600 min-w-[40px] text-center select-none">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(200, z + 25))}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
                title="放大"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="p-1 text-[10px] font-bold text-slate-455 hover:text-slate-800 hover:bg-white rounded transition-colors"
                title="重置缩放"
              >
                1:1
              </button>
            </div>

            {/* Rotation */}
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-850 hover:bg-slate-50 transition-colors"
              title="向右旋转 90 度"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-5 bg-slate-200 mx-1"></span>

            {/* Copy button */}
            <button
              onClick={handleCopyText}
              className={`p-1.5 px-2.5 text-xs font-bold border rounded-lg transition-all flex items-center gap-1.5 ${
                copied 
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{copied ? "✓ 已复制全文" : "复制解译内容"}</span>
            </button>

            {/* Local pseudo print */}
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
              title="本地物理打印"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {/* Toggle security seal */}
            <button
              onClick={() => setIsSealed(!isSealed)}
              className={`p-1.5 px-2 text-xs font-semibold border rounded-lg transition-all flex items-center gap-1.5 ${
                isSealed 
                  ? "bg-slate-100 border-slate-250 text-indigo-700 font-bold" 
                  : "bg-white border-slate-200 text-slate-450 hover:text-slate-650"
              }`}
              title="查看防伪电子签章"
            >
              <Award className="w-3.5 h-3.5" />
              <span>电子印章 {isSealed ? "ON" : "OFF"}</span>
            </button>

          </div>

        </div>

        {/* DUAL WORKSPACE: SIDEBAR & CANVAS */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-100">
          
          {/* SIDEBAR FOR PAGE THUMBNAILS (Toggleable, elegant design) */}
          {showSidebar && (
            <div className="w-[160px] shrink-0 border-r border-slate-250 bg-white flex flex-col min-h-0 select-none">
              <div className="p-2 border-b border-slate-150 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-widest text-slate-450 flex items-center justify-between">
                <span>文档缩略图 ({docPages.length})</span>
                <span className="font-mono text-[9px] text-slate-400">INDEX</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {docPages.map((pg) => {
                  const isActive = pg.pageNum === selectedPage;
                  return (
                    <div
                      key={pg.pageNum}
                      onClick={() => setSelectedPage(pg.pageNum)}
                      className={`group cursor-pointer text-left focus:outline-none transition-all ${
                        isActive 
                          ? "ring-2 ring-indigo-500 rounded-sm" 
                          : "opacity-75 hover:opacity-100"
                      }`}
                    >
                      {/* Miniature preview card representing the page shape */}
                      <div className="w-full aspect-[1/1.414] bg-slate-50 border border-slate-250 rounded shadow-3xs p-1.5 flex flex-col justify-between overflow-hidden relative">
                        {/* Sealing watermark in miniature */}
                        {isSealed && (
                          <div className="absolute inset-0 bg-[radial-gradient(#fee2e2_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
                        )}
                        
                        {/* Fake micro paragraphs */}
                        <div className="space-y-1">
                          <div className="h-1 bg-slate-300 w-3/4 rounded-full"></div>
                          <div className="h-1.5 bg-slate-400 w-full rounded-full"></div>
                          <div className="h-1.5 bg-slate-350 w-5/6 rounded-full"></div>
                          <div className="h-1 bg-slate-250 w-2/3 rounded-full mt-1.5"></div>
                        </div>

                        {/* Footer page number indicator */}
                        <div className="flex items-center justify-between border-t border-slate-150 pt-1">
                          <span className="text-[7px] text-slate-400">Page {pg.pageNum}</span>
                          <span className={`text-[7px] font-mono px-1 rounded-xs ${isActive ? "bg-indigo-600 text-white font-bold" : "bg-slate-200 text-slate-600"}`}>
                            {isActive ? "ACTIVE" : "GOTO"}
                          </span>
                        </div>
                      </div>
                      <span className="block text-[9.5px] font-bold text-center mt-1 text-slate-600 truncate px-1">
                        页码 {pg.pageNum}: {pg.pageNum === 1 ? "核心财务透视" : pg.pageNum === 2 ? "涉诉轮候冻结" : "监管账户核查"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MAIN DOCUMENT CORE PREVIEW SCROLL AREA */}
          <div className="flex-1 overflow-auto p-6 flex flex-col items-center custom-scrollbar relative">
            
            {/* Scale & rotation wrapper container */}
            <div 
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, 
                transformOrigin: "top center",
                transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)"
              }}
              className="mb-8"
            >
              {/* RENDER THE SELECTED DOCUMENT EMBEDDED SHEET */}
              {viewMode === "pdf" ? (
                
                /* PDF RENDER VIEW: Scanned / Official Document Look */
                <div className="w-[780px] bg-white border border-slate-300 shadow-2xl p-12 relative text-left min-h-[1050px] flex flex-col justify-between overflow-hidden group select-text">
                  
                  {/* Watermark layers */}
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-20" />
                  
                  {/* Diagonal Official AMC Warning Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
                    <span className="text-red-500/5 font-extrabold text-5xl uppercase tracking-widest leading-none rotate-[-35deg] whitespace-nowrap text-center -ml-12 font-mono select-none">
                      资产管理公司 (AMC) 对公项目审查专用水印验证对签<br/>
                      CONFIDENTIAL • SECURITY AUDIT LAYER
                    </span>
                  </div>

                  {/* Header metadata row */}
                  <div className="border-b-2 border-red-700 pb-3 flex justify-between items-end shrink-0 relative z-10 font-mono">
                    <div>
                      <span className="text-[12px] font-extrabold text-red-700 tracking-wider">
                        中合实业资产重整及负债剥离工作底稿文件 (PDF/A-1b 格式)
                      </span>
                      <p className="text-[10px] text-slate-450 mt-0.5 font-medium">存证机构: 上海市虹口第二公证处 • 数字水印校验已备案</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-red-700 font-extrabold border border-red-600 px-1.5 py-0.2 rounded-xs">
                        {activePageData.securityLevel}
                      </span>
                      <p className="text-[9px] text-slate-450 mt-1">报告码: AMC-2026-F69</p>
                    </div>
                  </div>

                  {/* Core PDF Content Container */}
                  <div className="my-8 flex-1 relative z-10 flex gap-6 min-h-0">
                    
                    {/* Main text column */}
                    <div className="flex-1 space-y-5 text-slate-800">
                      
                      {/* Document title letterhead */}
                      <div className="text-center space-y-1 mb-6 border-b border-slate-100 pb-5">
                        <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                          {activePageData.title}
                        </h2>
                        <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded inline-block mt-1 font-mono">
                          {activePageData.subTitle}
                        </span>
                      </div>

                      {/* Content paragraphs */}
                      {activePageData.content.map((p, idx) => (
                        <p 
                          key={idx} 
                          className="text-[11.5px] leading-relaxed text-slate-700 font-normal text-justify tracking-wide text-indent"
                          style={{ textIndent: "2rem" }}
                        >
                          {renderHighlightedText(p)}
                        </p>
                      ))}

                      {/* Optional Financial Grid Table Embedded in PDF */}
                      {activePageData.table && (
                        <div className="mt-6 border border-slate-250 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                                {activePageData.table.headers.map((h, i) => (
                                  <th key={i} className="p-2 py-2.5 font-extrabold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150">
                              {activePageData.table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                                  {row.map((cell, cIdx) => {
                                    let cellStyle = "p-2 py-2.5 font-medium";
                                    if (cIdx === 0) cellStyle += " font-bold text-slate-800";
                                    else if (cIdx === 1 || cIdx === 2) cellStyle += " font-mono text-slate-700";
                                    else if (cell.includes("⚠️") || cell.includes("-") || cell.includes("+")) cellStyle += " font-bold text-slate-600";

                                    return (
                                      <td key={cIdx} className={cellStyle}>
                                        {renderHighlightedText(cell)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="bg-slate-50 p-2 border-t border-slate-150 text-[10px] text-slate-450 italic text-right font-mono font-medium">
                            * 数据来源于德勤华永会计师事务所2025年度合并审计辅导报告第三修正案
                          </div>
                        </div>
                      )}

                      {/* Litigation specific view */}
                      {activePageData.lititations && (
                        <div className="mt-5 space-y-2 border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1">
                              <AlertTriangle className="w-3 text-amber-500" />
                              上海及江苏地方法院最新在审/冻结名录核验 (QCC QIANCHENG API LIAISON)
                            </span>
                            <span className="text-[9px] bg-red-100 text-red-700 px-1 font-bold rounded">12起严重纠纷已过滤</span>
                          </div>
                          
                          <div className="space-y-1.5">
                            {activePageData.lititations.map((lit, lIdx) => (
                              <div key={lIdx} className="bg-white border border-slate-150 rounded-lg p-2 flex items-center justify-between text-[10.5px]">
                                <div className="space-y-0.5 text-left">
                                  <span className="font-mono font-bold text-slate-800 block">{lit.caseNo}</span>
                                  <span className="text-slate-400 text-[10px] block font-medium">{lit.court}</span>
                                </div>
                                <div className="text-right space-y-0.5">
                                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-250 font-extrabold px-1.5 py-0.1 rounded block text-center font-mono select-none">
                                    {lit.status}
                                  </span>
                                  <span className="text-[9px] text-slate-500 block font-mono">标的: {lit.amount}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Official Signatures & Round Seal Area */}
                      <div className="pt-10 flex justify-between items-center text-[10.5px] select-none relative">
                        <div className="text-left space-y-1.5 text-slate-500 font-mono">
                          <p>经手资产管理员（核签）：<span className="text-slate-800 font-bold underline decoration-slate-400 decoration-dotted">陈俊杰 (Chen Junjie) </span></p>
                          <p>合规与风控部门复审签记：<span className="text-green-700 font-bold">☑ 已通过系统二次反洗钱审计</span></p>
                          <p>报告生成时间戳：<span className="text-slate-700 font-bold">{activePageData.date}</span></p>
                        </div>
                        
                        {/* Red round seal on the document */}
                        {isSealed && (
                          <div className="absolute right-4 bottom-[-10px] w-28 h-28 border-[3px] border-red-500/80 rounded-full flex flex-col items-center justify-center text-center p-2 text-red-500/80 uppercase font-extrabold rotate-[12deg] pointer-events-none select-none z-20"
                               style={{ transform: "rotate(14deg)" }}>
                            <div className="absolute top-[50%] left-0 right-0 h-[3px] bg-red-500/80 border-t border-b border-white -translate-y-1/2" />
                            <span className="text-[8px] tracking-widest font-serif block mt-1">评估重组专用</span>
                            <span className="text-[11px] block text-center font-bold font-serif leading-none mt-1 z-30 bg-white px-1 font-extrabold">已验核无误</span>
                            <span className="text-[7.5px] block font-serif tracking-tight mt-0.5">上海闵行资产处理中心</span>
                            <div className="absolute top-1 text-[16px]">★</div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Stick notes overlapping onto layout margins representing professional AMC workflow */}
                    <div className="w-[180px] shrink-0 relative hidden lg:block select-none">
                      <div className={`absolute ${activePageData.annotation.pos} right-0 w-[170px] p-3 text-[10.5px] rounded-xl border leading-relaxed text-left flex flex-col gap-1 z-30 transition-shadow hover:shadow-lg`}>
                        <div className="flex items-center justify-between border-b border-current pb-1 mb-1 font-mono">
                          <span className="font-extrabold text-xs block">{activePageData.annotation.author}</span>
                          <span className="text-[8px] opacity-75 uppercase block">{activePageData.annotation.role}</span>
                        </div>
                        <p className="font-medium">{activePageData.annotation.text}</p>
                        <span className="text-[8px] opacity-50 block text-right font-mono mt-1">刚刚留注 • 复核有效</span>
                      </div>
                    </div>

                  </div>

                  {/* Footer page identifier */}
                  <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] text-slate-400 font-mono shrink-0 relative z-10 select-none">
                    <span>* 本文件已启用AMC私有化安全边界加密，禁止私自截屏、打印及外传泄密 *</span>
                    <span>第 {selectedPage} / {docPages.length} 页</span>
                  </div>

                </div>
              ) : (
                
                /* WORD RENDER VIEW: Editable/A4 Microsoft Word styling with rulers */
                <div className="w-[780px] bg-white border border-slate-200 shadow-xl p-16 relative text-left min-h-[1050px] flex flex-col justify-between overflow-hidden group select-text">
                  
                  {/* Top Word Page Ruler Guide Layout Lines */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-8 text-[8px] text-slate-400 font-mono pointer-events-none select-none">
                    <span>0..........1..........2..........3..........4..........5..........6..........7..........8..........9..........10..........11..........12..........13..........14</span>
                    <span>15..........16..........17..........18</span>
                  </div>

                  {/* Word document type margin spacing */}
                  <div className="space-y-6 pt-4 flex-1">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between text-[10px] text-slate-450 border-b border-slate-200 pb-1.5 font-serif select-none">
                      <span>中合实业资产自查整理底本【只读存根】</span>
                      <span>分类号：A-010</span>
                    </div>

                    {/* Word Title styling (Songti style look) */}
                    <div className="text-center space-y-2 py-4">
                      <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-serif">
                        {activePageData.title}
                      </h1>
                      <div className="w-16 h-0.5 bg-slate-800 mx-auto"></div>
                      <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                        {activePageData.subTitle}
                      </p>
                    </div>

                    {/* Word main paragraphs */}
                    <div className="space-y-5 text-slate-800 font-serif leading-loose text-[12.5px] tracking-wide text-justify">
                      {activePageData.content.map((p, idx) => (
                        <p 
                          key={idx} 
                          className="text-indent"
                          style={{ textIndent: "2.5rem" }}
                        >
                          {p}
                        </p>
                      ))}

                      {/* Word tables */}
                      {activePageData.table && (
                        <div className="my-6 border-2 border-slate-900 p-1">
                          <table className="w-full text-left text-[11.5px] border border-slate-900 border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-900">
                                {activePageData.table.headers.map((h, i) => (
                                  <th key={i} className="p-2 border border-slate-900 font-bold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {activePageData.table.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2 border border-slate-900 font-medium">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Word Footer */}
                  <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] text-slate-400 font-serif shrink-0 select-none">
                    <span>文档编制人：中核风控专委会（AMC）- 陈俊杰</span>
                    <span>页码：{selectedPage} 之第 {selectedPage} 页</span>
                  </div>

                </div>

              )}
            </div>

          </div>

        </div>

        {/* BOTTOM QUICK FOOTER CONTROL */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span>支持格式自动转换: Word (.docx), PDF (.pdf), Txt (.txt), RTF (.rtf)</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" title="AMC文书转换内核支持智能体多模态解析核实" />
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-950 text-white rounded-lg transition-colors shadow-xs hover:shadow-md cursor-pointer"
          >
            结束大纲预览
          </button>
        </div>

      </div>
    </div>
  );
}
