const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const parseBlock = `    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet) as any[];

        if (parsedData.length === 0) {`;

const newParseBlock = `    reader.onload = async (event) => {
      let parsedData: any[] = [];
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        parsedData = XLSX.utils.sheet_to_json(sheet) as any[];

        if (parsedData.length === 0) {`;

code = code.replace(parseBlock, newParseBlock);
fs.writeFileSync('src/components/Dashboard.tsx', code);
