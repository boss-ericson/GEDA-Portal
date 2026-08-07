import fs from 'fs';

let content = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

const oldCardBlock = `                {/* Conduct, Attitude & Remarks Card */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-slate-900 shrink-0 shadow-xs">
                  <div>
                    <CustomDropdown 
      label="Attitude" 
      options={ATTITUDES} 
      value={editRecord.attitude} 
      onChange={(val) => setEditRecord({...editRecord, attitude: val})} 
      disabled={!isOtherFieldsEditable()} 
    />
                  </div>
                  <div>
                    <CustomDropdown 
      label="Conduct" 
      options={CONDUCTS} 
      value={editRecord.conduct} 
      onChange={(val) => setEditRecord({...editRecord, conduct: val})} 
      disabled={!isOtherFieldsEditable()} 
    />
                  </div>
                  <div>
                    <CustomDropdown 
      label="Interest" 
      options={INTERESTS} 
      value={editRecord.interest} 
      onChange={(val) => setEditRecord({...editRecord, interest: val})} 
      disabled={!isOtherFieldsEditable()} 
    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Teacher Remarks</label>
                    <input 
                      disabled={!isOtherFieldsEditable()}
                      type="text"
                      value={editRecord.teacherRemarks || ''} 
                      onChange={e => setEditRecord({...editRecord, teacherRemarks: e.target.value})}
                      className="w-full h-8 py-1 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      placeholder="Enter custom remarks..."
                    />
                  </div>
                </div>`;

const newButtonsRow = `{/* Conduct, Attitude & Remarks small action buttons */}
                <div className="flex flex-wrap items-center gap-2 p-2 sm:p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-0.5 shrink-0">Conduct & Remarks:</span>
                  <DropdownButton 
                    label="Attitude" 
                    options={ATTITUDES} 
                    value={editRecord.attitude} 
                    onChange={(val) => setEditRecord({...editRecord, attitude: val})} 
                    disabled={!isOtherFieldsEditable()} 
                  />
                  <DropdownButton 
                    label="Conduct" 
                    options={CONDUCTS} 
                    value={editRecord.conduct} 
                    onChange={(val) => setEditRecord({...editRecord, conduct: val})} 
                    disabled={!isOtherFieldsEditable()} 
                  />
                  <DropdownButton 
                    label="Interest" 
                    options={INTERESTS} 
                    value={editRecord.interest} 
                    onChange={(val) => setEditRecord({...editRecord, interest: val})} 
                    disabled={!isOtherFieldsEditable()} 
                  />
                  <RemarksButton 
                    value={editRecord.teacherRemarks} 
                    onChange={(val) => setEditRecord({...editRecord, teacherRemarks: val})} 
                    disabled={!isOtherFieldsEditable()} 
                  />
                </div>`;

content = content.replaceAll(oldCardBlock, newButtonsRow);

fs.writeFileSync('src/components/AcademicCenter.tsx', content);
console.log('Successfully fixed remaining CustomDropdown card usages.');
