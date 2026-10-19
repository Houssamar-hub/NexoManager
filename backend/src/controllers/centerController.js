
import Center from "../models/Center.js";

export const getMyCenter = async (req, res) => {
  try {
    if (!req.user.center) {
      return res.status(404).json({
        success: false,
        message: "Aucun centre associé à ce compte",
      });
    }

    const center = await Center.findById(req.user.center);

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "Centre introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      center,
    });
  } catch (error) {
    console.error("Get center error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updateMyCenter = async (req, res) => {
  try {
    if (!req.user.center) {
      return res.status(404).json({
        success: false,
        message: "Aucun centre associé à ce compte",
      });
    }

    const { name, email, phone, address } = req.body;

    if (
      name === undefined &&
      email === undefined &&
      phone === undefined &&
      address === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Aucune information à modifier",
      });
    }

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Le nom du centre est invalide",
        });
      }

      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string") {
        return res.status(400).json({
          success: false,
          message: "L'email est invalide",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (
        normalizedEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      ) {
        return res.status(400).json({
          success: false,
          message: "Format d'email invalide",
        });
      }

      updates.email = normalizedEmail || undefined;
    }

    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Le numéro de téléphone est invalide",
        });
      }

      updates.phone = phone.trim();
    }

    if (address !== undefined) {
      if (typeof address !== "string") {
        return res.status(400).json({
          success: false,
          message: "L'adresse est invalide",
        });
      }

      updates.address = address.trim();
    }

    const center = await Center.findByIdAndUpdate(
      req.user.center,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "Centre introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Informations du centre mises à jour avec succès",
      center,
    });
  } catch (error) {
    console.error("Update center error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};
