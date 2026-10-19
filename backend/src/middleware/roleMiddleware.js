
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas la permission d'accéder à cette ressource.",
      });
    }

    next();
  };
};
