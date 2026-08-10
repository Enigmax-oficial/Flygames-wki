const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const additionalUI = `
              {/* 3D Model Configuration */}
              <div className="space-y-4 p-4 bg-[#0b0f19] border border-[#1e293b] rounded-2xl mt-4">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
                  3D Model & Textures
                </h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">3D Model Key / URL</label>
                  <input
                    type="text"
                    placeholder="e.g. climber_zombie or https://...model.glb"
                    value={model3DKey}
                    onChange={(e) => setModel3DKey(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">3D Texture URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://...texture.png"
                    value={model3DTexture}
                    onChange={(e) => setModel3DTexture(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Advanced Data Tables */}
              <div className="space-y-4 p-4 bg-[#0b0f19] border border-[#1e293b] rounded-2xl mt-4">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
                  Advanced Data Tables
                </h3>
                
                {/* Movement Speed */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-bold text-slate-300 block">Movement Speed</label>
                  <input
                    type="text"
                    placeholder="e.g. 0.28x"
                    value={movementSpeed}
                    onChange={(e) => setMovementSpeed(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>

                {/* Difficulty Stats */}
                <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Difficulty Stats (Health/Attack)</label>
                    <button type="button" onClick={addDifficultyStat} className="px-2 py-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-[10px] font-bold rounded">
                      + Add Stat
                    </button>
                  </div>
                  {difficultyStats.length > 0 && (
                    <div className="space-y-2">
                      {difficultyStats.map((stat, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" placeholder="Diff" value={stat.difficulty} onChange={(e) => updateDifficultyStat(idx, 'difficulty', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <input type="text" placeholder="Health" value={stat.health} onChange={(e) => updateDifficultyStat(idx, 'health', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <input type="text" placeholder="Atk" value={stat.attack} onChange={(e) => updateDifficultyStat(idx, 'attack', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <input type="text" placeholder="Icon" value={stat.icon} onChange={(e) => updateDifficultyStat(idx, 'icon', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <button type="button" onClick={() => removeDifficultyStat(idx)} className="text-rose-400">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drops Table */}
                <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Loot / Drops Table</label>
                    <button type="button" onClick={addDrop} className="px-2 py-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-[10px] font-bold rounded">
                      + Add Drop
                    </button>
                  </div>
                  {dropsTable.length > 0 && (
                    <div className="space-y-2">
                      {dropsTable.map((drop, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" placeholder="Item" value={drop.item} onChange={(e) => updateDrop(idx, 'item', e.target.value)} className="w-1/3 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <input type="text" placeholder="Amount" value={drop.amount} onChange={(e) => updateDrop(idx, 'amount', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <input type="text" placeholder="Chance" value={drop.chance} onChange={(e) => updateDrop(idx, 'chance', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <button type="button" onClick={() => removeDrop(idx)} className="text-rose-400">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
`;

code = code.replace(
  /\{\/\* Badge Color Choice \*\/\}/,
  additionalUI + '\n              {/* Badge Color Choice */}'
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
