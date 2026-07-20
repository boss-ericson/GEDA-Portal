const fs = require('fs');

let content = fs.readFileSync('src/components/StudentTranscripts.tsx', 'utf8');

// Add import
content = content.replace("import { Printer, Search, FileText } from 'lucide-react';", "import { Printer, Search, FileText, Download } from 'lucide-react';\nimport html2pdf from 'html2pdf.js';");

// modify printTranscript signature
content = content.replace("const printTranscript = () => {", "const handleTranscriptAction = (action: 'print' | 'pdf') => {");

// modify the execution logic
const printLogicOld = `
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(\`
        <html>
          <head>
            <title>Transcript - \${selectedStudent.fullName}</title>
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
        filename:     \`Transcript_\${selectedStudent.fullName.replace(/\\s+/g, '_')}.pdf\`,
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
              <title>Transcript - \${selectedStudent.fullName}</title>
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
                  onClick={printTranscript}
                  disabled={loading || records.length === 0}
                  className="flex items-center gap-2 bg-brand-green-700 hover:bg-brand-green-800 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <Printer className="h-4 w-4" />
                  Print Transcript
                </button>`;

const newButtons = `<div className="flex items-center gap-2">
                <button
                  onClick={() => handleTranscriptAction('print')}
                  disabled={loading || records.length === 0}
                  className="flex items-center gap-2 bg-brand-green-700 hover:bg-brand-green-800 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  onClick={() => handleTranscriptAction('pdf')}
                  disabled={loading || records.length === 0}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Save PDF
                </button>
                </div>`;

content = content.replace(oldButton, newButtons);

fs.writeFileSync('src/components/StudentTranscripts.tsx', content);
