const GDB_PROFILE = 'https://gdbrowser.com/api/profile/';

function isProfile(data) {
  return data && typeof data === 'object' && typeof data.username === 'string' && data.username.length > 0;
}

async function fetchOnce(id, query = '') {
  const sep = query ? (query.startsWith('?') ? '&' : '?') : '?';
  const url = GDB_PROFILE + encodeURIComponent(String(id).trim()) + query + sep + 't=' + Date.now();
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'FRDL/1.0 (https://frdl.vercel.app)',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    }
  });
  const text = await res.text();
  if (!text || text.trim() === '-1') {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid GDBrowser response');
  }
  if (!isProfile(data)) {
    throw new Error('Invalid GDBrowser response');
  }
  return data;
}

/**
 * Fetch a live Geometry Dash profile from GDBrowser.
 * Prefer accountID — usernames can change and then look up as -1.
 */
async function fetchGdProfile({ username, accountID, playerID } = {}) {
  const attempts = [];
  if (accountID) attempts.push({ id: accountID, query: '' });
  if (username) attempts.push({ id: username, query: '' });
  if (playerID) attempts.push({ id: playerID, query: '?player=1' });

  if (!attempts.length) {
    const err = new Error('Username required');
    err.statusCode = 400;
    throw err;
  }

  let lastErr = null;
  for (const attempt of attempts) {
    try {
      return await fetchOnce(attempt.id, attempt.query);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('User not found');
}

module.exports = { fetchGdProfile, isProfile };
