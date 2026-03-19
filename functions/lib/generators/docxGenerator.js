"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docxGenerator = docxGenerator;
const docx_1 = require("docx");
async function docxGenerator(data) {
    const companyName = data.client.companyName;
    const consultantName = data.consultant.companyName;
    // Brand color can be used for custom styles if expanded later
    // const brandColor = (data.consultant.brandColor || '#10B981').replace('#', '');
    const doc = new docx_1.Document({
        sections: [
            {
                properties: {},
                children: [
                    // Cover Page
                    new docx_1.Paragraph({
                        text: 'LAPORAN ASSESSMENT ESG',
                        heading: docx_1.HeadingLevel.TITLE,
                        alignment: 'center',
                        spacing: { before: 2000, after: 400 },
                    }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: `Klien: ${companyName}`, size: 28 }),
                        ],
                        alignment: 'center',
                        spacing: { after: 200 },
                    }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: `Konsultan: ${consultantName}`, size: 24 }),
                        ],
                        alignment: 'center',
                        spacing: { after: 200 },
                    }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: 'RAHASIA & KONFIDENSIAL', size: 28, color: 'FF0000', bold: true }),
                        ],
                        alignment: 'center',
                        pageBreakBefore: true,
                    }),
                    // Executive Summary
                    new docx_1.Paragraph({
                        text: 'Executive Summary',
                        heading: docx_1.HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 },
                    }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: `Skor Akhir: ${data.assessment.finalScore}`, size: 32, bold: true }),
                        ],
                    }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: `Rating: ${data.assessment.ratingBand}`, size: 24 }),
                        ],
                        spacing: { after: 400 }
                    }),
                    // Content Placeholder for remaining sections
                    new docx_1.Paragraph({ text: 'Metodologi', heading: docx_1.HeadingLevel.HEADING_1 }),
                    new docx_1.Paragraph({ text: 'Kami menggunakan framework Tier ' + data.assessment.tier }),
                    new docx_1.Paragraph({ text: 'Temuan Per Pilar', heading: docx_1.HeadingLevel.HEADING_1 }),
                    new docx_1.Paragraph({ text: 'Evaluasi menemukan titik kekuatan dan area perbaikan di berbagai pilar.' }),
                    new docx_1.Paragraph({ text: 'Compliance Flags', heading: docx_1.HeadingLevel.HEADING_1 }),
                    new docx_1.Paragraph({ text: (data.assessment.complianceFlags || []).join(', ') || 'Aman' }),
                ],
            },
        ],
    });
    return docx_1.Packer.toBuffer(doc);
}
//# sourceMappingURL=docxGenerator.js.map