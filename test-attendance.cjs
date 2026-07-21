const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const app = initializeApp({ credential: cert(require('./firebase-applet-config.json')) });
const db = getFirestore(app);

async function run() {
  const qs = await db.collection('attendance').limit(10).get();
  qs.forEach(d => console.log(d.id, d.data()));
  process.exit(0);
}
run();
