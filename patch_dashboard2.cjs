const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (!code.includes("import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';")) {
  code = code.replace(
    "import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';",
    "import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';"
  );
}

const updateFallback = `    } catch (err) {
      alert('Network error while updating student.');
    }`;

const newUpdateFallback = `    } catch (err) {
      try {
        await updateDoc(doc(db, "students", editingStudent.id), editingStudent as any);
        setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
        setEditingStudent(null);
      } catch (fbErr) {
        alert('Network and database error while updating student.');
      }
    }`;
code = code.replace(updateFallback, newUpdateFallback);

const deleteFallback = `    } catch (err) {
      alert('Network error while deleting student.');
    }`;
    
const newDeleteFallback = `    } catch (err) {
      try {
        await deleteDoc(doc(db, "students", id));
        setStudents(prev => prev.filter(s => s.id !== id));
        
        const schoolRef = doc(db, "schools", school.id);
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists()) {
          const currentCount = schoolSnap.data().studentCount || 0;
          await updateDoc(schoolRef, { studentCount: Math.max(0, currentCount - 1) });
        }
      } catch (fbErr) {
        alert('Network and database error while deleting student.');
      }
    }`;
code = code.replace(deleteFallback, newDeleteFallback);

const promoteFallback = `                } catch (err) {
                  alert('Network error during promotion.');
                }`;

const newPromoteFallback = `                } catch (err) {
                  try {
                    for (const id of studentIds) {
                      await updateDoc(doc(db, "students", id), { classLevel: targetClass });
                    }
                    alert('Students promoted successfully directly in database!');
                    fetchData();
                  } catch (fbErr) {
                    alert('Network error during promotion.');
                  }
                }`;
code = code.replace(promoteFallback, newPromoteFallback);

fs.writeFileSync('src/components/Dashboard.tsx', code);
