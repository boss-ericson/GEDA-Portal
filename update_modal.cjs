const fs = require('fs');

let content = fs.readFileSync('src/components/StudentHistoryModal.tsx', 'utf8');

// Add import
content = content.replace("import { X, Printer, Calendar, BookOpen, Award } from 'lucide-react';", "import { X, Printer, Calendar, BookOpen, Award, Download } from 'lucide-react';\nimport html2pdf from 'html2pdf.js';");

// modify printReport signature
content = content.replace("const printReport = async (record: AcademicRecord) => {", "const handleReportAction = async (record: AcademicRecord, action: 'print' | 'pdf') => {");

// modify the execution logic
const printLogicOld = `
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(\`
          <html>
            <head>
              <title>Report Card - \${student.fullName}</title>
              <style>
                @media print {
                  body { -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              \${html}
              <script>
                window.onload = () => { window.print(); window.close(); }
              </script>
            </body>
          </html>
        \`);
        win.document.close();
      }
`;

const printLogicNew = `
      if (action === 'pdf') {
        const element = document.createElement('div');
        element.innerHTML = html;
        const opt = {
          margin:       0.5,
          filename:     \`Report_Card_\${student.fullName.replace(/\\s+/g, '_')}.pdf\`,
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
                <title>Report Card - \${student.fullName}</title>
                <style>
                  @media print {
                    body { -webkit-print-color-adjust: exact; }
                  }
                </style>
              </head>
              <body>
                \${html}
                <script>
                  window.onload = () => { window.print(); window.close(); }
                </script>
              </body>
            </html>
          \`);
          win.document.close();
        }
      }
`;

content = content.replace(printLogicOld, printLogicNew);

// modify the buttons
const oldButton = `<button 
                    onClick={() => printReport(record)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Report Card
                  </button>`;

const newButtons = `<div className="flex gap-2">
                    <button 
                      onClick={() => handleReportAction(record, 'print')}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </button>
                    <button 
                      onClick={() => handleReportAction(record, 'pdf')}
                      className="flex-1 bg-brand-green-700 hover:bg-brand-green-800 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Save PDF
                    </button>
                  </div>`;

content = content.replace(oldButton, newButtons);

fs.writeFileSync('src/components/StudentHistoryModal.tsx', content);
