import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Layers, Upload, ChevronRight, ChevronDown, FileText, CheckCircle2, 
  Clock, Activity, RefreshCw, MessageCircle, Search, User, AlertCircle
} from "lucide-react";
import { AMCProject, ExecutionEvent } from "../types";

interface FilesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: AMCProject;
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  subfolderFileInputRef: React.RefObject<HTMLInputElement | null>;
  setTargetSubfolderIdForUpload: (id: string | null) => void;
  setPreviewFile: (file: any) => void;
  handleDeleteFile: (id: string) => void;
  setSelectedReportKey: (key: string) => void;
  setSelectedReportIndex: (index: number) => void;
  currentTheme: any;
}

export function FilesDrawer({
  isOpen,
  onClose,
  currentProject,
  expandedFolders,
  setExpandedFolders,
  subfolderFileInputRef,
  setTargetSubfolderIdForUpload,
  setPreviewFile,
  handleDeleteFile,
  setSelectedReportKey,
  setSelectedReportIndex,
  currentTheme
}: FilesDrawerProps) {
  const extractBrand = () => {
    const bgClass = currentTheme?.accentBg || "bg-indigo-600";
    const match = bgClass.match(/bg-(\w+)-/);
    return match ? match[1] : "indigo";
  };
  const brand = extractBrand();

  const initialFiles = currentProject.files.filter(f => f.type !== "supplementary");
  const supplementaryFiles = currentProject.files.filter(f => f.type === "supplementary");

  const isCat1Expanded = !!expandedFolders["1"];
  const isSub11Expanded = !!expandedFolders["1.1"];
  const isSub12Expanded = !!expandedFolders["1.2"];
  const isCat2Expanded = !!expandedFolders["2"];

  const outcomesConfig = [
    { id: "2.1", label: "2.1-法律合规", agentKey: "law_review", emoji: "⚖️", docPrefix: "法律审查报告" },
    { id: "2.2", label: "2.2-估值评估", agentKey: "evaluation", emoji: "📊", docPrefix: "资产评估报告" },
    { id: "2.3", label: "2.3-风险评估", agentKey: "risk_review", emoji: "🚨", docPrefix: "风险评估报告" },
    { id: "2.4", label: "2.4-综合评估", agentKey: "orchestrator", emoji: "🌟", docPrefix: "协同综合报告" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Drawer backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-40"
          />

          {/* Drawer container body */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed left-0 top-0 bottom-0 w-[420px] max-w-[90vw] bg-white border-r border-slate-200 shadow-2xl z-50 flex flex-col h-full text-left"
          >
            {/* Header top bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Layers className={`w-4.5 h-4.5 text-${brand}-600`} />
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">项目资料目录树</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 px-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
              >
                <span>收起</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable folder tree listing */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-3">
                
                {/* 1-项目材料目录 */}
                <div className="space-y-1">
                  <div
                    onClick={() => setExpandedFolders(prev => ({ ...prev, "1": !prev["1"] }))}
                    className="flex items-center justify-between hover:bg-slate-50 p-1.5 rounded-lg cursor-pointer transition-all select-none"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                      {isCat1Expanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      <span>📁</span>
                      <span className="text-sm text-slate-850 font-bold">1-项目材料目录</span>
                    </div>
                  </div>

                  {isCat1Expanded && (
                    <div className="pl-4 space-y-2.5 mt-1 border-l border-slate-100 ml-3.5">
                      
                      {/* 1.1-初始材料 */}
                      <div className="space-y-1">
                        <div 
                          onClick={() => setExpandedFolders(prev => ({ ...prev, "1.1": !prev["1.1"] }))}
                          className="group flex items-center justify-between pl-2.5 pr-1.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 truncate flex-1 pr-2">
                            {isSub11Expanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-550" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="text-slate-400">📂</span>
                            <span className="truncate text-slate-700">1.1-初始材料</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.2 rounded-full">
                              {initialFiles.length}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetSubfolderIdForUpload("initial");
                              setTimeout(() => subfolderFileInputRef.current?.click(), 30);
                            }}
                            className="text-[9.5px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap cursor-pointer"
                          >
                            <Upload className="w-2.5 h-2.5" />
                            <span>上传</span>
                          </button>
                        </div>

                        {isSub11Expanded && (
                          <div className="pl-6 space-y-1">
                            {initialFiles.length === 0 ? (
                              <div className="text-[10px] text-slate-400 italic pl-3 py-1">暂无初始文件</div>
                            ) : (
                              initialFiles.map(f => (
                                <div key={f.id} className="p-1.5 border border-slate-100 rounded-lg bg-slate-50/40 hover:bg-slate-50 transition-all flex items-center justify-between gap-2">
                                  <span 
                                    onClick={() => setPreviewFile(f)}
                                    className="text-xs font-medium text-slate-705 hover:text-indigo-600 hover:underline cursor-pointer block truncate flex-1 font-mono select-none"
                                    title="在线预览"
                                  >
                                    📄 {f.name}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFile(f.id);
                                    }}
                                    className="text-slate-400 hover:text-red-500 text-[10px] font-bold py-0.5 px-1.5 transition-colors cursor-pointer rounded"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* 1.2-补充材料 */}
                      <div className="space-y-1">
                        <div 
                          onClick={() => setExpandedFolders(prev => ({ ...prev, "1.2": !prev["1.2"] }))}
                          className="group flex items-center justify-between pl-2.5 pr-1.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 truncate flex-1 pr-2">
                            {isSub12Expanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-550" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="text-slate-400">📂</span>
                            <span className="truncate text-slate-700">1.2-补充材料</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.2 rounded-full">
                              {supplementaryFiles.length}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetSubfolderIdForUpload("supplementary");
                              setTimeout(() => subfolderFileInputRef.current?.click(), 30);
                            }}
                            className="text-[9.5px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap cursor-pointer"
                          >
                            <Upload className="w-2.5 h-2.5" />
                            <span>上传</span>
                          </button>
                        </div>

                        {isSub12Expanded && (
                          <div className="pl-6 space-y-1">
                            {supplementaryFiles.length === 0 ? (
                              <div className="text-[10px] text-slate-400 italic pl-3 py-1">暂无补充文件</div>
                            ) : (
                              supplementaryFiles.map(f => (
                                <div key={f.id} className="p-1.5 border border-slate-100 rounded-lg bg-slate-50/40 hover:bg-slate-50 transition-all flex items-center justify-between gap-2">
                                  <span 
                                    onClick={() => setPreviewFile(f)}
                                    className="text-xs font-medium text-slate-705 hover:text-indigo-600 hover:underline cursor-pointer block truncate flex-1 font-mono select-none"
                                    title="在线预览"
                                  >
                                    📄 {f.name}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFile(f.id);
                                    }}
                                    className="text-slate-400 hover:text-red-500 text-[10px] font-bold py-0.5 px-1.5 transition-colors cursor-pointer rounded"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* 2-项目工作成果目录 */}
                <div className="space-y-1">
                  <div
                    onClick={() => setExpandedFolders(prev => ({ ...prev, "2": !prev["2"] }))}
                    className="flex items-center justify-between hover:bg-slate-50 p-1.5 rounded-lg cursor-pointer transition-all select-none"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                      {isCat2Expanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      <span>🏆</span>
                      <span className="text-sm text-slate-850 font-bold">2-项目工作成果目录</span>
                    </div>
                  </div>

                  {isCat2Expanded && (
                    <div className="pl-4 space-y-2 mt-1 border-l border-slate-100 ml-3.5">
                      {outcomesConfig.map(sub => {
                        const isSubExpanded = !!expandedFolders[sub.id];
                        const recordsList = currentProject.evaluations[sub.agentKey] || [];

                        return (
                          <div key={sub.id} className="space-y-1">
                            <div 
                              onClick={() => setExpandedFolders(prev => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                              className="flex items-center justify-between pl-2.5 pr-1.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-750 cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5 truncate flex-1">
                                {isSubExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                <span>{sub.emoji}</span>
                                <span className="truncate text-slate-700 font-semibold">{sub.label}</span>
                                <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.2 rounded-full">
                                  {recordsList.length}
                                </span>
                              </div>
                            </div>

                            {isSubExpanded && (
                              <div className="pl-5 space-y-1">
                                {recordsList.length === 0 ? (
                                  <div className="text-[10px] text-slate-400 italic pl-3 py-1">暂无工作成果版本</div>
                                ) : (
                                  recordsList.map((rec, revIdx) => (
                                    <div 
                                      key={rec.id} 
                                      onClick={() => {
                                        setSelectedReportKey(sub.agentKey);
                                        setSelectedReportIndex(revIdx);
                                        onClose(); // Hide drawer on selection
                                      }}
                                      className={`p-1.5 border border-slate-150 rounded-lg bg-${brand}-50/10 hover:bg-${brand}-50/40 transition-all cursor-pointer flex items-center justify-between group`}
                                      title="在主面板中打开审查内容"
                                    >
                                      <div className="flex items-center gap-1 truncate flex-1 pr-1 text-left">
                                        <span className={`text-[10.5px] text-${brand}-600 font-bold font-mono whitespace-nowrap`}>V{rec.version}.0</span>
                                        <span className="text-[11px] font-medium text-slate-650 truncate">{sub.docPrefix}</span>
                                      </div>
                                      <span className={`text-[10px] text-${brand}-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0`}>
                                        查看 ➔
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Bottom help contact */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center select-none">
              当前项目底层系统资产材料归档加密安全受托保护
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --------------------------------------------------------------------------
// EXECUTION RECORDS / LIVE STEPS PROGRESS DRAWER
// --------------------------------------------------------------------------
interface ExecutionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isEvaluating: boolean;
  orchestratorMode: string;
  instructionText: string;
  currentProject: AMCProject;
  currentTheme?: any;
  events: ExecutionEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
}

export function ExecutionDrawer({
  isOpen,
  onClose,
  isEvaluating,
  orchestratorMode,
  instructionText,
  currentProject,
  currentTheme,
  events = [],
  selectedEventId,
  onSelectEvent
}: ExecutionDrawerProps) {

  const [searchQuery, setSearchQuery] = React.useState("");

  // Scoped to the current project
  const projectEvents = events.filter(e => e.projectId === currentProject.id);

  // Filter based on search query
  const filteredEvents = projectEvents.filter(e => 
    e.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.actionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.userRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-find default/fallback active event
  const activeEvent = filteredEvents.find(e => e.id === selectedEventId) || filteredEvents[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-40"
          />

          {/* Body panel - widened to 840px to fit double columns comfortably */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed left-0 top-0 bottom-0 w-[840px] max-w-[95vw] bg-white border-r border-slate-200 shadow-2xl z-50 flex flex-col h-full text-left font-sans"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${currentTheme?.iconBg || "bg-indigo-50"}`}>
                  <Activity className={`w-4.5 h-4.5 animate-pulse ${currentTheme?.text || "text-indigo-600"}`} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <span>委员研判作业记录面板</span>
                    <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">
                      {projectEvents.length} 次总记录
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">针对底稿项目：{currentProject.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 px-2.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold border border-slate-200"
              >
                <span>收起记录</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Split Screen Container */}
            <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50">
              
              {/* LEFT COLUMN: EVENTS LIST (40% width) */}
              <div className="w-[340px] shrink-0 border-r border-slate-200 bg-white flex flex-col min-h-0">
                
                {/* Search Bar */}
                <div className="p-3 border-b border-slate-150 bg-slate-50/50 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索事件记录/用户姓名..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 transition-all font-medium placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Scrollable Events History List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-1.5">
                    事件历史流水 ({filteredEvents.length})
                  </div>
                  
                  {filteredEvents.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs italic">
                      未发现匹配的执行记录
                    </div>
                  ) : (
                    filteredEvents.map((evt) => {
                      const isSelected = activeEvent?.id === evt.id;
                      const isActive = evt.status === 'active';
                      const isFailed = evt.status === 'failed';

                      return (
                        <div
                          key={evt.id}
                          onClick={() => onSelectEvent(evt.id)}
                          className={`p-3 border rounded-xl transition-all cursor-pointer text-left relative overflow-hidden group select-none ${
                            isSelected
                              ? `${currentTheme?.border || "border-indigo-300"} bg-indigo-50/20 shadow-xs`
                              : "border-slate-150 hover:border-slate-350 hover:bg-slate-50"
                          }`}
                        >
                          {/* Active pulsating bar */}
                          {isActive && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-amber-505 animate-pulse bg-amber-500" />
                          )}

                          {/* Trigger User Metadata */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9.5px] font-extrabold text-slate-600 border border-slate-200 font-mono shrink-0">
                                {evt.userAvatar?.substring(0, 2) || "U"}
                              </span>
                              <div className="truncate">
                                <span className="text-xs font-bold text-slate-800 block leading-tight">{evt.user}</span>
                                <span className="text-[9px] text-slate-400 block leading-none">{evt.userRole}</span>
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium font-mono shrink-0 whitespace-nowrap">
                              {evt.timestamp?.substring(11, 19) || evt.timestamp}
                            </span>
                          </div>

                          {/* Action short description */}
                          <p className="text-[11px] font-medium text-slate-700 leading-normal line-clamp-2 pr-1 mb-2 font-mono">
                            {evt.actionName}
                          </p>

                          {/* Status Tag */}
                          <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100">
                            <span className="text-[8px] uppercase tracking-wider text-slate-450 font-bold">
                              {evt.orchestratorMode === 'single' ? "单兵模式" : "多席会商"}
                            </span>
                            
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold flex items-center gap-1 shrink-0 ${
                              isActive
                                ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                                : isFailed
                                ? "bg-red-50 text-red-700 border border-red-150"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-150"
                            }`}>
                              {isActive ? (
                                <>
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                  <span>正在分析</span>
                                </>
                              ) : isFailed ? (
                                <><span>✕</span><span>阻断/失败</span></>
                              ) : (
                                <><span>✓</span><span>全面审结</span></>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: REVIEWS PROCESS DETAILS (60% width) */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                {activeEvent ? (
                  <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
                    
                    {/* Event summary header card */}
                    <div className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">
                          本次评估指令与要素排查
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-mono font-medium">{activeEvent.timestamp}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">
                          {activeEvent.orchestratorMode === 'single' ? "🔍 独立智能专家审查" : "👥 委员会多席合议会商模式"}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 leading-relaxed mt-1">{activeEvent.actionName}</h4>
                        {activeEvent.instructionText && (
                          <div className="mt-2.5 p-2 bg-slate-50 border-l-2 border-indigo-500 rounded-r text-[10px] text-slate-650 leading-relaxed italic">
                            <b>额外专项批示:</b> "{activeEvent.instructionText}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stepper block */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-[10.5px] uppercase tracking-wider text-slate-400 border-b border-slate-150 pb-1.5 flex items-center justify-between">
                        <span>流水作业进度详情</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {activeEvent.status === 'completed' ? "状态：审结归口存档" : activeEvent.status === 'active' ? "状态：专家交互辩论中..." : "状态：安全挂起"}
                        </span>
                      </h4>

                      <div className="space-y-4 bg-white border border-slate-150 rounded-xl p-4">
                        {activeEvent.steps.map((s, idx) => (
                          <div key={idx} className="flex gap-3 text-left">
                            <div className="flex flex-col items-center shrink-0">
                              <span className={`w-5.5 h-5.5 rounded-full text-[10.5px] font-extrabold flex items-center justify-center ${
                                s.status === 'completed'
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-250 shadow-3xs"
                                  : s.status === 'active'
                                  ? `${currentTheme?.accentBg || "bg-indigo-600"} text-white animate-pulse shadow-xs`
                                  : "bg-slate-100 text-slate-400 border border-slate-200"
                              }`}>
                                {s.status === 'completed' ? "✓" : s.step}
                              </span>
                              {idx < activeEvent.steps.length - 1 && (
                                <div className={`w-0.5 h-8 mt-1.5 ${s.status === 'completed' ? "bg-emerald-250" : "bg-slate-150"}`}></div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 leading-snug">
                              <span className="block text-xs font-bold text-slate-850">{s.title}</span>
                              <span className="block text-[10px] text-slate-450 mt-1">{s.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Communication streams dialogue trace */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-[10.5px] uppercase tracking-wider text-slate-400 border-b border-slate-150 pb-1.5 flex items-center gap-1.5">
                        <MessageCircle className={`w-3.5 h-3.5 ${currentTheme?.text || "text-indigo-500"}`} />
                        <span>席位专家音轨与交互通信记录</span>
                      </h4>

                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-3.5 max-h-[380px] overflow-y-auto">
                        {activeEvent.communicationTranscripts && activeEvent.communicationTranscripts.length > 0 ? (
                          activeEvent.communicationTranscripts.map((bubble, bIdx) => {
                            let themeBg = "bg-white border-slate-100";
                            if (bubble.bubbleType === 'lawyer') themeBg = `${currentTheme?.badge || "bg-indigo-50/40 border-indigo-100/60"}`;
                            else if (bubble.bubbleType === 'valuer') themeBg = "bg-emerald-50/30 border-emerald-150/40 text-slate-750";
                            else if (bubble.bubbleType === 'risk') themeBg = "bg-amber-50/20 border-amber-100/30 text-slate-750";

                            return (
                              <div key={bIdx} className="space-y-1">
                                <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-500">
                                  <span>{bubble.senderAvatar} {bubble.senderName} • {bubble.senderRole}</span>
                                  <span className="font-mono">{bubble.timestamp}</span>
                                </div>
                                <div className={`p-2.5 rounded-lg border font-normal text-[10.5px] leading-relaxed text-slate-705 shadow-3xs ${themeBg}`}>
                                  {bubble.content}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-xs italic">
                            暂未生产交互会商记录
                          </div>
                        )}

                        {/* Live active indicator */}
                        {isEvaluating && activeEvent.status === 'active' && (
                          <div className="flex items-center gap-2 p-1.5 text-xs text-slate-500 animate-pulse font-mono select-none bg-indigo-50/20 border border-dotted border-indigo-200 rounded-lg">
                            <RefreshCw className={`w-3.5 h-3.5 animate-spin ${currentTheme?.text || "text-indigo-610"}`} />
                            <span>品质控制专家正在对合并底稿合规文本字句及内规指标进行交叉穿透校正中...</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 text-center">
                    <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs">请自左侧选择特定事件以调阅底稿评估流水过程与智能会商音轨记录</p>
                  </div>
                )}
              </div>

            </div>

            {/* Sticky live status bottom indicator */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-4 text-[10px] text-slate-500 select-none shrink-0 font-medium font-mono">
              <span>项目标识: {currentProject.id}</span>
              <span>
                {isEvaluating ? "⏳ 多智能体协同会商并发研判管道执行中..." : "✓ 本轮委员会商研判作业已全面终审盖印存档"}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
