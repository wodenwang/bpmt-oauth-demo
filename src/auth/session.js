export function currentUser(req) {
  return req.session?.user || null;
}

export function saveUserSession(req, userInfo) {
  req.session.user = {
    userid: userInfo.userid,
    name: userInfo.name || userInfo.userid,
    group: userInfo.group || null,
    role: userInfo.role || null
  };
}

export function clearUserSession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export function requireLogin(req, res, next) {
  if (currentUser(req)) {
    next();
    return;
  }
  res.redirect('/login');
}
