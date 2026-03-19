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
exports.buildReportData = buildReportData;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
async function buildReportData(clientId, assessmentId, consultantId) {
    const [clientSnap, assessmentSnap, consultantSnap, responsesSnap, templatesSnap] = await Promise.all([
        db.collection('clients').doc(clientId).get(),
        db.collection('assessments').doc(assessmentId).get(),
        db.collection('consultants').doc(consultantId).get(),
        db.collection(`assessments/${assessmentId}/responses`).get(),
        db.collection('questionnaireTemplates').get(),
    ]);
    if (!assessmentSnap.exists)
        throw new Error('Assessment tidak ditemukan');
    const assessment = { id: assessmentId, ...assessmentSnap.data() };
    if (assessment.status !== 'scored') {
        throw new Error('Assessment belum selesai dinilai');
    }
    const client = { id: clientId, ...clientSnap.data() };
    const consultant = consultantSnap.data();
    const responses = {};
    responsesSnap.forEach(doc => {
        const data = doc.data();
        responses[data.questionId] = data;
    });
    const templates = [];
    templatesSnap.forEach(doc => {
        const data = doc.data();
        if (data.tier <= assessment.tier) {
            templates.push(data);
        }
    });
    return {
        consultant,
        client,
        assessment,
        responses,
        templates,
        generatedAt: new Date()
    };
}
//# sourceMappingURL=reportBuilder.js.map