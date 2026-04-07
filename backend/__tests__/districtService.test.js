const axios = require('axios');
const { searchDistricts, getDistrictById, compareDistricts, normalizeDistrict } = require('../services/districtService');
const { MOCK_DISTRICTS } = require('../services/mockData');

jest.mock('axios');

afterEach(() => jest.clearAllMocks());

describe('normalizeDistrict', () => {
  it('maps raw API fields to clean schema', () => {
    const raw = {
      leaid: 123,
      lea_name: 'Test USD',
      state_abbr: 'CA',
      city_location: 'Testville',
      county_name: 'Test County',
      enrollment: 1000,
      num_schools: 5,
      lowest_grade_offered: 'KG',
      highest_grade_offered: '12',
      urban_centric_locale: 11,
      rev_total: 20000000,
      exp_total: 18000000,
    };
    const result = normalizeDistrict(raw);
    expect(result.id).toBe('123');
    expect(result.name).toBe('Test USD');
    expect(result.state).toBe('CA');
    expect(result.expenditurePerPupil).toBe(18000);
    expect(result.gradeSpan).toEqual({ low: 'KG', high: '12' });
  });

  it('handles missing optional fields gracefully', () => {
    const result = normalizeDistrict({ leaid: 1 });
    expect(result.name).toBe('Unknown');
    expect(result.enrollment).toBeNull();
    expect(result.expenditurePerPupil).toBeNull();
  });
});

describe('searchDistricts (mock fallback)', () => {
  it('returns all mock districts when API fails with no filters', async () => {
    axios.get.mockRejectedValue(new Error('network error'));
    const results = await searchDistricts({});
    expect(results.length).toBe(MOCK_DISTRICTS.length);
  });

  it('filters by state via mock fallback', async () => {
    axios.get.mockRejectedValue(new Error('network error'));
    const results = await searchDistricts({ state: 'CA' });
    expect(results.every((d) => d.state === 'CA')).toBe(true);
  });

  it('filters by name query via mock fallback (case-insensitive)', async () => {
    axios.get.mockRejectedValue(new Error('network error'));
    const results = await searchDistricts({ q: 'los angeles' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toMatch(/Los Angeles/i);
  });

  it('respects limit via mock fallback', async () => {
    axios.get.mockRejectedValue(new Error('network error'));
    const results = await searchDistricts({ limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

describe('searchDistricts (live API path)', () => {
  it('calls Urban Institute API and normalizes results', async () => {
    axios.get.mockResolvedValue({
      data: { results: [{ leaid: 999, lea_name: 'Demo USD', state_abbr: 'TX', enrollment: 500 }] },
    });
    const results = await searchDistricts({ q: 'Demo', state: 'TX' });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(results[0].name).toBe('Demo USD');
  });

  it('falls back to mock data when API throws', async () => {
    axios.get.mockRejectedValue(new Error('network error'));
    const results = await searchDistricts({});
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('getDistrictById (live API path)', () => {
  it('merges directory and finance results', async () => {
    axios.get.mockResolvedValue({
      data: { results: [{ leaid: '0601710', lea_name: 'LA Unified', state_abbr: 'CA', enrollment: 500000, rev_total: 1e9, exp_total: 9e8 }] },
    });
    const district = await getDistrictById('0601710');
    expect(district).not.toBeNull();
    expect(district.id).toBe('0601710');
  });

  it('falls back to mock when directory returns empty', async () => {
    axios.get.mockResolvedValue({ data: { results: [] } });
    const district = await getDistrictById('0601710');
    expect(district).not.toBeNull(); // found in mock
    expect(district.id).toBe('0601710');
  });

  it('falls back to mock when API throws', async () => {
    axios.get.mockRejectedValue(new Error('timeout'));
    const district = await getDistrictById('0601710');
    expect(district).not.toBeNull();
  });

  it('returns null when id is not in mock either', async () => {
    axios.get.mockRejectedValue(new Error('timeout'));
    const district = await getDistrictById('0000000');
    expect(district).toBeNull();
  });

  it('handles finance endpoint failure gracefully (dir ok, fin rejected)', async () => {
    const dirData = { leaid: '0601710', lea_name: 'LA Unified', state_abbr: 'CA', enrollment: 10000 };
    axios.get
      .mockResolvedValueOnce({ data: { results: [dirData] } })
      .mockRejectedValueOnce(new Error('finance unavailable'));
    const district = await getDistrictById('0601710');
    expect(district).not.toBeNull();
    expect(district.name).toBe('LA Unified');
    expect(district.revenueTotal).toBeNull(); // fin was unavailable
  });
});

describe('compareDistricts', () => {
  it('returns details for multiple districts', async () => {
    axios.get.mockResolvedValue({ data: { results: [] } }); // triggers mock fallback
    const results = await compareDistricts(['0601710', '3600077']);
    expect(results.length).toBe(2);
  });

  it('filters out not-found districts', async () => {
    axios.get.mockRejectedValue(new Error('err'));
    const results = await compareDistricts(['0601710', '0000000']);
    expect(results.length).toBe(1);
  });
});
