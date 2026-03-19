import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

const db = admin.firestore();

// Using streamTransport for stubbing email sending without a real SMTP server
const transporter = nodemailer.createTransport({
  streamTransport: true,
  newline: 'unix',
});

export const onClientInvite = functions.firestore
  .document('clients/{clientId}')
  .onCreate(async (snap, context) => {
    const clientId = context.params.clientId;
    const clientData = snap.data();
    
    // 1. Get consultant profile
    const consultantSnap = await db.collection('consultants').doc(clientData.consultantId).get();
    const consultantName = consultantSnap.data()?.companyName || 'Konsultan Anda';

    // 2. Create Firebase Auth user
    const picEmail = clientData.picEmail;
    
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(picEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email: picEmail,
          displayName: clientData.picName,
          password: Math.random().toString(36).slice(-8) + 'A1!'
        });
      } else {
        throw error;
      }
    }

    // 3. Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'client_user',
      clientId: clientId
    });

    // 4. Generate email sign-in link
    const actionCodeSettings = {
      url: `http://localhost:3000/client/portal`, 
      handleCodeInApp: true,
    };
    
    let link = "";
    try {
      link = await admin.auth().generateSignInWithEmailLink(picEmail, actionCodeSettings);
    } catch(e) {
      console.error("Magic link generation error, using fallback simulated link.", e);
      link = `http://localhost:3000/client/portal`;
    }

    // 5. Send email via NodeMailer
    const mailOptions = {
      from: '"ESG Platform" <noreply@esgplatform.test>',
      to: picEmail,
      subject: `Undangan Pengisian Kuesioner ESG — ${consultantName}`,
      text: `
Salam kepada ${clientData.picName},

${consultantName} mengundang Anda untuk mengisi penilaian ESG di Platform kami.
Klik tautan berikut untuk login tanpa password (magic link):

${link}

Link ini berlaku selama 7 hari.

Terima kasih,
Tim ESG Platform
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Simulated Email Sent Payload:\n", info.message.toString());

    // 6. Write AuditLog
    await db.collection('auditLogs').add({
      uid: 'system',
      userRole: 'system',
      action: 'CLIENT_INVITED',
      resourceType: 'client',
      resourceId: clientId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isAdminAction: true
    });

    return null;
  });
