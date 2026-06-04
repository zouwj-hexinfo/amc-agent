import React from "react";
import {
  AgentConfigBundle,
  AgentDomain,
  AgentRole,
  AgentType,
  AgentWorkGroup,
  AgentWorkItem,
  AgentWorkItemDefinition,
  KnowledgeItem,
} from "../types";
import { BarChart3, BookOpen, Bot, ChevronRight, Edit3, FileText, GripVertical, Plus, PlusCircle, RefreshCw, Scale, ShieldCheck, Sparkles, TrendingUp, Wand2 } from "lucide-react";

interface AgentSettingsProps {
  bundle: AgentConfigBundle;
  knowledgeItems: KnowledgeItem[];
  onRefresh: () => Promise<void>;
  currentTheme?: any;
  activeColorBrand?: string;
}

type ConfigDrawerMode = "group-create" | "group-edit" | "work-item-create" | "work-item-edit" | "agent-definition";

export default function AgentSettings({ bundle, knowledgeItems, onRefresh, currentTheme, activeColorBrand }: AgentSettingsProps) {
  const [selectedDomainId, setSelectedDomainId] = React.useState("");
  const [selectedRoleId, setSelectedRoleId] = React.useState("");
  const [selectedGroupId, setSelectedGroupId] = React.useState("");
  const [selectedWorkItemId, setSelectedWorkItemId] = React.useState("");
  const [groupDraft, setGroupDraft] = React.useState<AgentWorkGroup | null>(null);
  const [workItemDraft, setWorkItemDraft] = React.useState<AgentWorkItem | null>(null);
  const [knowledgeQuery, setKnowledgeQuery] = React.useState("");
  const [knowledgeCategory, setKnowledgeCategory] = React.useState("all");
  const [generationPreview, setGenerationPreview] = React.useState<AgentWorkItemDefinition | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [expandedDomainIds, setExpandedDomainIds] = React.useState<Set<string>>(() => new Set());
  const [drawerMode, setDrawerMode] = React.useState<ConfigDrawerMode | null>(null);
  const [leftPaneWidth, setLeftPaneWidth] = React.useState<number>(() => {
    if (typeof window === "undefined") return 330;
    const stored = window.localStorage.getItem("amc.agentConfig.leftPaneWidth");
    const parsed = stored ? Number(stored) : NaN;
    return Number.isFinite(parsed) && parsed >= 220 && parsed <= 640 ? parsed : 330;
  });
  const dragStateRef = React.useRef<{ startX: number; startWidth: number } | null>(null);

  const onDragHandleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragStateRef.current = { startX: event.clientX, startWidth: leftPaneWidth };
    const handleMove = (moveEvent: MouseEvent) => {
      if (!dragStateRef.current) return;
      const delta = moveEvent.clientX - dragStateRef.current.startX;
      const next = Math.max(220, Math.min(640, dragStateRef.current.startWidth + delta));
      setLeftPaneWidth(next);
    };
    const handleUp = () => {
      dragStateRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("amc.agentConfig.leftPaneWidth", String(leftPaneWidth));
  }, [leftPaneWidth]);

  const brand = activeColorBrand || "indigo";
  const primaryBtn = currentTheme?.primaryBtn || "bg-indigo-600 hover:bg-indigo-700 text-white";
  const selectedDomain = bundle.domains.find(domain => domain.id === selectedDomainId) || bundle.domains[0];
  const roles = bundle.roles.filter(role => role.domainId === selectedDomain?.id);
  const selectedRole = roles.find(role => role.id === selectedRoleId) || roles[0];
  const groups = bundle.workGroups.filter(group => group.roleId === selectedRole?.id);
  const selectedGroup = groups.find(group => group.id === selectedGroupId) || groups[0];
  const workItems = bundle.workItems.filter(item => item.roleId === selectedRole?.id);
  const selectedWorkItem = workItems.find(item => item.id === selectedWorkItemId) || workItems.find(item => item.groupId === selectedGroup?.id) || workItems[0];

  React.useEffect(() => {
    if (selectedDomain && selectedDomain.id !== selectedDomainId) setSelectedDomainId(selectedDomain.id);
  }, [selectedDomain?.id, selectedDomainId]);

  React.useEffect(() => {
    if (!selectedDomain?.id) return;
    setExpandedDomainIds(previous => {
      if (previous.has(selectedDomain.id)) return previous;
      const next = new Set(previous);
      next.add(selectedDomain.id);
      return next;
    });
  }, [selectedDomain?.id]);

  React.useEffect(() => {
    if (selectedRole && selectedRole.id !== selectedRoleId) setSelectedRoleId(selectedRole.id);
  }, [selectedRole?.id, selectedRoleId]);

  React.useEffect(() => {
    if (selectedGroup && selectedGroup.id !== selectedGroupId) setSelectedGroupId(selectedGroup.id);
    setGroupDraft(selectedGroup || null);
  }, [selectedGroup?.id, selectedGroupId]);

  React.useEffect(() => {
    if (selectedWorkItem && selectedWorkItem.id !== selectedWorkItemId) setSelectedWorkItemId(selectedWorkItem.id);
    setWorkItemDraft(selectedWorkItem || null);
    setGenerationPreview(null);
  }, [selectedWorkItem?.id, selectedWorkItemId]);

  const apiSave = async (path: string, method: "POST" | "PUT" | "DELETE", body?: unknown) => {
    const response = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || "配置保存失败");
    await onRefresh();
    setMessage("配置已更新");
    window.setTimeout(() => setMessage(null), 1800);
    return data;
  };

  const addDomain = async () => {
    const label = window.prompt("请输入产品领域名称", "对公不良资产收购");
    if (!label?.trim()) return;
    const code = window.prompt("请输入领域编码", label.trim().toUpperCase().replace(/\s+/g, "_"));
    if (!code?.trim()) return;
    await apiSave("/api/agent-config/domains", "POST", {
      label: label.trim(),
      code: code.trim(),
      themeColor: brand,
      fields: [],
      status: "active",
    });
  };

  const addRole = async (domainId = selectedDomain?.id) => {
    if (!domainId) return;
    const name = window.prompt("请输入岗位专家名称", "法务合规专家");
    if (!name?.trim()) return;
    await apiSave("/api/agent-config/roles", "POST", {
      domainId,
      agentType: "law_review",
      name: name.trim(),
      role: "请维护该岗位专家的职责描述",
      defaultTemperature: 0.15,
      status: "active",
    });
  };

  const openGroupCreate = () => {
    if (!selectedRole) return;
    setGroupDraft({
      id: "",
      domainId: selectedRole.domainId,
      roleId: selectedRole.id,
      name: "新工作组",
      description: "",
      status: "active",
      createdAt: "",
      updatedAt: "",
    });
    setDrawerMode("group-create");
  };

  const openGroupEdit = () => {
    if (!selectedGroup) return;
    setGroupDraft(selectedGroup);
    setDrawerMode("group-edit");
  };

  const openWorkItemCreate = () => {
    if (!selectedRole || !selectedGroup) return;
    const name = "新工作项";
    setWorkItemDraft({
      id: "",
      domainId: selectedRole.domainId,
      roleId: selectedRole.id,
      groupId: selectedGroup.id,
      name,
      description: "",
      status: "active",
      createdAt: "",
      updatedAt: "",
      definition: {
        workSteps: ["检查资料完整性", "阅读资料", "运用专业知识识别合规性", "按公司格式形成合规报告"],
        knowledgeItemIds: [],
        outputTemplate: `# ${name}报告\n\n## 一、审查对象\n\n## 二、审查发现\n\n## 三、结论与建议\n`,
        systemPrompt: `你是 AMC ${name}智能体。`,
        userPrompt: `请执行${name}并输出结构化报告。`,
        tools: ["knowledge_search"],
        skills: [name],
      },
    });
    setDrawerMode("work-item-create");
  };

  const openWorkItemEdit = () => {
    if (!selectedWorkItem) return;
    setWorkItemDraft(selectedWorkItem);
    setDrawerMode("work-item-edit");
  };

  const openAgentDefinition = () => {
    if (!selectedWorkItem) return;
    setWorkItemDraft(selectedWorkItem);
    setGenerationPreview(null);
    setDrawerMode("agent-definition");
  };

  const closeDrawer = (next?: { group?: AgentWorkGroup | null; workItem?: AgentWorkItem | null }) => {
    setDrawerMode(null);
    setGenerationPreview(null);
    setGroupDraft(next?.group ?? selectedGroup ?? null);
    setWorkItemDraft(next?.workItem ?? selectedWorkItem ?? null);
  };

  const saveGroupDraft = async () => {
    if (!groupDraft) return;
    const saved = drawerMode === "group-create"
      ? await apiSave("/api/agent-config/work-groups", "POST", groupDraft)
      : await apiSave(`/api/agent-config/work-groups/${encodeURIComponent(groupDraft.id)}`, "PUT", groupDraft);
    if (saved?.id) setSelectedGroupId(saved.id);
    closeDrawer({ group: saved || groupDraft });
  };

  const saveWorkItemDraft = async (override?: AgentWorkItem) => {
    const item = override && "definition" in override ? override : workItemDraft;
    if (!item) return;
    const saved = drawerMode === "work-item-create"
      ? await apiSave("/api/agent-config/work-items", "POST", item)
      : await apiSave(`/api/agent-config/work-items/${encodeURIComponent(item.id)}`, "PUT", item);
    if (saved?.id) {
      setSelectedGroupId(saved.groupId || item.groupId);
      setSelectedWorkItemId(saved.id);
    }
    closeDrawer({ workItem: saved || item });
  };

  const deleteWorkItemDraft = async () => {
    if (!workItemDraft?.id || drawerMode !== "work-item-edit") return;
    const confirmed = window.confirm(`确定删除工作项“${workItemDraft.name}”吗？历史配置会以停用方式保留。`);
    if (!confirmed) return;
    await apiSave(`/api/agent-config/work-items/${encodeURIComponent(workItemDraft.id)}`, "DELETE");
    const nextItem = workItems.find(item => item.groupId === workItemDraft.groupId && item.id !== workItemDraft.id) || workItems.find(item => item.id !== workItemDraft.id) || null;
    if (nextItem) {
      setSelectedGroupId(nextItem.groupId);
      setSelectedWorkItemId(nextItem.id);
    } else {
      setSelectedWorkItemId("");
    }
    closeDrawer({ workItem: nextItem });
  };

  const generateDefinition = async () => {
    if (!workItemDraft) return;
    setIsGenerating(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/agent-config/work-items/${encodeURIComponent(workItemDraft.id)}/generate-definition`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "生成失败");
      setGenerationPreview(data.definition);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyPreview = async () => {
    if (!workItemDraft || !generationPreview) return;
    const next = { ...workItemDraft, definition: generationPreview };
    setWorkItemDraft(next);
    await saveWorkItemDraft(next);
    setGenerationPreview(null);
  };

  const toggleKnowledge = (id: string) => {
    if (!workItemDraft) return;
    const set = new Set(workItemDraft.definition.knowledgeItemIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setWorkItemDraft({
      ...workItemDraft,
      definition: {
        ...workItemDraft.definition,
        knowledgeItemIds: [...set],
      },
    });
  };

  const toggleDomainExpansion = (domainId: string) => {
    setExpandedDomainIds(previous => {
      const next = new Set(previous);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  };

  const filteredKnowledgeItems = knowledgeItems.filter(item => {
    const query = knowledgeQuery.trim().toLowerCase();
    if (knowledgeCategory !== "all" && item.category !== knowledgeCategory) return false;
    if (!query) return true;
    return `${item.title} ${item.tags.join(" ")} ${item.source || ""}`.toLowerCase().includes(query);
  });
  const selectedKnowledgeItems = workItemDraft
    ? knowledgeItems.filter(item => workItemDraft.definition.knowledgeItemIds.includes(item.id))
    : [];

  return (
    <div className="bg-slate-50/75 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-slate-200 bg-white/75 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Bot className={`w-4 h-4 text-${brand}-600`} />
            AMC智能体配置主数据
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">产品领域 / 岗位专家 → 工作项 → 智能体定义</p>
        </div>
        {message && <span className="text-[11px] font-bold text-slate-500">{message}</span>}
      </div>

      <div className="flex flex-1 min-h-[640px] divide-y xl:divide-y-0 divide-slate-200 overflow-hidden">
        <div className="shrink-0 overflow-hidden" style={{ width: leftPaneWidth }}>
          <Panel title="产品领域 / 岗位专家" action={addDomain} actionTitle="新增产品领域">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-3xs">
            {bundle.domains.map((domain, index) => {
              const domainRoles = bundle.roles.filter(role => role.domainId === domain.id);
              const isCurrentDomain = domain.id === selectedDomain?.id;
              const isExpanded = expandedDomainIds.has(domain.id);

              return (
                <div key={domain.id} className={`${index > 0 ? "border-t border-slate-100" : ""} ${domain.status === "inactive" ? "opacity-55" : ""}`}>
                  <div className={`group flex items-center gap-1.5 px-2 py-2.5 transition-colors ${isCurrentDomain ? `bg-${brand}-50/70` : "hover:bg-slate-50"}`}>
                    <button
                      type="button"
                      onClick={() => toggleDomainExpansion(domain.id)}
                      className="shrink-0 rounded-md p-1 hover:bg-white/80"
                      title={isExpanded ? "收起领域" : "展开领域"}
                    >
                      <ChevronRight className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDomainId(domain.id);
                        setExpandedDomainIds(previous => new Set(previous).add(domain.id));
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`truncate text-xs font-extrabold ${isCurrentDomain ? `text-${brand}-900` : "text-slate-850"}`}>{domain.label}</span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${domain.status === "inactive" ? "bg-slate-100 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                          {domain.status === "inactive" ? "停用" : `${domainRoles.length} 岗`}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[10px] font-mono text-slate-400">{domain.code}</div>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedDomainId(domain.id);
                        setExpandedDomainIds(previous => new Set(previous).add(domain.id));
                        void addRole(domain.id);
                      }}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 opacity-70 hover:opacity-100 hover:bg-slate-50"
                      title="新增岗位专家"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/45 py-1 pl-8 pr-2">
                      {domainRoles.map(role => {
                        const isCurrentRole = role.id === selectedRole?.id;
                        return (
                          <button
                            key={role.id}
                            onClick={() => {
                              setSelectedDomainId(domain.id);
                              setSelectedRoleId(role.id);
                            }}
                            className={`w-full rounded-xl px-3 py-2 text-left transition-all ${isCurrentRole ? `bg-white text-${brand}-900 shadow-3xs ring-1 ring-${brand}-200` : "text-slate-600 hover:bg-white/80"} ${role.status === "inactive" ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">{roleIcon(role.agentType)}</span>
                              <span className="min-w-0">
                                <span className="block truncate text-[11px] font-extrabold">{role.name}</span>
                                <span className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{role.role}</span>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {domainRoles.length === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDomainId(domain.id);
                            void addRole(domain.id);
                          }}
                          className="w-full rounded-xl border border-dashed border-slate-250 px-3 py-2 text-left text-[11px] font-bold text-slate-400 hover:bg-white"
                        >
                          + 为该领域添加岗位专家
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="拖动以调整左右区域大小"
          onMouseDown={onDragHandleMouseDown}
          className="group relative hidden xl:flex shrink-0 w-1.5 cursor-col-resize items-center justify-center bg-slate-200/60 hover:bg-indigo-200/80 active:bg-indigo-300 transition-colors"
        >
          <GripVertical className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        <div className="overflow-y-auto px-5 py-2.5 space-y-2.5 bg-white/60 flex-1 min-w-0">
          <CurrentConfigNav domain={selectedDomain} role={selectedRole} brand={brand} />

          <WorkItemTabs
            groups={groups}
            workItems={workItems}
            selectedGroup={selectedGroup}
            selectedWorkItem={selectedWorkItem}
            brand={brand}
            primaryBtn={primaryBtn}
            onAddGroup={openGroupCreate}
            onEditGroup={openGroupEdit}
            onAddWorkItem={openWorkItemCreate}
            onSelectGroup={(group) => {
              setSelectedGroupId(group.id);
              const firstItem = workItems.find(item => item.groupId === group.id);
              if (firstItem) setSelectedWorkItemId(firstItem.id);
            }}
            onSelectWorkItem={(item) => {
              setSelectedGroupId(item.groupId);
              setSelectedWorkItemId(item.id);
            }}
          />

          <Section title="工作项定义" icon={<FileText className="w-4 h-4" />}>
            {workItemDraft && (
              <WorkItemReadonlyOverview
                item={workItemDraft}
                group={selectedGroup}
                knowledgeItems={selectedKnowledgeItems}
                brand={brand}
                primaryBtn={primaryBtn}
                onEdit={openWorkItemEdit}
                onOpenAgentDefinition={openAgentDefinition}
              />
            )}
          </Section>

          {drawerMode && (
            <ConfigDrawer
              mode={drawerMode}
              groupDraft={groupDraft}
              workItemDraft={workItemDraft}
              groups={groups}
              knowledgeItems={filteredKnowledgeItems}
              knowledgeQuery={knowledgeQuery}
              knowledgeCategory={knowledgeCategory}
              generationPreview={generationPreview}
              isGenerating={isGenerating}
              primaryBtn={primaryBtn}
              onClose={closeDrawer}
              onGroupChange={setGroupDraft}
              onWorkItemChange={setWorkItemDraft}
              onSaveGroup={() => void saveGroupDraft()}
              onSaveWorkItem={() => void saveWorkItemDraft()}
              onToggleKnowledge={toggleKnowledge}
              onKnowledgeQuery={setKnowledgeQuery}
              onKnowledgeCategory={setKnowledgeCategory}
              onGenerateDefinition={() => void generateDefinition()}
              onApplyPreview={() => void applyPreview()}
              onClearPreview={() => setGenerationPreview(null)}
              onToggleGroupStatus={() => groupDraft && setGroupDraft({ ...groupDraft, status: groupDraft.status === "inactive" ? "active" : "inactive" })}
              onToggleWorkItemStatus={() => workItemDraft && setWorkItemDraft({ ...workItemDraft, status: workItemDraft.status === "inactive" ? "active" : "inactive" })}
              onDeleteWorkItem={() => void deleteWorkItemDraft()}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, action, actionTitle, children }: { title: string; action: () => void; actionTitle?: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-2.5 overflow-y-auto bg-slate-50/60">
      <div className="flex h-5 items-center justify-between mb-2">
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{title}</span>
        <button onClick={action} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50" title={actionTitle || `新增${title}`}>
          <PlusCircle className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CurrentConfigNav(props: {
  domain?: AgentDomain;
  role?: AgentRole;
  brand: string;
}) {
  return (
    <div className="flex h-5 flex-wrap items-center gap-2 px-1 text-[11px] font-black">
      <span className="text-slate-400">当前配置</span>
      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
      <span className={`rounded-full bg-${props.brand}-50 px-2.5 py-1 text-${props.brand}-800`}>
        领域：{props.domain?.label || "未选择"}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
        岗位：{props.role?.name || "未选择"}
      </span>
    </div>
  );
}

function WorkItemTabs(props: {
  groups: AgentWorkGroup[];
  workItems: AgentWorkItem[];
  selectedGroup?: AgentWorkGroup;
  selectedWorkItem?: AgentWorkItem;
  brand: string;
  primaryBtn: string;
  onAddGroup: () => void;
  onEditGroup: () => void;
  onAddWorkItem: () => void;
  onSelectGroup: (group: AgentWorkGroup) => void;
  onSelectWorkItem: (item: AgentWorkItem) => void;
}) {
  const visibleItems = props.workItems.filter(item => item.groupId === props.selectedGroup?.id);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-3xs overflow-hidden">
      <div className="border-b border-slate-100 px-4 pt-3">
        <div className="flex items-end gap-2">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0">
            {props.groups.map(group => {
              const active = group.id === props.selectedGroup?.id;
              const count = props.workItems.filter(item => item.groupId === group.id).length;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => props.onSelectGroup(group)}
                  className={`shrink-0 rounded-t-xl border px-4 py-2 text-[11px] font-extrabold transition-all ${active ? `border-slate-200 border-b-white bg-white text-${props.brand}-800 shadow-3xs` : "border-transparent bg-slate-100/70 text-slate-500 hover:bg-slate-100"} ${group.status === "inactive" ? "opacity-50" : ""}`}
                >
                  <span>{group.name}</span>
                  <span className="ml-1.5 rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] text-slate-400">{count}</span>
                </button>
              );
            })}
            {props.groups.length === 0 && (
              <button type="button" onClick={props.onAddGroup} className="rounded-xl border border-dashed border-slate-250 px-4 py-2 text-[11px] font-bold text-slate-400 hover:bg-slate-50">
                先添加工作组
              </button>
            )}
          </div>
          <IconButton label="新增工作组" onClick={props.onAddGroup}>
            <Plus className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="flex min-h-[58px] items-center gap-2 bg-white px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {visibleItems.map(item => {
            const active = item.id === props.selectedWorkItem?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => props.onSelectWorkItem(item)}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] font-extrabold transition-all ${active ? `border-${props.brand}-200 bg-${props.brand}-50 text-${props.brand}-800` : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"} ${item.status === "inactive" ? "opacity-50" : ""}`}
              >
                {item.name}
              </button>
            );
          })}
          {props.selectedGroup && visibleItems.length === 0 && (
            <button type="button" onClick={props.onAddWorkItem} className="rounded-full border border-dashed border-slate-250 px-3.5 py-1.5 text-[11px] font-bold text-slate-400 hover:bg-slate-50">
              为“{props.selectedGroup.name}”添加工作项
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <IconButton label="编辑当前工作组" onClick={props.onEditGroup} disabled={!props.selectedGroup}>
            <Edit3 className="h-4 w-4" />
          </IconButton>
          <IconButton label="新增工作项" onClick={props.onAddWorkItem} variant="primary">
            <Plus className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function WorkItemReadonlyOverview(props: {
  item: AgentWorkItem;
  group?: AgentWorkGroup;
  knowledgeItems: KnowledgeItem[];
  brand: string;
  primaryBtn: string;
  onEdit: () => void;
  onOpenAgentDefinition: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-slate-50/70 p-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">当前工作项</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-slate-900">{props.item.name}</span>
            {props.group && <span className="rounded-full bg-white px-2 py-1 text-[10px] font-extrabold text-slate-500">工作组：{props.group.name}</span>}
            {props.item.status === "inactive" && <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-extrabold text-rose-600">已停用</span>}
          </div>
          {props.item.description && <p className="mt-1 text-xs font-semibold text-slate-500">{props.item.description}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <IconButton label="编辑工作项" onClick={props.onEdit}>
            <Edit3 className="h-4 w-4" />
          </IconButton>
          <IconButton label="智能体定义预览" onClick={props.onOpenAgentDefinition} variant="primary">
            <Wand2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <ReadOnlyBlock title="工作定义步骤">
        {props.item.definition.workSteps.length > 0 ? (
          <ol className="space-y-2">
            {props.item.definition.workSteps.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-2 text-xs font-semibold text-slate-700">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-${props.brand}-50 text-[10px] font-black text-${props.brand}-700`}>{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyText>暂无工作定义步骤</EmptyText>
        )}
      </ReadOnlyBlock>

      <ReadOnlyBlock title={`知识资产关联（${props.knowledgeItems.length}）`}>
        {props.knowledgeItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {props.knowledgeItems.map(item => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="truncate text-[11px] font-black text-slate-800">{item.title}</div>
                <div className="mt-1 truncate text-[10px] font-semibold text-slate-400">{item.category} · {item.tags.slice(0, 3).join(" / ")}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyText>暂无关联知识资产</EmptyText>
        )}
      </ReadOnlyBlock>

      <ReadOnlyBlock title="成果定义">
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-semibold leading-relaxed text-slate-700">{props.item.definition.outputTemplate || "暂无成果模板"}</pre>
      </ReadOnlyBlock>
    </div>
  );
}

function IconButton({ label, onClick, disabled, variant = "ghost", children }: { label: string; onClick: () => void; disabled?: boolean; variant?: "ghost" | "primary"; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-xs transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        variant === "primary"
          ? "border-indigo-600 bg-indigo-600 text-white shadow-xs hover:bg-indigo-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function ReadOnlyBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h5 className="text-[11px] font-black text-slate-700">{title}</h5>
      {children}
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center text-xs font-semibold text-slate-400">{children}</div>;
}

function ConfigDrawer(props: {
  mode: ConfigDrawerMode;
  groupDraft: AgentWorkGroup | null;
  workItemDraft: AgentWorkItem | null;
  groups: AgentWorkGroup[];
  knowledgeItems: KnowledgeItem[];
  knowledgeQuery: string;
  knowledgeCategory: string;
  generationPreview: AgentWorkItemDefinition | null;
  isGenerating: boolean;
  primaryBtn: string;
  onClose: () => void;
  onGroupChange: (group: AgentWorkGroup | null) => void;
  onWorkItemChange: (item: AgentWorkItem | null) => void;
  onSaveGroup: () => void;
  onSaveWorkItem: () => void;
  onToggleKnowledge: (id: string) => void;
  onKnowledgeQuery: (value: string) => void;
  onKnowledgeCategory: (value: string) => void;
  onGenerateDefinition: () => void;
  onApplyPreview: () => void;
  onClearPreview: () => void;
  onToggleGroupStatus: () => void;
  onToggleWorkItemStatus: () => void;
  onDeleteWorkItem: () => void;
}) {
  const isGroupMode = props.mode === "group-create" || props.mode === "group-edit";
  const isCreate = props.mode === "group-create" || props.mode === "work-item-create";
  const title = isGroupMode
    ? (isCreate ? "创建工作组" : "编辑工作组")
    : props.mode === "agent-definition"
      ? "智能体定义预览"
      : (isCreate ? "创建工作项" : "编辑工作项");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[1px]">
      <button type="button" aria-label="关闭抽屉遮罩" className="absolute inset-0 cursor-default" onClick={props.onClose} />
      <aside className="relative flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">{title}</h3>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-400">配置变更保存后同步写入后端主数据</p>
          </div>
          <button type="button" onClick={props.onClose} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-50">
            关闭
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isGroupMode && props.groupDraft && (
            <div className="space-y-4">
              <TextField label="工作组名称" value={props.groupDraft.name} onChange={value => props.onGroupChange({ ...props.groupDraft!, name: value })} />
              <DefinitionTextarea label="工作组说明" value={props.groupDraft.description || ""} onChange={value => props.onGroupChange({ ...props.groupDraft!, description: value })} rows={4} />
            </div>
          )}

          {(props.mode === "work-item-create" || props.mode === "work-item-edit") && props.workItemDraft && (
            <div className="space-y-4">
              <label className="space-y-1 text-[11px] font-bold text-slate-600 block">
                <span>所属工作组</span>
                <select
                  value={props.workItemDraft.groupId}
                  onChange={event => props.onWorkItemChange({ ...props.workItemDraft!, groupId: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  {props.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField label="工作项名称" value={props.workItemDraft.name} onChange={value => props.onWorkItemChange({ ...props.workItemDraft!, name: value })} />
                <TextField label="说明" value={props.workItemDraft.description || ""} onChange={value => props.onWorkItemChange({ ...props.workItemDraft!, description: value })} />
              </div>
              <DefinitionTextarea label="工作定义步骤（一行一步）" value={props.workItemDraft.definition.workSteps.join("\n")} onChange={value => props.onWorkItemChange(updateDefinition(props.workItemDraft!, { workSteps: lines(value) }))} rows={5} />
              <KnowledgePicker
                items={props.knowledgeItems}
                selectedIds={props.workItemDraft.definition.knowledgeItemIds}
                query={props.knowledgeQuery}
                category={props.knowledgeCategory}
                onQuery={props.onKnowledgeQuery}
                onCategory={props.onKnowledgeCategory}
                onToggle={props.onToggleKnowledge}
              />
              <DefinitionTextarea label="成果定义 Markdown 模板" value={props.workItemDraft.definition.outputTemplate} onChange={value => props.onWorkItemChange(updateDefinition(props.workItemDraft!, { outputTemplate: value }))} rows={8} />
            </div>
          )}

          {props.mode === "agent-definition" && props.workItemDraft && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">当前工作项</div>
                <div className="mt-1 text-sm font-black text-slate-900">{props.workItemDraft.name}</div>
              </div>
              <DefinitionTextarea label="系统提示词" value={props.workItemDraft.definition.systemPrompt} onChange={value => props.onWorkItemChange(updateDefinition(props.workItemDraft!, { systemPrompt: value }))} rows={7} />
              <DefinitionTextarea label="用户提示词" value={props.workItemDraft.definition.userPrompt} onChange={value => props.onWorkItemChange(updateDefinition(props.workItemDraft!, { userPrompt: value }))} rows={7} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DefinitionTextarea label="依赖工具（一行一个）" value={props.workItemDraft.definition.tools.join("\n")} onChange={value => props.onWorkItemChange(updateDefinition(props.workItemDraft!, { tools: lines(value) }))} rows={5} />
                <DefinitionTextarea label="依赖 skills（一行一个）" value={props.workItemDraft.definition.skills.join("\n")} onChange={value => props.onWorkItemChange(updateDefinition(props.workItemDraft!, { skills: lines(value) }))} rows={5} />
              </div>
              {props.generationPreview && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="text-[11px] font-black text-slate-700">Hermes 生成预览</div>
                  <PreviewBlock title="系统提示词" content={props.generationPreview.systemPrompt} />
                  <PreviewBlock title="用户提示词" content={props.generationPreview.userPrompt} />
                  <PreviewBlock title="工具" content={props.generationPreview.tools.join("、")} />
                  <PreviewBlock title="Skills" content={props.generationPreview.skills.join("、")} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            {isGroupMode && props.groupDraft && props.mode === "group-edit" && (
              <button type="button" onClick={props.onToggleGroupStatus} className="rounded-lg bg-slate-200 px-3 py-2 text-[11px] font-extrabold text-slate-700">
                {props.groupDraft.status === "inactive" ? "恢复组" : "停用组"}
              </button>
            )}
            {!isGroupMode && props.workItemDraft && props.mode === "work-item-edit" && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={props.onToggleWorkItemStatus} className="rounded-lg bg-slate-200 px-3 py-2 text-[11px] font-extrabold text-slate-700">
                  {props.workItemDraft.status === "inactive" ? "恢复工作项" : "停用工作项"}
                </button>
                <button type="button" onClick={props.onDeleteWorkItem} className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-extrabold text-rose-700 hover:bg-rose-100">
                  删除工作项
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {props.mode === "agent-definition" && (
              <>
                <button type="button" onClick={() => props.onGenerateDefinition()} disabled={props.isGenerating} className="rounded-lg bg-slate-900 px-4 py-2 text-[11px] font-extrabold text-white disabled:opacity-50">
                  {props.isGenerating ? "生成中..." : "一键生成智能体定义"}
                </button>
                {props.generationPreview && <button type="button" onClick={() => props.onApplyPreview()} className="rounded-lg bg-indigo-600 px-4 py-2 text-[11px] font-extrabold text-white">应用预览</button>}
                {props.generationPreview && <button type="button" onClick={() => props.onClearPreview()} className="rounded-lg bg-slate-200 px-4 py-2 text-[11px] font-extrabold text-slate-700">清除预览</button>}
                <button type="button" onClick={() => props.onSaveWorkItem()} className={`rounded-lg px-4 py-2 text-[11px] font-extrabold ${props.primaryBtn}`}>保存智能体定义</button>
              </>
            )}
            {isGroupMode && <button type="button" onClick={() => props.onSaveGroup()} className={`rounded-lg px-4 py-2 text-[11px] font-extrabold ${props.primaryBtn}`}>{isCreate ? "创建工作组" : "保存工作组"}</button>}
            {(props.mode === "work-item-create" || props.mode === "work-item-edit") && <button type="button" onClick={() => props.onSaveWorkItem()} className={`rounded-lg px-4 py-2 text-[11px] font-extrabold ${props.primaryBtn}`}>{isCreate ? "创建工作项" : "保存工作项"}</button>}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-3xs">
      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-3">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1 text-[11px] font-bold text-slate-600 w-full">
      <span>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" />
    </label>
  );
}

function DefinitionTextarea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <label className="space-y-1 text-[11px] font-bold text-slate-600 block">
      <span>{label}</span>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono leading-relaxed" />
    </label>
  );
}

function KnowledgePicker(props: {
  items: KnowledgeItem[];
  selectedIds: string[];
  query: string;
  category: string;
  onQuery: (value: string) => void;
  onCategory: (value: string) => void;
  onToggle: (id: string) => void;
}) {
  const categories = ["all", "policies", "legal", "market", "cases", "methodology", "internal_policies", "industry", "feedback"];
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-4 h-4 text-slate-500" />
        <span className="text-[11px] font-black text-slate-700">知识资产关联</span>
        <span className="text-[10px] text-slate-400 font-bold">已选 {props.selectedIds.length}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-2 mb-2">
        <input value={props.query} onChange={e => props.onQuery(e.target.value)} placeholder="搜索知识条目标题、标签、来源" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" />
        <select value={props.category} onChange={e => props.onCategory(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
          {categories.map(category => <option key={category} value={category}>{category === "all" ? "全部分类" : category}</option>)}
        </select>
      </div>
      <div className="max-h-44 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
        {props.items.map(item => {
          const checked = props.selectedIds.includes(item.id);
          return (
            <button key={item.id} onClick={() => props.onToggle(item.id)} className={`text-left rounded-lg border px-3 py-2 text-[11px] ${checked ? "bg-indigo-50 border-indigo-200 text-indigo-900" : "bg-white border-slate-150 text-slate-700"}`}>
              <div className="font-extrabold truncate">{checked ? "✓ " : ""}{item.title}</div>
              <div className="text-[10px] text-slate-400 mt-1">{item.category} · {item.tags.slice(0, 3).join(" / ")}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-[10px] font-black text-slate-500 mb-1">{title}</div>
      <pre className="whitespace-pre-wrap text-[11px] text-slate-700 font-mono leading-relaxed">{content}</pre>
    </div>
  );
}

function roleIcon(type: AgentType) {
  if (type === "law_review") return <Scale className="w-4 h-4 text-indigo-600" />;
  if (type === "evaluation") return <BarChart3 className="w-4 h-4 text-blue-600" />;
  if (type === "risk_review") return <ShieldCheck className="w-4 h-4 text-rose-600" />;
  if (type === "industry") return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  return <Bot className="w-4 h-4 text-slate-500" />;
}

function updateDefinition(item: AgentWorkItem, patch: Partial<AgentWorkItemDefinition>): AgentWorkItem {
  return {
    ...item,
    definition: {
      ...item.definition,
      ...patch,
    },
  };
}

function lines(value: string) {
  return value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
}
