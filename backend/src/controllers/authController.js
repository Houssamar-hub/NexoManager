import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Center from "../models/Center.js";

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "nexomanager_default_secret_key",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export const register = async (req, res) => {
  let createdCenter;

  try {
    const { fullName, email, password, centerName, phone, address } = req.body;

    if (!fullName || !email || !password || !centerName) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être renseignés.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé.",
      });
    }

    createdCenter = await Center.create({
      name: centerName.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
      status: "active",
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin", // The creator of the center is an admin of their center
      center: createdCenter._id,
      phone: phone?.trim() || undefined,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Centre et compte administrateur créés avec succès.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        center: user.center,
      },
      center: {
        id: createdCenter._id,
        name: createdCenter.name,
        email: createdCenter.email,
        phone: createdCenter.phone,
        address: createdCenter.address,
        status: createdCenter.status,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    if (createdCenter) {
      await Center.findByIdAndDelete(createdCenter._id).catch(() => {});
    }

    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du compte.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe obligatoires.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect.",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Votre compte est désactivé. Veuillez contacter votre administrateur.",
      });
    }

    const center = await Center.findById(user.center);
    if (center && center.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "L'accès à ce centre a été suspendu.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        specialization: user.specialization,
        center: user.center,
      },
      center: center
        ? {
            id: center._id,
            name: center.name,
            email: center.email,
            phone: center.phone,
            address: center.address,
            status: center.status,
          }
        : null,
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion.",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const center = req.center || (await Center.findById(req.user.center));

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        specialization: user.specialization,
        center: user.center,
      },
      center: center
        ? {
            id: center._id,
            name: center.name,
            email: center.email,
            phone: center.phone,
            address: center.address,
            status: center.status,
          }
        : null,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil.",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe actuel incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Mot de passe modifié avec succès.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du mot de passe.",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, specialization } = req.body;

    const updates = {};
    if (fullName) updates.fullName = fullName.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (specialization !== undefined) updates.specialization = specialization.trim();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        specialization: user.specialization,
        center: user.center,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil.",
    });
  }
};
