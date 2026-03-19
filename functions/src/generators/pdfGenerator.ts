const PdfPrinter = require('pdfmake');
import { ReportData } from '../reportBuilder';
import { ESGPillar } from '../types';

export async function pdfGenerator(data: ReportData): Promise<Buffer> {
  const brandColor = data.consultant.brandColor || '#10B981';
  const companyName = data.client.companyName;
  const consultantName = data.consultant.companyName;

  // Use core fonts (Helvetica) that do not require TTF files in basic node setup
  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };

  const printer = new PdfPrinter(fonts);

  const pillars = ['environment', 'social', 'governance', 'economic'];
  const pBody = [['Pilar', 'Skor']];
  pillars.forEach(p => {
    const s = data.assessment.pillarScores?.[p as ESGPillar] || 0;
    pBody.push([p.toUpperCase(), s.toString()]);
  });

  const docDefinition: any = {
    defaultStyle: { font: 'Helvetica' },
    content: [
      // SECTION 1: Cover Page
      { text: 'LAPORAN ASSESSMENT ESG', fontSize: 32, bold: true, color: brandColor, margin: [0, 100, 0, 20], alignment: 'center' },
      { text: `Klien: ${companyName}`, fontSize: 24, alignment: 'center', margin: [0, 0, 0, 40] },
      { text: `Firma Konsultan: ${consultantName}`, fontSize: 16, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Tanggal Generate: ${data.generatedAt.toLocaleDateString('id-ID')}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 100] },
      { text: 'RAHASIA & KONFIDENSIAL', fontSize: 14, bold: true, color: 'red', alignment: 'center', pageBreak: 'after' },

      // SECTION 2: Executive Summary
      { text: 'Executive Summary', fontSize: 20, bold: true, color: brandColor, margin: [0, 0, 0, 10] },
      { text: `Skor Akhir: ${data.assessment.finalScore}`, fontSize: 28, bold: true, alignment: 'center', margin: [0, 20, 0, 5] },
      { text: `Rating: ${data.assessment.ratingBand}`, fontSize: 16, alignment: 'center', margin: [0, 0, 0, 20] },
      { table: { headerRows: 1, widths: ['*', 'auto'], body: pBody }, margin: [0, 0, 0, 30] },

      // SECTION 3: Metodologi
      { text: 'Metodologi', fontSize: 20, bold: true, color: brandColor, margin: [0, 20, 0, 10] },
      { text: `Framework ESG: Tier ${data.assessment.tier}`, margin: [0, 0, 0, 5] },
      
      // SECTION 4: Temuan Per Pilar (simplified)
      { text: 'Temuan Per Pilar', fontSize: 20, bold: true, color: brandColor, margin: [0, 20, 0, 10] },
      { text: 'Hasil evaluasi menunjukkan celah pada aspek spesifik di berbagai pilar terkait kepatuhan regulasi.', margin: [0,0,0,20] },

      // SECTION 5: Compliance Flags
      { text: 'Compliance Flags', fontSize: 20, bold: true, color: brandColor, margin: [0, 20, 0, 10] },
      { ul: data.assessment.complianceFlags?.length ? data.assessment.complianceFlags : ['Tidak ada flag kritis'] },

      // SECTION 6: Rekomendasi
      { text: 'Rekomendasi Utama', fontSize: 20, bold: true, color: brandColor, margin: [0, 20, 0, 10], pageBreak: 'before' },
      { table: { headerRows: 1, widths: ['*', '*', '*'], body: [['Jangka Pendek', 'Jangka Menengah', 'Jangka Panjang'], ['Penuhi POJK', 'Integrasi Sistem', 'Net Zero']]}},

      // SECTION 7: Appendix
      { text: 'Appendix', fontSize: 20, bold: true, color: brandColor, margin: [0, 20, 0, 10], pageBreak: 'before' },
      { text: `Total Pertanyaan: ${data.templates.length}`, margin: [0, 0, 0, 10] },
    ]
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err: any) => reject(err));
      pdfDoc.end();
    } catch (err) {
      reject(err);
    }
  });
}
