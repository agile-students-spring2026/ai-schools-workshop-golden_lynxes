const request = require('supertest');
const app = require('../server');

jest.mock('../services/districtService', () => ({
  searchDistricts: jest.fn(),
  getDistrictById: jest.fn(),
  compareDistricts: jest.fn(),
}));

const { searchDistricts, getDistrictById, compareDistricts } = require('../services/districtService');

const MOCK_DISTRICT = {
  id: '0601710',
  name: 'Los Angeles Unified',
  state: 'CA',
  city: 'Los Angeles',
  enrollment: 596937,
  expenditurePerPupil: 18093,
  graduationRate: 82.3,
};

afterEach(() => jest.clearAllMocks());

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/districts/search', () => {
  it('returns search results', async () => {
    searchDistricts.mockResolvedValue([MOCK_DISTRICT]);
    const res = await request(app).get('/api/districts/search?q=los+angeles&state=CA');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.results[0].name).toBe('Los Angeles Unified');
  });

  it('caps limit at 50', async () => {
    searchDistricts.mockResolvedValue([]);
    await request(app).get('/api/districts/search?limit=200');
    expect(searchDistricts).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
  });

  it('defaults limit to 20', async () => {
    searchDistricts.mockResolvedValue([]);
    await request(app).get('/api/districts/search');
    expect(searchDistricts).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
  });

  it('returns 500 when service throws', async () => {
    searchDistricts.mockRejectedValue(new Error('boom'));
    const res = await request(app).get('/api/districts/search');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/districts/compare', () => {
  it('returns comparison results', async () => {
    compareDistricts.mockResolvedValue([MOCK_DISTRICT, { ...MOCK_DISTRICT, id: '3600077', name: 'NYC' }]);
    const res = await request(app).get('/api/districts/compare?ids=0601710,3600077');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });

  it('returns 400 when fewer than 2 ids provided', async () => {
    const res = await request(app).get('/api/districts/compare?ids=0601710');
    expect(res.status).toBe(400);
  });

  it('returns 400 when more than 5 ids provided', async () => {
    const res = await request(app).get('/api/districts/compare?ids=1,2,3,4,5,6');
    expect(res.status).toBe(400);
  });

  it('returns 400 when ids param is empty', async () => {
    const res = await request(app).get('/api/districts/compare?ids=');
    expect(res.status).toBe(400);
  });

  it('returns 400 when ids param is omitted entirely', async () => {
    const res = await request(app).get('/api/districts/compare');
    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    compareDistricts.mockRejectedValue(new Error('boom'));
    const res = await request(app).get('/api/districts/compare?ids=0601710,3600077');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/districts/:id', () => {
  it('returns a district by id', async () => {
    getDistrictById.mockResolvedValue(MOCK_DISTRICT);
    const res = await request(app).get('/api/districts/0601710');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('0601710');
  });

  it('returns 404 when district not found', async () => {
    getDistrictById.mockResolvedValue(null);
    const res = await request(app).get('/api/districts/0000000');
    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    getDistrictById.mockRejectedValue(new Error('boom'));
    const res = await request(app).get('/api/districts/0601710');
    expect(res.status).toBe(500);
  });
});

describe('GET unknown route', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
