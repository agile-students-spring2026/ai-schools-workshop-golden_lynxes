import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { compareDistricts } from '../api/districts';
import { letterGrade, overallScore, spendingScore, fmt } from '../utils/ratings';

const COLORS = ['#3182ce', '#e53e3e', '#38a169', '#d69e2e', '#805ad5'];

const METRICS = [
  { key: 'graduationRate', label: 'Grad Rate (%)', higher: true },
  { key: 'expenditurePerPupil', label: 'Spending/Pupil ($)', higher: true },
  { key: 'testScoreMath', label: 'Math Score', higher: true },
  { key: 'testScoreReading', label: 'Reading Score', higher: true },
  { key: 'enrollment', label: 'Enrollment', higher: true },
];

function bestIndex(districts, key, higher = true) {
  let best = null;
  districts.forEach((d, i) => {
    if (d[key] == null) return;
    if (best === null) { best = i; return; }
    if (higher ? d[key] > districts[best][key] : d[key] < districts[best][key]) best = i;
  });
  return best;
}

export default function ComparePage({ compareIds, compareDistricts: compareDistrictsState, onRemoveCompare }) {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (compareIds.length < 2) { setDistricts([]); return; }
    setLoading(true);
    setError('');
    compareDistricts(compareIds)
      .then((data) => setDistricts(data.results || []))
      .catch(() => setError('Failed to load comparison data.'))
      .finally(() => setLoading(false));
  }, [compareIds]);

  // Bar chart data: one entry per metric, value per district
  const barData = METRICS.map(({ key, label }) => {
    const entry = { metric: label };
    districts.forEach((d) => { entry[d.name] = d[key] ?? 0; });
    return entry;
  });

  // Radar chart data: normalized 0-100 per district
  const radarData = [
    { subject: 'Grad Rate', ...Object.fromEntries(districts.map((d) => [d.name, d.graduationRate ?? 0])) },
    { subject: 'Spending', ...Object.fromEntries(districts.map((d) => [d.name, spendingScore(d.expenditurePerPupil) ?? 0])) },
    { subject: 'Math', ...Object.fromEntries(districts.map((d) => [d.name, d.testScoreMath ? Math.min(100, ((d.testScoreMath - 200) / 100) * 100) : 0])) },
    { subject: 'Reading', ...Object.fromEntries(districts.map((d) => [d.name, d.testScoreReading ? Math.min(100, ((d.testScoreReading - 200) / 100) * 100) : 0])) },
    { subject: 'Overall', ...Object.fromEntries(districts.map((d) => [d.name, overallScore(d) ?? 0])) },
  ];

  return (
    <div className="page">
      <div className="compare-controls">
        <h3>Districts to Compare ({compareIds.length}/5)</h3>
        {compareIds.length === 0 ? (
          <p style={{ color: '#a0aec0', fontSize: '.88rem' }}>
            Search for districts and click "+ Compare" to add them here.
          </p>
        ) : (
          <div className="compare-tags">
            {compareDistrictsState.map((d, i) => (
              <span key={d.id} className="tag" style={{ borderColor: COLORS[i] }}>
                {d.name}
                <button onClick={() => onRemoveCompare(d.id)} title="Remove">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {compareIds.length < 2 && (
        <div className="empty-state">
          <p style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📊</p>
          <p>Add at least 2 districts from the Search page to compare them.</p>
        </div>
      )}

      {loading && <div className="spinner">Loading comparison…</div>}

      {districts.length >= 2 && !loading && (
        <>
          {/* Summary table */}
          <table className="compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                {districts.map((d) => <th key={d.id}>{d.name}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Overall Grade</td>
                {districts.map((d) => {
                  const score = overallScore(d);
                  const { grade, cls } = letterGrade(score);
                  return <td key={d.id}><span className={`badge ${cls}`}>{grade}</span></td>;
                })}
              </tr>
              {METRICS.map(({ key, label, higher }) => {
                const bi = bestIndex(districts, key, higher);
                return (
                  <tr key={key}>
                    <td>{label}</td>
                    {districts.map((d, i) => (
                      <td key={d.id} className={i === bi ? 'best' : ''}>
                        {key === 'expenditurePerPupil'
                          ? d[key] != null ? `$${fmt(d[key])}` : 'N/A'
                          : d[key] != null ? fmt(d[key]) : 'N/A'}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr>
                <td>Grad Rate Grade</td>
                {districts.map((d) => {
                  const { grade, cls } = letterGrade(d.graduationRate);
                  return <td key={d.id}><span className={`badge ${cls}`}>{grade}</span></td>;
                })}
              </tr>
            </tbody>
          </table>

          {/* Bar chart: spending per pupil */}
          <div className="chart-section">
            <h3>Spending Per Pupil ($)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[{ metric: 'Spending', ...Object.fromEntries(districts.map((d) => [d.name, d.expenditurePerPupil ?? 0])) }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                <Legend />
                {districts.map((d, i) => <Bar key={d.id} dataKey={d.name} fill={COLORS[i]} radius={[4, 4, 0, 0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart: graduation rates */}
          <div className="chart-section">
            <h3>Graduation Rate (%)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[{ metric: 'Grad Rate', ...Object.fromEntries(districts.map((d) => [d.name, d.graduationRate ?? 0])) }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                {districts.map((d, i) => <Bar key={d.id} dataKey={d.name} fill={COLORS[i]} radius={[4, 4, 0, 0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar chart: multi-metric overview */}
          <div className="chart-section">
            <h3>Overall Profile (normalized 0–100)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                {districts.map((d, i) => (
                  <Radar
                    key={d.id}
                    name={d.name}
                    dataKey={d.name}
                    stroke={COLORS[i]}
                    fill={COLORS[i]}
                    fillOpacity={0.15}
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
