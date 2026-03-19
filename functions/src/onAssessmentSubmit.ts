import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { calculatePillarScore, getRatingBand } from './scoringEngine';
import { calculateFlags } from './flagEngine';
import { Assessment, AssessmentResponse, ClientProfile, QuestionnaireTemplate, ESGPillar } from './types';

const db = admin.firestore();

export const onAssessmentSubmit = functions.firestore
  .document('assessments/{assessmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Assessment;
    const after = change.after.data() as Assessment;

    // Condition: status changed to 'submitted'
    if (before.status === 'submitted' || after.status !== 'submitted') {
      return null;
    }

    const { assessmentId } = context.params;

    // 2. Load all responses
    const responsesSnap = await db.collection(`assessments/${assessmentId}/responses`).get();
    const responses: Record<string, AssessmentResponse> = {};
    responsesSnap.forEach(doc => {
      const data = doc.data() as AssessmentResponse;
      responses[data.questionId] = data;
    });

    // 3. Load questionnaire templates by tier
    const templatesSnap = await db.collection('questionnaireTemplates')
      .where('tier', '<=', after.tier)
      .get();
    const templates: QuestionnaireTemplate[] = [];
    templatesSnap.forEach(doc => {
      templates.push(doc.data() as QuestionnaireTemplate);
    });

    // 4. Load client profile
    const clientSnap = await db.collection('clients').doc(after.clientId).get();
    const clientProfile = clientSnap.data() as ClientProfile;

    // 5. Calculate pillar scores
    const pillars: ESGPillar[] = ['environment', 'social', 'governance', 'economic'];
    const pillarScores: Record<string, number> = {};
    
    for (const pillar of pillars) {
      const pillarQuestions = templates.filter(t => t.pillar === pillar);
      const result = calculatePillarScore(pillarQuestions, responses);
      pillarScores[pillar] = result.score;
    }

    // 6. Calculate final score (average over 4 pillars)
    const values = Object.values(pillarScores);
    const sum = values.reduce((a, b) => a + b, 0);
    const finalScore = values.length > 0 ? Math.round((sum / values.length) * 100) / 100 : 0;

    // 7. Get rating band
    const ratingBand = getRatingBand(finalScore);

    // 8. Calculate compliance flags
    const flags = calculateFlags(responses, templates, pillarScores, clientProfile, finalScore);

    // 9. Update /assessments/{id}
    await change.after.ref.update({
      status: 'scored',
      finalScore,
      ratingBand,
      pillarScores,
      complianceFlags: flags,
      scoredAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 10. Denormalize -> /clients/{clientId}
    await db.collection('clients').doc(after.clientId).update({
      latestScore: finalScore,
      latestRating: ratingBand,
      latestPillarScores: pillarScores,
      complianceFlags: flags,
      status: 'completed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 11. Update /platformStats (upsert)
    const statsRef = db.collection('platformStats').doc('global');
    await db.runTransaction(async (t) => {
      const statsDoc = await t.get(statsRef);
      if (!statsDoc.exists) {
        t.set(statsRef, {
          totalAssessments: 1,
          averageESGScore: finalScore
        });
      } else {
        const data = statsDoc.data()!;
        const total = (data.totalAssessments || 0) + 1;
        const currentAvg = data.averageESGScore || 0;
        // recalculate simple moving average:
        const newAvg = currentAvg + ((finalScore - currentAvg) / total);
        t.update(statsRef, {
          totalAssessments: admin.firestore.FieldValue.increment(1),
          averageESGScore: Math.round(newAvg * 100) / 100
        });
      }
    });

    // 12. Write AuditLog
    await db.collection('auditLogs').add({
      uid: 'system',
      userRole: 'system',
      action: 'ASSESSMENT_SCORED',
      resourceType: 'assessment',
      resourceId: assessmentId,
      before: { status: 'submitted' },
      after: { finalScore, ratingBand, pillarScores, flags },
      isAdminAction: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return null;
  });
