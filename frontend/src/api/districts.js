const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function searchDistricts({ q = '', state = '', limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (state) params.set('state', state);
  params.set('limit', limit);
  const res = await fetch(`${BASE_URL}/districts/search?${params}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getDistrict(id) {
  const res = await fetch(`${BASE_URL}/districts/${id}`);
  if (!res.ok) throw new Error('District not found');
  return res.json();
}

export async function compareDistricts(ids) {
  const params = new URLSearchParams({ ids: ids.join(',') });
  const res = await fetch(`${BASE_URL}/districts/compare?${params}`);
  if (!res.ok) throw new Error('Compare failed');
  return res.json();
}
