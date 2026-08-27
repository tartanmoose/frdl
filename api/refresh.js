const { supabaseAdmin, send, handleOptions } = require('../lib/auth');
const { fetchGdProfile } = require('../lib/gd');

const STALE_MS = 60 * 1000; // skip GDBrowser if we refreshed within the last minute (unless force)

function wantsForce(req) {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true') return true;
  } catch {
    /* ignore */
  }
  return false;
}

function profileOf(f) {
  return f && f.profile && typeof f.profile === 'object' ? f.profile : {};
}

async function saveFriend(db, friend, profile) {
  const now = new Date().toISOString();
  const patch = { profile, updated_at: now };

  if (profile.username && profile.username !== friend.username) {
    const { data, error } = await db
      .from('friends')
      .update({ ...patch, username: profile.username })
      .eq('id', friend.id)
      .select()
      .single();

    // Unique username conflict (e.g. already added under the new name) — keep old username, still save stats
    if (error && error.code === '23505') {
      const retry = await db
        .from('friends')
        .update(patch)
        .eq('id', friend.id)
        .select()
        .single();
      if (retry.error) throw retry.error;
      return retry.data;
    }
    if (error) throw error;
    return data;
  }

  const { data, error } = await db
    .from('friends')
    .update(patch)
    .eq('id', friend.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  const db = supabaseAdmin();
  const force = wantsForce(req);

  try {
    const { data: list, error } = await db
      .from('friends')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;

    const friends = list || [];
    if (!friends.length) {
      return send(res, 200, { friends: [], errors: 0, skipped: 0, updated: 0 });
    }

    const outcomes = await Promise.allSettled(
      friends.map(async (friend) => {
        const age = Date.now() - new Date(friend.updated_at).getTime();
        if (!force && Number.isFinite(age) && age < STALE_MS) {
          return { friend, skipped: true };
        }
        const p = profileOf(friend);
        const profile = await fetchGdProfile({
          username: friend.username,
          accountID: p.accountID,
          playerID: p.playerID
        });
        const saved = await saveFriend(db, friend, profile);
        return { friend: saved, skipped: false };
      })
    );

    const next = [];
    let errors = 0;
    let skipped = 0;
    let updated = 0;
    const failed = [];

    outcomes.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        next.push(result.value.friend);
        if (result.value.skipped) skipped++;
        else updated++;
      } else {
        next.push(friends[i]);
        errors++;
        failed.push({
          username: friends[i].username,
          error: result.reason && result.reason.message ? result.reason.message : 'Failed'
        });
      }
    });

    return send(res, 200, { friends: next, errors, skipped, updated, failed });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error(err);
    return send(res, status, { error: err.message || 'Server error' });
  }
};
