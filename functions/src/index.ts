import * as admin from 'firebase-admin';

// Initialize the Firebase Admin App
admin.initializeApp();

export * from './onAssessmentSubmit';
export * from './onClientInvite';
export * from './generateReport';
