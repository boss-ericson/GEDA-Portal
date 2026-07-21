async function run() {
  const fetchRes = await fetch('http://localhost:3000/api/v1/attendance?schoolId=t');
  console.log('GET All:', await fetchRes.json());
}
run();
