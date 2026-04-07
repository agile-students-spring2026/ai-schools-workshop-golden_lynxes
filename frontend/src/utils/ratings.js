/**
 * Compute a letter grade and badge class from a 0-100 score.
 */
export function letterGrade(score) {
  if (score === null || score === undefined) return { grade: 'N/A', cls: '' };
  if (score >= 90) return { grade: 'A', cls: 'badge-a' };
  if (score >= 80) return { grade: 'B', cls: 'badge-b' };
  if (score >= 70) return { grade: 'C', cls: 'badge-c' };
  if (score >= 60) return { grade: 'D', cls: 'badge-d' };
  return { grade: 'F', cls: 'badge-f' };
}

/**
 * Normalize expenditure per pupil to a 0-100 score.
 * Treats $10k as baseline (50) and $25k+ as excellent (100).
 */
export function spendingScore(perPupil) {
  if (!perPupil) return null;
  return Math.min(100, Math.max(0, ((perPupil - 10000) / 15000) * 100));
}

/**
 * Overall district score: weighted average of grad rate, spending, and test scores.
 */
export function overallScore(district) {
  const parts = [];
  if (district.graduationRate != null) parts.push({ value: district.graduationRate, weight: 0.5 });
  const ss = spendingScore(district.expenditurePerPupil);
  if (ss != null) parts.push({ value: ss, weight: 0.25 });
  if (district.testScoreMath != null) {
    // NAEP scale ~200-300, normalise to 0-100
    const norm = Math.min(100, Math.max(0, ((district.testScoreMath - 200) / 100) * 100));
    parts.push({ value: norm, weight: 0.25 });
  }
  if (!parts.length) return null;
  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  return parts.reduce((s, p) => s + (p.value * p.weight) / totalWeight, 0);
}

export function fmt(num, opts = {}) {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString(undefined, opts);
}
