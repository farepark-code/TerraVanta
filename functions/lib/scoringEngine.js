"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeScore = normalizeScore;
exports.calculatePillarScore = calculatePillarScore;
exports.getRatingBand = getRatingBand;
function normalizeScore(value, inputType, options) {
    if (value === null || value === undefined || value === '')
        return 0;
    switch (inputType) {
        case 'single_choice':
            if (!options || options.length === 0)
                return 0;
            const idx = options.indexOf(value);
            if (idx === -1)
                return 0;
            return (idx / (options.length - 1)) * 100;
        case 'multi_choice':
            if (!options || options.length === 0 || !Array.isArray(value))
                return 0;
            return (value.length / options.length) * 100;
        case 'numeric':
            const num = parseFloat(value);
            if (!isNaN(num))
                return Math.min(100, Math.max(0, num > 0 ? 100 : 0));
            return 0;
        case 'text':
            return typeof value === 'string' && value.trim().length > 0 ? 100 : 0;
        case 'file_upload':
            return value ? 100 : 0;
        default:
            return 0;
    }
}
function calculatePillarScore(questions, responses) {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const q of questions) {
        const res = responses[q.id];
        if (!res)
            continue;
        if (res.isNA)
            continue;
        let valToScore = res.value;
        if (q.inputType === 'file_upload') {
            valToScore = res.evidenceUrl;
        }
        const score = normalizeScore(valToScore, q.inputType, q.options);
        // Default weight
        const weight = q.weight || 0.1;
        weightedSum += score * weight;
        totalWeight += weight;
    }
    const result = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
    return { score: Math.round(result * 100) / 100 };
}
function getRatingBand(score) {
    if (score >= 90)
        return 'AAA';
    if (score >= 80)
        return 'AA';
    if (score >= 70)
        return 'A';
    if (score >= 60)
        return 'BBB';
    if (score >= 50)
        return 'BB';
    if (score >= 40)
        return 'B';
    return 'CCC';
}
//# sourceMappingURL=scoringEngine.js.map