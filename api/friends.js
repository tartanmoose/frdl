const { supabaseAdmin, requireAdmin, send, handleOptions, readBody } = require('../lib/auth');

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
      const profile = body.profile || {};

      if (!username) return send(res, 400, { error: 'Username required' });

      const { data, error } = await db
        .from('friends')
        .upsert(
          {
            username,
            profile,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'username' }
        )
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
