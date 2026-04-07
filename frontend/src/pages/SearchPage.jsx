import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchDistricts } from '../api/districts';
import { letterGrade, overallScore, fmt } from '../utils/ratings';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

export default function SearchPage({ compareIds, onAddCompare }) {
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  async function handleSearch(e) {
    e.preventDefault();
    if (!q.trim() && !state) return;
    setLoading(true);
    setError('');
    try {
      const data = await searchDistricts({ q: q.trim(), state });
      setResults(data.results || []);
      setSearched(true);
    } catch {
      setError('Search failed. Make sure the API server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="District name (e.g. Unified, City Schools…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">All States</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <div className="error-msg">{error}</div>}

      {!searched && !loading && (
        <div className="empty-state">
          <p style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🏫</p>
          <p>Search for a school district by name or state to get started.</p>
        </div>
      )}

      {loading && <div className="spinner">Loading…</div>}

      {searched && !loading && results.length === 0 && (
        <div className="empty-state">No districts found. Try a different search.</div>
      )}

      <div className="results-grid">
        {results.map((d) => {
          const score = overallScore(d);
          const { grade, cls } = letterGrade(score);
          const alreadyAdded = compareIds.includes(d.id);
          return (
            <div key={d.id} className="district-card" onClick={() => navigate(`/district/${d.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3>{d.name}</h3>
                {score !== null && (
                  <span className={`badge ${cls}`}>{grade}</span>
                )}
              </div>
              <div className="meta">{[d.city, d.state, d.county].filter(Boolean).join(' · ')}</div>
              {d.enrollment && (
                <div className="enrollment">
                  {fmt(d.enrollment)} students · {fmt(d.numSchools)} schools
                </div>
              )}
              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-sm btn-outline" onClick={() => navigate(`/district/${d.id}`)}>
                  View Details
                </button>
                <button
                  className={`btn btn-sm ${alreadyAdded ? 'btn-danger' : 'btn-primary'}`}
                  disabled={!alreadyAdded && compareIds.length >= 5}
                  onClick={() => onAddCompare(d)}
                >
                  {alreadyAdded ? 'Remove' : '+ Compare'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
