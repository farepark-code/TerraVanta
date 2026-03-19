import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin if credentials exist
const canConnect = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !!process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (canConnect && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

const db = canConnect ? admin.firestore() : null;

async function seed() {
  const filePath = path.resolve(process.cwd(), '../docs/ESG_Assessment_Questionnaire_v2.txt');
  
  if (!fs.existsSync(filePath)) {
     console.error("File tidak ditemukan:", filePath);
     return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim());

  const templates: any[] = [];
  let currentTier: 1 | 2 | 3 | 4 = 1;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    if (line.includes('TIER 1')) currentTier = 1;
    else if (line.includes('TIER 2')) currentTier = 2;
    else if (line.includes('TIER 3')) currentTier = 3;
    else if (line.includes('TIER 4')) currentTier = 4;

    const idMatch = line.match(/^(E|S|G|EK|0)\d*\.\d+$/);
    if (idMatch) {
      const qId = line;
      const questionText = lines[i+1];
      const weightStr = lines[i+2];
      const optionsStr = lines[i+3];
      
      let pillar = 'environment';
      if (qId.startsWith('S')) pillar = 'social';
      else if (qId.startsWith('G')) pillar = 'governance';
      else if (qId.startsWith('EK')) pillar = 'economic';
      else if (qId.startsWith('0')) pillar = 'governance'; // fallback

      let inputType = 'single_choice';
      let options = optionsStr.split('/').map(o => o.trim());
      
      if (optionsStr.toLowerCase().includes('text input')) {
        inputType = 'text';
        options = [];
      } else if (optionsStr.toLowerCase().includes('numeric')) {
        inputType = 'numeric';
        options = [];
      } else if (optionsStr.toLowerCase().includes('multi-select')) {
        inputType = 'multi_choice';
        options = options[0].replace(/Multi-select:\s*/i, '').split('/').map(o => o.trim());
      } else if (optionsStr.toLowerCase().includes('year picker')) {
        inputType = 'numeric';
        options = [];
      }

      let weight = parseFloat(weightStr.replace('%', '')) / 100;
      if (isNaN(weight)) weight = 0;

      const complianceMapping: string[] = [];
      const frameworkRow = lines[i+5] || '';
      if (frameworkRow.includes('POJK 51')) complianceMapping.push('POJK_51_MANDATORY_GAP');
      if (frameworkRow.includes('ISSB')) complianceMapping.push('ISSB_S2_READINESS');
      
      templates.push({
        id: qId,
        tier: currentTier,
        pillar,
        questionText: questionText,
        questionTextEN: questionText,
        inputType,
        ...(options.length > 0 ? { options } : {}),
        weight,
        complianceMapping,
        isRequired: true,
        order: templates.length + 1
      });
      i += 6;
    } else {
      i++;
    }
  }

  console.log(`Mengurai ${templates.length} pertanyaan...`);
  
  if (canConnect && db) {
    console.log("Menyimpan ke Firestore...");
    const batch = db.batch();
    for (const t of templates) {
      const ref = db.collection('questionnaireTemplates').doc(t.id);
      batch.set(ref, t);
    }
    await batch.commit();
    console.log('Seed ke Firestore selesai!');
  } else {
    console.log("Firestore belum dikonfigurasi (ENV kosong). Menjalankan Dry-Run mode.");
  }
  
  const tierDist = templates.reduce((acc, curr) => {
    acc[`Tier ${curr.tier}`] = (acc[`Tier ${curr.tier}`] || 0) + 1;
    return acc;
  }, {});
  
  const pillarDist = templates.reduce((acc, curr) => {
    acc[curr.pillar] = (acc[curr.pillar] || 0) + 1;
    return acc;
  }, {});

  console.log('\n--- Distribusi per Tier ---');
  console.table(tierDist);
  console.log('\n--- Distribusi per Pillar ---');
  console.table(pillarDist);
  
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
