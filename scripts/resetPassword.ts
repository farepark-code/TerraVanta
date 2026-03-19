import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});
admin.auth().getUserByEmail('farepark@gmail.com')
  .then(user => admin.auth().updateUser(user.uid, { password: 'SuperAdmin123!' }))
  .then(() => { console.log('✅ Password forced to SuperAdmin123!'); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
