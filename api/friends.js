const { supabaseAdmin, requireAdmin, send, handleOptions, readBody } = require('../lib/auth');
const { fetchGdProfile } = require('../lib/gd');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;

  const db = supabaseAdmin();

  try {
    // Public: list all friends
    if (req.method === 'GET') {
      const { data, error } = await db
        .from('friends')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return send(res, 200, { friends: data || [] });
    }

    // Admin only below
    requireAdmin(req);

    // Add friend
    if (req.method === 'POST') {
      const body = await readBody(req);
      const username = (body.username || '').trim();
      if (!username) return send(res, 400, { error: 'Username required' });

      // Always pull a live GDBrowser profile so we store accountID for later refreshes
      const profile = await fetchGdProfile({
        username,
        accountID: body.profile && body.profile.accountID,
        playerID: body.profile && body.profile.playerID
      });

      const now = new Date().toISOString();
      const row = {
        username: profile.username || username,
        profile,
        updated_at: now
      };

      // If this GD account is already on the list (e.g. after a rename), update that row
      if (profile.accountID) {
        const { data: byAcc } = await db
          .from('friends')
          .select('id')
          .eq('profile->>accountID', String(profile.accountID))
          .maybeSingle();
        if (byAcc) {
          const { data, error } = await db
            .from('friends')
            .update(row)
            .eq('id', byAcc.id)
            .select()
            .single();
          if (error) throw error;
          return send(res, 200, { friend: data });
        }
      }

      const { data, error } = await db
        .from('friends')
        .upsert(row, { onConflict: 'username' })
        .select()
        .single();

      if (error) throw error;
      return send(res, 200, { friend: data });
    }

    // Update friend profile (refresh stats)
    if (req.method === 'PUT') {
      const body = await readBody(req);
      const { id, profile } = body;
      if (!id) return send(res, 400, { error: 'id required' });

      const { data, error } = await db
        .from('friends')
        .update({
          profile: profile || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return send(res, 200, { friend: data });
    }

    // Remove friend
    if (req.method === 'DELETE') {
      const body = await readBody(req);
      const { id } = body;
      if (!id) return send(res, 400, { error: 'id required' });

      const { error } = await db.from('friends').delete().eq('id', id);
      if (error) throw error;
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error(err);
    return send(res, status, { error: err.message || 'Server error' });
  }
};
