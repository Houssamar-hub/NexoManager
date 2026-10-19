
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

export const createTeacher = async (req, res) => {
  try {
    const { fullName, email, password, phone, specialization } = req.body;

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Le nom, l'email et le mot de passe sont obligatoires",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
      });
    }

    if (
      phone !== undefined &&
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Le numéro de téléphone est invalide",
      });
    }

    if (
      specialization !== undefined &&
      typeof specialization !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "La spécialité est invalide",
      });
    }

    if (!req.user.center) {
      return res.status(400).json({
        success: false,
        message: "Aucun centre associé à ce compte",
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const teacher = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "teacher",
      center: req.user.center,
      phone: phone?.trim(),
      specialization: specialization?.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Professeur créé avec succès",
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        role: teacher.role,
        center: teacher.center,
        phone: teacher.phone,
        specialization: teacher.specialization,
        status: teacher.status,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    console.error("Create teacher error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du professeur",
    });
  }
};

export const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({
      center: req.user.center,
      role: "teacher",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("Get teachers error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des professeurs",
    });
  }
};

export const getTeacherById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const teacher = await User.findOne({
      _id: req.params.id,
      center: req.user.center,
      role: "teacher",
    }).select("-password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("Get teacher error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const allowedFields = [
      "fullName",
      "email",
      "phone",
      "specialization",
      "status",
    ];

    const fields = Object.keys(req.body);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        success: false,
        message: "Champs invalides ou aucune modification demandée",
      });
    }

    const teacher = await User.findOne({
      _id: req.params.id,
      center: req.user.center,
      role: "teacher",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
      });
    }

    for (const field of fields) {
      const value = req.body[field];

      if (typeof value !== "string") {
        return res.status(400).json({
          success: false,
          message: `Le champ ${field} est invalide`,
        });
      }

      const normalizedValue = value.trim();

      if (["fullName", "email"].includes(field) && !normalizedValue) {
        return res.status(400).json({
          success: false,
          message: `Le champ ${field} est obligatoire`,
        });
      }

      if (field === "email") {
        const normalizedEmail = normalizedValue.toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          return res.status(400).json({
            success: false,
            message: "Format d'email invalide",
          });
        }

        teacher.email = normalizedEmail;
      } else if (field === "status") {
        if (!["active", "inactive"].includes(normalizedValue)) {
          return res.status(400).json({
            success: false,
            message: "Statut invalide",
          });
        }

        teacher.status = normalizedValue;
      } else {
        teacher[field] = normalizedValue;
      }
    }

    await teacher.save();

    return res.status(200).json({
      success: true,
      message: "Professeur modifié avec succès",
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        role: teacher.role,
        center: teacher.center,
        phone: teacher.phone,
        specialization: teacher.specialization,
        status: teacher.status,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
      });
    }

    console.error("Update teacher error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du professeur",
    });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const teacher = await User.findOne({
      _id: req.params.id,
      center: req.user.center,
      role: "teacher",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
      });
    }

    teacher.status = "inactive";
    await teacher.save();

    return res.status(200).json({
      success: true,
      message: "Professeur désactivé avec succès",
    });
  } catch (error) {
    console.error("Deactivate teacher error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation du professeur",
    });
  }
};
