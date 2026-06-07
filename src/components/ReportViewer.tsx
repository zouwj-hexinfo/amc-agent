import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, Clock, FileText, Wand2, RefreshCw, X, AlertTriangle, FileCheck2, ShieldCheck, Activity, Gauge, MessageCircle, Bot, UserRound, TerminalSquare
} from "lucide-react";
import { EvaluationRecord, AMCProject, ExecutionEvent, CommunicationBubble } from "../types";
import MarkdownRenderer from "./MarkdownRenderer";
import { formatBeijingTime } from "../lib/time";

const getThemeColorName = (themeObj: any): string => {
  if (!themeObj) return "indigo";
  const txt = themeObj.text || "";
  if (txt.includes("emerald")) return "emerald";
  if (txt.includes("purple")) return "purple";
  if (txt.includes("amber")) return "amber";
  if (txt.includes("sky")) return "sky";
  if (txt.includes("cyan")) return "cyan";
  if (txt.includes("rose")) return "rose";
  return "indigo";
};

const hexMap: Record<string, { base: string; dark: string; light: string; lighter: string }> = {
  indigo: { base: "#4f46e5", dark: "#3730a3", light: "#818cf8", lighter: "#e0e7ff" },
  purple: { base: "#9333ea", dark: "#6b21a8", light: "#c084fc", lighter: "#f3e8ff" },
  emerald: { base: "#10b981", dark: "#065f46", light: "#34d399", lighter: "#d1fae5" },
  amber: { base: "#d97706", dark: "#92400e", light: "#fbbf24", lighter: "#fef3c7" },
  sky: { base: "#0284c7", dark: "#075985", light: "#38bdf8", lighter: "#e0f2fe" },
  cyan: { base: "#0891b2", dark: "#155e75", light: "#22d3ee", lighter: "#ecfeff" },
  rose: { base: "#e11d48", dark: "#9f1239", light: "#fb7185", lighter: "#ffe4e6" },
};

function ReportDisplayTabButton({
  active,
  label,
  count,
  icon,
  brand,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon: React.ReactNode;
  brand: string;
  onClick: () => void;
}) {
  const color = hexMap[brand] || hexMap.indigo;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-extrabold transition-all ${
        active ? "text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
      style={active ? { backgroundColor: color.base } : undefined}
    >
      {icon}
      <span>{label}</span>
      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>
        {count}
      </span>
    </button>
  );
}

type AgentTraceScrollState = {
  scrollTop: number;
  latestMessageSignature: string;
};

function AgentTraceTimeline({
  events,
  currentTheme,
  brand,
  scrollStateRef,
}: {
  events: ExecutionEvent[];
  currentTheme: any;
  brand: string;
  scrollStateRef: React.MutableRefObject<AgentTraceScrollState>;
}) {
  const color = hexMap[brand] || hexMap.indigo;
  const scrollBodyRef = React.useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const latestMessageSignature = React.useMemo(
    () => events.map(event => {
      const lastBubble = event.communicationTranscripts[event.communicationTranscripts.length - 1];
      return [
        event.id,
        event.status,
        event.communicationTranscripts.length,
        lastBubble?.senderName || "",
        lastBubble?.senderRole || "",
        lastBubble?.content.length || 0,
      ].join(":");
    }).join("|"),
    [events]
  );

  React.useLayoutEffect(() => {
    const scrollBody = scrollBodyRef.current;
    if (!scrollBody) return;

    const previousSignature = scrollStateRef.current.latestMessageSignature;
    if (!previousSignature || previousSignature === latestMessageSignature) {
      scrollBody.scrollTop = scrollStateRef.current.scrollTop;
    } else {
      bottomAnchorRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    }
    scrollStateRef.current.latestMessageSignature = latestMessageSignature;
  }, [latestMessageSignature, scrollStateRef]);

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs select-none">
        <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="text-xs font-bold text-slate-700">暂无智能体对话记录</h4>
        <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
          当前项目尚未沉淀专家智能体通信流水。启动分析后，Hermes 事件会在此按时间顺序连续展示。
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <TerminalSquare className="h-3.5 w-3.5" style={{ color: color.base }} />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-slate-900">智能体交互流水</div>
            <div className="text-[10px] font-semibold text-slate-400">
              当前项目后续 Hermes Agent 返回消息与用户输入文本
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] font-bold text-slate-400 sm:mt-0 sm:text-right">
          {events.length} 次执行 · {events.reduce((sum, event) => sum + event.communicationTranscripts.length, 0)} 条通信
        </div>
      </div>

      <div
        ref={scrollBodyRef}
        onScroll={(event) => {
          scrollStateRef.current.scrollTop = event.currentTarget.scrollTop;
        }}
        className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-3 py-4 sm:px-5"
      >
        <div className="space-y-5">
        {events.map(event => {
          const hasTranscripts = event.communicationTranscripts.length > 0;
          const statusColor = event.status === 'failed'
            ? '#ef4444'
            : event.status === 'stopped'
              ? '#64748b'
              : event.status === 'completed'
                ? '#10b981'
                : color.base;
          const transcriptCount = event.communicationTranscripts.length;
          const shortAnalysisId = event.analysisId?.replace(/^analysis-/, '').slice(0, 10);
          return (
            <section key={event.id} className="rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="border-b border-slate-100 px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-slate-50"
                      style={{ backgroundColor: statusColor }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-extrabold text-slate-900">{event.actionName}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-400">
                        <span>{formatBeijingTime(event.timestamp, event.timestamp || "", { seconds: true, assumePlainTimestampAsUtc: true })}</span>
                        <span>{event.orchestratorMode === 'single' ? '指定专家' : event.orchestratorMode === 'chain' ? '顺序执行' : '智能规划'}</span>
                        <span>{transcriptCount} 条消息</span>
                        {shortAnalysisId && <span className="font-mono">analysis {shortAnalysisId}</span>}
                      </div>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black ${
                    event.status === 'failed'
                      ? "bg-red-50 text-red-700 border border-red-100"
                      : event.status === 'stopped'
                        ? "bg-slate-100 text-slate-600 border border-slate-200"
                      : event.status === 'completed'
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {event.status === 'failed' ? '异常' : event.status === 'stopped' ? '已停止' : event.status === 'completed' ? '完成' : '进行中'}
                  </span>
                </div>
              </div>

              {hasTranscripts ? (
                <div className="space-y-3 px-3 py-3.5 sm:px-4">
                  {event.communicationTranscripts.map((bubble, index) => (
                    <React.Fragment key={`${event.id}-${index}`}>
                      <AgentTraceBubble
                        bubble={bubble}
                        currentTheme={currentTheme}
                        brand={brand}
                      />
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="m-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-[11px] font-semibold text-slate-400">
                  本次执行暂无通信气泡记录。
                </div>
              )}
            </section>
          );
        })}
          <div ref={bottomAnchorRef} className="h-px" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function AgentTraceBubble({
  bubble,
  currentTheme,
  brand,
}: {
  bubble: CommunicationBubble;
  currentTheme: any;
  brand: string;
}) {
  const color = hexMap[brand] || hexMap.indigo;
  const isUser = bubble.bubbleType === 'user';
  const isTool = bubble.senderName.includes('工具') || bubble.senderRole.toLowerCase().includes('tool');
  let themeBg = "border-slate-200 bg-white";
  if (bubble.bubbleType === 'lawyer') themeBg = `${currentTheme?.badge || "bg-indigo-50/40 border-indigo-100/60"}`;
  else if (bubble.bubbleType === 'valuer') themeBg = "border-emerald-100 bg-emerald-50/30";
  else if (bubble.bubbleType === 'risk') themeBg = "border-amber-100 bg-amber-50/30";
  else if (bubble.bubbleType === 'leader') themeBg = "border-slate-200 bg-slate-50";
  else if (isUser) themeBg = "border-slate-300 bg-slate-900 text-white";

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[10px] font-black text-slate-600 shadow-3xs">
          {isTool ? <TerminalSquare className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </div>
      )}
      <div className={`min-w-0 ${isUser ? "max-w-[82%]" : "max-w-[92%]"} space-y-1`}>
        <div className={`flex flex-wrap items-center gap-2 text-[10px] font-bold ${isUser ? "justify-end text-slate-400" : "text-slate-500"}`}>
          <span>{bubble.senderName} · {bubble.senderRole}</span>
          <span className="font-mono text-slate-400">{bubble.timestamp}</span>
        </div>
        <div
          className={`rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed shadow-3xs whitespace-pre-wrap ${
            isUser ? "rounded-tr-sm" : "rounded-tl-sm"
          } ${themeBg}`}
          style={isUser ? { backgroundColor: color.dark, borderColor: color.dark } : undefined}
        >
          {bubble.content}
        </div>
      </div>
      {isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[10px] font-black text-slate-600 shadow-3xs">
          <UserRound className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

function normalizeEventTime(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// SVG CONNECTOR LINES FOR DOCUMENT REVISIONS
// ==========================================
function SVGConnectorLines({ 
  revisions, 
  hoveredRevisionId, 
  projectId, 
  category,
  currentTheme
}: { 
  revisions: any[]; 
  hoveredRevisionId: string | null; 
  projectId: string; 
  category: string; 
  currentTheme?: any;
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

        const x1 = pRect.right - rootRect.left;
        const y1 = (pRect.top + pRect.bottom) / 2 - rootRect.top;
        const pTop = pRect.top - rootRect.top;
        const pBottom = pRect.bottom - rootRect.top;

        const x2 = cRect.left - rootRect.left;
        const y2 = (cRect.top + cRect.bottom) / 2 - rootRect.top;

        const isHovered = hoveredRevisionId === rev.id;

        const offsetLeft = 4;
        const startX = x1 + offsetLeft;
        const bracketD = `M ${startX} ${pTop + 2} L ${startX} ${pBottom - 2}`;

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
    recalculate();

    const handleScrollUpdate = () => {
      requestAnimationFrame(recalculate);
    };

    window.addEventListener("scroll", handleScrollUpdate, { capture: true, passive: true });
    window.addEventListener("resize", handleScrollUpdate, { passive: true });

    const docLayout = document.querySelector(".prose")?.parentElement;
    const historyLayout = document.querySelector("[max-h-\\[500px\\]]");
    docLayout?.addEventListener("scroll", handleScrollUpdate, { passive: true });
    historyLayout?.addEventListener("scroll", handleScrollUpdate, { passive: true });

    const syncInterval = setInterval(recalculate, 300);

    return () => {
      window.removeEventListener("scroll", handleScrollUpdate, { capture: true });
      window.removeEventListener("resize", handleScrollUpdate);
      docLayout?.removeEventListener("scroll", handleScrollUpdate);
      historyLayout?.removeEventListener("scroll", handleScrollUpdate);
      clearInterval(syncInterval);
    };
  }, [recalculate]);

  const colorName = getThemeColorName(currentTheme);
  const colors = hexMap[colorName] || hexMap.indigo;

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
          <path
            d={line.bracketD}
            fill="none"
            stroke={line.isHovered ? "#f43f5e" : colors.base}
            strokeWidth={line.isHovered ? "3.5" : "2.5"}
            className="transition-all duration-150"
          />

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
          <path
            d={line.connectD}
            fill="none"
            stroke={line.isHovered ? "#e11d48" : "#cbd5e1"}
            strokeWidth={line.isHovered ? "2.5" : "1.5"}
            strokeDasharray={line.isHovered ? "none" : "3.5 3.5"}
            className="transition-all duration-150"
          />

          <circle
            cx={line.x1}
            cy={line.pTop + 2}
            r={line.isHovered ? "4" : "2.5"}
            fill={line.isHovered ? "#e11d48" : colors.base}
          />
          <circle
            cx={line.x1}
            cy={line.pBottom - 2}
            r={line.isHovered ? "4" : "2.5"}
            fill={line.isHovered ? "#e11d48" : colors.base}
          />

          <circle
            cx={line.x1}
            cy={line.y1}
            r={line.isHovered ? "5" : "3.5"}
            fill={line.isHovered ? "#e11d48" : colors.dark}
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

// 4 Category options definition matching 2-项目工作成果目录
const SECTIONS_CONFIG = [
  { key: "law_review", subCode: "2.1", label: "法律合规审核", desc: "债务抵押及有效对抗核验", icon: ShieldCheck, color: "text-indigo-600 bg-indigo-50" },
  { key: "evaluation", subCode: "2.2", label: "估值评估计算", desc: "实体资产溢折价顺位计算", icon: FileCheck2, color: "text-blue-600 bg-blue-50" },
  { key: "risk_review", subCode: "2.3", label: "风险评估报告", desc: "追偿红线防线极端压力测试", icon: AlertTriangle, color: "text-rose-600 bg-rose-50" },
  { key: "orchestrator", subCode: "2.4", label: "综合评估底稿", desc: "多专家委员协同终审意见", icon: Gauge, color: "text-emerald-600 bg-emerald-50" }
];

type TuningSuggestion = { label: string; text: string };

interface ReportViewerProps {
  currentProject: AMCProject;
  displayTab: 'report' | 'agentTrace';
  setDisplayTab: (tab: 'report' | 'agentTrace') => void;
  selectedReportKey: string;
  setSelectedReportKey: (key: string) => void;
  selectedReportIndex: number;
  setSelectedReportIndex: (index: number) => void;
  revisions: any[];
  hoveredRevisionId: string | null;
  setHoveredRevisionId: (id: string | null) => void;
  isRightDrawerOpen: boolean;
  setIsRightDrawerOpen: (open: boolean) => void;
  rightDrawerContent: string;
  setRightDrawerContent: (content: string) => void;
  selectedParagraphs: string[];
  setSelectedParagraphs: (paragraphs: string[]) => void;
  tuningInstruction: string;
  setTuningInstruction: (text: string) => void;
  isTuningSubmitting: boolean;
  handleSendParagraphTuning: () => void;
  handleUpdateRecordStatus: (id: string, status: "Draft" | "Confirmed" | "Rejected", notes?: string) => void;
  revisionsOffsets: Record<string, number>;
  isLargeScreen: boolean;
  confirmUndoId: string | null;
  setConfirmUndoId: (id: string | null) => void;
  handleUndoRevision: (id: string, rev: any) => void;
  currentTheme: any;
  executionEvents: ExecutionEvent[];
}

export default function ReportViewer({
  currentProject,
  displayTab,
  setDisplayTab,
  selectedReportKey,
  setSelectedReportKey,
  selectedReportIndex,
  setSelectedReportIndex,
  revisions,
  hoveredRevisionId,
  setHoveredRevisionId,
  isRightDrawerOpen,
  setIsRightDrawerOpen,
  rightDrawerContent,
  setRightDrawerContent,
  selectedParagraphs,
  setSelectedParagraphs,
  tuningInstruction,
  setTuningInstruction,
  isTuningSubmitting,
  handleSendParagraphTuning,
  handleUpdateRecordStatus,
  revisionsOffsets,
  isLargeScreen,
  confirmUndoId,
  setConfirmUndoId,
  handleUndoRevision,
  currentTheme,
  executionEvents
}: ReportViewerProps) {

  const [showRevisionList, setShowRevisionList] = React.useState(false);
  const [tuningSuggestions, setTuningSuggestions] = React.useState<TuningSuggestion[]>([]);
  const [isLoadingTuningSuggestions, setIsLoadingTuningSuggestions] = React.useState(false);
  const agentTraceScrollStateRef = React.useRef<AgentTraceScrollState>({
    scrollTop: 0,
    latestMessageSignature: "",
  });

  const extractBrand = () => {
    const bgClass = currentTheme?.accentBg || "bg-indigo-600";
    const match = bgClass.match(/bg-(\w+)-/);
    return match ? match[1] : "indigo";
  };
  const brand = extractBrand();

  const activeBgClass = 
    brand === 'purple' ? 'bg-purple-600' :
    brand === 'emerald' ? 'bg-emerald-600' :
    brand === 'amber' ? 'bg-amber-600' :
    brand === 'sky' ? 'bg-sky-600' :
    brand === 'cyan' ? 'bg-cyan-600' :
    brand === 'rose' ? 'bg-rose-600' :
    'bg-indigo-600';

  const activeTextClass = 
    brand === 'purple' ? 'text-purple-650' :
    brand === 'emerald' ? 'text-emerald-600' :
    brand === 'amber' ? 'text-amber-650' :
    brand === 'sky' ? 'text-sky-600' :
    brand === 'cyan' ? 'text-cyan-600' :
    brand === 'rose' ? 'text-rose-600' :
    'text-indigo-600';

  const labelTextClass = 
    brand === 'purple' ? 'text-purple-700' :
    brand === 'emerald' ? 'text-emerald-700' :
    brand === 'amber' ? 'text-amber-700' :
    brand === 'sky' ? 'text-sky-700' :
    brand === 'cyan' ? 'text-cyan-700' :
    brand === 'rose' ? 'text-rose-700' :
    'text-indigo-700';

  const borderLClass = 
    brand === 'purple' ? 'border-l-purple-500 hover:border-l-purple-600' :
    brand === 'emerald' ? 'border-l-emerald-500 hover:border-l-emerald-600' :
    brand === 'amber' ? 'border-l-amber-500 hover:border-l-amber-600' :
    brand === 'sky' ? 'border-l-sky-500 hover:border-l-sky-600' :
    brand === 'cyan' ? 'border-l-cyan-500 hover:border-l-cyan-600' :
    brand === 'rose' ? 'border-l-rose-500 hover:border-l-rose-600' :
    'border-l-indigo-500 hover:border-l-indigo-600';

  const previewBoxClass = 
    brand === 'purple' ? 'bg-purple-50/20 border-purple-100/40 text-[10px] text-slate-800 border rounded-lg p-2 max-h-24 overflow-y-auto select-text font-serif' :
    brand === 'emerald' ? 'bg-emerald-50/20 border-emerald-100/40 text-[10px] text-slate-800 border rounded-lg p-2 max-h-24 overflow-y-auto select-text font-serif' :
    brand === 'amber' ? 'bg-amber-50/20 border-amber-100/40 text-[10px] text-slate-800 border rounded-lg p-2 max-h-24 overflow-y-auto select-text font-serif' :
    brand === 'sky' ? 'bg-sky-50/20 border-sky-100/40 text-[10px] text-slate-800 border rounded-lg p-2 max-h-24 overflow-y-auto select-text font-serif' :
    brand === 'cyan' ? 'bg-cyan-50/20 border-cyan-100/40 text-[10px] text-slate-800 border rounded-lg p-2 max-h-24 overflow-y-auto select-text font-serif' :
    brand === 'rose' ? 'bg-rose-50/20 border-rose-100/40 text-[10px] text-slate-800 border rounded-lg p-2 max-h-24 overflow-y-auto select-text font-serif' :
    'bg-indigo-50/20 border-indigo-100/40 text-[10px] text-slate-800 border rounded-lg p-2 max-h-24 overflow-y-auto select-text font-serif';

  // Sync index boundary safety on tab change
  React.useEffect(() => {
    const list = currentProject.evaluations[selectedReportKey] || [];
    if (selectedReportIndex >= list.length) {
      setSelectedReportIndex(Math.max(0, list.length - 1));
    }
  }, [selectedReportKey, currentProject, selectedReportIndex, setSelectedReportIndex]);

  const activeList = currentProject.evaluations[selectedReportKey] || [];
  const activeRecord = activeList[selectedReportIndex] as EvaluationRecord | undefined;
  const selectedTuningText = selectedParagraphs.join("\n").trim();
  const projectExecutionEvents = executionEvents
    .filter(event => event.projectId === currentProject.id)
    .slice()
    .sort((a, b) => normalizeEventTime(a.timestamp) - normalizeEventTime(b.timestamp));

  React.useEffect(() => {
    if (!activeRecord || !selectedTuningText) {
      setTuningSuggestions([]);
      setIsLoadingTuningSuggestions(false);
      return;
    }

    const controller = new AbortController();
    setTuningSuggestions([]);
    setIsLoadingTuningSuggestions(true);

    fetch(`/api/projects/${encodeURIComponent(currentProject.id)}/evaluations/${encodeURIComponent(activeRecord.id)}/tune-suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedText: selectedTuningText, count: 5 }),
      signal: controller.signal,
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || data.message || "微调推荐词生成失败");
        const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
        const normalized = suggestions
          .map((item: Partial<TuningSuggestion>) => ({
            label: String(item.label || "").trim(),
            text: String(item.text || "").trim(),
          }))
          .filter((item: TuningSuggestion) => item.label && item.text)
          .slice(0, 7);
        setTuningSuggestions(normalized);
      })
      .catch(error => {
        if ((error as Error).name === "AbortError") return;
        console.error(error);
        setTuningSuggestions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingTuningSuggestions(false);
      });

    return () => controller.abort();
  }, [activeRecord?.id, currentProject.id, selectedTuningText]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="shrink-0 sticky top-0 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs">
        <ReportDisplayTabButton
          active={displayTab === 'report'}
          label="报告显示"
          count={activeList.length}
          icon={<FileText className="w-3.5 h-3.5" />}
          brand={brand}
          onClick={() => setDisplayTab('report')}
        />
        <ReportDisplayTabButton
          active={displayTab === 'agentTrace'}
          label="智能体对话记录"
          count={projectExecutionEvents.reduce((count, event) => count + event.communicationTranscripts.length, 0)}
          icon={<MessageCircle className="w-3.5 h-3.5" />}
          brand={brand}
          onClick={() => setDisplayTab('agentTrace')}
        />
      </div>

      <div className={`min-h-0 flex-1 pr-1 ${displayTab === 'agentTrace' ? "overflow-hidden" : "overflow-y-auto"}`}>
        {displayTab === 'agentTrace' ? (
          <AgentTraceTimeline
            events={projectExecutionEvents}
            currentTheme={currentTheme}
            brand={brand}
            scrollStateRef={agentTraceScrollStateRef}
          />
        ) : activeList.length === 0 ? (
          <div className="bg-white p-12 border border-slate-200 rounded-2xl text-center shadow-2xs select-none">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-xs font-bold text-slate-700">尚未生成成果草稿</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              该目录子分类中暂无自动输出成果，请点击下方定制化意见区指令按钮、指派对应的专家智能体执行生成。
            </p>
          </div>
        ) : (
          <div id="expert-reports-grid-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
          
          {/* Connector Wires from Markup paragraph selector to float Revisions list */}
          {showRevisionList && (
            <SVGConnectorLines 
              revisions={revisions} 
              hoveredRevisionId={hoveredRevisionId}
              projectId={currentProject.id}
              category={selectedReportKey}
              currentTheme={currentTheme}
            />
          )}

          {/* Sub LEFT: Versions switcher with margin to avoid floating buttons overlap */}
          <div className="lg:sticky lg:top-0 lg:self-start lg:col-span-2 ml-4 lg:ml-7 bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs text-left">
            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
              成果版本库 (V)
            </span>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {activeList.map((rec, idx) => {
                const isSelected = selectedReportIndex === idx;
                return (
                  <button
                    key={rec.id}
                    onClick={() => {
                      setSelectedReportIndex(idx);
                      setSelectedParagraphs([]);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex items-start gap-2.5 ${
                      isSelected
                        ? `bg-${brand}-50/60 border-${brand}-500 font-bold text-${brand}-900 shadow-3xs`
                        : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {rec.status === "Confirmed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-slate-800 font-bold">V{rec.version}.0 {rec.orchestrationMode !== "single" ? "联合" : "单项"}</div>
                      <div className="text-[9px] text-slate-400 font-medium font-sans mt-0.5 truncate">{formatBeijingTime(rec.createdAt)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub CENTER: Markdown Viewer */}
          {activeRecord && (
            <div className="lg:col-span-7 space-y-4 bg-white p-6 border border-slate-200 rounded-xl shadow-sm min-h-[400px]">

              {activeRecord.notes && (
                <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-pulse leading-relaxed text-left">
                  <span className="font-extrabold flex-shrink-0">📝 修订批注：</span>
                  <span>{activeRecord.notes}</span>
                </div>
              )}

              <div className="prose max-w-none text-slate-800 mt-4 select-text">
                <div className="space-y-3">

                  <MarkdownRenderer 
                    content={activeRecord.content} 
                    selectable={true}
                    selectedTexts={selectedParagraphs}
                    onToggleSelectText={(pText) => {
                      setSelectedParagraphs([pText]); // Single point selection for extreme focused edits
                    }}
                    revisions={revisions}
                    hoveredRevisionId={hoveredRevisionId}
                    onHoverRevision={setHoveredRevisionId}
                    renderInlinedTuningForm={() => (
                      <div className="relative border-2 border-indigo-400 bg-indigo-50/20 rounded-2xl p-4.5 mt-3 mb-3 animate-in fade-in duration-200 shadow-md text-left">
                        <div className="absolute -top-2 left-6 w-3 h-3 bg-white border-t border-l border-indigo-400 rotate-45" />
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                            </span>
                            <span className="text-xs font-bold text-indigo-950">下达段落定向微调指令</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <textarea
                            value={tuningInstruction}
                            onChange={(e) => setTuningInstruction(e.target.value)}
                            rows={3}
                            className="w-full text-xs p-3.5 bg-white border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400 leading-relaxed font-sans"
                            placeholder="请输入具体校准指令（例如：'请法律专家追加本段抵押权成立顺位抗辩对抗机制...'）"
                          />
                          
                          {/* Recommendations */}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-[9px] text-slate-400 mr-2 font-bold select-none">推荐语:</span>
                            {isLoadingTuningSuggestions && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 text-[9px] font-bold text-indigo-600">
                                <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                                Hermes生成中
                              </span>
                            )}
                            {tuningSuggestions.map((tag, idx) => (
                              <button
                                key={`${tag.label}-${idx}`}
                                type="button"
                                onClick={() => setTuningInstruction(tag.text)}
                                className="text-[9px] bg-white hover:bg-indigo-50 hover:text-indigo-750 text-slate-600 font-semibold px-2.5 py-1 rounded-md border border-slate-200 cursor-pointer transition-all"
                              >
                                {tag.label}
                              </button>
                            ))}
                          </div>

                          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100 select-none">
                            <button
                              type="button"
                              onClick={() => setSelectedParagraphs([])}
                              className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors font-medium"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              disabled={isTuningSubmitting || !tuningInstruction.trim()}
                              onClick={handleSendParagraphTuning}
                              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-805 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              {isTuningSubmitting ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Hermes 微调写稿中...</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-3.5 h-3.5" />
                                  <span>精校段落 (Execute)</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sub RIGHT: Revisions list column */}
          <div className="lg:col-span-3 relative min-h-[400px] space-y-3.5">
            {/* Toggle Switch at top of revisions area */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs flex items-center justify-between text-left select-none">
              <div className="flex items-center gap-2">
                <FileCheck2 className={`w-4 h-4 ${showRevisionList ? activeTextClass : 'text-slate-400'}`} />
                <div className="space-y-0.5">
                  <span className="block text-[10.5px] font-extrabold text-slate-700">查看修订记录</span>
                  <span className="block text-[9px] text-slate-400 font-medium leading-none">比对调优批注卡片</span>
                </div>
              </div>
              <button
                id="toggle-revisions-record"
                onClick={() => setShowRevisionList(!showRevisionList)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showRevisionList ? activeBgClass : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    showRevisionList ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {!showRevisionList ? (
              <div className="text-center py-8 px-4 bg-slate-50/40 border border-slate-200 rounded-xl select-none lg:sticky lg:top-4 mx-0.5 space-y-2">
                <FileText className="w-7 h-7 text-slate-350 mx-auto opacity-70" />
                <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">已收起修订比对栏</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  正文中已修订部分仍保留高亮标识，开启上方开关可展开查看具体的修正对比参数。
                </p>
              </div>
            ) : (() => {
              const projectRevs = revisions.filter(
                (r) => r.projectId === currentProject?.id && r.category === selectedReportKey
              );

              if (projectRevs.length === 0) {
                return (
                  <div className="text-center py-10 px-5 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl select-none lg:sticky lg:top-4 mx-1">
                    <FileText className="w-8 h-8 text-slate-350 mx-auto opacity-70 mb-2" />
                    <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">协同修订批注栏</h4>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      💡 点击正文内的段落，系统可精细调遣对应场景专家智能体进行增删替换，并形成比对存底卡片。
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4 lg:space-y-0 relative min-h-[400px]">
                  {projectRevs.map((rev, index) => {
                    const isHovered = hoveredRevisionId === rev.id;
                    const verticalOffset = revisionsOffsets[rev.id];

                    return (
                      <div 
                        key={rev.id} 
                        data-card-rev-id={rev.id}
                        onMouseEnter={() => setHoveredRevisionId(rev.id)}
                        onMouseLeave={() => setHoveredRevisionId(null)}
                        style={{
                          top: isLargeScreen && verticalOffset !== undefined ? `${verticalOffset}px` : undefined,
                          position: isLargeScreen && verticalOffset !== undefined ? "absolute" : "relative",
                          width: isLargeScreen ? "100%" : undefined,
                          zIndex: isHovered ? 20 : 10,
                          transition: "top 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s, box-shadow 0.2s"
                        }}
                        className={`bg-white border rounded-xl p-3.5 shadow-2xs space-y-2.5 text-[11px] leading-relaxed transition-all duration-200 border-l-[3.5px] text-left ${
                          isHovered 
                            ? "border-rose-500 border-l-rose-500 ring-2 ring-rose-100 shadow-md bg-rose-50/5" 
                            : `border-slate-200 ${borderLClass}`
                        }`}
                      >
                        <div className="flex items-center justify-between pointer-events-none">
                          <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded border flex items-center gap-1 select-none ${currentTheme?.badge || "bg-indigo-50 text-indigo-700 border-indigo-100"}`}>
                            <Wand2 className="w-2.5 h-2.5" />
                            修订案 #{projectRevs.length - index}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono select-none">
                            {formatBeijingTime(rev.createdAt)}
                          </span>
                        </div>

                        <div>
                          <div className="text-slate-400 text-[9px] font-bold uppercase select-none">优化批注指令</div>
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-normal italic mt-0.5 text-slate-700 leading-snug">
                            "{rev.instruction}"
                          </div>
                        </div>

                        {rev.originalText && (
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-450 font-bold block select-none">原文字段</span>
                            <div className="p-2 bg-slate-50 text-[10px] text-slate-550 border border-slate-100 rounded-lg italic max-h-24 overflow-y-auto select-text font-serif line-through decoration-slate-350 decoration-1">
                              {rev.originalText}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <span className={`text-[9px] block select-none ${labelTextClass}`}>修正更新段落</span>
                          <div className={previewBoxClass}>
                            {rev.tunedText}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 select-none">
                          {confirmUndoId === rev.id ? (
                            <div className="flex flex-col gap-1 w-full animate-in slide-in-from-bottom-1 duration-150">
                              <p className="text-[9.5px] text-rose-500 font-bold leading-tight">确定要还原撤销该段的修改？</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <button
                                  onClick={() => {
                                    setConfirmUndoId(null);
                                    handleUndoRevision(rev.id, rev);
                                  }}
                                  className="px-2.5 py-1 text-[9px] text-white bg-rose-600 hover:bg-rose-700 font-extrabold border border-rose-600 rounded-md transition-all cursor-pointer"
                                >
                                  确认撤销
                                </button>
                                <button
                                  onClick={() => setConfirmUndoId(null)}
                                  className="px-2.5 py-1 text-[9px] text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-md transition-all cursor-pointer font-bold"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center w-full">
                              <button
                                onClick={() => setConfirmUndoId(rev.id)}
                                className="px-2 py-1 text-[9px] text-slate-450 hover:text-rose-600 font-bold bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>撤回更新</span>
                              </button>
                              <span className="text-[9px] text-slate-400 font-medium italic">
                                瞬时同步
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          </div>
        )}
      </div>
    </div>
  );
}
