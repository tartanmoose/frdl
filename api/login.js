const { getEnv, createToken, send, handleOptions, readBody } = require('./_lib');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const password = (body.password || '').trim();

    if (!password) {
      return send(res, 400, { error: 'Password required' });
    }

    if (password !== getEnv('ADMIN_PASSWORD')) {
      return send(res, 401, { error: 'Wrong password' });
    }

    const token = createToken();
    return send(res, 200, { token, expiresInDays: 7 });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: err.message || 'Server error' });
  }
};
