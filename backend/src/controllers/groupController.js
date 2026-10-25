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

    if (!name || !subject || !schoolLevel) {
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
        status: "active",
      });

      if (!teacherExists) {
        return res.status(400).json({
          success: false,
          message: "Professeur actif introuvable dans ce centre",
        });
      }
    }

    const group = await Group.create({
      name: name.trim(),
      subject: subject.trim(),
      schoolLevel: schoolLevel.trim(),
      description: description?.trim() || undefined,
      teacher: teacher || undefined,
      capacity: capacity ? Number(capacity) : 20,
      schedule: schedule || [],
      center: req.user.center,
      createdBy: req.user._id,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Groupe créé avec succès",
      group,
    });
  } catch (error) {
    console.error("Create group error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du groupe",
    });
  }
};

export const getGroups = async (req, res) => {
  try {
    const { status, subject, schoolLevel, teacher, search } = req.query;

    const filter = {
      center: req.user.center,
    };

    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    if (subject && typeof subject === "string") {
      filter.subject = subject.trim();
    }

    if (schoolLevel && typeof schoolLevel === "string") {
      filter.schoolLevel = schoolLevel.trim();
    }

    if (teacher && mongoose.isValidObjectId(teacher)) {
      filter.teacher = teacher;
    }

    // If teacher role, only allow viewing their assigned groups or center groups
    if (req.user.role === "teacher") {
      // Teachers can see their own groups or all groups in read-only
      // Let's filter to their own groups if requested
      if (req.query.myGroups === "true") {
        filter.teacher = req.user._id;
      }
    }

    if (search && typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [
        { name: searchRegex },
        { subject: searchRegex },
        { schoolLevel: searchRegex },
      ];
    }

    const groups = await Group.find(filter)
      .populate("teacher", "fullName email phone specialization status")
      .populate("students", "firstName lastName registrationNumber schoolLevel status")
      .sort({ createdAt: -1 })
      .lean();

    const formattedGroups = groups.map((g) => ({
      ...g,
      id: g._id,
      enrolledCount: g.students ? g.students.length : 0,
    }));

    return res.status(200).json({
      success: true,
      count: formattedGroups.length,
      groups: formattedGroups,
    });
  } catch (error) {
    console.error("Get groups error:", error);

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
      .populate("teacher", "fullName email phone specialization status")
      .populate(
        "students",
        "firstName lastName registrationNumber schoolLevel parentPhone parentName status"
      )
      .lean();

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Groupe introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      group: {
        ...group,
        id: group._id,
        enrolledCount: group.students ? group.students.length : 0,
      },
    });
  } catch (error) {
    console.error("Get group error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updateGroup = async (req, res) => {
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
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Groupe introuvable",
      });
    }

    const {
      name,
      subject,
      schoolLevel,
      description,
      teacher,
      capacity,
      schedule,
      status,
    } = req.body;

    if (name !== undefined) group.name = name.trim();
    if (subject !== undefined) group.subject = subject.trim();
    if (schoolLevel !== undefined) group.schoolLevel = schoolLevel.trim();
    if (description !== undefined) group.description = description.trim();

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
          status: "active",
        });

        if (!teacherExists) {
          return res.status(400).json({
            success: false,
            message: "Professeur actif introuvable dans ce centre",
          });
        }

        group.teacher = teacher;
      }
    }

    if (capacity !== undefined) {
      const capNum = Number(capacity);
      if (capNum < group.students.length) {
        return res.status(400).json({
          success: false,
          message:
            "La capacité ne peut pas être inférieure au nombre d'élèves déjà inscrits",
        });
      }
      group.capacity = capNum;
    }

    if (schedule !== undefined) {
      group.schedule = schedule;
    }

    if (status !== undefined) {
      group.status = status;
    }

    await group.save();

    return res.status(200).json({
      success: true,
      message: "Groupe modifié avec succès",
      group,
    });
  } catch (error) {
    console.error("Update group error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du groupe",
    });
  }
};

export const addStudentToGroup = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(studentId)) {
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

    if (group.students.some((id) => id.toString() === student._id.toString())) {
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
    console.error("Add student to group error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout de l'élève",
    });
  }
};

export const removeStudentFromGroup = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(studentId)) {
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
      (id) => id.toString() !== studentId.toString()
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
    console.error("Remove student from group error:", error);

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
    console.error("Delete group error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du groupe",
    });
  }
};
