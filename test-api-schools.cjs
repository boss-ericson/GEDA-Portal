async function run() {
  const res = await fetch('http://localhost:3000/api/v1/superadmin/schools');
  const d = await res.json();
  console.log(d.length, d.map(s => s.name));
}
run();
