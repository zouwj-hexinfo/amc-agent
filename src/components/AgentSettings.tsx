import React from "react";
import { AgentConfig, AgentType } from "../types";
import { ShieldCheck, Scale, BarChart3, TrendingUp, Settings2 } from "lucide-react";

interface AgentSettingsProps {
  configs: AgentConfig[];
  onUpdateConfig: (updatedConfigs: AgentConfig[]) => void;
  currentTheme?: any;
  activeColorBrand?: string;
}

const themeBrandConfigs: Record<string, {
  text: string;
  bg: string;
  borderClass: string;
  pill: string;
  accent: string;
  ring: string;
  iconBgActive: string;
}> = {
  indigo: {
    text: "text-indigo-600",
    bg: "bg-indigo-600",
    borderClass: "border-indigo-500",
    pill: "bg-indigo-50/80 border-indigo-200/60 text-indigo-700",
    accent: "accent-indigo-600",
    ring: "focus:ring-indigo-500",
    iconBgActive: "bg-indigo-50/80"
  },
  purple: {
    text: "text-purple-600",
    bg: "bg-purple-600",
    borderClass: "border-purple-500",
    pill: "bg-purple-50/80 border-purple-200/60 text-purple-700",
    accent: "accent-purple-600",
    ring: "focus:ring-purple-500",
    iconBgActive: "bg-purple-50/80"
  },
  emerald: {
    text: "text-emerald-600",
    bg: "bg-emerald-600",
    borderClass: "border-emerald-500",
    pill: "bg-emerald-50/80 border-emerald-200/60 text-emerald-700",
    accent: "accent-emerald-600",
    ring: "focus:ring-emerald-500",
    iconBgActive: "bg-emerald-50/80"
  },
  amber: {
    text: "text-amber-600",
    bg: "bg-amber-600",
    borderClass: "border-amber-500",
    pill: "bg-amber-50/80 border-amber-200/60 text-amber-700",
    accent: "accent-amber-600",
    ring: "focus:ring-amber-500",
    iconBgActive: "bg-amber-50/80"
  },
  sky: {
    text: "text-sky-600",
    bg: "bg-sky-600",
    borderClass: "border-sky-500",
    pill: "bg-sky-50/80 border-sky-200/60 text-sky-700",
    accent: "accent-sky-600",
    ring: "focus:ring-sky-500",
    iconBgActive: "bg-sky-50/80"
  },
  cyan: {
    text: "text-cyan-600",
    bg: "bg-cyan-600",
    borderClass: "border-cyan-500",
    pill: "bg-cyan-50/80 border-cyan-200/60 text-cyan-700",
    accent: "accent-cyan-600",
    ring: "focus:ring-cyan-500",
    iconBgActive: "bg-cyan-50/80"
  },
  rose: {
    text: "text-rose-600",
    bg: "bg-rose-600",
    borderClass: "border-rose-500",
    pill: "bg-rose-50/80 border-rose-200/60 text-rose-700",
    accent: "accent-rose-600",
    ring: "focus:ring-rose-500",
    iconBgActive: "bg-rose-50/80"
  }
};

export default function AgentSettings({ configs, onUpdateConfig, currentTheme, activeColorBrand }: AgentSettingsProps) {
  const [selectedAgent, setSelectedAgent] = React.useState<AgentType>("law_review");

  const currentAgent = configs.find(c => c.type === selectedAgent) || configs[0];
  const brandKey = activeColorBrand || "indigo";
  const brand = themeBrandConfigs[brandKey] || themeBrandConfigs.indigo;

  const handlePromptChange = (val: string) => {
    const updated = configs.map(c => {
      if (c.type === selectedAgent) {
        return { ...c, systemPrompt: val };
      }
      return c;
    });
    onUpdateConfig(updated);
  };

  const handleTempChange = (val: number) => {
    const updated = configs.map(c => {
      if (c.type === selectedAgent) {
        return { ...c, temperature: val };
      }
      return c;
    });
    onUpdateConfig(updated);
  };

  const handleToggleSkill = (skillId: string) => {
    const updated = configs.map(c => {
      if (c.type === selectedAgent) {
        const nextSkills = c.skills.map(s => {
          if (s.id === skillId) return { ...s, selected: !s.selected };
          return s;
        });
        return { ...c, skills: nextSkills };
      }
      return c;
    });
    onUpdateConfig(updated);
  };

  const getIcon = (type: AgentType, isActive: boolean) => {
    const colorClass = isActive ? brand.text : "text-slate-400";
    switch (type) {
      case "law_review": return <Scale className={`w-5 h-5 ${colorClass}`} />;
      case "evaluation": return <BarChart3 className={`w-5 h-5 ${colorClass}`} />;
      case "industry": return <TrendingUp className={`w-5 h-5 ${colorClass}`} />;
      case "risk_review": return <ShieldCheck className={`w-5 h-5 ${colorClass}`} />;
      default: return <Settings2 className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  return (
    <div className="bg-slate-50/75 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col relative">
      {/* Decorative gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r from-${brandKey}-50/30 via-slate-50/40 to-transparent pointer-events-none z-0`} />
      
      <div className={`relative z-10 p-5 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-${brandKey}-50/60 via-slate-50/80 to-transparent`}>
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Settings2 className={`w-4 h-4 ${brand.text}`} />
            AMC智能体工作坊 (Agent Workshop)
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">配置法律、风险、估价及行业四个核心Agent的微调系统提示词和专业审查技能</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200/80 overflow-hidden min-h-[450px]">
        {/* Agent Side Switcher */}
        <div className="w-full md:w-64 p-3 space-y-1.5 bg-slate-50/40 flex-shrink-0">
          <p className="text-[11px] font-bold text-slate-400 px-2.5 pb-2 uppercase tracking-wider">选择审查委员会常设智能体</p>
          {configs.filter(c => c.type !== 'orchestrator').map((cfg) => {
            const isActive = selectedAgent === cfg.type;
            const activeSkillsCount = cfg.skills.filter(s => s.selected).length;

            return (
              <button
                key={cfg.type}
                onClick={() => setSelectedAgent(cfg.type)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                  isActive
                    ? `bg-white border-slate-200 font-semibold text-slate-900 shadow-xs ring-1 ring-${brandKey}-500/5`
                    : "border-transparent text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? brand.iconBgActive : "bg-slate-100"}`}>
                  {getIcon(cfg.type, isActive)}
                </div>
                <div className="text-xs leading-none">
                  <div className="font-bold text-slate-800">{cfg.name}</div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-1">{cfg.role}</div>
                  <div className="mt-1.5 flex items-center">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 animate-pulse ${brand.bg}`} />
                    <span className={`text-[9px] font-bold font-mono ${brand.text}`}>已启用 {activeSkillsCount} 项技能</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Configurations Body */}
        {currentAgent && (
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-white/40">
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${brand.pill}`}>{currentAgent.name} (配置档)</span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 font-semibold font-mono">情绪幻觉系数 (Temp): {currentAgent.temperature}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentAgent.temperature}
                    onChange={(e) => handleTempChange(parseFloat(e.target.value))}
                    className={`w-24 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none ${brand.accent}`}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1.5">{currentAgent.role} — 负责对拟受让债权主体进行该领域的关键指标重塑与核查意见书起草。</p>
            </div>

            {/* System prompt view */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">专家系统提示词 (System Instruction)</label>
              <textarea
                value={currentAgent.systemPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                rows={5}
                className={`w-full text-xs font-mono p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:border-transparent leading-relaxed ${brand.ring}`}
              />
            </div>

            {/* Skills selection */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700">可组装专业技能 (Expert Skills)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentAgent.skills.map(sk => (
                  <div
                    key={sk.id}
                    onClick={() => handleToggleSkill(sk.id)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex items-start justify-between ${
                      sk.selected
                        ? `border-${brandKey}-300 bg-white shadow-3xs ring-1 ring-${brandKey}-500/10`
                        : "border-slate-200 bg-white/70 hover:bg-slate-50"
                    }`}
                  >
                    <div className="pr-3">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${sk.selected ? `${brand.bg} animate-pulse` : "bg-gray-300"}`} />
                        {sk.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-1 leading-snug">{sk.description}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={sk.selected}
                      readOnly
                      className={`rounded border-slate-300 w-3.5 h-3.5 cursor-pointer mt-0.5 ${brand.accent} ${brand.ring}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
