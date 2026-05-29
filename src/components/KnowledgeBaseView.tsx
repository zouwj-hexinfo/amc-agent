import React from "react";
import { KnowledgeItem } from "../types";
import { 
  BookOpen, Search, PlusCircle, Scale, BarChart3, Database, MessageSquare, 
  ClipboardCheck, Briefcase, UploadCloud, FileText, Trash2, Paperclip, X 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StructuredMarketView from "./StructuredMarketView";

interface KnowledgeBaseViewProps {
  items: KnowledgeItem[];
  onAddNewItem: (item: Omit<KnowledgeItem, 'id'>) => Promise<void>;
  currentTheme?: any;
}

export default function KnowledgeBaseView({ items, onAddNewItem, currentTheme }: KnowledgeBaseViewProps) {
  const brandConfig: Record<string, {
    text: string;
    textDark: string;
    bg: string;
    bgHover: string;
    badge: string;
    borderHover: string;
    accentLine: string;
    pill: string;
    link: string;
  }> = {
    indigo: {
      text: "text-indigo-600",
      textDark: "text-indigo-700",
      bg: "bg-indigo-600",
      bgHover: "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700",
      badge: "text-indigo-700 bg-indigo-50/50 border border-indigo-100",
      borderHover: "hover:border-indigo-300",
      accentLine: "bg-indigo-500",
      pill: "text-indigo-600 bg-indigo-50/60 border border-indigo-100/40",
      link: "text-indigo-600 hover:text-indigo-700 font-extrabold"
    },
    purple: {
      text: "text-purple-600",
      textDark: "text-purple-700",
      bg: "bg-purple-600",
      bgHover: "bg-purple-600 hover:bg-purple-500 active:bg-purple-700",
      badge: "text-purple-700 bg-purple-50/50 border border-purple-100",
      borderHover: "hover:border-purple-300",
      accentLine: "bg-purple-500",
      pill: "text-purple-600 bg-purple-50/60 border border-purple-100/40",
      link: "text-purple-600 hover:text-purple-700 font-extrabold"
    },
    emerald: {
      text: "text-emerald-600",
      textDark: "text-emerald-700",
      bg: "bg-emerald-600",
      bgHover: "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700",
      badge: "text-emerald-700 bg-emerald-50/50 border border-emerald-100",
      borderHover: "hover:border-emerald-300",
      accentLine: "bg-emerald-500",
      pill: "text-emerald-600 bg-emerald-50/60 border border-emerald-100/40",
      link: "text-emerald-600 hover:text-emerald-700 font-extrabold"
    },
    amber: {
      text: "text-amber-600",
      textDark: "text-amber-700",
      bg: "bg-amber-600",
      bgHover: "bg-amber-600 hover:bg-amber-500 active:bg-amber-700",
      badge: "text-amber-700 bg-amber-50/50 border border-amber-100",
      borderHover: "hover:border-amber-300",
      accentLine: "bg-amber-500",
      pill: "text-amber-600 bg-amber-50/60 border border-amber-100/40",
      link: "text-amber-600 hover:text-amber-700 font-extrabold"
    },
    sky: {
      text: "text-sky-600",
      textDark: "text-sky-700",
      bg: "bg-sky-600",
      bgHover: "bg-sky-600 hover:bg-sky-500 active:bg-sky-700",
      badge: "text-sky-700 bg-sky-50/50 border border-sky-100",
      borderHover: "hover:border-sky-300",
      accentLine: "bg-sky-500",
      pill: "text-sky-600 bg-sky-50/60 border border-sky-100/40",
      link: "text-sky-600 hover:text-sky-700 font-extrabold"
    },
    cyan: {
      text: "text-cyan-600",
      textDark: "text-cyan-700",
      bg: "bg-cyan-600",
      bgHover: "bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700",
      badge: "text-cyan-700 bg-cyan-50/50 border border-cyan-100",
      borderHover: "hover:border-cyan-300",
      accentLine: "bg-cyan-500",
      pill: "text-cyan-600 bg-cyan-50/60 border border-cyan-100/40",
      link: "text-cyan-600 hover:text-cyan-700 font-extrabold"
    },
    rose: {
      text: "text-rose-600",
      textDark: "text-rose-700",
      bg: "bg-rose-600",
      bgHover: "bg-rose-600 hover:bg-rose-500 active:bg-rose-700",
      badge: "text-rose-700 bg-rose-50/50 border border-rose-100",
      borderHover: "hover:border-rose-300",
      accentLine: "bg-rose-500",
      pill: "text-rose-600 bg-rose-50/60 border border-rose-100/40",
      link: "text-rose-600 hover:text-rose-700 font-extrabold"
    }
  };

  const getBrandName = (themeObj: any): string => {
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

  const brandKey = getBrandName(currentTheme);
  const activeBrand = brandConfig[brandKey] || brandConfig.indigo;

  const [selectedCat, setSelectedCat] = React.useState<KnowledgeItem['category'] | 'all'>("policies");
  const [searchVal, setSearchVal] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = React.useState<KnowledgeItem | null>(null);

  const [marketRowsCount, setMarketRowsCount] = React.useState<number>(0);

  const updateMarketCount = React.useCallback(() => {
    const cached = localStorage.getItem("amc_market_structured_db");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          let total = 0;
          parsed.forEach((obj: any) => {
            if (obj && Array.isArray(obj.rows)) {
              total += obj.rows.length;
            }
          });
          setMarketRowsCount(total);
          return;
        }
      } catch (e) {
        console.error("Failed to parse market structured db for stats:", e);
      }
    }
    // Fallback default
    setMarketRowsCount(7);
  }, []);

  React.useEffect(() => {
    updateMarketCount();
    window.addEventListener("amc_market_db_updated", updateMarketCount);
    return () => {
      window.removeEventListener("amc_market_db_updated", updateMarketCount);
    };
  }, [updateMarketCount]);

  // Ingestion form state
  const [formTitle, setFormTitle] = React.useState("");
  const [formCat, setFormCat] = React.useState<KnowledgeItem['category']>("policies");
  const [formContent, setFormContent] = React.useState("");
  const [formTags, setFormTags] = React.useState("");
  const [formSource, setFormSource] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Uploaded files and drag & drop states
  const [uploadedFiles, setUploadedFiles] = React.useState<{ name: string; size: number }[]>([]);
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map((f: any) => ({
        name: f.name,
        size: f.size
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f: any) => ({
        name: f.name,
        size: f.size
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeUploadedFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleOpenAddForm = () => {
    setFormCat(selectedCat !== "all" ? selectedCat : "policies");
    setIsAdding(true);
  };

  const categoriesMap: { key: KnowledgeItem['category']; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: "policies", label: "政策法规库", desc: "监管限额、法院拍卖细则及金融条例", icon: <Scale className="w-4 h-4 text-slate-500" /> },
    { key: "legal", label: "法律知识库", desc: "民法典物权篇、抵押顺位优先权解析", icon: <MessageSquare className="w-4 h-4 text-slate-500" /> },
    { key: "market", label: "市场数据库", desc: "长三角与大湾区大宗不动产折旧指标表", icon: <BarChart3 className="w-4 h-4 text-slate-500" /> },
    { key: "cases", label: "案例数据库", desc: "工业用房盘活、债务平移处置典型案例", icon: <Database className="w-4 h-4 text-slate-500" /> },
    { key: "methodology", label: "评估方法库", desc: "收益还原计价法及现金流折现公式标准", icon: <ClipboardCheck className="w-4 h-4 text-slate-500" /> },
    { key: "internal_policies", label: "内规制度库", desc: "AMC准入门槛、LTV限额及审批极值", icon: <BookOpen className="w-4 h-4 text-slate-500" /> },
    { key: "industry", label: "行业知识库", desc: "制造加工与传统制造特种设备流动趋势", icon: <Briefcase className="w-4 h-4 text-slate-500" /> },
    { key: "feedback", label: "反馈知识库", desc: "报告段落智能微调与修订历史记录库", icon: <MessageSquare className="w-4 h-4 text-slate-500" /> },
  ];

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCat === "all" || item.category === selectedCat;
    const matchesQuery = item.title.toLowerCase().includes(searchVal.toLowerCase()) || 
                         item.content.toLowerCase().includes(searchVal.toLowerCase()) ||
                         item.tags.some(t => t.toLowerCase().includes(searchVal.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) return;

    setIsSubmitting(true);
    try {
      let finalContent = formContent;
      if (uploadedFiles.length > 0) {
        finalContent += `\n\n[已关联附件文档: ${uploadedFiles.map(f => `${f.name} (${formatBytes(f.size)})`).join(", ")}]`;
      }

      await onAddNewItem({
        title: formTitle,
        category: formCat,
        content: finalContent,
        tags: formTags || "新增法规",
        source: formSource || "用户添加"
      });
      // Clear form
      setFormTitle("");
      setFormContent("");
      setFormTags("");
      setFormSource("");
      setUploadedFiles([]);
      setIsAdding(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExcerpt = (text: string) => {
    if (!text) return "暂无详细摘要描述";
    const cleanText = text.replace(/\[已关联附件文档:.*?\]/g, "").trim();
    if (cleanText.length <= 180) return cleanText;
    return cleanText.slice(0, 180) + "...";
  };

  const getCategoryLabel = (cat: string) => {
    return categoriesMap.find(c => c.key === cat)?.label || "全维知识库";
  };

  const totalItemsCount = items.filter(i => i.category !== "market").length + marketRowsCount;

  return (
    <div className="bg-slate-50/75 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col relative">
      {/* Decorative gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r from-${brandKey}-50/30 via-slate-50/40 to-transparent pointer-events-none z-0`} />

      <div className={`relative z-10 p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-${brandKey}-50/60 via-slate-50/80 to-transparent`}>
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <BookOpen className={`w-4 h-4 inline mr-1 ${activeBrand.text}`} />
            AMC智能法审与重构知识库 (8-Dimensional Ingest)
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">多维知识仓储：检索出的依据可在专家Agent起草报告时当作实时上下文(RAG)嵌入</p>
        </div>
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="relative z-10 p-6 space-y-5 max-w-2xl bg-white/60 border border-slate-200/60 rounded-2xl shadow-sm m-5 text-left">
          <div className="border-b border-slate-200/80 pb-3">
            <h4 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
              <PlusCircle className={`w-4 h-4 ${activeBrand.text}`} />
              以文档为核心新建知识构建「{categoriesMap.find(c => c.key === formCat)?.label}」
            </h4>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">提供所需各项材料，系统在后台对多源信息、备注及附加文档智能建立词向量化</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-600 font-bold">标题</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="请输入文档、规章或典型案例标题"
                className={`w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-${brandKey}-500 font-medium font-semibold`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-600 font-bold flex items-center justify-between">
                <span>所属分类元数据库</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${activeBrand.text} bg-${brandKey}-50`}>自动选中，只读</span>
              </label>
              <select
                disabled
                value={formCat}
                className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 rounded-lg text-slate-500 font-bold cursor-not-allowed select-none opacity-90"
              >
                {categoriesMap.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-600 font-bold">特征标签 (多个标签逗号分隔)</label>
              <input
                type="text"
                value={formTags}
                onChange={e => setFormTags(e.target.value)}
                placeholder="例如: 拍卖折扣, 抵押顺位, 先进机械"
                className={`w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-${brandKey}-500 font-medium font-semibold`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-600 font-bold">颁布单位/数据源</label>
              <input
                type="text"
                value={formSource}
                onChange={e => setFormSource(e.target.value)}
                placeholder="例如：最高人民法院 / 发展改革委 / 上海金融监督管理局"
                className={`w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-${brandKey}-500 font-medium font-semibold`}
              />
            </div>
          </div>

          {/* Upload files field */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-600 font-bold">上传文件 (支持上传多个文件)</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                dragActive 
                  ? `border-${brandKey}-500 bg-${brandKey}-50/20` 
                  : `border-slate-250 bg-slate-50/60 hover:bg-slate-50/10 hover:border-${brandKey}-400`
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <UploadCloud className={`w-7 h-7 mx-auto mb-1 animate-pulse text-${brandKey}-500/60`} />
              <p className="text-xs font-bold text-slate-700">拖拽文件到此处，或 <span className={`hover:underline text-${brandKey}-600`}>点击浏览上传</span></p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">支持PDF、DOCX、XLSX、TXT等核心文档 (可上传多个文件)</p>
            </div>

            {/* List of uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-1.5 rounded-xl border border-slate-205/65 bg-slate-50/50 p-3">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">待上传的文档列表 ({uploadedFiles.length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-3xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Paperclip className={`w-3.5 h-3.5 flex-shrink-0 text-${brandKey}-500`} />
                        <span className="font-mono text-[11px] truncate text-slate-800 font-bold" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[9px] text-slate-455 font-bold font-mono flex-shrink-0 text-slate-400">
                          ({formatBytes(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUploadedFile(idx);
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-bold">备注信息</label>
            <textarea
              required
              rows={4}
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              placeholder="请输入对此核心文档或评估案例需要被 RAG 检出的核心分析、规则、极值标准等备注内容..."
              className={`w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-${brandKey}-500 font-medium leading-relaxed font-semibold`}
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-150">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer ${activeBrand.bgHover}`}
            >
              {isSubmitting ? "正在导入物理大纲索引..." : "添加并导入为知识段 (Ingest)"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormTitle("");
                setFormContent("");
                setFormTags("");
                setFormSource("");
                setUploadedFiles([]);
                setIsAdding(false);
              }}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
          
          {/* List switcher */}
          <div className="w-full md:w-64 p-3 bg-slate-50/40 flex-shrink-0 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider mb-1">分选依据图谱</p>
            <button
              onClick={() => setSelectedCat("all")}
              className={`w-full text-left p-2.5 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
                selectedCat === "all"
                  ? "bg-white border-slate-200 text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100/70"
              }`}
            >
              全部八大知识目录 ({totalItemsCount})
            </button>
            {categoriesMap.map((cat) => {
              const count = cat.key === "market" ? marketRowsCount : items.filter(i => i.category === cat.key).length;
              const isActive = selectedCat === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCat(cat.key)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 border cursor-pointer group/catbtn ${
                    isActive
                      ? `bg-white border-slate-200 ${activeBrand.textDark} font-extrabold shadow-sm`
                      : "border-transparent text-slate-600 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="mt-0.5">
                    {React.cloneElement(cat.icon as React.ReactElement, {
                      className: `w-4 h-4 ${isActive ? activeBrand.text : "text-slate-450 group-hover/catbtn:text-slate-650"}`
                    })}
                  </div>
                  <div className="text-[11px] leading-tight">
                    <div>{cat.label} ({count})</div>
                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">{cat.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* List items view */}
          {selectedCat === "market" ? (
            <div className="flex-1 p-4 bg-slate-50/30 overflow-y-auto">
              <StructuredMarketView />
            </div>
          ) : (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white/40">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1.5 border-b border-slate-200/80">
                <span className="font-semibold">检索出符合条件的依据条目共 {filteredItems.length} 条</span>
                <button
                  onClick={handleOpenAddForm}
                  className={`text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center gap-1 cursor-pointer select-none ${activeBrand.bgHover}`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  新增
                </button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-xs italic font-semibold">未发现匹配项，你可以录入新的依据条例充实该维度</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-5 border border-slate-200 rounded-2xl bg-white/70 hover:bg-white shadow-2xs hover:shadow-xs transition-all space-y-3.5 text-left relative overflow-hidden group/card ${activeBrand.borderHover}`}
                    >
                      {/* Interactive slide-in accent line */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/card:opacity-100 transition-opacity ${activeBrand.accentLine}`} />

                      <div className="flex items-start justify-between gap-6">
                        {/* Title - clickable to open drawer */}
                        <h4 
                          onClick={() => setSelectedDetailItem(item)}
                          className={`font-extrabold text-slate-900 cursor-pointer transition-colors text-sm leading-snug flex items-center gap-1.5 select-none hover:${activeBrand.text}`}
                        >
                          <FileText className={`w-4 h-4 flex-shrink-0 text-${brandKey}-500`} />
                          <span className={`hover:underline decoration-1 underline-offset-2 decoration-${brandKey}-400`}>{item.title}</span>
                        </h4>

                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex-shrink-0 ${activeBrand.badge}`}>
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>

                      {/* Meat & Veggie Meta Block: Issuing unit and Tags formatted beautifully */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-slate-100/40 p-2.5 rounded-lg border border-slate-200/30">
                        <div className="flex items-center gap-1 leading-none">
                          <span className="text-slate-400 font-bold">颁布单位/数据源:</span>
                          <span className="text-slate-700 font-extrabold font-mono truncate max-w-[180px]" title={item.source || "自主添加资料库"}>
                            {item.source || "自主添加资料库"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 leading-none md:justify-end">
                          <span className="text-slate-400 font-bold">特征标签:</span>
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tg, i) => (
                              <span key={i} className={`text-[9.5px] px-1.5 py-0.2 rounded font-black border ${activeBrand.pill}`}>
                                #{tg}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* File Abstract Information */}
                      <div className="space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-150/60">
                        <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center justify-between">
                          <span>依据文件摘要 (Document Abstract Summary)</span>
                          <span className="text-[9px] text-slate-350 font-normal">全文共及约 {item.content ? item.content.length : 0} 字</span>
                        </div>
                        <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                          {getExcerpt(item.content)}
                        </p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-150/50 text-[10.5px]">
                        <span className="text-slate-400 font-semibold">
                          标识编码: <code className="text-slate-600 font-mono font-bold">{item.id}</code>
                        </span>
                        
                        <button 
                          onClick={() => setSelectedDetailItem(item)}
                          className={`font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer ${activeBrand.link}`}
                        >
                          点击标题或此处查看完整公文抽屉 &raquo;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 侧边大抽屉 / Right-side slide-out document details drawer panel */}
      <AnimatePresence>
        {selectedDetailItem && (
          <>
            {/* Backdrop with fade-in */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDetailItem(null)}
              className="fixed inset-0 bg-slate-900 z-50 cursor-pointer pointer-events-auto"
            />

            {/* Slide-out Panel from right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-[580px] max-w-[95vw] bg-white border-l border-slate-200 shadow-2xl z-55 flex flex-col h-full text-left font-sans text-slate-800"
            >
              {/* Drawer Header top bar */}
              <div className={`p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-gradient-to-r from-${brandKey}-50/50 via-slate-50/30 to-white`}>
                <div className="space-y-1 pr-4">
                  <div className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest ${activeBrand.textDark}`}>
                    <span className={`p-1 rounded select-none bg-${brandKey}-105 bg-${brandKey}-100`}>
                      {React.cloneElement((categoriesMap.find(c => c.key === selectedDetailItem.category)?.icon || <Scale className="w-3.5 h-3.5" />) as React.ReactElement, {
                        className: `w-3.5 h-3.5 ${activeBrand.textDark}`
                      })}
                    </span>
                    <span>AMC风控法审依据库 &raquo; {getCategoryLabel(selectedDetailItem.category)}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-950 text-base leading-snug tracking-tight">
                    {selectedDetailItem.title}
                  </h3>
                </div>
                
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 cursor-pointer transition-all active:scale-95 flex-shrink-0"
                  title="关闭详情面板"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable details view content */}
              <div className="flex-grow overflow-y-auto p-6 space-y-5">
                {/* Meta block info */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    依据项目核心特征参数 (Core Document Schema)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-bold block">颁布单位/数据源：</span>
                      <span className="text-slate-900 font-extrabold font-mono">
                        {selectedDetailItem.source || "原国家资产管理政策指引"}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-bold block">依归特征标签：</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {selectedDetailItem.tags.map((tg, i) => (
                          <span key={i} className={`text-[9.5px] px-2 py-0.5 rounded font-black border ${activeBrand.pill}`}>
                            #{tg}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-bold block">系统特征编码 (Unique Key)：</span>
                      <span className="text-slate-600 font-mono font-bold text-[10.5px]">
                        {selectedDetailItem.id}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-bold block">所在数据库版块：</span>
                      <span className={`${activeBrand.text} font-extrabold`}>
                        {getCategoryLabel(selectedDetailItem.category)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main full expanded text details */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    依据原文及深度合规指引 (Original Document Body)
                  </span>
                  
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs leading-relaxed space-y-4">
                    {/* Visual paper-texture background and standard letter elements */}
                    <div className="text-slate-900 text-xs font-semibold leading-relaxed font-sans whitespace-pre-wrap">
                      {selectedDetailItem.content}
                    </div>

                    {/* Extraneous Trace details warning */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-amber-600/90 font-bold">
                      <span className="p-0.5 bg-amber-50 rounded">⚠️</span>
                      <span>合规提示：该公文仅供AMC内部资产定价、物权处置或司法追溯审核参考，不得泄密。</span>
                    </div>
                  </div>
                </div>

                {/* Structured audit attachments timeline lists */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    司法追溯与原始凭证底稿 (Attached Auditing Materials)
                  </span>

                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <div>
                          <p className="font-extrabold text-slate-800">
                            【原始PDF】{selectedDetailItem.title}_原文章程底签件.pdf
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">2.4 MB · 司法凭证效力 · PDF加密签署</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer select-none flex-shrink-0 ${activeBrand.text} bg-${brandKey}-50 hover:bg-${brandKey}-100`}>
                        查验凭证
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 flex-shrink-0 text-${brandKey}-500`} />
                        <div>
                          <p className="font-extrabold text-slate-800">
                            【法律效力指引】{getCategoryLabel(selectedDetailItem.category)}_AMC准入及折扣率底稿.docx
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">812 KB · RAG智能归档 · Word修订版</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer select-none flex-shrink-0 ${activeBrand.text} bg-${brandKey}-50 hover:bg-${brandKey}-100`}>
                        查验凭证
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer bottom buttons */}
              <div className="p-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between gap-2.5">
                <span className="text-[10.5px] font-bold text-slate-400 font-mono">
                  数据最后同步于: 2026年05月29日
                </span>
                
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className={`px-4 py-2 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 ${activeBrand.bgHover}`}
                >
                  关闭面板
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
