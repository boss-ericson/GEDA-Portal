const fs = require('fs');
let content = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

// add html2pdf import
content = content.replace("import { Award, PlusCircle, Printer, Search, RefreshCw, ChevronDown, ChevronRight, FileText } from 'lucide-react';", "import { Award, PlusCircle, Printer, Search, RefreshCw, ChevronDown, ChevronRight, FileText, Download } from 'lucide-react';\nimport html2pdf from 'html2pdf.js';");

// update printBroadSheet and add download pdf logic
content = content.replace("const printBroadSheet = () => {", "const handleBroadSheetAction = (action: 'print' | 'pdf') => {");

const broadsheetOldPrint = `
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };
`;
const broadsheetNewPrint = `
    if (action === 'pdf') {
      const element = document.createElement('div');
      element.innerHTML = html;
      const opt = {
        margin:       0.5,
        filename:     \`Broadsheet_\${activeClass.replace(/\\s+/g, '_')}_\${term}_\${year.replace('/', '-')}.pdf\`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
      };
      html2pdf().set(opt).from(element).save();
    } else {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    }
  };
`;
content = content.replace(broadsheetOldPrint, broadsheetNewPrint);

// update printBulkReports and add download pdf logic
content = content.replace("const printBulkReports = () => {", "const handleBulkReportsAction = (action: 'print' | 'pdf') => {");

const bulkOldPrint = `
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(\`
        <html>
          <head>
            <title>Bulk Reports - \${activeClass}</title>
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            \${combinedHTML}
            <script>
              window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 1000); }
            </script>
          </body>
        </html>
      \`);
      win.document.close();
    }
  };
`;
const bulkNewPrint = `
    if (action === 'pdf') {
      const element = document.createElement('div');
      element.innerHTML = \`
        <div style="font-family: sans-serif; font-size: 12px; color: #000; background: #fff;">
          \${combinedHTML}
        </div>
      \`;
      const opt = {
        margin:       0.5,
        filename:     \`Bulk_Reports_\${activeClass.replace(/\\s+/g, '_')}_\${term}_\${year.replace('/', '-')}.pdf\`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } else {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(\`
          <html>
            <head>
              <title>Bulk Reports - \${activeClass}</title>
              <style>
                @media print {
                  body { -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              \${combinedHTML}
              <script>
                window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 1000); }
              </script>
            </body>
          </html>
        \`);
        win.document.close();
      }
    }
  };
`;
content = content.replace(bulkOldPrint, bulkNewPrint);


// update the buttons
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
                <FileText className="h-3 w-3" />
                <span>Print All Reports</span>
              </button>`;

const btnNew = `<button
                onClick={() => handleBroadSheetAction('print')}
                disabled={classStudents.length === 0}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Printer className="h-3 w-3" />
                <span>Broad Sheet</span>
              </button>
              <button
                onClick={() => handleBroadSheetAction('pdf')}
                disabled={classStudents.length === 0}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleBulkReportsAction('print')}
                disabled={classStudents.length === 0}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                <span>Print All Reports</span>
              </button>
              <button
                onClick={() => handleBulkReportsAction('pdf')}
                disabled={classStudents.length === 0}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
              </button>`;

content = content.replace(btnOld, btnNew);

fs.writeFileSync('src/components/AcademicCenter.tsx', content);
