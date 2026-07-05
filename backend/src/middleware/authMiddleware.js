import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Center from "../models/Center.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Accès refusé. Token d'authentification manquant.",
      });
    }

    const secret = process.env.JWT_SECRET || "nexomanager_default_secret_key";
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré.",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Votre compte est désactivé. Veuillez contacter votre administrateur.",
      });
    }

    // Verify associated center
    if (user.center) {
      const center = await Center.findById(user.center);
      if (!center) {
        return res.status(403).json({
          success: false,
          message: "Centre associé introuvable.",
        });
      }
      if (center.status === "inactive") {
        return res.status(403).json({
          success: false,
          message: "L'accès à ce centre a été suspendu.",
        });
      }
      req.center = center;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur d'authentification interne.",
    });
  }
};
