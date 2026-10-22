import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Center from "../models/Center.js";


export const register = async (req, res) => {
  let createdCenter;

  try {
    const { fullName, email, password, centerName } = req.body;

    if (!fullName || !email || !password || !centerName) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont obligatoires",
      });
    }

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof centerName !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Format des données invalide",
      });
    }

    if (
      !fullName.trim() ||
      !centerName.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Veuillez vérifier les informations saisies",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    createdCenter = await Center.create({
      name: centerName.trim(),
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "manager",
      center: createdCenter._id,
    });

    return res.status(201).json({
      success: true,
      message: "Centre et compte créés avec succès",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        center: user.center,
      },
      center: {
        id: createdCenter._id,
        name: createdCenter.name,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    if (createdCenter) {
      await Center.findByIdAndDelete(createdCenter._id).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    console.error("Register error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du compte",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe obligatoires",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Votre compte est désactivé",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        center: user.center,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};