const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const offlineFallbackAddStudent = `      } catch (err) {
        setErrorMsg('Network error. Switched registration to offline cache.');
        setOfflineQueue(prev => [...prev, newStudentTemp]);
        resetRegisterForm();
      }`;

const newFallbackAddStudent = `      } catch (err) {
        try {
          // Firebase fallback
          const docRef = await addDoc(collection(db, "students"), newStudentTemp);
          const schoolRef = doc(db, "schools", school.id);
          const schoolSnap = await getDoc(schoolRef);
          if (schoolSnap.exists()) {
            const currentCount = schoolSnap.data().studentCount || 0;
            await updateDoc(schoolRef, { studentCount: currentCount + 1 });
          }
          const savedStudent = { ...newStudentTemp, id: docRef.id, syncStatus: 'synced' };
          setStudents(prev => [...prev, savedStudent as any]);
          setSuccessMsg(\`SUCCESS: student \${savedStudent.fullName} registered directly to database. Admission No: \${savedStudent.admissionNo}. Fee: GH₵ \${(price || 0).toLocaleString()}\`);
          resetRegisterForm();
        } catch (fbErr) {
          setErrorMsg('Network and database error. Switched registration to offline cache.');
          setOfflineQueue(prev => [...prev, newStudentTemp]);
          resetRegisterForm();
        }
      }`;

code = code.replace(offlineFallbackAddStudent, newFallbackAddStudent);
fs.writeFileSync('src/components/Dashboard.tsx', code);
