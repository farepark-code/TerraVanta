import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }
      : undefined;

    if (serviceAccountStr) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountStr)
      });
    } else {
      admin.initializeApp();
    }
  } catch (error) {
    console.warn("⚠️ Warning: Firebase Admin failed to initialize properly:", error);
  }
}

const db = admin.firestore();

async function setSuperAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error("❌ ERROR: ADMIN_EMAIL tidak ditemukan di .env.local");
    process.exit(1);
  }

  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(adminEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`User ${adminEmail} belum ada di Firebase Auth. Membuat user baru...`);
        userRecord = await admin.auth().createUser({
          email: adminEmail,
          password: 'SuperAdmin123!', // You should change this after login
          displayName: 'Super Admin',
        });
        console.log(`✅ User auth dibuat dengan nama Super Admin.`);
      } else {
        throw error;
      }
    }

    const { uid } = userRecord;

    // Set Custom Claims
    await admin.auth().setCustomUserClaims(uid, {
      role: 'super_admin',
      isSuperAdmin: true
    });
    console.log(`✅ Custom claims set (super_admin).`);

    // Create Admin Document
    await db.collection('admins').doc(uid).set({
      email: adminEmail,
      displayName: 'Super Admin',
      invitedBy: null,
      invitedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    }, { merge: true });
    console.log(`✅ Document /admins/${uid} created/updated.`);

    // If exists in consultants, grant bypass
    const consultantSnap = await db.collection('consultants').doc(uid).get();
    if (consultantSnap.exists) {
      await db.collection('consultants').doc(uid).update({
        isSuperAdmin: true,
        billingBypass: true,
        reportCredits: 999999
      });
      console.log(`✅ Document /consultants/${uid} upgraded.`);
    }

    // Write AuditLog
    await db.collection('auditLogs').add({
      uid: 'system',
      userRole: 'super_admin',
      action: 'SUPER_ADMIN_GRANTED',
      resourceType: 'admin',
      resourceId: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isAdminAction: true
    });
    console.log(`✅ AuditLog written.`);

    console.log(`\n✅ Super admin granted: ${adminEmail} (UID: ${uid})`);
    console.log("Kamu dapat login menggunakan email ini untuk mengakses fitur Super Admin.");

  } catch (error) {
    console.error("❌ Gagal mengaktifkan Super Admin:", error);
  }
}

setSuperAdmin().then(() => process.exit(0)).catch(() => process.exit(1));
