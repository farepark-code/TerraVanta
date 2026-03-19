"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFlags = calculateFlags;
function calculateFlags(responses, templates, pillarScores, clientProfile, finalScore) {
    const flags = [];
    // Rule 1: POJK_51_MANDATORY_GAP
    const financialIndustries = ['Perbankan & Keuangan', 'Asuransi', 'Sekuritas', 'Fintech'];
    if (pillarScores.governance < 60 &&
        financialIndustries.includes(clientProfile.industry)) {
        flags.push('POJK_51_MANDATORY_GAP');
    }
    // Rule 2: ISSB_S2_READINESS
    const climateQuestions = templates.filter(t => t.complianceMapping && t.complianceMapping.includes('ISSB_S2_READINESS'));
    const hasUnansweredClimate = climateQuestions.some(q => {
        const r = responses[q.id];
        return !r || (!r.isNA && (r.value === null || r.value === ''));
    });
    if (pillarScores.environment < 50 && hasUnansweredClimate) {
        flags.push('ISSB_S2_READINESS');
    }
    // Rule 3: GRI_ALIGNMENT
    if (finalScore >= 70 &&
        pillarScores.environment >= 60 &&
        pillarScores.social >= 60 &&
        pillarScores.governance >= 60 &&
        (isNaN(pillarScores.economic) || pillarScores.economic >= 60)) {
        flags.push('GRI_ALIGNMENT');
    }
    // Rule 4: TCFD_READINESS
    if (pillarScores.environment >= 65 &&
        pillarScores.governance >= 65) {
        flags.push('TCFD_READINESS');
    }
    return [...new Set(flags)];
}
//# sourceMappingURL=flagEngine.js.map