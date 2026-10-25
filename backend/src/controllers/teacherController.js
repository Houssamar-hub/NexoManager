import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Group from "../models/Group.js";

export const createTeacher = async (req, res) => {
  try {
    const { fullName, email, password, phone, specialization } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Le nom, l'email et le mot de passe sont obligatoires",
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
      phone: phone?.trim() || undefined,
      specialization: specialization?.trim() || undefined,
      status: "active",
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
        createdAt: teacher.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    console.error("Create teacher error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du professeur",
    });
  }
};

export const getTeachers = async (req, res) => {
  try {
    const { search, status } = req.query;

    const filter = {
      center: req.user.center,
      role: "teacher",
    };

    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    if (search && typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { specialization: searchRegex },
      ];
    }

    const teachers = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Attach assigned groups count
    const teacherIds = teachers.map((t) => t._id);
    const groups = await Group.find({
      center: req.user.center,
      teacher: { $in: teacherIds },
    })
      .select("_id name subject teacher")
      .lean();

    const teachersWithGroups = teachers.map((t) => {
      const assignedGroups = groups.filter(
        (g) => g.teacher && g.teacher.toString() === t._id.toString()
      );
      return {
        ...t,
        id: t._id,
        assignedGroups,
        groupsCount: assignedGroups.length,
      };
    });

    return res.status(200).json({
      success: true,
      count: teachersWithGroups.length,
      teachers: teachersWithGroups,
    });
  } catch (error) {
    console.error("Get teachers error:", error);

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
    })
      .select("-password")
      .lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
      });
    }

    const assignedGroups = await Group.find({
      center: req.user.center,
      teacher: teacher._id,
    })
      .select("_id name subject schoolLevel capacity students schedule status")
      .lean();

    return res.status(200).json({
      success: true,
      teacher: {
        ...teacher,
        id: teacher._id,
        assignedGroups,
        groupsCount: assignedGroups.length,
      },
    });
  } catch (error) {
    console.error("Get teacher error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const allowedFields = [
      "fullName",
      "email",
      "phone",
      "specialization",
      "status",
    ];

    const updates = {};
    for (const key of Object.keys(req.body)) {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucune modification demandée",
      });
    }

    if (updates.email) {
      updates.email = updates.email.trim().toLowerCase();
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: req.params.id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Cet email est déjà utilisé",
        });
      }
    }

    const teacher = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        center: req.user.center,
        role: "teacher",
      },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
      });
    }

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
        updatedAt: teacher.updatedAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    console.error("Update teacher error:", error);

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

    // Toggle or deactivate
    teacher.status = teacher.status === "active" ? "inactive" : "active";
    await teacher.save();

    return res.status(200).json({
      success: true,
      message: `Statut du professeur mis à jour (${teacher.status})`,
      status: teacher.status,
    });
  } catch (error) {
    console.error("Deactivate teacher error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut du professeur",
    });
  }
};
