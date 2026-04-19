function requireLogin(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/login?error=Please+login+to+continue');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.redirect('/admin/login?error=Unauthorized');
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/search');
  }
  next();
}

module.exports = { requireLogin, requireAdmin, redirectIfLoggedIn };
