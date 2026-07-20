const fs = require('fs');
let code = fs.readFileSync('src/components/SuperAdminDashboard.tsx', 'utf8');

if (!code.includes("import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';")) {
  code = code.replace(
    "import { School } from '../types';",
    "import { School } from '../types';\nimport { collection, getDocs, updateDoc, doc } from 'firebase/firestore';\nimport { db } from '../lib/firebase';"
  );
}

const fetchCode = `  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/superadmin/schools');
      if (res.ok) {
        const data = await res.json();
        setSchools(data);
      } else {
        throw new Error('Failed to fetch schools');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };`;

const newFetchCode = `  const fetchSchools = async () => {
    setLoading(true);
    try {
      try {
        const res = await fetch('/api/v1/superadmin/schools');
        if (res.ok) {
          const data = await res.json();
          setSchools(data);
          setLoading(false);
          return;
        }
      } catch (apiErr) {
        console.warn('Backend API failed, falling back to Firebase directly');
      }
      
      const schoolsSnapshot = await getDocs(collection(db, "schools"));
      const schoolsData = schoolsSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as any));
      
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentsData = studentsSnapshot.docs.map(d => d.data());
      
      const combined = schoolsData.map(school => {
        const schoolStudents = studentsData.filter(s => s.schoolId === school.id);
        return {
          ...school,
          studentCount: schoolStudents.length
        };
      });
      
      setSchools(combined);
    } catch (err: any) {
      setError(err.message || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(fetchCode, newFetchCode);

const statusCode = `  const handleToggleStatus = async (schoolId: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'Deactivated' ? 'Active' : 'Deactivated';
    try {
      const res = await fetch(\`/api/v1/superadmin/schools/\${schoolId}/status\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, status: newStatus } : s));
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Network error while updating status');
    }
  };`;

const newStatusCode = `  const handleToggleStatus = async (schoolId: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'Deactivated' ? 'Active' : 'Deactivated';
    try {
      try {
        const res = await fetch(\`/api/v1/superadmin/schools/\${schoolId}/status\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
          setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, status: newStatus } : s));
          return;
        }
      } catch (apiErr) {}
      
      await updateDoc(doc(db, "schools", schoolId), { status: newStatus });
      setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, status: newStatus } : s));
    } catch (err) {
      console.error('Network error while updating status');
    }
  };`;

code = code.replace(statusCode, newStatusCode);


const accessCode = `  const handleToggleAccess = async (schoolId: string, currentAccess?: string) => {
    const newAccess = currentAccess === 'Restricted' ? 'Full' : 'Restricted';
    try {
      const res = await fetch(\`/api/v1/superadmin/schools/\${schoolId}/access\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessLevel: newAccess })
      });
      if (res.ok) {
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, accessLevel: newAccess } : s));
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to update access level');
      }
    } catch (err) {
      console.error('Network error while updating access level');
    }
  };`;

const newAccessCode = `  const handleToggleAccess = async (schoolId: string, currentAccess?: string) => {
    const newAccess = currentAccess === 'Restricted' ? 'Full' : 'Restricted';
    try {
      try {
        const res = await fetch(\`/api/v1/superadmin/schools/\${schoolId}/access\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessLevel: newAccess })
        });
        if (res.ok) {
          setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, accessLevel: newAccess } : s));
          return;
        }
      } catch (apiErr) {}
      
      await updateDoc(doc(db, "schools", schoolId), { accessLevel: newAccess });
      setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, accessLevel: newAccess } : s));
    } catch (err) {
      console.error('Network error while updating access level');
    }
  };`;

code = code.replace(accessCode, newAccessCode);

const verifyCode = `  const handleVerifyPayment = async (schoolId: string, currentStudents: number) => {
    try {
      const res = await fetch(\`/api/v1/superadmin/schools/\${schoolId}/verify-payment\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidStudentCount: currentStudents })
      });
      if (res.ok) {
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, accessLevel: 'Full', paidStudentCount: currentStudents, billingNotice: '' } : s));
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to verify payment');
      }
    } catch (err) {
      console.error('Network error while verifying payment');
    }
  };`;

const newVerifyCode = `  const handleVerifyPayment = async (schoolId: string, currentStudents: number) => {
    try {
      try {
        const res = await fetch(\`/api/v1/superadmin/schools/\${schoolId}/verify-payment\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paidStudentCount: currentStudents })
        });
        if (res.ok) {
          setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, accessLevel: 'Full', paidStudentCount: currentStudents, billingNotice: '' } : s));
          return;
        }
      } catch (apiErr) {}
      
      await updateDoc(doc(db, "schools", schoolId), { accessLevel: 'Full', paidStudentCount: currentStudents, billingNotice: '' });
      setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, accessLevel: 'Full', paidStudentCount: currentStudents, billingNotice: '' } : s));
    } catch (err) {
      console.error('Network error while verifying payment');
    }
  };`;

code = code.replace(verifyCode, newVerifyCode);


const noticeCode = `  const handleSendNotice = async (schoolId: string, unpaidStudents: number) => {
    if (unpaidStudents <= 0) return;
    const message = \`Notice: You have \${unpaidStudents} new student(s) unpaid for. Please make payment to avoid access restriction.\`;
    try {
      const res = await fetch(\`/api/v1/superadmin/schools/\${schoolId}/billing-notice\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingNotice: message })
      });
      if (res.ok) {
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, billingNotice: message } : s));
        alert('Notice sent successfully to the school dashboard.');
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to send notice');
      }
    } catch (err) {
      console.error('Network error while sending notice');
    }
  };`;

const newNoticeCode = `  const handleSendNotice = async (schoolId: string, unpaidStudents: number) => {
    if (unpaidStudents <= 0) return;
    const message = \`Notice: You have \${unpaidStudents} new student(s) unpaid for. Please make payment to avoid access restriction.\`;
    try {
      try {
        const res = await fetch(\`/api/v1/superadmin/schools/\${schoolId}/billing-notice\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billingNotice: message })
        });
        if (res.ok) {
          setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, billingNotice: message } : s));
          alert('Notice sent successfully to the school dashboard.');
          return;
        }
      } catch (apiErr) {}
      
      await updateDoc(doc(db, "schools", schoolId), { billingNotice: message });
      setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, billingNotice: message } : s));
      alert('Notice sent successfully to the school dashboard.');
    } catch (err) {
      console.error('Network error while sending notice');
    }
  };`;

code = code.replace(noticeCode, newNoticeCode);


fs.writeFileSync('src/components/SuperAdminDashboard.tsx', code);
