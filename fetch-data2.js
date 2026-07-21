async function run() {
  const schoolId = "PYZgudFZNSk4zvAHfnQc";
  const aRes = await fetch('http://localhost:3000/api/v1/attendance?schoolId=' + schoolId + '&date=2026-07-21');
  const data = await aRes.json();
  console.log('2026-07-21 Records:', data.length);
}
run();
