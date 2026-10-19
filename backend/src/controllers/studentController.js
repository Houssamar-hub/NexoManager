
import Student from "../models/Student.js";

export const createStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      parentName,
      parentPhone,
      parentEmail,
      schoolLevel,
      registrationNumber,
      notes,
    } = req.body;

    if (
      typeof firstName !== "string" ||
      !firstName.trim() ||
      typeof lastName !== "string" ||
      !lastName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Le prénom et le nom sont obligatoires",
      });
    }

    if (!req.user.center) {
      return res.status(400).json({
        success: false,
        message: "Aucun centre associé à ce compte",
      });
    }

    if (
      gender !== undefined &&
      !["male", "female"].includes(gender)
    ) {
      return res.status(400).json({
        success: false,
        message: "Le genre est invalide",
      });
    }

    if (dateOfBirth !== undefined && dateOfBirth !== "") {
      const date = new Date(dateOfBirth);

      if (
        Number.isNaN(date.getTime()) ||
        date > new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "La date de naissance est invalide",
        });
      }
    }

    const student = await Student.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth || undefined,
      gender,
      parentName,
      parentPhone,
      parentEmail,
      schoolLevel,
      registrationNumber: registrationNumber || undefined,
      notes,
      center: req.user.center,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Élève ajouté avec succès",
      student,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ce numéro d'inscription existe déjà dans ce centre",
      });
    }

    console.error("Create student error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'élève",
    });
  }
};

export const getStudents = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {
      center: req.user.center,
    };

    if (status && ["active", "suspended", "left"].includes(status)) {
      filter.status = status;
    }

    if (search && typeof search === "string") {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { registrationNumber: searchRegex },
        { parentPhone: searchRegex },
      ];
    }

    const students = await Student.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get students error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des élèves",
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    console.error("Get student error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const allowedFields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "parentName",
      "parentPhone",
      "parentEmail",
      "schoolLevel",
      "registrationNumber",
      "status",
      "notes",
    ];

    const updates = {};
    const fields = Object.keys(req.body);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucune information à modifier",
      });
    }

    const invalidFields = fields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Certains champs ne peuvent pas être modifiés",
      });
    }

    for (const field of fields) {
      const value = req.body[field];

      if (
        value !== null &&
        value !== undefined &&
        typeof value !== "string" &&
        field !== "dateOfBirth"
      ) {
        return res.status(400).json({
          success: false,
          message: `Le champ ${field} est invalide`,
        });
      }

      updates[field] =
        typeof value === "string" ? value.trim() : value;
    }

    if (
      ("firstName" in updates && !updates.firstName) ||
      ("lastName" in updates && !updates.lastName)
    ) {
      return res.status(400).json({
        success: false,
        message: "Le prénom et le nom ne peuvent pas être vides",
      });
    }

    if (
      updates.gender !== undefined &&
      !["male", "female"].includes(updates.gender)
    ) {
      return res.status(400).json({
        success: false,
        message: "Le genre est invalide",
      });
    }

    if (
      updates.status !== undefined &&
      !["active", "suspended", "left"].includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Le statut est invalide",
      });
    }

    if (updates.dateOfBirth === "") {
      updates.dateOfBirth = undefined;
    } else if (updates.dateOfBirth !== undefined) {
      const date = new Date(updates.dateOfBirth);

      if (
        Number.isNaN(date.getTime()) ||
        date > new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "La date de naissance est invalide",
        });
      }

      updates.dateOfBirth = date;
    }

    if (updates.parentEmail) {
      updates.parentEmail = updates.parentEmail.toLowerCase();
    }

    if (updates.registrationNumber === "") {
      updates.registrationNumber = undefined;
    }

    const student = await Student.findOneAndUpdate(
      {
        _id: req.params.id,
        center: req.user.center,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Élève modifié avec succès",
      student,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ce numéro d'inscription existe déjà dans ce centre",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Identifiant ou données invalides",
      });
    }

    console.error("Update student error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification de l'élève",
    });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Élève supprimé avec succès",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    console.error("Delete student error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'élève",
    });
  }
};
