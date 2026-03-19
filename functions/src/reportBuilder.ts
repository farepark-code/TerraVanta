import * as admin from 'firebase-admin';
import { Assessment, AssessmentResponse, ClientProfile, QuestionnaireTemplate, ConsultantProfile } from './types';

const db = admin.firestore();

export interface ReportData {
  consultant: ConsultantProfile;
  client: ClientProfile;
  assessment: Assessment;
  responses: Record<string, AssessmentResponse>;
  templates: QuestionnaireTemplate[];
  generatedAt: Date;
}

export async function buildReportData(
  clientId: string,
  assessmentId: string,
  consultantId: string
): Promise<ReportData> {
  
  const [clientSnap, assessmentSnap, consultantSnap, responsesSnap, templatesSnap] = await Promise.all([
    db.collection('clients').doc(clientId).get(),
    db.collection('assessments').doc(assessmentId).get(),
    db.collection('consultants').doc(consultantId).get(),
    db.collection(`assessments/${assessmentId}/responses`).get(),
    db.collection('questionnaireTemplates').get(),
  ]);

  if (!assessmentSnap.exists) throw new Error('Assessment tidak ditemukan');
  const assessment = { id: assessmentId, ...assessmentSnap.data() } as Assessment;

  if (assessment.status !== 'scored') {
    throw new Error('Assessment belum selesai dinilai');
  }

  const client = { id: clientId, ...clientSnap.data() } as ClientProfile;
  const consultant = consultantSnap.data() as ConsultantProfile;

  const responses: Record<string, AssessmentResponse> = {};
  responsesSnap.forEach(doc => {
    const data = doc.data() as AssessmentResponse;
    responses[data.questionId] = data;
  });

  const templates: QuestionnaireTemplate[] = [];
  templatesSnap.forEach(doc => {
    const data = doc.data() as QuestionnaireTemplate;
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
