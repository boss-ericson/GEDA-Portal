const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const bulkFallback = `        if (res.ok) {
          const newStudents = await res.json();
          setStudents((prev) => [...prev, ...newStudents]);
          setSuccessMsg(\`Successfully onboarded \${newStudents.length} students in bulk.\`);
        } else {
          const err = await res.json();
          setErrorMsg(err.error || 'Bulk upload failed.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Error parsing Excel file. Please use the provided template.');
      }`;
      
const newBulkFallback = `        if (res.ok) {
          const newStudents = await res.json();
          setStudents((prev) => [...prev, ...newStudents]);
          setSuccessMsg(\`Successfully onboarded \${newStudents.length} students in bulk.\`);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.warn("Falling back to bulk upload via Firebase");
        try {
          const newStudents = [];
          for (const rawData of parsedData) {
            const price = rawData['Fee Total'] ? Number(rawData['Fee Total']) : (rawData['Boarding Status'] === 'Boarding' ? 2500 : 1200);
            const stu = {
              schoolId: school.id,
              admissionNo: 'PENDING-SYNC',
              fullName: rawData['Full Name'] || 'Unknown',
              dob: rawData['Date of Birth'] || '2010-01-01',
              gender: rawData['Gender'] || 'Male',
              classLevel: rawData['Class'] || 'JHS 1',
              boardingStatus: rawData['Boarding Status'] || 'Day',
              guardianName: rawData['Guardian Name'] || 'Unknown',
              guardianPhone: rawData['Guardian Phone'] || 'Unknown',
              passportPicture: '',
              admissionStatus: 'Admitted',
              feePaid: 0,
              feeTotal: price,
              paymentStatus: 'Unpaid',
              syncStatus: 'synced',
              remarks: '',
              createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, "students"), stu);
            newStudents.push({ ...stu, id: docRef.id });
          }
          
          const schoolRef = doc(db, "schools", school.id);
          const schoolSnap = await getDoc(schoolRef);
          if (schoolSnap.exists()) {
            const currentCount = schoolSnap.data().studentCount || 0;
            await updateDoc(schoolRef, { studentCount: currentCount + newStudents.length });
          }
          
          setStudents(prev => [...prev, ...newStudents]);
          setSuccessMsg(\`Successfully onboarded \${newStudents.length} students directly to database.\`);
        } catch (fbErr) {
          console.error(fbErr);
          setErrorMsg('Error processing bulk upload.');
        }
      }`;

code = code.replace(bulkFallback, newBulkFallback);
fs.writeFileSync('src/components/Dashboard.tsx', code);
