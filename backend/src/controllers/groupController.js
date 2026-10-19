
import mongoose from "mongoose";
import Group from "../models/Group.js";
import Student from "../models/Student.js";
import User from "../models/User.js";

export const createGroup = async (req, res) => {
  try {
    const {
      name,
      subject,
      schoolLevel,
      description,
      teacher,
      capacity,
      schedule,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof subject !== "string" ||
      !subject.trim() ||
      typeof schoolLevel !== "string" ||
      !schoolLevel.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Le nom, la matière et le niveau sont obligatoires",
      });
    }

    if (!req.user.center) {
      return res.status(400).json({
        success: false,
        message: "Aucun centre associé à ce compte",
      });
    }

    if (
      capacity !== undefined &&
      (!Number.isInteger(capacity) || capacity < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "La capacité doit être un entier positif",
      });
    }

    if (teacher) {
      if (!mongoose.isValidObjectId(teacher)) {
        return res.status(400).json({
          success: false,
          message: "Identifiant du professeur invalide",
        });
      }

      const teacherExists = await User.findOne({
        _id: teacher,
        center: req.user.center,
        role: "teacher",
      });

      if (!teacherExists) {
        return res.status(400).json({
          success: false,
          message: "Professeur introuvable dans ce centre",
        });
      }
    }

    if (schedule !== undefined && !Array.isArray(schedule)) {
      return res.status(400).json({
        success: false,
        message: "Le planning doit être une liste",
      });
    }

    if (schedule) {
      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;

      for (const slot of schedule) {
        if (
          !slot ||
          !validDays.includes(slot.day) ||
          typeof slot.startTime !== "string" ||
          typeof slot.endTime !== "string" ||
          !validTime.test(slot.startTime) ||
          !validTime.test(slot.endTime) ||
          slot.startTime >= slot.endTime
        ) {
          return res.status(400).json({
            success: false,
            message: "Un créneau du planning est invalide",
          });
        }
      }
    }

    const group = await Group.create({
      name: name.trim(),
      subject: subject.trim(),
      schoolLevel: schoolLevel.trim(),
      description,
      teacher: teacher || undefined,
      capacity: capacity ?? 20,
      schedule: schedule ?? [],
      center: req.user.center,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Groupe créé avec succès",
      group,
    });
  } catch (error) {
    console.error("Create group error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du groupe",
    });
  }
};

export const getGroups = async (req, res) => {
  try {
    const filter = {
      center: req.user.center,
    };

    if (req.query.status) {
      if (!["active", "inactive"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Statut invalide",
        });
      }

      filter.status = req.query.status;
    }

    const groups = await Group.find(filter)
      .populate("teacher", "fullName email")
      .populate("students", "firstName lastName registrationNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error("Get groups error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des groupes",
    });
  }
};

export const getGroupById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const group = await Group.findOne({
      _id: req.params.id,
      center: req.user.center,
    })
      .populate("teacher", "fullName email")
      .populate("students", "firstName lastName registrationNumber");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Groupe introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Get group error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "subject",
      "schoolLevel",
      "description",
      "teacher",
      "capacity",
      "schedule",
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

    const group = await Group.findOne({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Groupe introuvable",
      });
    }

    const { name, subject, schoolLevel, description, teacher, capacity, schedule, status } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Nom invalide",
        });
      }

      group.name = name.trim();
    }

    if (subject !== undefined) {
      if (typeof subject !== "string" || !subject.trim()) {
        return res.status(400).json({
          success: false,
          message: "Matière invalide",
        });
      }

      group.subject = subject.trim();
    }

    if (schoolLevel !== undefined) {
      if (typeof schoolLevel !== "string" || !schoolLevel.trim()) {
        return res.status(400).json({
          success: false,
          message: "Niveau invalide",
        });
      }

      group.schoolLevel = schoolLevel.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description invalide",
        });
      }

      group.description = description.trim();
    }

    if (teacher !== undefined) {
      if (teacher === null || teacher === "") {
        group.teacher = undefined;
      } else {
        if (!mongoose.isValidObjectId(teacher)) {
          return res.status(400).json({
            success: false,
            message: "Identifiant du professeur invalide",
          });
        }

        const teacherExists = await User.findOne({
          _id: teacher,
          center: req.user.center,
          role: "teacher",
        });

        if (!teacherExists) {
          return res.status(400).json({
            success: false,
            message: "Professeur introuvable dans ce centre",
          });
        }

        group.teacher = teacher;
      }
    }

    if (capacity !== undefined) {
      if (!Number.isInteger(capacity) || capacity < 1) {
        return res.status(400).json({
          success: false,
          message: "Capacité invalide",
        });
      }

      if (capacity < group.students.length) {
        return res.status(400).json({
          success: false,
          message: "La capacité ne peut pas être inférieure au nombre d'élèves inscrits",
        });
      }

      group.capacity = capacity;
    }

    if (schedule !== undefined) {
      if (!Array.isArray(schedule)) {
        return res.status(400).json({
          success: false,
          message: "Le planning doit être une liste",
        });
      }

      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;

      for (const slot of schedule) {
        if (
          !slot ||
          !validDays.includes(slot.day) ||
          typeof slot.startTime !== "string" ||
          typeof slot.endTime !== "string" ||
          !validTime.test(slot.startTime) ||
          !validTime.test(slot.endTime) ||
          slot.startTime >= slot.endTime
        ) {
          return res.status(400).json({
            success: false,
            message: "Un créneau du planning est invalide",
          });
        }
      }

      group.schedule = schedule;
    }

    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Statut invalide",
        });
      }

      group.status = status;
    }

    await group.save();

    return res.status(200).json({
      success: true,
      message: "Groupe modifié avec succès",
      group,
    });
  } catch (error) {
    console.error("Update group error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du groupe",
    });
  }
};

export const addStudentToGroup = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant du groupe invalide",
      });
    }

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de l'élève invalide",
      });
    }

    const group = await Group.findOne({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Groupe introuvable",
      });
    }

    const student = await Student.findOne({
      _id: studentId,
      center: req.user.center,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève actif introuvable dans ce centre",
      });
    }

    if (group.students.some((id) => id.equals(student._id))) {
      return res.status(409).json({
        success: false,
        message: "Cet élève est déjà inscrit dans ce groupe",
      });
    }

    if (group.students.length >= group.capacity) {
      return res.status(400).json({
        success: false,
        message: "La capacité maximale du groupe est atteinte",
      });
    }

    group.students.push(student._id);
    await group.save();

    return res.status(200).json({
      success: true,
      message: "Élève ajouté au groupe avec succès",
      group,
    });
  } catch (error) {
    console.error("Add student to group error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout de l'élève",
    });
  }
};

export const removeStudentFromGroup = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !mongoose.isValidObjectId(studentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const group = await Group.findOne({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Groupe introuvable",
      });
    }

    const initialLength = group.students.length;

    group.students = group.students.filter(
      (id) => !id.equals(studentId)
    );

    if (group.students.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Cet élève n'est pas inscrit dans ce groupe",
      });
    }

    await group.save();

    return res.status(200).json({
      success: true,
      message: "Élève retiré du groupe avec succès",
      group,
    });
  } catch (error) {
    console.error("Remove student from group error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors du retrait de l'élève",
    });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const group = await Group.findOneAndDelete({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Groupe introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Groupe supprimé avec succès",
    });
  } catch (error) {
    console.error("Delete group error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du groupe",
    });
  }
};
