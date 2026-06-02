import React from "react";
import { 
  Table, Plus, Trash2, Edit3, Settings, AlertCircle, RefreshCw, 
  Search, Check, Grid, Sliders, Calendar, FolderPlus, Info, Save, X, Layers
} from "lucide-react";
import type { MarketField, MarketObject } from "../types";

export default function StructuredMarketView() {
  const [objects, setObjects] = React.useState<MarketObject[]>([]);
  const [selectedObjId, setSelectedObjId] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modals & Forms State
  const [isCreatingObj, setIsCreatingObj] = React.useState(false);
  const [newObjName, setNewObjName] = React.useState("");
  const [newObjDesc, setNewObjDesc] = React.useState("");
  const [newObjFields, setNewObjFields] = React.useState<MarketField[]>([
    { key: "name", label: "对象名称", type: "string" }
  ]);

  // For defining dynamic field form
  const [tempFieldKey, setTempFieldKey] = React.useState("");
  const [tempFieldLabel, setTempFieldLabel] = React.useState("");
  const [tempFieldType, setTempFieldType] = React.useState<"string" | "number" | "date">("string");

  // For maintaining Table Rows (Add/Edit)
  const [isEditingRow, setIsEditingRow] = React.useState(false);
  const [activeRowId, setActiveRowId] = React.useState<string | null>(null); // null means adding
  const [rowFormData, setRowFormData] = React.useState<Record<string, any>>({});

  // Error/Success message toast
  const [toastMsg, setToastMsg] = React.useState<{ text: string; isError: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  const loadMarketObjects = React.useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge/market-objects");
      if (!res.ok) throw new Error("市场数据库读取失败");
      const data: MarketObject[] = await res.json();
      setObjects(data);
      setSelectedObjId(prev => data.some(obj => obj.id === prev) ? prev : (data[0]?.id || ""));
      window.dispatchEvent(new CustomEvent("amc_market_db_updated", { detail: { count: countMarketRows(data) } }));
    } catch (error) {
      console.error(error);
      showToast("结构化市场数据库读取失败，请稍后重试。", true);
    }
  }, []);

  React.useEffect(() => {
    loadMarketObjects();
  }, [loadMarketObjects]);

  const saveObjectToApi = async (object: MarketObject) => {
    const res = await fetch(`/api/knowledge/market-objects/${encodeURIComponent(object.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(object),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "市场对象保存失败");
    const saved: MarketObject = await res.json();
    const updated = objects.map(obj => obj.id === saved.id ? saved : obj);
    setObjects(updated);
    window.dispatchEvent(new CustomEvent("amc_market_db_updated", { detail: { count: countMarketRows(updated) } }));
    return saved;
  };

  const handleResetToPresets = async () => {
    if (window.confirm("确定要恢复出厂原预设的数据对象吗？此操作会重置您自定义的所有字段和元数据数据记录。")) {
      try {
        const res = await fetch("/api/knowledge/market-objects/reset", { method: "POST" });
        if (!res.ok) throw new Error("市场对象重置失败");
        const data: MarketObject[] = await res.json();
        setObjects(data);
        setSelectedObjId(data[0]?.id || "");
        window.dispatchEvent(new CustomEvent("amc_market_db_updated", { detail: { count: countMarketRows(data) } }));
        showToast("已成功重置初始化八维合规元数据库预设!", false);
      } catch (error) {
        console.error(error);
        showToast("恢复预设失败，请稍后重试。", true);
      }
    }
  };

  const activeObject = objects.find(o => o.id === selectedObjId);

  // Field creation helper
  const addTempField = () => {
    if (!tempFieldKey || !tempFieldLabel) {
      showToast("必须填写字段Key（英文）与显示标签（中文）", true);
      return;
    }
    const sanitizedKey = tempFieldKey.trim().replace(/[^a-zA-Z0-9]/g, "");
    if (newObjFields.some(f => f.key === sanitizedKey)) {
      showToast("已存在相同名称的字段 key，请更换", true);
      return;
    }
    setNewObjFields(prev => [...prev, {
      key: sanitizedKey,
      label: tempFieldLabel.trim(),
      type: tempFieldType
    }]);
    setTempFieldKey("");
    setTempFieldLabel("");
    setTempFieldType("string");
    showToast(`临时添加字段 ${sanitizedKey} 成功，请在确认下方提交!`, false);
  };

  const removeTempField = (key: string) => {
    if (key === "name") {
      showToast("默认根键字段不得清除", true);
      return;
    }
    setNewObjFields(prev => prev.filter(f => f.key !== key));
  };

  // Edit existing Object Model State
  const [isEditingObj, setIsEditingObj] = React.useState(false);
  const [editObjName, setEditObjName] = React.useState("");
  const [editObjDesc, setEditObjDesc] = React.useState("");
  const [editObjFields, setEditObjFields] = React.useState<MarketField[]>([]);

  const handleOpenEditObjectModel = () => {
    if (!activeObject) return;
    setEditObjName(activeObject.name);
    setEditObjDesc(activeObject.description);
    setEditObjFields([...activeObject.fields]);
    setIsEditingObj(true);
  };

  const addEditTempField = () => {
    if (!tempFieldKey || !tempFieldLabel) {
      showToast("必须填写字段Key（英文）与显示标签（中文）", true);
      return;
    }
    const sanitizedKey = tempFieldKey.trim().replace(/[^a-zA-Z0-9]/g, "");
    if (editObjFields.some(f => f.key === sanitizedKey)) {
      showToast("已存在相同名称的字段 key，请更换", true);
      return;
    }
    setEditObjFields(prev => [...prev, {
      key: sanitizedKey,
      label: tempFieldLabel.trim(),
      type: tempFieldType
    }]);
    setTempFieldKey("");
    setTempFieldLabel("");
    setTempFieldType("string");
    showToast(`临时添加字段 ${sanitizedKey} 成功，请在确认下方提交!`, false);
  };

  const removeEditTempField = (key: string) => {
    if (editObjFields.length <= 1) {
      showToast("必须至少保留一个核心描述属性字段", true);
      return;
    }
    setEditObjFields(prev => prev.filter(f => f.key !== key));
  };

  const handleUpdateObjectModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObject) return;
    if (!editObjName.trim()) {
      showToast("市场对象中文统称不能为空", true);
      return;
    }
    if (editObjFields.length === 0) {
      showToast("模型必须包含至少一个有效描述属性字段", true);
      return;
    }

    const adjustedRows = activeObject.rows.map(row => {
      const newRow: Record<string, any> = { id: row.id };
      editObjFields.forEach(f => {
        if (row[f.key] !== undefined) {
          newRow[f.key] = f.type === "number" ? (isNaN(Number(row[f.key])) ? 0 : Number(row[f.key])) : row[f.key];
        } else {
          newRow[f.key] = f.type === "number" ? 0 : "";
        }
      });
      return newRow;
    });

    try {
      await saveObjectToApi({
        ...activeObject,
        name: editObjName.trim(),
        description: editObjDesc.trim(),
        fields: editObjFields,
        rows: adjustedRows
      });
      setIsEditingObj(false);
      showToast(`对结构化市场对象 [${editObjName}] 模型更新及行数据字段自动关联完毕!`);
    } catch (error) {
      console.error(error);
      showToast("市场对象模型保存失败。", true);
    }
  };

  // Submit completely new market object model
  const handleCreateObjectModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjName.trim()) {
      showToast("市场对象中文统称不能为空", true);
      return;
    }
    if (newObjFields.length === 0) {
      showToast("模型必须包含至少一个有效描述属性字段", true);
      return;
    }

    const uniqueId = `cust_obj_${Date.now()}`;
    const newObj: MarketObject = {
      id: uniqueId,
      name: newObjName.trim(),
      description: newObjDesc.trim() || `自定数据模型，共有 ${newObjFields.length} 个自定义评估属性`,
      fields: newObjFields,
      rows: []
    };

    try {
      const res = await fetch("/api/knowledge/market-objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newObj),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "市场对象创建失败");
      const saved: MarketObject = await res.json();
      const updated = [...objects, saved];
      setObjects(updated);
      window.dispatchEvent(new CustomEvent("amc_market_db_updated", { detail: { count: countMarketRows(updated) } }));
      setSelectedObjId(saved.id);
      setNewObjName("");
      setNewObjDesc("");
      setNewObjFields([{ key: "name", label: "名称", type: "string" }]);
      setIsCreatingObj(false);
      showToast(`新的结构化市场对象 [${saved.name}] 在线建模架构成功!`);
    } catch (error) {
      console.error(error);
      showToast("市场对象创建失败，请稍后重试。", true);
    }
  };

  const handleDeleteObject = async (id: string) => {
    if (objects.length <= 1) {
      showToast("必须至少保留一个核心结构化业务分析对象!", true);
      return;
    }
    if (window.confirm("极度警告：确认要永久销毁此字段的定义元数据结构模型及该类目下的所有数据记录吗？此过程不可逆。")) {
      try {
        const res = await fetch(`/api/knowledge/market-objects/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "市场对象删除失败");
        const remaining = objects.filter(o => o.id !== id);
        setObjects(remaining);
        window.dispatchEvent(new CustomEvent("amc_market_db_updated", { detail: { count: countMarketRows(remaining) } }));
        setSelectedObjId(remaining[0].id);
        showToast("已销毁指定的市场要素数据库实体和它的所有属性行");
      } catch (error) {
        console.error(error);
        showToast("市场对象删除失败，请稍后重试。", true);
      }
    }
  };

  // ROW DATA ACTIONS
  const handleOpenAddRow = () => {
    if (!activeObject) return;
    const initialForm: Record<string, any> = {};
    activeObject.fields.forEach(f => {
      if (f.type === "number") {
        initialForm[f.key] = 0;
      } else if (f.type === "date") {
        initialForm[f.key] = new Date().toISOString().split('T')[0];
      } else {
        initialForm[f.key] = "";
      }
    });
    setRowFormData(initialForm);
    setActiveRowId(null); // adding
    setIsEditingRow(true);
  };

  const handleOpenEditRow = (row: Record<string, any>) => {
    setRowFormData({ ...row });
    setActiveRowId(row.id);
    setIsEditingRow(true);
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!activeObject) return;
    if (window.confirm("确定要删除这条维护的数据记录吗？")) {
      try {
        await saveObjectToApi({ ...activeObject, rows: activeObject.rows.filter(r => r.id !== rowId) });
        showToast("已剔除该行指标数据。");
      } catch (error) {
        console.error(error);
        showToast("删除行数据失败。", true);
      }
    }
  };

  const handleSaveRowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObject) return;

    let updatedObject: MarketObject;
    if (activeRowId === null) {
      // Adding new record
      const newRowId = `row_${Date.now()}`;
      const newRow = { id: newRowId, ...rowFormData };
      updatedObject = { ...activeObject, rows: [...activeObject.rows, newRow] };
      showToast("添加新指标参数并计算分析模型完毕!", false);
    } else {
      // Editing existing record
      updatedObject = { ...activeObject, rows: activeObject.rows.map(r => r.id === activeRowId ? { ...r, ...rowFormData } : r) };
      showToast("修改选定指标行成功，评估上下文已更新!", false);
    }

    try {
      await saveObjectToApi(updatedObject);
      setIsEditingRow(false);
      setActiveRowId(null);
    } catch (error) {
      console.error(error);
      showToast("保存行数据失败。", true);
    }
  };

  // Filter rows based on search
  const filteredRows = activeObject 
    ? activeObject.rows.filter(row => {
        return activeObject.fields.some(f => {
          const val = row[f.key];
          if (val === undefined || val === null) return false;
          return String(val).toLowerCase().includes(searchQuery.toLowerCase());
        });
      })
    : [];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden text-left shadow-2xs">
      
      {/* Toast Notification Container */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4.5 rounded-xl shadow-xl flex items-center gap-2.5 transition-all text-xs font-bold animate-in ${
          toastMsg.isError ? "bg-rose-50 text-rose-800 border border-rose-100" : "bg-indigo-50 text-indigo-800 border border-indigo-100"
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Structured Category Core Dashboard Header */}
      <div className="p-4.5 bg-gradient-to-br from-indigo-50/40 via-slate-50/50 to-transparent border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <Grid className="w-4 h-4" />
            </span>
            <h4 className="font-extrabold text-slate-900 text-xs">多维度市场可比对象结构化配置数据库 (Structured Data Engine)</h4>
          </div>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
            不同于法规文本，在此可在线「动态配置不同的市场评估对象字段」，随时对各评估参数对象按实体列特征进行行数据的录入和计算。
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={handleResetToPresets}
            className="px-2.5 py-1.5 border border-slate-200 hover:border-indigo-250 bg-white hover:bg-slate-50 text-[10.5px] font-bold text-slate-650 hover:text-indigo-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            title="一键恢复最初系统大宗不动产精算及准入LTV参数"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            恢复原厂指标预设
          </button>
          
          <button
            onClick={() => setIsCreatingObj(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            自定义设计全新市场对象
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden divide-y xl:divide-y-0 xl:divide-x divide-slate-200">
        
        {/* Left control block list metadata catalog schemas */}
        <div className="w-full xl:w-72 bg-slate-50/60 p-4 space-y-3 flex-shrink-0 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-2.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">1. 选定拟配置的结构化对象</span>
            
            <div className="space-y-1.5">
              {objects.map((obj) => {
                const isSelected = obj.id === selectedObjId;
                return (
                  <div
                    key={obj.id}
                    onClick={() => {
                      setSelectedObjId(obj.id);
                      setSearchQuery("");
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col space-y-1 select-none ${
                      isSelected 
                        ? "bg-white border-indigo-500 ring-1 ring-indigo-500/10 text-slate-900 shadow-2xs" 
                        : "bg-white/40 border-slate-200/80 text-slate-500 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-extrabold text-[11.5px] tracking-tight ${isSelected ? "text-indigo-700" : "text-slate-800"}`}>
                        {obj.name}
                      </span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      ) : (
                        <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-400 px-1 py-0.2 rounded">
                          {obj.rows.length} 笔
                        </span>
                      )}
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-semibold leading-relaxed line-clamp-2">
                      {obj.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {activeObject && (
            <div className="bg-indigo-50/30 border border-indigo-100/60 rounded-xl p-3.5 space-y-2 mt-4">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span>对象模型属性 ({activeObject.fields.length} 个字段)</span>
                <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-mono font-black text-[9px]">SCHEMA</span>
              </div>
              
              <div className="space-y-1.5 font-mono text-[10px] text-slate-500/90 max-h-40 overflow-y-auto pr-1">
                {activeObject.fields.map(f => (
                  <div key={f.key} className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 font-semibold">
                    <span className="text-slate-750 text-[10.5px]" title={f.key}>{f.label}</span>
                    <span className="text-slate-400">({f.type})</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                <button
                  type="button"
                  onClick={handleOpenEditObjectModel}
                  className="w-full text-center py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-lg cursor-pointer transition-all active:scale-[0.98] shadow-3xs flex items-center justify-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  修改对象模型 (Edit Schema)
                </button>
                <button
                  onClick={() => handleDeleteObject(activeObject.id)}
                  className="w-full text-center py-1.5 hover:bg-rose-50 text-[10px] font-extrabold text-rose-600 border border-dashed border-rose-200 hover:border-rose-350 rounded-lg cursor-pointer transition-colors"
                >
                  💣 永久注销该定制数据模型
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right view / maintain data grids */}
        <div className="flex-1 bg-white p-5 overflow-y-auto flex flex-col justify-between">
          {activeObject ? (
            <div className="space-y-4">
              {/* Table search bar & action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="输入检索关键字过滤下方指标列表..."
                    className="w-full text-xs bg-white border border-slate-200 pl-9 pr-3 py-2 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={handleOpenAddRow}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    维护行数据 (Add Record)
                  </button>
                </div>
              </div>

              {/* Data Table Grid */}
              {filteredRows.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-150 bg-slate-50/40">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-650">此数据模型暂未添加行记录或未匹配到检索结果</p>
                  <p className="text-[10.5px] text-slate-400 mt-1">请点击右侧「维护行数据」按钮，为其在线定制化输入样本参数。</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-700 select-none">
                        {activeObject.fields.map(f => (
                          <th key={f.key} className="py-3 px-4.5 font-bold">{f.label}</th>
                        ))}
                        <th className="py-3 px-4.5 text-right font-bold">维护</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                      {filteredRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                          {activeObject.fields.map(f => {
                            const val = row[f.key];
                            return (
                              <td key={f.key} className="py-3.5 px-4.5 text-xs text-slate-800 font-medium">
                                {f.type === "number" ? (
                                  <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100/50 px-1.5 py-0.5 rounded">
                                    {val}
                                  </span>
                                ) : (
                                  <span>{val ?? "--"}</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-3 px-4.5 text-right flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditRow(row)}
                              className="p-1.5 hover:bg-amber-50 text-amber-600 hover:text-amber-800 rounded transition-all cursor-pointer"
                              title="拟修订该参数项"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition-all cursor-pointer"
                              title="剔除此行"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10.5px] text-slate-400 font-bold flex justify-between">
                    <span>当前展示符合条件的记录共 {filteredRows.length} 条</span>
                    <span>数据精度及加密通道：128-bit RFC4122</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <p className="italic text-xs font-bold">请在页面左侧选择至少一个市场评估对象模型进行管理。</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CREATE DYNAMIC NEW OBJECT MODEL */}
      {isCreatingObj && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-y-auto flex flex-col p-6 animate-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
              <div className="flex items-center gap-1.5 text-slate-900">
                <span className="p-1 bg-indigo-50 text-indigo-700 rounded text-xs font-mono font-bold">SCHEME_DESIGN</span>
                <h4 className="font-extrabold text-sm">创建并在线建模全新的市场多维对象</h4>
              </div>
              <button 
                onClick={() => setIsCreatingObj(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5 animate-pulse" />
              </button>
            </div>

            <form onSubmit={handleCreateObjectModel} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-bold block">对象名称 (中文简述)</label>
                <input
                  type="text"
                  required
                  value={newObjName}
                  onChange={e => setNewObjName(e.target.value)}
                  placeholder="例如: 智能制造装备变现走势指标表"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-bold block">对象大纲背景/说明</label>
                <textarea
                  rows={2}
                  value={newObjDesc}
                  onChange={e => setNewObjDesc(e.target.value)}
                  placeholder="请输入对此对象用作风控或资产核算的合规准入背景简介。"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Advanced field defining panel */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-150">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    在线构造动态属性列 (Define schema fields)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-1.5 py-0.2 rounded">必填</span>
                </div>

                {/* Subform to append row temp fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-extrabold text-slate-500">字段Key (英文唯一)</label>
                    <input
                      type="text"
                      value={tempFieldKey}
                      onChange={e => setTempFieldKey(e.target.value)}
                      placeholder="如: peRatio"
                      className="w-full text-xs p-1.5 border border-slate-150 rounded"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-extrabold text-slate-500">显示标签 (中文标识)</label>
                    <input
                      type="text"
                      value={tempFieldLabel}
                      onChange={e => setTempFieldLabel(e.target.value)}
                      placeholder="如: 各股滚动盈率"
                      className="w-full text-xs p-1.5 border border-slate-150 rounded"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-extrabold text-slate-500">数据格式类型</label>
                    <div className="flex gap-1.5">
                      <select
                        value={tempFieldType}
                        onChange={e => setTempFieldType(e.target.value as any)}
                        className="flex-1 text-[11px] p-1.5 border border-slate-150 rounded bg-white font-bold"
                      >
                        <option value="string">文本 (string)</option>
                        <option value="number">数字 (number)</option>
                        <option value="date">日期 (date)</option>
                      </select>
                      <button
                        type="button"
                        onClick={addTempField}
                        className="bg-indigo-600 text-white font-black px-2 py-1 rounded hover:bg-indigo-550 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Defined Fields list preview */}
                <div className="space-y-1.5 pt-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">架构字段大骨架结构预览：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {newObjFields.map((f) => (
                      <div 
                        key={f.key} 
                        className="pl-2.5 pr-1.5 py-1 text-[11px] font-semibold bg-white border border-slate-205/80 text-slate-700 rounded-full flex items-center gap-1.5 hover:border-rose-200 hover:text-rose-600 transition"
                      >
                        <span>{f.label} <code className="text-[9.5px] font-mono text-slate-400">({f.key}:{f.type})</code></span>
                        {f.key !== "name" && (
                          <button
                            type="button"
                            onClick={() => removeTempField(f.key)}
                            className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-150">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  确立元模型结构
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingObj(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-330 transition-colors cursor-pointer"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1B: MODIFY / EDIT DYNAMIC EXISTING OBJECT MODEL */}
      {isEditingObj && activeObject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-y-auto flex flex-col p-6 animate-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
              <div className="flex items-center gap-1.5 text-slate-900">
                <span className="p-1 bg-indigo-50 text-indigo-700 rounded text-xs font-mono font-bold">SCHEMA_EDIT</span>
                <h4 className="font-extrabold text-sm">修改及重构 [{activeObject.name}] 对象模型字段</h4>
              </div>
              <button 
                onClick={() => setIsEditingObj(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5 animate-pulse" />
              </button>
            </div>

            <form onSubmit={handleUpdateObjectModel} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-bold block">对象名称 (中文简述)</label>
                <input
                  type="text"
                  required
                  value={editObjName}
                  onChange={e => setEditObjName(e.target.value)}
                  placeholder="例如: 智能制造装备变现走势指标表"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-bold block">对象大纲背景/说明</label>
                <textarea
                  rows={2}
                  value={editObjDesc}
                  onChange={e => setEditObjDesc(e.target.value)}
                  placeholder="请输入对此对象用作风控或资产核算的合规准入背景简介。"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Advanced field defining panel */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-150">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    追加或修订动态属性列 (Configure dynamic fields)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-1.5 py-0.2 rounded">在线同步调整</span>
                </div>

                {/* Subform to append row temp fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-extrabold text-slate-500">追加字段Key (英文唯一)</label>
                    <input
                      type="text"
                      value={tempFieldKey}
                      onChange={e => setTempFieldKey(e.target.value)}
                      placeholder="如: netProfit"
                      className="w-full text-xs p-1.5 border border-slate-150 rounded"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-extrabold text-slate-500">显示标签 (名称说明)</label>
                    <input
                      type="text"
                      value={tempFieldLabel}
                      onChange={e => setTempFieldLabel(e.target.value)}
                      placeholder="如: 年度净利润指标"
                      className="w-full text-xs p-1.5 border border-slate-150 rounded"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-extrabold text-slate-500">数据格式类型</label>
                    <div className="flex gap-1.5">
                      <select
                        value={tempFieldType}
                        onChange={e => setTempFieldType(e.target.value as any)}
                        className="flex-1 text-[11px] p-1.5 border border-slate-150 rounded bg-white font-bold"
                      >
                        <option value="string">文本 (string)</option>
                        <option value="number">数字 (number)</option>
                        <option value="date">日期 (date)</option>
                      </select>
                      <button
                        type="button"
                        onClick={addEditTempField}
                        className="bg-indigo-600 text-white font-black px-2 py-1 rounded hover:bg-indigo-550 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Defined Fields list preview */}
                <div className="space-y-1.5 pt-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">架构字段大骨架结构预览 (点击右侧 ✕ 剔除指定列)：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {editObjFields.map((f) => (
                      <div 
                        key={f.key} 
                        className="pl-2.5 pr-1.5 py-1 text-[11px] font-semibold bg-white border border-slate-205/80 text-slate-700 rounded-full flex items-center gap-1.5 hover:border-rose-200 hover:text-rose-600 transition"
                      >
                        <span>{f.label} <code className="text-[9.5px] font-mono text-slate-400">({f.key}:{f.type})</code></span>
                        <button
                          type="button"
                          onClick={() => removeEditTempField(f.key)}
                          className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-150">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  应用修改并重新映射指标
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingObj(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ROW DATA MAINTENANCE (ADD OR EDIT) */}
      {isEditingRow && activeObject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto flex flex-col animate-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
              <div className="flex items-center gap-1.5 text-slate-900">
                <span className="p-1 bg-indigo-50 text-indigo-700 rounded text-xs font-mono font-bold">ROW_INGESTION</span>
                <h4 className="font-extrabold text-sm">
                  {activeRowId === null ? "维护指标：新增市场数据行" : "维护指标：编辑市场数据行"}
                </h4>
              </div>
              <button 
                onClick={() => setIsEditingRow(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRowSubmit} className="space-y-4 text-left">
              <div className="bg-indigo-50/25 border border-indigo-100 p-3 rounded-xl flex gap-1.5 text-slate-650 text-xs font-semibold leading-relaxed">
                <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>
                  当前正面向模型【{activeObject.name}】维护指标数据。请按该模型包含的各个特征字段规范进行数据填写。
                </span>
              </div>

              <div className="space-y-3.5">
                {activeObject.fields.map((field) => {
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="text-xs text-slate-705 font-bold block flex items-center justify-between">
                        <span>{field.label}</span>
                        <code className="text-[9.5px] font-mono text-slate-400">({field.key} - {field.type})</code>
                      </label>

                      {field.type === "number" ? (
                        <input
                          type="number"
                          required
                          step="any"
                          value={rowFormData[field.key] ?? 0}
                          onChange={e => setRowFormData({ ...rowFormData, [field.key]: Number(e.target.value) })}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : field.type === "date" ? (
                        <input
                          type="date"
                          required
                          value={rowFormData[field.key] ?? ""}
                          onChange={e => setRowFormData({ ...rowFormData, [field.key]: e.target.value })}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <input
                          type="text"
                          required
                          value={rowFormData[field.key] ?? ""}
                          onChange={e => setRowFormData({ ...rowFormData, [field.key]: e.target.value })}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-150 mt-4.5">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存记录段
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingRow(false)}
                  className="px-4 py-2 bg-slate-250 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-350 transition-colors cursor-pointer"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function countMarketRows(objects: MarketObject[]) {
  return objects.reduce((total, object) => total + (Array.isArray(object.rows) ? object.rows.length : 0), 0);
}
