// replicon-local-runner/firestore-test.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  try {
    const snapshot = await db.collection('inventory').limit(5).get();
    console.log(`✅ Found ${snapshot.size} item(s) in inventory:`);

    snapshot.forEach(doc => {
      console.log(`🧾 ${doc.id}:`, doc.data());
    });
  } catch (error) {
    console.error('❌ Firestore access failed:', error.message);
  }
})();
