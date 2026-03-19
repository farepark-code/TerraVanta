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
exports.onAssessmentSubmit = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const scoringEngine_1 = require("./scoringEngine");
const flagEngine_1 = require("./flagEngine");
const db = admin.firestore();
exports.onAssessmentSubmit = functions.firestore
    .document('assessments/{assessmentId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Condition: status changed to 'submitted'
    if (before.status === 'submitted' || after.status !== 'submitted') {
        return null;
    }
    const { assessmentId } = context.params;
    // 2. Load all responses
    const responsesSnap = await db.collection(`assessments/${assessmentId}/responses`).get();
    const responses = {};
    responsesSnap.forEach(doc => {
        const data = doc.data();
        responses[data.questionId] = data;
    });
    // 3. Load questionnaire templates by tier
    const templatesSnap = await db.collection('questionnaireTemplates')
        .where('tier', '<=', after.tier)
        .get();
    const templates = [];
    templatesSnap.forEach(doc => {
        templates.push(doc.data());
    });
    // 4. Load client profile
    const clientSnap = await db.collection('clients').doc(after.clientId).get();
    const clientProfile = clientSnap.data();
    // 5. Calculate pillar scores
    const pillars = ['environment', 'social', 'governance', 'economic'];
    const pillarScores = {};
    for (const pillar of pillars) {
        const pillarQuestions = templates.filter(t => t.pillar === pillar);
        const result = (0, scoringEngine_1.calculatePillarScore)(pillarQuestions, responses);
        pillarScores[pillar] = result.score;
    }
    // 6. Calculate final score (average over 4 pillars)
    const values = Object.values(pillarScores);
    const sum = values.reduce((a, b) => a + b, 0);
    const finalScore = values.length > 0 ? Math.round((sum / values.length) * 100) / 100 : 0;
    // 7. Get rating band
    const ratingBand = (0, scoringEngine_1.getRatingBand)(finalScore);
    // 8. Calculate compliance flags
    const flags = (0, flagEngine_1.calculateFlags)(responses, templates, pillarScores, clientProfile, finalScore);
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
        }
        else {
            const data = statsDoc.data();
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
//# sourceMappingURL=onAssessmentSubmit.js.map