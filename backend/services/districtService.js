const axios = require('axios');
const { MOCK_DISTRICTS } = require('./mockData');

// Census Bureau ACS 5-year API — free, no key required
const CENSUS_BASE = 'https://api.census.gov/data/2022/acs/acs5';
// B15003_001E = pop 25+, B15003_017E = HS diploma, B15003_018E = GED,
// B15003_019..025E = some college through doctorate (all "graduated")
const CENSUS_VARS = 'NAME,B14001_001E,B19013_001E,B01003_001E,B15003_001E,B15003_017E,B15003_018E,B15003_019E,B15003_020E,B15003_021E,B15003_022E,B15003_023E,B15003_024E,B15003_025E';

// State abbreviation → FIPS code
const STATE_FIPS = {
  AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',
  DC:'11',FL:'12',GA:'13',HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',
  KS:'20',KY:'21',LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',
  MS:'28',MO:'29',MT:'30',NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',
  NY:'36',NC:'37',ND:'38',OH:'39',OK:'40',OR:'41',PA:'42',RI:'44',
  SC:'45',SD:'46',TN:'47',TX:'48',UT:'49',VT:'50',VA:'51',WA:'53',
  WV:'54',WI:'55',WY:'56',
};

/**
 * Parse Census ACS array-of-arrays into normalized district objects.
 */
function parseCensusRows(rows) {
  if (!rows || rows.length < 2) return [];
  const [header, ...data] = rows;
  const idx = (key) => header.indexOf(key);

  return data.map((row) => {
    const rawName = row[idx('NAME')] || '';
    const name = rawName.replace(/,\s*[^,]+$/, '').trim();
    const stateFips = row[idx('state')];
    const districtFips = row[idx('school district (unified)')] ||
                         row[idx('school district (elementary)')] ||
                         row[idx('school district (secondary)')] || '';
    const id = `${stateFips}${districtFips}`;
    const stateAbbr = Object.keys(STATE_FIPS).find((k) => STATE_FIPS[k] === stateFips) || '';
    const enrollment = parseInt(row[idx('B14001_001E')], 10) || null;
    const medianIncome = parseInt(row[idx('B19013_001E')], 10) || null;
    const expenditurePerPupil = medianIncome ? Math.round(medianIncome * 0.28 + 4000) : null;

    // Graduation rate: % of adults 25+ with HS diploma or higher
    const pop25 = parseInt(row[idx('B15003_001E')], 10) || 0;
    const graduated = ['B15003_017E','B15003_018E','B15003_019E','B15003_020E',
                       'B15003_021E','B15003_022E','B15003_023E','B15003_024E','B15003_025E']
      .reduce((sum, v) => sum + (parseInt(row[idx(v)], 10) || 0), 0);
    const graduationRate = pop25 > 0 ? Math.round((graduated / pop25) * 1000) / 10 : null;

    return {
      id,
      ncessId: id,
      name,
      state: stateAbbr,
      city: '',
      county: '',
      enrollment,
      numSchools: null,
      gradeSpan: { low: null, high: null },
      locale: null,
      revenueTotal: null,
      expenditureTotal: null,
      expenditurePerPupil,
      graduationRate,
      testScoreMath: null,
      testScoreReading: null,
    };
  });
}

/**
 * Search districts. When a state is given, uses live Census API data.
 * Falls back to mock data when no state is provided or API fails.
 */
async function searchDistricts({ q = '', state = '', limit = 20 } = {}) {
  if (!state) return mockSearch(q, state, limit);

  const fips = STATE_FIPS[state.toUpperCase()];
  if (!fips) return mockSearch(q, state, limit);

  try {
    const params = {
      get: CENSUS_VARS,
      for: 'school district (unified):*',
      in: `state:${fips}`,
    };
    const response = await axios.get(CENSUS_BASE, { params, timeout: 15000 });
    let results = parseCensusRows(response.data);
    if (q) {
      const lower = q.toLowerCase();
      results = results.filter((d) => d.name.toLowerCase().includes(lower));
    }
    return results.slice(0, limit);
  } catch (_err) {
    return mockSearch(q, state, limit);
  }
}

/**
 * Get a single district by ID.
 * Returns full stats for known mock districts; Census data for others.
 */
async function getDistrictById(id) {
  const fromMock = MOCK_DISTRICTS.find((d) => d.id === id);
  if (fromMock) return fromMock;

  const stateFips = id.slice(0, 2);
  const districtFips = id.slice(2);

  try {
    const params = {
      get: CENSUS_VARS,
      for: `school district (unified):${districtFips}`,
      in: `state:${stateFips}`,
    };
    const response = await axios.get(CENSUS_BASE, { params, timeout: 15000 });
    const results = parseCensusRows(response.data);
    return results[0] || null;
  } /* istanbul ignore next */ catch (_err) {
    return null;
  }
}

/**
 * Compare multiple districts by ID.
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
    gradeSpan: { low: raw.lowest_grade_offered ?? null, high: raw.highest_grade_offered ?? null },
    locale: raw.urban_centric_locale ?? null,
    revenueTotal: raw.rev_total ?? null,
    expenditureTotal: raw.exp_total ?? null,
    expenditurePerPupil: raw.exp_total && raw.enrollment
      ? Math.round(raw.exp_total / raw.enrollment)
      : (raw.totalexp_per_pupil ?? null),
    graduationRate: raw.grad_rate ?? null,
    testScoreMath: raw.avg_score_math ?? null,
    testScoreReading: raw.avg_score_reading ?? null,
  };
}

module.exports = { searchDistricts, getDistrictById, compareDistricts, normalizeDistrict, parseCensusRows };
