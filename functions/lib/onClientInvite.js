"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onClientInvite = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const nodemailer = __importStar(require("nodemailer"));
const db = admin.firestore();
// Using streamTransport for stubbing email sending without a real SMTP server
const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
});
exports.onClientInvite = functions.firestore
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
    }
    catch (error) {
        if (error.code === 'auth/user-not-found') {
            userRecord = await admin.auth().createUser({
                email: picEmail,
                displayName: clientData.picName,
                password: Math.random().toString(36).slice(-8) + 'A1!'
            });
        }
        else {
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
    }
    catch (e) {
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
//# sourceMappingURL=onClientInvite.js.map