const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
admin.initializeApp({
  projectId: "ai-studio-ghanaschooladmis-e2b13834-2ce2-4a6d-8b46-b280a8b35cad"
});
const db = getFirestore();
async function run() {
  const sSnap = await db.collection("students").get();
  console.log("Students count:", sSnap.size);
  sSnap.docs.forEach(d => console.log(d.id, d.data().schoolId));
}
run();
