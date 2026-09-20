import admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'ai-studio-1b81e3cf-4528-4366-99fc-fa6a94e45f5b'
});

const db = admin.firestore();
async function run() {
  try {
    const snapshot = await db.collection('roadmap').get();
    snapshot.forEach(doc => {
      console.log(doc.id, doc.data());
    });
  } catch(e) {
    console.error(e);
  }
}
run();
