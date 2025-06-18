const ensureAuthenticated = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized its not working" });
};

module.exports = { ensureAuthenticated };
