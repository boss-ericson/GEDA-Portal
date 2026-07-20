const fs = require('fs');

const file1 = 'server.ts';
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace(
  'delete student.id;\n      const docRef = await addDoc(collection(getDb(), "students"), student);',
  `if (!student.admissionNo || student.admissionNo === "PENDING-SYNC") {
        student.admissionNo = \`ADM-\${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}\`;
      }
      delete student.id;
      const docRef = await addDoc(collection(getDb(), "students"), student);`
);
fs.writeFileSync(file1, code1);

const file2 = 'api/index.ts';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(
  'delete student.id;\n      const docRef = await addDoc(collection(getDb(), "students"), student);',
  `if (!student.admissionNo || student.admissionNo === "PENDING-SYNC") {
        student.admissionNo = \`ADM-\${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}\`;
      }
      delete student.id;
      const docRef = await addDoc(collection(getDb(), "students"), student);`
);
fs.writeFileSync(file2, code2);
