const fs = require('fs');

const fileContent = fs.readFileSync('src/App.tsx', 'utf8');

// Find the index of the start anchor
const startKeyword = "rightDrawerContent === 'reflection' ?";
const startIndex = fileContent.indexOf(startKeyword);

if (startIndex === -1) {
  console.error("Could not find startKeyword!");
  process.exit(1);
}

// Find the very first ") : (" occurrences after startIndex
const innerPartIndex = fileContent.indexOf(") : (", startIndex);
if (innerPartIndex === -1) {
  console.error("Could not find innerPartIndex!");
  process.exit(1);
}

const targetReplacementStart = innerPartIndex;

// Find the end anchor
const endKeyword = "            {/* TAB 3: THIRD PARTY MCP INTEGRATIONS */}";
const endIndex = fileContent.indexOf(endKeyword);

if (endIndex === -1) {
  console.error("Could not find endKeyword!");
  process.exit(1);
}

const targetReplacementEnd = endIndex;

const before = fileContent.slice(0, targetReplacementStart);
const after = fileContent.slice(targetReplacementEnd);

const drawerRestoration = `) : (
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
                                        <span className="text-3xl font-black text-emerald-400 font-mono">` + "${activeRecord.reflection.score || 85}分" + `</span>
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
                                            <span>` + "${activeRecord.reflection.completeness}%" + `</span>
                                          </div>
                                          <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
                                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: \`\${activeRecord.reflection.completeness}%\` }} />
                                          </div>
                                        </div>

                                        <div>
                                          <div className="flex justify-between text-xs text-slate-700 font-semibold">
                                            <span>司法核验契合 (Compliance):</span>
                                            <span>` + "${activeRecord.reflection.compliance}%" + `</span>
                                          </div>
                                          <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
                                            <div className="bg-teal-500 h-2 rounded-full" style={{ width: \`\${activeRecord.reflection.compliance}%\` }} />
                                          </div>
                                        </div>

                                        <div>
                                          <div className="flex justify-between text-xs text-slate-700 font-semibold">
                                            <span>推导深度及防流折让 (Depth):</span>
                                            <span>` + "${activeRecord.reflection.depth}%" + `</span>
                                          </div>
                                          <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
                                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: \`\${activeRecord.reflection.depth}%\` }} />
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
                                        {` + "(activeRecord.reflection.pros || []).map((p, i) => (" + `
                                          <li key={i} className="text-xs text-slate-700 leading-relaxed p-2.5 bg-emerald-50/20 border border-emerald-100/60 rounded-xl flex items-start gap-2">
                                            <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">•</span>
                                            <span>` + "{p}" + `</span>
                                          </li>
                                        ` + "))" + `}
                                      </ul>
                                    </div>

                                    {/* Suggestions Area */}
                                    <div className="space-y-2 border-t border-slate-100 pt-4.5">
                                      <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                                        <span>🟡</span> 专家整改优化方向 (Audit Suggestions)
                                      </span>
                                      <div className="p-3 bg-amber-50/20 border border-amber-100 rounded-xl text-xs text-slate-700 leading-relaxed font-normal">
                                        {` + "activeRecord.reflection.suggestions" + `}
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

                                      {` + "activeRecord.sensitiveWordsFlagged && activeRecord.sensitiveWordsFlagged.length > 0 ? (" + `
                                        <div className="space-y-3">
                                          <div className="p-4 bg-rose-50 border border-rose-150 rounded-xl text-xs text-rose-800 space-y-2">
                                            <span className="font-extrabold block text-sm">🚨 发现高风险内容拦截：</span>
                                            <p className="text-[11px]">发现以下不合规或未充分脱敏的司法资产红线词：</p>
                                            <div className="space-y-1 mt-2">
                                              {` + "activeRecord.sensitiveWordsFlagged.map((f, i) => (" + `
                                                <div key={i} className="font-mono bg-white/75 px-2.5 py-1 rounded inline-block text-[10px] border border-rose-200 mr-2 mb-2">
                                                  {` + "{f}" + `}
                                                </div>
                                              ` + "))" + `}
                                            </div>
                                          </div>
                                          <p className="text-[10px] text-slate-400 select-none">
                                            提示：对于被标记的不合规敏感词，建议立即使用智能微调功能，指示模型重新撰写，过滤去这些高风险合规死角。
                                          </p>
                                        </div>
                                      ` + ") : (" + `
                                        <div className="p-5 bg-emerald-50/50 border border-emerald-150 rounded-2xl flex items-start gap-3">
                                          <span className="text-xl">✓</span>
                                          <div>
                                            <h4 className="text-xs font-bold text-emerald-800">未检测到任何高危敏感保密红线</h4>
                                            <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                                              本次生成的评估报告中，完全不包含需要强制脱敏或人工剥离的企业内部机密、隐匿负债、或未披露关联瑕疵。评定可安全对外呈报。
                                            </p>
                                          </div>
                                        </div>
                                      ` + ")" + `}
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

          `;

fs.writeFileSync('src/App.tsx', before + drawerRestoration + after, 'utf8');
console.log("Successfully restored right drawer in App.tsx!");
