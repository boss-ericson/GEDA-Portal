import fs from 'fs';

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const oldCard = `                {/* CARD 2: Student Enrollment (3 Cols) */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-[#274C77]/20 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#274C77]/80">Student Body</span>
                    <div className="h-9 w-9 rounded-xl bg-[#EEF6FC] text-[#274C77] flex items-center justify-center shrink-0 border border-[#274C77]/20">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-display font-bold text-[#0B1E2D] tracking-tight">
                      {totalStudents}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {admittedStudents} Admitted
                      </span>
                      {pendingStudents > 0 && (
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {pendingStudents} Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#274C77]/15 flex justify-between text-xs text-[#274C77]/70 font-medium">
                    <span>JHS: <strong className="text-[#0B1E2D] font-bold">{jhsStudentsCount}</strong></span>
                    <span>Primary: <strong className="text-[#0B1E2D] font-bold">{primaryStudentsCount}</strong></span>
                  </div>
                </div>`;

const newCard = `                {/* CARD 2: Student Enrollment (3 Cols) */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-[#274C77]/20 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#274C77]/80">Student Body</span>
                    <div className="h-9 w-9 rounded-xl bg-[#EEF6FC] text-[#274C77] flex items-center justify-center shrink-0 border border-[#274C77]/20">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-display font-bold text-[#0B1E2D] tracking-tight">
                        {totalStudents}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {admittedStudents} Admitted
                        </span>
                        {pendingStudents > 0 && (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {pendingStudents} Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Gender Distribution Visual */}
                  {totalStudents > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-blue-600">Boys ({malePercentage.toFixed(0)}%)</span>
                        <span className="text-pink-600">Girls ({femalePercentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-2 flex rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-blue-500 h-full transition-all duration-1000 ease-out" style={{ width: \`\${malePercentage}%\` }}></div>
                        <div className="bg-pink-500 h-full transition-all duration-1000 ease-out" style={{ width: \`\${femalePercentage}%\` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-medium text-slate-500">
                        <span>{maleStudentsCount} Male</span>
                        <span>{femaleStudentsCount} Female</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#274C77]/15 flex justify-between text-[11px] text-[#274C77]/70 font-medium mt-1">
                    <span>JHS: <strong className="text-[#0B1E2D] font-bold">{jhsStudentsCount}</strong></span>
                    <span>Primary/Pre: <strong className="text-[#0B1E2D] font-bold">{primaryStudentsCount}</strong></span>
                  </div>
                </div>`;

content = content.replace(oldCard, newCard);
fs.writeFileSync('src/components/Dashboard.tsx', content);
