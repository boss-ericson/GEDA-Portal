const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Insert import
const importStr = "import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';\n";
content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\n" + importStr);

// Insert calculated data before the return statement.
const calcDataStr = `
  // Calculate dynamic charts data
  const chartStudents = [...students, ...offlineQueue];
  const intakeDataMap = chartStudents.reduce((acc, s) => {
    const d = new Date(s.createdAt);
    const month = d.toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const intakeData = Object.entries(intakeDataMap).map(([month, count]) => ({ month, count }));
  if (intakeData.length === 0) {
    intakeData.push({ month: 'Jun', count: 12 }, { month: 'Jul', count: 28 }, { month: 'Aug', count: 45 }, { month: 'Sep', count: 32 });
  }

  const genderData = [
    { name: 'Male', value: mCount },
    { name: 'Female', value: fCount }
  ];
  
  const boardingData = [
    { name: 'Day', value: dayCount },
    { name: 'Boarding', value: boardingCount }
  ];

  const COLORS = ['#2563eb', '#ec4899', '#f59e0b', '#10b981'];

  // End dynamic charts calculations
`;
content = content.replace("const dynamicStyles =", calcDataStr + "\n  const dynamicStyles =");

// Now replace the SVG section
const targetSvgStart = `{/* DYNAMIC SVG CHARTS (High Crafts, Zero-dependency, pure and error-free) */}`;
const targetSvgEnd = `{/* BOTTOM GRID */}`;

const newSvgSection = `
              {/* DYNAMIC METRICS CHARTS */}
              <div className="grid lg:grid-cols-12 gap-6">
                
                {/* Chart 1: Enrollment Distribution */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 dark:text-white">Monthly Student Intake (Academic Timeline)</h3>
                    <p className="text-slate-400 text-xs">Dynamic linear index of admissions plotted against real-time registers.</p>
                  </div>

                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={intakeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#15803d" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#15803d" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#15803d" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-brand-green-700"></span> Registered Intake
                    </span>
                  </div>
                </div>

                {/* Chart 2: Student Attributes */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 dark:text-white">Enrollment & Gender Dynamics</h3>
                    <p className="text-slate-400 text-xs">Aesthetic ratio breakups of registered school students.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 h-48">
                    {/* Gender Chart */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={genderData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={50}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {genderData.map((entry, index) => (
                                <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Gender Balance
                        <div className="text-[10px] font-normal text-slate-500 mt-1">
                          <span className="text-blue-600 font-medium">{mCount} M</span> / <span className="text-pink-500 font-medium">{fCount} F</span>
                        </div>
                      </div>
                    </div>

                    {/* Boarding Chart */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={boardingData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={50}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {boardingData.map((entry, index) => (
                                <Cell key={\`cell-\${index}\`} fill={COLORS[(index + 2) % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Enrollment System
                        <div className="text-[10px] font-normal text-slate-500 mt-1">
                          <span className="text-amber-500 font-medium">{dayCount} Day</span> / <span className="text-emerald-500 font-medium">{boardingCount} Brd</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    💡 <b>GES Standard Ratio Guidance:</b> {school.name} recommends maintaining balanced class metrics. Ensure class sizes remain under national municipal safety ceilings of 35-40 pupils.
                  </div>
                </div>

              </div>
`;

const startIndex = content.indexOf(targetSvgStart);
const endIndex = content.indexOf(targetSvgEnd);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newSvgSection + content.substring(endIndex);
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Successfully replaced chart section.');
} else {
  console.log('Could not find the target strings.');
  console.log('startIndex:', startIndex);
  console.log('endIndex:', endIndex);
}
