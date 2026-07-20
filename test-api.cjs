async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/superadmin/schools');
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
run();
