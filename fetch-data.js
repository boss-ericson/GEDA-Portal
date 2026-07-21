async function run() {
  const sRes = await fetch('http://localhost:3000/api/v1/schools');
  const schools = await sRes.json();
  if (!schools || schools.length === 0) { console.log('No schools found'); return; }
  const schoolId = schools[0].id;
  const aRes = await fetch('http://localhost:3000/api/v1/attendance?schoolId=' + schoolId);
  const data = await aRes.json();
  console.log('School:', schoolId, 'Records:', JSON.stringify(data.slice(0,2), null, 2));
}
run();
