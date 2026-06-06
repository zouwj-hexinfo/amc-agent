import React from "react";
import { 
  Building2, PlusCircle, Scale, AlertTriangle, Layers, TrendingUp, User, 
  LayoutGrid, List, Search, ArrowRight, FolderPlus, FileText, ChevronRight, CheckCircle2, Clock, RefreshCw, X, HelpCircle
} from "lucide-react";
import { AMCProject, ProjectType } from "../types";
import { motion } from "motion/react";
import { formatBeijingDate } from "../lib/time";

interface SystemHomePageProps {
  projects: AMCProject[];
  homeTypeFilter: string | null;
  setHomeTypeFilter: (filter: string | null) => void;
  homeViewMode: 'card' | 'list';
  setHomeViewMode: (mode: 'card' | 'list') => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  setCurrentMode: (mode: 'home' | 'work' | 'config') => void;
  currentTheme: any;
  activeColorBrand: string;
  setIsProjectDrawerOpen: (open: boolean) => void;
  setIsCreatingProject: (open: boolean) => void;
  projectTypesConfig: any;
}

export default function SystemHomePage({
  projects,
  homeTypeFilter,
  setHomeTypeFilter,
  homeViewMode,
  setHomeViewMode,
  selectedProjectId,
  setSelectedProjectId,
  setCurrentMode,
  currentTheme,
  activeColorBrand,
  setIsProjectDrawerOpen,
  setIsCreatingProject,
  projectTypesConfig
}: SystemHomePageProps) {
  const [searchText, setSearchText] = React.useState("");

  const brand = React.useMemo(() => {
    const key = activeColorBrand || "indigo";
    const config: Record<string, {
      text: string;
      textHover: string;
      bg: string;
      bgHover: string;
      bgActive: string;
      badge: string;
      badgeBorder: string;
      badgeText: string;
      badgeBg: string;
      borderActive: string;
      ring: string;
      iconBgSelected: string;
      iconBgNormal: string;
      link: string;
      pulseDot: string;
      borderCol: string;
    }> = {
      indigo: {
        text: "text-indigo-600",
        textHover: "group-hover:text-indigo-600",
        bg: "bg-indigo-600",
        bgHover: "hover:bg-indigo-500 active:bg-indigo-750",
        bgActive: "bg-indigo-700",
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
        badgeBorder: "border-indigo-100",
        badgeText: "text-indigo-700",
        badgeBg: "bg-indigo-50",
        borderActive: "border-indigo-500 ring-1 ring-indigo-500/10",
        ring: "focus:ring-indigo-500/20",
        iconBgSelected: "bg-indigo-100 text-indigo-700",
        iconBgNormal: "bg-indigo-50 text-indigo-600",
        link: "text-indigo-600",
        pulseDot: "bg-indigo-500",
        borderCol: "hover:border-indigo-500"
      },
      purple: {
        text: "text-purple-600",
        textHover: "group-hover:text-purple-600",
        bg: "bg-purple-600",
        bgHover: "hover:bg-purple-500 active:bg-purple-700",
        bgActive: "bg-purple-700",
        badge: "bg-purple-50 text-purple-700 border-purple-200/60",
        badgeBorder: "border-purple-100",
        badgeText: "text-purple-700",
        badgeBg: "bg-purple-50",
        borderActive: "border-purple-500 ring-1 ring-purple-500/10",
        ring: "focus:ring-purple-500/20",
        iconBgSelected: "bg-purple-100 text-purple-700",
        iconBgNormal: "bg-purple-50 text-purple-600",
        link: "text-purple-600",
        pulseDot: "bg-purple-500",
        borderCol: "hover:border-purple-500"
      },
      emerald: {
        text: "text-emerald-600",
        textHover: "group-hover:text-emerald-600",
        bg: "bg-emerald-600",
        bgHover: "hover:bg-emerald-500 active:bg-emerald-700",
        bgActive: "bg-emerald-700",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
        badgeBorder: "border-emerald-100",
        badgeText: "text-emerald-700",
        badgeBg: "bg-emerald-50",
        borderActive: "border-emerald-500 ring-1 ring-emerald-500/10",
        ring: "focus:ring-emerald-500/20",
        iconBgSelected: "bg-emerald-100 text-emerald-700",
        iconBgNormal: "bg-emerald-50 text-emerald-600",
        link: "text-emerald-600",
        pulseDot: "bg-emerald-500",
        borderCol: "hover:border-emerald-500"
      },
      amber: {
        text: "text-amber-600",
        textHover: "group-hover:text-amber-600",
        bg: "bg-amber-600",
        bgHover: "hover:bg-amber-500 active:bg-amber-700",
        bgActive: "bg-amber-700",
        badge: "bg-amber-50 text-amber-700 border-amber-200/60",
        badgeBorder: "border-amber-100",
        badgeText: "text-amber-700",
        badgeBg: "bg-amber-50",
        borderActive: "border-amber-500 ring-1 ring-amber-500/10",
        ring: "focus:ring-amber-500/20",
        iconBgSelected: "bg-amber-100 text-amber-700",
        iconBgNormal: "bg-amber-50 text-amber-600",
        link: "text-amber-600",
        pulseDot: "bg-amber-500",
        borderCol: "hover:border-amber-500"
      },
      sky: {
        text: "text-sky-600",
        textHover: "group-hover:text-sky-600",
        bg: "bg-sky-600",
        bgHover: "hover:bg-sky-500 active:bg-sky-700",
        bgActive: "bg-sky-700",
        badge: "bg-sky-50 text-sky-700 border-sky-200/60",
        badgeBorder: "border-sky-100",
        badgeText: "text-sky-700",
        badgeBg: "bg-sky-50",
        borderActive: "border-sky-500 ring-1 ring-sky-500/10",
        ring: "focus:ring-sky-500/20",
        iconBgSelected: "bg-sky-100 text-sky-700",
        iconBgNormal: "bg-sky-50 text-sky-600",
        link: "text-sky-600",
        pulseDot: "bg-sky-500",
        borderCol: "hover:border-sky-500"
      },
      cyan: {
        text: "text-cyan-600",
        textHover: "group-hover:text-cyan-600",
        bg: "bg-cyan-600",
        bgHover: "hover:bg-cyan-500 active:bg-cyan-700",
        bgActive: "bg-cyan-700",
        badge: "bg-cyan-50 text-cyan-700 border-cyan-200/60",
        badgeBorder: "border-cyan-100",
        badgeText: "text-cyan-700",
        badgeBg: "bg-cyan-50",
        borderActive: "border-cyan-500 ring-1 ring-cyan-500/10",
        ring: "focus:ring-cyan-500/20",
        iconBgSelected: "bg-cyan-100 text-cyan-700",
        iconBgNormal: "bg-cyan-50 text-cyan-600",
        link: "text-cyan-600",
        pulseDot: "bg-cyan-500",
        borderCol: "hover:border-cyan-500"
      },
      rose: {
        text: "text-rose-600",
        textHover: "group-hover:text-rose-600",
        bg: "bg-rose-600",
        bgHover: "hover:bg-rose-500 active:bg-rose-700",
        bgActive: "bg-rose-700",
        badge: "bg-rose-50 text-rose-700 border-rose-200/60",
        badgeBorder: "border-rose-100",
        badgeText: "text-rose-700",
        badgeBg: "bg-rose-50",
        borderActive: "border-rose-500 ring-1 ring-rose-500/10",
        ring: "focus:ring-rose-500/20",
        iconBgSelected: "bg-rose-100 text-rose-700",
        iconBgNormal: "bg-rose-50 text-rose-600",
        link: "text-rose-600",
        pulseDot: "bg-rose-500",
        borderCol: "hover:border-rose-500"
      }
    };
    return config[key] || config.indigo;
  }, [activeColorBrand]);

  // Helper to count projects of a certain type
  const getTypeCount = (type: string) => {
    return projects.filter(p => p.projectType === type).length;
  };

  // Filter projects by type & search text
  const filteredProjects = projects.filter(proj => {
    const matchesType = !homeTypeFilter || proj.projectType === homeTypeFilter;
    const matchesSearch = !searchText || 
      proj.name.toLowerCase().includes(searchText.toLowerCase()) ||
      proj.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      (proj.debtorName && proj.debtorName.toLowerCase().includes(searchText.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Calculate status summaries
  const activeCount = projects.filter(p => p.status === 'Active' || p.status === 'Reviewing').length;
  const draftCount = projects.filter(p => p.status === 'Draft' || p.status === 'DataCollected').length;

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* 1. Welcoming Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className={`absolute inset-0 bg-gradient-to-r from-${activeColorBrand}-50/65 via-slate-50/80 to-transparent z-0`} />
        
        {/* Subtle decorative grid/lights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className={`absolute bottom-0 right-1/4 w-60 h-60 bg-${activeColorBrand}-500/5 rounded-full blur-3xl pointer-events-none`} />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${brand.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${brand.pulseDot}`} />
              AMC项目审查智能体系统
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight font-sans">
              让AMC项目审查从‘经验驱动’进化为‘智能决策’
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed font-semibold">
              基于大模型及多智能体协同机制（法务合规、项目评估、风控审查），支持多种类型的AMC项目资料的快速智能化审查辅助，智能读取项目资料与政策知识库，快速产出项目审查报告。
            </p>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              id="cta-create-project-home"
              onClick={() => {
                setIsCreatingProject(true);
                setIsProjectDrawerOpen(true);
              }}
              className={`px-4 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer border border-white/10 ${brand.bg} ${brand.bgHover}`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>快速创建新项目</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Statistics Cards (Clickable filtering) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            ① 业务模块状态概览（点击快速筛选项目）
          </h3>
          {homeTypeFilter && (
            <button 
              onClick={() => setHomeTypeFilter(null)}
              className={`text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${brand.text} hover:opacity-80`}
            >
              <span>清除过滤器</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Universal "Show All" Card */}
          <div
            onClick={() => setHomeTypeFilter(null)}
            className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col justify-between min-h-[92px] ${
              homeTypeFilter === null
                ? `bg-${activeColorBrand}-50/40 border-${activeColorBrand}-500 text-${activeColorBrand}-900 shadow-3xs ring-1 ring-${activeColorBrand}-500/10`
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`p-1.5 rounded-lg ${homeTypeFilter === null ? `bg-${activeColorBrand}-100 ${brand.text}` : 'bg-slate-100 text-slate-500'}`}>
                <Layers className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-black">{projects.length}</span>
            </div>
            <div className="mt-2">
              <div className="text-[11px] font-bold truncate">全部项目包</div>
              <p className="text-[9px] text-slate-400 font-semibold">集成完整档案</p>
            </div>
          </div>

          {/* Dynamic Category Cards */}
          {Object.entries(projectTypesConfig).map(([typeKey, cfg]: [string, any]) => {
            const isSelected = homeTypeFilter === typeKey;
            const count = getTypeCount(typeKey);
            const IconComponent = cfg.icon || Building2;
            const themeColor = activeColorBrand;

            return (
              <div
                key={typeKey}
                onClick={() => setHomeTypeFilter(typeKey)}
                className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col justify-between min-h-[92px] ${
                  isSelected
                    ? `bg-${themeColor}-50/40 border-${themeColor}-500 text-${themeColor}-900 shadow-3xs ring-1 ring-${themeColor}-500/10`
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`p-1.5 rounded-lg ${
                    isSelected 
                      ? `bg-${themeColor}-100 text-${themeColor}-700` 
                      : `bg-${themeColor}-50 text-${themeColor}-650`
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-black">{count}</span>
                </div>
                <div className="mt-2">
                  <div className="text-[11px] font-bold truncate" title={cfg.label}>{cfg.label}</div>
                  <p className="text-[9px] text-slate-400 font-semibold">{count > 0 ? "已有评估案" : "暂无立项"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Search and Layout Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-col md:flex-row items-center justify-between gap-4 text-left">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="输入项目名、提请客户或主债务主体..."
            className={`w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-${activeColorBrand}-500/20 focus:border-${activeColorBrand}-500 font-semibold text-slate-700`}
          />
          {searchText && (
            <button 
              onClick={() => setSearchText("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Layout Switcher & Fast Description */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
          <span className="text-[11px] text-slate-400 font-semibold">
            筛选结果: 共找到 <strong className="text-slate-700">{filteredProjects.length}</strong> 个项目档案
          </span>
          
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setHomeViewMode('card')}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer text-xs ${
                homeViewMode === 'card'
                  ? 'bg-white shadow-2xs font-extrabold text-slate-800'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="网格卡片分布"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">卡片模式</span>
            </button>
            <button
              onClick={() => setHomeViewMode('list')}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer text-xs ${
                homeViewMode === 'list'
                  ? 'bg-white shadow-2xs font-extrabold text-slate-800'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="行目明细表"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">列表模式</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Filtered Project Results Area */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-2xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-sm font-bold text-slate-700">未检索到匹配的评估项目</h4>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            没有符合当前分类过滤条件或搜索关键词的项目大底本，请清除筛选条件、更新搜索或通过右侧“快速立项新档案”开辟新工作区。
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => {
                setHomeTypeFilter(null);
                setSearchText("");
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              重置筛选
            </button>
            <button
              onClick={() => {
                setIsCreatingProject(true);
                setIsProjectDrawerOpen(true);
              }}
              className={`px-4 py-2 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer ${brand.bg} ${brand.bgHover}`}
            >
              立即新建项目
            </button>
          </div>
        </div>
      ) : homeViewMode === 'card' ? (
        /* CARD MODE GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
            const cfg = projectTypesConfig[proj.projectType] || projectTypesConfig.NPA_ACQUISITION;
            const Icon = cfg.icon || Building2;
            const theme = activeColorBrand;
            const reportsCount = Object.values(proj.evaluations).reduce((acc: number, curr: any) => acc + curr.length, 0);

            return (
              <div
                key={proj.id}
                onClick={() => {
                  setSelectedProjectId(proj.id);
                  setCurrentMode('work');
                }}
                className={`group bg-white border border-slate-200 hover:border-${activeColorBrand}-500 rounded-2xl shadow-2xs hover:shadow-xs p-5 transition-all text-left flex flex-col justify-between cursor-pointer relative`}
              >
                <div>
                  {/* Card Header Type Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-${theme}-50 border border-${theme}-100 text-${theme}-700`}>
                      <Icon className={`w-3 h-3 text-${theme}-600`} />
                      {cfg.label}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      proj.status === 'Draft' ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                      proj.status === 'DataCollected' ? "bg-cyan-50 text-cyan-700 border border-cyan-200/50" :
                      proj.status === 'Active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-purple-50 text-purple-700 border border-purple-200/50"
                    }`}>
                      {proj.status === 'Draft' ? '待收集' :
                       proj.status === 'DataCollected' ? '自检齐备' :
                       proj.status === 'Active' ? '评估活跃' : '合规审核中'}
                    </span>
                  </div>

                  {/* Project Title */}
                  <h4 className={`font-extrabold text-sm text-slate-800 group-hover:text-${activeColorBrand}-600 transition-colors line-clamp-1 mb-1.5`}>
                    {proj.name}
                  </h4>

                  {/* Description */}
                  <p className="text-[11px] text-slate-450 leading-relaxed font-medium line-clamp-2 mb-4">
                    {proj.description || "暂无项目描述介绍，进入工作面板可补充完好项目说明。"}
                  </p>

                  {/* Key Financial Attributes Box */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="space-y-0.5 text-left">
                      <span className="block text-[9px] font-bold text-slate-400">主要债务/相关方</span>
                      <span className="font-bold text-slate-700 block truncate" title={proj.debtorName || proj.customerName}>
                        {proj.debtorName || proj.customerName || "未知相关方"}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-left border-l border-slate-200/80 pl-3">
                      <span className="block text-[9px] font-bold text-slate-400">账面债权本息金额</span>
                      <span className="font-mono font-extrabold text-slate-800 block truncate text-slate-900">
                        {proj.totalDebt ? `${proj.totalDebt} 万元` : "暂未披露"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Detail bar */}
                <div className="flex items-center justify-between border-t border-slate-100/90 pt-3 mt-1.5 text-[10px] text-slate-400 font-semibold bg-white">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>更新：{formatBeijingDate(proj.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-500 font-bold">
                    <span>📄 成果库版本:</span>
                    <strong className="text-slate-800 font-extrabold font-mono">{reportsCount}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST MODE TABLE/LIST */
        <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-3xs text-left">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">项目档案名称 & 类型</th>
                  <th className="py-3.5 px-4">提请委托方</th>
                  <th className="py-3.5 px-4">主要债务主体</th>
                  <th className="py-3.5 px-4 text-right">账面总额</th>
                  <th className="py-3.5 px-4">更新时间</th>
                  <th className="py-3.5 px-4 text-center">当前状态</th>
                  <th className="py-3.5 px-4 text-center">成果版本</th>
                  <th className="py-3.5 px-5 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                {filteredProjects.map((proj) => {
                  const cfg = projectTypesConfig[proj.projectType] || projectTypesConfig.NPA_ACQUISITION;
                  const Icon = cfg.icon || Building2;
                  const theme = activeColorBrand;
                  const reportsCount = Object.values(proj.evaluations).reduce((acc: number, curr: any) => acc + curr.length, 0);

                  return (
                    <tr
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setCurrentMode('work');
                      }}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-2.5">
                          <span className={`p-1.5 rounded-lg bg-${theme}-50 text-${theme}-600 mt-0.5 flex-shrink-0 border border-${theme}-100`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <div className="space-y-0.5 max-w-[280px]">
                            <div className={`font-extrabold text-slate-800 group-hover:text-${activeColorBrand}-600 transition-colors truncate`} title={proj.name}>
                              {proj.name}
                            </div>
                            <span className="inline-block text-[9px] font-bold text-slate-400">
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-600 truncate max-w-[150px]" title={proj.customerName}>
                        {proj.customerName}
                      </td>
                      <td className="py-4 px-4 truncate max-w-[150px]" title={proj.debtorName || "未披露"}>
                        {proj.debtorName || "未披露"}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-slate-805 text-slate-800">
                        {proj.totalDebt ? `${proj.totalDebt.toLocaleString()} 万元` : "暂未披露"}
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-bold">
                        {formatBeijingDate(proj.updatedAt, "未知")}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block text-[9.5px] font-extrabold px-2 py-0.5 rounded-full ${
                          proj.status === 'Draft' ? "bg-amber-50 text-amber-700" :
                          proj.status === 'DataCollected' ? "bg-cyan-50 text-cyan-700" :
                          proj.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-purple-50 text-purple-700"
                        }`}>
                          {proj.status === 'Draft' ? '待收集' :
                           proj.status === 'DataCollected' ? '自检齐备' :
                           proj.status === 'Active' ? '评估活跃' : '审核中'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-black text-slate-800 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          {reportsCount}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${brand.text} group-hover:translate-x-0.5 transition-transform`}>
                          <span>进入</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
