import fs from 'fs';

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Update counts logic
content = content.replace(
  "const jhsStudentsCount = students.filter(s => s.department === 'JHS').length;",
  "const jhsStudentsCount = students.filter(s => s.classLevel && (s.classLevel.toUpperCase().includes('JHS') || s.classLevel.toUpperCase().includes('BASIC 7') || s.classLevel.toUpperCase().includes('BASIC 8') || s.classLevel.toUpperCase().includes('BASIC 9'))).length;\n  const maleStudentsCount = students.filter(s => s.gender === 'Male').length;\n  const femaleStudentsCount = students.filter(s => s.gender === 'Female').length;\n  const malePercentage = totalStudents > 0 ? (maleStudentsCount / totalStudents) * 100 : 0;\n  const femalePercentage = totalStudents > 0 ? (femaleStudentsCount / totalStudents) * 100 : 0;"
);

content = content.replace(
  "const primaryStudentsCount = students.filter(s => s.department === 'Primary').length;",
  "const primaryStudentsCount = totalStudents - jhsStudentsCount;"
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
