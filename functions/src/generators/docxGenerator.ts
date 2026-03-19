import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';
import { ReportData } from '../reportBuilder';

export async function docxGenerator(data: ReportData): Promise<Buffer> {
  const companyName = data.client.companyName;
  const consultantName = data.consultant.companyName;
  // Brand color can be used for custom styles if expanded later
  // const brandColor = (data.consultant.brandColor || '#10B981').replace('#', '');

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cover Page
          new Paragraph({
            text: 'LAPORAN ASSESSMENT ESG',
            heading: HeadingLevel.TITLE,
            alignment: 'center',
            spacing: { before: 2000, after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Klien: ${companyName}`, size: 28 }),
            ],
            alignment: 'center',
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Konsultan: ${consultantName}`, size: 24 }),
            ],
            alignment: 'center',
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'RAHASIA & KONFIDENSIAL', size: 28, color: 'FF0000', bold: true }),
            ],
            alignment: 'center',
            pageBreakBefore: true,
          }),

          // Executive Summary
          new Paragraph({
            text: 'Executive Summary',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Skor Akhir: ${data.assessment.finalScore}`, size: 32, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Rating: ${data.assessment.ratingBand}`, size: 24 }),
            ],
            spacing: { after: 400 }
          }),

          // Content Placeholder for remaining sections
          new Paragraph({ text: 'Metodologi', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: 'Kami menggunakan framework Tier ' + data.assessment.tier }),
          
          new Paragraph({ text: 'Temuan Per Pilar', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: 'Evaluasi menemukan titik kekuatan dan area perbaikan di berbagai pilar.' }),

          new Paragraph({ text: 'Compliance Flags', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: (data.assessment.complianceFlags || []).join(', ') || 'Aman' }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
