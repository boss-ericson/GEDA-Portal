const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove demo auth interceptor
const demoAuth = `      if (email === "admin@gedaschool.edu.gh") {
        return res.json({
          success: true,
          user: { email, fullName: "Admin User", role },
          school: {
            id: 'demo-school',
            name: 'GEDA Demo School Complex',
            slug: 'geda-demo-school',
            region: 'Greater Accra',
            district: 'Accra Metropolitan',
            email: 'admin@gedaschool.edu.gh',
            status: 'Active',
            accessLevel: 'Full',
            createdAt: new Date().toISOString()
          }
        });
      }`;
code = code.replace(demoAuth, "");

// Remove demoStudents array declaration
code = code.replace("  const demoStudents: any[] = [];\n", "");

// Remove demo-school checks in routes
code = code.replace(/      if \(req\.params\.id === "demo-school"\) \{[\s\S]*?\}\n/g, "");
code = code.replace(/      if \(req\.query\.schoolId === "demo-school"\) return res\.json\(\[\]\);\n/g, "");
code = code.replace(/      if \(schoolId === "demo-school"\) \{\n[\s\S]*?res\.json\(\[\]\);\n      \}\n/g, "");
code = code.replace(/      if \(schoolId === "demo-school"\) \{\n[\s\S]*?\}\n/g, "");
code = code.replace(/      if \(req\.query\.schoolId === "demo-school"\) \{\n[\s\S]*?\}\n/g, "");

// Replace student post
const demoStudentPost = `      if (student.schoolId === "demo-school") {
        student.id = "demo-stu-" + Date.now();
        demoStudents.push(student);
        return res.status(201).json(student);
      }`;
code = code.replace(demoStudentPost, "");

const demoStudentBulk = `      if (students.length > 0 && students[0].schoolId === "demo-school") {
        const results = [];
        for (const s of students) {
          s.createdAt = new Date().toISOString();
          s.id = "demo-stu-" + Date.now() + Math.random();
          demoStudents.push(s);
          results.push(s);
        }
        return res.status(201).json(results);
      }`;
code = code.replace(demoStudentBulk, "");

const demoStudentUpdate = `      if (req.body.schoolId === "demo-school") {
        const index = demoStudents.findIndex(s => s.id === req.params.id);
        if (index !== -1) demoStudents[index] = { ...demoStudents[index], ...req.body };
        return res.json({ message: "Student updated" });
      }`;
code = code.replace(demoStudentUpdate, "");

const demoStudentDelete = `      // For demo, we don't have schoolId in query easily, but we can just filter it out
      const index = demoStudents.findIndex(s => s.id === req.params.id);
      if (index !== -1) {
        demoStudents.splice(index, 1);
        return res.json({ message: "Student deleted" });
      }`;
code = code.replace(demoStudentDelete, "");

const demoPaymentPost = `      if (payment.schoolId === "demo-school") {
        payment.id = "demo-pay-" + Date.now();
        return res.status(201).json(payment);
      }`;
code = code.replace(demoPaymentPost, "");

const demoRecordPost = `      if (record.schoolId === "demo-school") {
        record.id = "demo-rec-" + Date.now();
        return res.status(201).json(record);
      }`;
code = code.replace(demoRecordPost, "");


fs.writeFileSync('server.ts', code);
