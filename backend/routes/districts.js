const express = require('express');
const { searchDistricts, getDistrictById, compareDistricts } = require('../services/districtService');

const router = express.Router();

/**
 * GET /api/districts/search
 * Query params:
 *   q      - district name (partial match)
 *   state  - two-letter state abbreviation (e.g. "CA")
 *   limit  - number of results (default 20, max 50)
 *
 * Example: /api/districts/search?q=unified&state=CA&limit=10
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q = '', state = '', limit } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const districts = await searchDistricts({ q, state, limit: parsedLimit });
    res.json({ count: districts.length, results: districts });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/districts/compare
 * Query params:
 *   ids - comma-separated NCES lea IDs (2–5 districts)
 *
 * Example: /api/districts/compare?ids=0601710,0622710,0628530
 */
router.get('/compare', async (req, res, next) => {
  try {
    const { ids = '' } = req.query;
    const idList = ids.split(',').map((s) => s.trim()).filter(Boolean);

    if (idList.length < 2) {
      return res.status(400).json({ error: 'Provide at least 2 district IDs in the ids param' });
    }
    if (idList.length > 5) {
      return res.status(400).json({ error: 'Cannot compare more than 5 districts at once' });
    }

    const districts = await compareDistricts(idList);
    res.json({ count: districts.length, results: districts });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/districts/:id
 * Path param: NCES lea ID
 *
 * Example: /api/districts/0601710
 */
router.get('/:id', async (req, res, next) => {
  try {
    const district = await getDistrictById(req.params.id);
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }
    res.json(district);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
