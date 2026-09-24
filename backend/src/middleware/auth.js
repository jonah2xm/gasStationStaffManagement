const ensureAuthenticated = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized its not working" });
};

/** Réservé aux rôles listés (à placer après ensureAuthenticated). */
const exigerRoles = (...roles) => (req, res, next) => {
  if (roles.includes(req.session?.user?.role)) return next();
  res.status(403).json({ message: "Action non autorisée pour votre rôle." });
};

/**
 * Le chef de station ne supprime plus ses documents lui-même : il en demande
 * l'annulation (voir demandeController.js).
 */
const interdireChefStation = (req, res, next) => {
  if (req.session?.user?.role !== "chef station") return next();
  res.status(403).json({
    message:
      "Un chef de station ne peut pas supprimer ce document : faites une demande d'annulation depuis la liste.",
  });
};

module.exports = { ensureAuthenticated, exigerRoles, interdireChefStation };
