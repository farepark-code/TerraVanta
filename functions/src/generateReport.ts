import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { buildReportData } from './reportBuilder';
import { pdfGenerator } from './generators/pdfGenerator';
import { docxGenerator } from './generators/docxGenerator';

const db = admin.firestore();
const storage = admin.storage();

export const generateReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { clientId, assessmentId, format } = data;
  if (!clientId || !assessmentId || !['pdf', 'docx'].includes(format)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid clientId, assessmentId, and format (pdf/docx) required.');
  }

  // 1 & 2: Prechecks
  const assessmentSnap = await db.collection('assessments').doc(assessmentId).get();
  if (!assessmentSnap.exists) throw new functions.https.HttpsError('not-found', 'Assessment missing.');
  const assessment = assessmentSnap.data()!;

  if (assessment.status !== 'scored') {
    throw new functions.https.HttpsError('failed-precondition', 'Assessment belum selesai dinilai');
  }

  const consultantId = assessment.consultantId;

  // Validate caller = consultant or super_admin
  const uid = context.auth.uid;
  const userToken = context.auth.token;
  if (userToken.role !== 'super_admin' && uid !== consultantId) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized to generate report for this client.');
  }

  // 1. Build report data
  const reportData = await buildReportData(clientId, assessmentId, consultantId);

  // 2. Generate Buffer
  let buffer: Buffer;
  let mimeType = '';
  let extension = '';

  if (format === 'pdf') {
    buffer = await pdfGenerator(reportData);
    mimeType = 'application/pdf';
    extension = 'pdf';
  } else {
    buffer = await docxGenerator(reportData);
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    extension = 'docx';
  }

  // 3. Upload ke Firebase Storage
  const timestamp = new Date().getTime();
  const safeName = reportData.client.companyName.replace(/[^a-zA-Z0-9]/g, '_');
  const filePath = `reports/${consultantId}/${clientId}/${timestamp}/ESG_Report_${safeName}.${extension}`;
  
  const bucket = storage.bucket();
  const file = bucket.file(filePath);
  
  await file.save(buffer, {
    metadata: { contentType: mimeType },
  });

  // 4. Generate signed URL (7 days)
  const [downloadUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });

  // 5. Save report record
  const reportRef = db.collection('reports').doc();
  await reportRef.set({
    clientId,
    consultantId,
    assessmentId,
    format,
    downloadUrl,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    companyName: reportData.client.companyName,
    finalScore: assessment.finalScore,
    ratingBand: assessment.ratingBand,
  });

  // 6. Increment consultant credits
  await db.collection('consultants').doc(consultantId).update({
    reportCredits: admin.firestore.FieldValue.increment(-1),
  });

  // 7. Update platform stats
  await db.collection('platformStats').doc('global').set({
    totalReportsGenerated: admin.firestore.FieldValue.increment(1)
  }, { merge: true });

  // 8. Write audit log
  await db.collection('auditLogs').add({
    uid,
    action: 'REPORT_GENERATED',
    resourceType: 'report',
    resourceId: reportRef.id,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  // 9. Return
  return { 
    downloadUrl, 
    reportId: reportRef.id 
  };
});
