import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDistrict } from '../api/districts';
import { letterGrade, overallScore, spendingScore, fmt } from '../utils/ratings';

function StatCard({ label, value, sub, colorClass }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className={`value ${colorClass || ''}`}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function RatingBadge({ score }) {
  const { grade, cls } = letterGrade(score);
  return <span className={`badge ${cls}`} style={{ fontSize: '1rem', padding: '.25rem .9rem' }}>{grade}</span>;
}

export default function DistrictDetailPage({ onAddCompare, compareIds }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [district, setDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getDistrict(id)
      .then(setDistrict)
      .catch(() => setError('District not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page spinner">Loading district…</div>;
  if (error) return <div className="page error-msg">{error}</div>;
  if (!district) return null;

  const score = overallScore(district);
  const spending = spendingScore(district.expenditurePerPupil);
  const alreadyAdded = compareIds.includes(district.id);

  return (
    <div className="page">
      <button className="btn btn-outline btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.75rem' }}>
          <div>
            <h2>{district.name}</h2>
            <div className="location">
              {[district.city, district.county, district.state].filter(Boolean).join(', ')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {score !== null && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '.72rem', color: '#718096', marginBottom: '.2rem' }}>OVERALL</div>
                <RatingBadge score={score} />
              </div>
            )}
            <button
              className={`btn ${alreadyAdded ? 'btn-danger' : 'btn-primary'}`}
              disabled={!alreadyAdded && compareIds.length >= 5}
              onClick={() => onAddCompare(district)}
            >
              {alreadyAdded ? 'Remove from Compare' : '+ Add to Compare'}
            </button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Enrollment"
          value={fmt(district.enrollment)}
          sub="students"
        />
        <StatCard
          label="Schools"
          value={fmt(district.numSchools)}
        />
        <StatCard
          label="Grad Rate"
          value={district.graduationRate != null ? `${district.graduationRate.toFixed(1)}%` : 'N/A'}
          colorClass={district.graduationRate != null ? letterGrade(district.graduationRate).cls.replace('badge-', 'rating-') : ''}
          sub={district.graduationRate != null ? letterGrade(district.graduationRate).grade : ''}
        />
        <StatCard
          label="Spending / Pupil"
          value={district.expenditurePerPupil != null ? `$${fmt(district.expenditurePerPupil)}` : 'N/A'}
          colorClass={spending != null ? letterGrade(spending).cls.replace('badge-', 'rating-') : ''}
          sub={spending != null ? `Grade: ${letterGrade(spending).grade}` : ''}
        />
        <StatCard
          label="Math Score"
          value={fmt(district.testScoreMath)}
          sub="NAEP scale"
        />
        <StatCard
          label="Reading Score"
          value={fmt(district.testScoreReading)}
          sub="NAEP scale"
        />
        <StatCard
          label="Total Revenue"
          value={district.revenueTotal != null ? `$${fmt(Math.round(district.revenueTotal / 1e6))}M` : 'N/A'}
        />
        <StatCard
          label="Total Expenditure"
          value={district.expenditureTotal != null ? `$${fmt(Math.round(district.expenditureTotal / 1e6))}M` : 'N/A'}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <h3 style={{ marginBottom: '.75rem', fontSize: '1rem', fontWeight: 700, color: '#2d3748' }}>Grade Span</h3>
        <p style={{ color: '#4a5568' }}>
          {district.gradeSpan?.low && district.gradeSpan?.high
            ? `${district.gradeSpan.low} – ${district.gradeSpan.high}`
            : 'Not reported'}
        </p>
        <div style={{ marginTop: '.75rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-b">NCES ID: {district.ncessId}</span>
          <span className="badge badge-b">State: {district.state}</span>
          {district.locale && <span className="badge badge-c">Locale: {district.locale}</span>}
        </div>
      </div>
    </div>
  );
}
