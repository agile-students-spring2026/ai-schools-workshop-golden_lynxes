const axios = require('axios');
const { MOCK_DISTRICTS } = require('./mockData');

// Urban Institute Education Data API — free, no key required
// Docs: https://educationdata.urban.org/documentation/
const BASE_URL = 'https://educationdata.urban.org/api/v1';
const USE_MOCK = process.env.USE_MOCK === 'true';

/**
 * Normalize raw NCES district record into a clean schema.
 */
function normalizeDistrict(raw) {
  return {
    id: String(raw.leaid),
    ncessId: String(raw.leaid),
    name: raw.lea_name || raw.name || 'Unknown',
    state: raw.state_abbr || raw.state || '',
    city: raw.city_location || raw.city || '',
    county: raw.county_name || '',
    enrollment: raw.enrollment ?? null,
    numSchools: raw.num_schools ?? null,
    gradeSpan: {
      low: raw.lowest_grade_offered ?? null,
      high: raw.highest_grade_offered ?? null,
    },
    locale: raw.urban_centric_locale ?? null,
    // Finance metrics (from finance endpoint, merged when available)
    revenueTotal: raw.rev_total ?? null,
    expenditureTotal: raw.exp_total ?? null,
    expenditurePerPupil: raw.exp_total && raw.enrollment
      ? Math.round(raw.exp_total / raw.enrollment)
      : (raw.totalexp_per_pupil ?? null),
    // Outcome metrics (merged from other endpoints when available)
    graduationRate: raw.grad_rate ?? null,
    testScoreMath: raw.avg_score_math ?? null,
    testScoreReading: raw.avg_score_reading ?? null,
  };
}

/**
 * Search districts by name and/or state.
 * Falls back to mock data when USE_MOCK=true or the upstream API fails.
 */
async function searchDistricts({ q = '', state = '', limit = 20 } = {}) {
  if (USE_MOCK) return mockSearch(q, state, limit);

  try {
    const params = {
      fields: 'leaid,lea_name,state_abbr,city_location,county_name,enrollment,num_schools,urban_centric_locale',
      per_page: limit,
      page: 1,
    };
    if (state) params.state_abbr = state.toUpperCase();
    if (q) params.lea_name = q;

    const response = await axios.get(`${BASE_URL}/schools/ccd/lea_directory/`, { params, timeout: 10000 });
    return (response.data.results || []).map(normalizeDistrict);
  } catch (_err) {
    return mockSearch(q, state, limit);
  }
}

/**
 * Get full details for a single district by NCES lea ID.
 * Falls back to mock data when USE_MOCK=true or the upstream API fails.
 */
async function getDistrictById(id) {
  if (USE_MOCK) return MOCK_DISTRICTS.find((d) => d.id === id) || null;

  const year = 2021; // most recent stable year with full data
  try {
    const [dirRes, finRes] = await Promise.allSettled([
      axios.get(`${BASE_URL}/schools/ccd/lea_directory/${year}/`, {
        params: { leaid: id, fields: 'leaid,lea_name,state_abbr,city_location,county_name,enrollment,num_schools,lowest_grade_offered,highest_grade_offered,urban_centric_locale' },
        timeout: 10000,
      }),
      axios.get(`${BASE_URL}/schools/ccd/lea_finance/${year}/`, {
        params: { leaid: id, fields: 'leaid,rev_total,exp_total' },
        timeout: 10000,
      }),
    ]);

    const dir = dirRes.status === 'fulfilled' ? (dirRes.value.data.results || [])[0] : null;
    const fin = finRes.status === 'fulfilled' ? (finRes.value.data.results || [])[0] : null;
    if (!dir) return MOCK_DISTRICTS.find((d) => d.id === id) || null;
    return normalizeDistrict({ ...fin, ...dir });
  } /* istanbul ignore next */ catch (_err) {
    return MOCK_DISTRICTS.find((d) => d.id === id) || null;
  }
}

/**
 * Compare multiple districts by their NCES lea IDs.
 */
async function compareDistricts(ids) {
  const results = await Promise.all(ids.map((id) => getDistrictById(id)));
  return results.filter(Boolean);
}

// --- helpers ---

function mockSearch(q, state, limit) {
  let results = MOCK_DISTRICTS;
  if (state) results = results.filter((d) => d.state.toUpperCase() === state.toUpperCase());
  if (q) results = results.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));
  return results.slice(0, limit);
}

module.exports = { searchDistricts, getDistrictById, compareDistricts, normalizeDistrict };
