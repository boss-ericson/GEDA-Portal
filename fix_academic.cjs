const fs = require('fs');
let content = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

const btnOld = `<button
                onClick={printBroadSheet}
                disabled={classStudents.length === 0}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Printer className="h-3 w-3" />
                <span>Broad Sheet</span>
              </button>
              <button
                onClick={printBulkReports}
                disabled={classStudents.length === 0}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Printer className="h-3 w-3" />
                <span>Bulk Reports</span>
              </button>`;

const btnNew = `<button
                onClick={() => handleBroadSheetAction('print')}
                disabled={classStudents.length === 0}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Print Broadsheet"
              >
                <Printer className="h-3 w-3" />
                <span className="hidden sm:inline">Broad Sheet</span>
              </button>
              <button
                onClick={() => handleBroadSheetAction('pdf')}
                disabled={classStudents.length === 0}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Save Broadsheet as PDF"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">Save PDF</span>
              </button>
              <button
                onClick={() => handleBulkReportsAction('print')}
                disabled={classStudents.length === 0}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Print Bulk Reports"
              >
                <Printer className="h-3 w-3" />
                <span className="hidden sm:inline">Bulk Reports</span>
              </button>
              <button
                onClick={() => handleBulkReportsAction('pdf')}
                disabled={classStudents.length === 0}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Save Bulk Reports as PDF"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">Save PDF</span>
              </button>`;

if (content.includes("onClick={printBroadSheet}")) {
  content = content.replace(btnOld, btnNew);
  fs.writeFileSync('src/components/AcademicCenter.tsx', content);
  console.log("Success");
} else {
  console.log("Could not find the target code to replace.");
}

