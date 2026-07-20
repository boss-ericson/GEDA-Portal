const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const offlineSyncFallback = `    } catch (err) {
      setErrorMsg('Failed to establish hand-shake with GES Cloud servers. Try again later.');
    }`;

const newOfflineSyncFallback = `    } catch (err) {
      console.warn("Falling back to Firebase for offline sync");
      try {
        let syncedCount = 0;
        for (const stu of offlineQueue) {
          const docRef = await addDoc(collection(db, "students"), { ...stu, syncStatus: 'synced' });
          syncedCount++;
        }
        
        const schoolRef = doc(db, "schools", school.id);
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists()) {
          const currentCount = schoolSnap.data().studentCount || 0;
          await updateDoc(schoolRef, { studentCount: currentCount + syncedCount });
        }
        
        setOfflineQueue([]);
        setSuccessMsg(\`Synchronization complete! \${syncedCount} offline registration records pushed to cloud database.\`);
        setTimeout(() => setSuccessMsg(''), 5000);
        fetchData();
      } catch (fbErr) {
        setErrorMsg('Failed to establish hand-shake with GES Cloud servers and Firebase fallback failed.');
      }
    }`;

code = code.replace(offlineSyncFallback, newOfflineSyncFallback);
fs.writeFileSync('src/components/Dashboard.tsx', code);
