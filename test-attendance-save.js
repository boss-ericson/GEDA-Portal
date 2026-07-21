async function run() {
  const res = await fetch('http://localhost:3000/api/v1/attendance/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schoolId: 'test-school',
      records: [
        {
          schoolId: 'test-school',
          studentId: 'student-1',
          date: '2026-07-20',
          status: 'Present',
          academicYear: '2026/2027',
          academicTerm: 'First'
        }
      ]
    })
  });
  console.log(await res.text());
  const fetchRes = await fetch('http://localhost:3000/api/v1/attendance?schoolId=test-school&date=2026-07-20');
  console.log('GET 2026-07-20:', await fetchRes.json());
  const fetchRes2 = await fetch('http://localhost:3000/api/v1/attendance?schoolId=test-school&date=2026-07-21');
  console.log('GET 2026-07-21:', await fetchRes2.json());
}
run();
