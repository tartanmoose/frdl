const { supabaseAdmin, requireAdmin, send, handleOptions, readBody } = require('./_lib');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;

  const db = supabaseAdmin();

  try {
    // Public: list levels ordered by sort_order
    if (req.method === 'GET') {
      const { data, error } = await db
        .from('levels')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return send(res, 200, { levels: data || [] });
    }

    requireAdmin(req);

    // Add level at a position
    if (req.method === 'POST') {
      const body = await readBody(req);
      const level = body.level;
      let position = body.position; // 1-based, or null/undefined = end

      if (!level || !level.level_id) {
        return send(res, 400, { error: 'level with level_id required' });
      }

      // Check duplicate
      const { data: existing } = await db
        .from('levels')
        .select('id')
        .eq('level_id', String(level.level_id))
        .maybeSingle();
      if (existing) {
        return send(res, 400, { error: 'Level already in ranking' });
      }

      const { data: all } = await db
        .from('levels')
        .select('id, sort_order')
        .order('sort_order', { ascending: true });

      const list = all || [];
      let insertAt = list.length;
      if (position != null && position !== 'end') {
        const p = parseInt(position, 10);
        if (!isNaN(p) && p >= 1) insertAt = Math.min(p - 1, list.length);
      }

      // Shift sort_order for items at or after insertAt
      for (let i = list.length - 1; i >= insertAt; i--) {
        await db
          .from('levels')
          .update({ sort_order: i + 1 })
          .eq('id', list[i].id);
      }

      const { data, error } = await db
        .from('levels')
        .insert({
          level_id: String(level.level_id),
          name: level.name || 'Unknown',
          author: level.author || '',
          difficulty: level.difficulty || '',
          stars: level.stars ?? null,
          sort_order: insertAt
        })
        .select()
        .single();

      if (error) throw error;
      return send(res, 200, { level: data });
    }

    // Reorder entire list (drag-and-drop)
    if (req.method === 'PUT') {
      const body = await readBody(req);
      const order = body.order; // array of level row ids in new order

      if (!Array.isArray(order)) {
        return send(res, 400, { error: 'order array required' });
      }

      for (let i = 0; i < order.length; i++) {
        const { error } = await db
          .from('levels')
          .update({ sort_order: i })
          .eq('id', order[i]);
        if (error) throw error;
      }

      const { data, error } = await db
        .from('levels')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return send(res, 200, { levels: data || [] });
    }

    // Remove level
    if (req.method === 'DELETE') {
      const body = await readBody(req);
      const { id } = body;
      if (!id) return send(res, 400, { error: 'id required' });

      const { error } = await db.from('levels').delete().eq('id', id);
      if (error) throw error;

      // Re-normalize sort_order
      const { data: remaining } = await db
        .from('levels')
        .select('id')
        .order('sort_order', { ascending: true });

      if (remaining) {
        for (let i = 0; i < remaining.length; i++) {
          await db.from('levels').update({ sort_order: i }).eq('id', remaining[i].id);
        }
      }

      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error(err);
    return send(res, status, { error: err.message || 'Server error' });
  }
};
