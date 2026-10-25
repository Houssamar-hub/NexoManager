import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Group from "../models/Group.js";
import { generateAbsenceNotifications } from "../services/notificationService.js";

// Helper to check if teacher can manage group
const canManageGroup = async (user, groupId, centerId) => {
  if (user.role === "admin" || user.role === "manager") return true;

  const group = await Group.findOne({
    _id: groupId,
    center: centerId,
  });

  if (!group) return false;
  return group.teacher && group.teacher.toString() === user._id.toString();
};

export const createAttendance = async (req, res) => {
  try {
    const {
      student,
      group,
      date,
      sessionStartTime,
      status,
      notes,
    } = req.body;

    if (!student || !group || !date || !sessionStartTime) {
      return res.status(400).json({
        success: false,
        message: "Les champs obligatoires sont manquants",
      });
    }

    if (
      !["present", "absent", "late", "excused"].includes(
        status || "present"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Statut de présence invalide",
      });
    }

    // Teacher permission check
    const allowed = await canManageGroup(req.user, group, req.user.center);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas l'autorisation d'enregistrer les présences pour ce groupe",
      });
    }

    const attendanceDate = new Date(date);
    if (Number.isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Date invalide",
      });
    }

    const studentExists = await Student.findOne({
      _id: student,
      center: req.user.center,
      status: "active",
    });

    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable ou inactif",
      });
    }

    const groupExists = await Group.findOne({
      _id: group,
      center: req.user.center,
      students: student,
    });

    if (!groupExists) {
      return res.status(400).json({
        success: false,
        message: "L'élève n'est pas inscrit dans ce groupe",
      });
    }

    const attendance = await Attendance.create({
      student,
      group,
      center: req.user.center,
      date: attendanceDate,
      sessionStartTime,
      status: status || "present",
      notes,
      recordedBy: req.user._id,
    });

    if (attendance.status === "absent") {
      try {
        await generateAbsenceNotifications(attendance._id);
      } catch (err) {
        console.error("Failed to generate absence notification:", err.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Présence enregistrée avec succès",
      attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "La présence de cet élève est déjà enregistrée pour cette séance",
      });
    }

    console.error("Create attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement de la présence",
    });
  }
};

export const recordBulkAttendance = async (req, res) => {
  try {
    const { group, date, sessionStartTime, records } = req.body;

    if (!group || !date || !sessionStartTime || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "Données de présence incomplètes",
      });
    }

    // Teacher authorization
    const allowed = await canManageGroup(req.user, group, req.user.center);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas l'autorisation d'enregistrer les présences pour ce groupe",
      });
    }

    const targetDate = new Date(date);
    if (Number.isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Date invalide",
      });
    }

    const savedRecords = [];
    const errors = [];

    for (const record of records) {
      try {
        const updated = await Attendance.findOneAndUpdate(
          {
            center: req.user.center,
            group,
            student: record.student,
            date: targetDate,
            sessionStartTime,
          },
          {
            $set: {
              status: record.status,
              notes: record.notes,
              recordedBy: req.user._id,
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

        savedRecords.push(updated);

        if (updated.status === "absent") {
          await generateAbsenceNotifications(updated._id).catch(() => {});
        }
      } catch (err) {
        errors.push({ student: record.student, error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${savedRecords.length} présence(s) enregistrée(s) avec succès`,
      savedCount: savedRecords.length,
      errorsCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement groupé des présences",
    });
  }
};

export const getAttendances = async (req, res) => {
  try {
    const { student, group, status, date, startDate, endDate } = req.query;

    const filter = {
      center: req.user.center,
    };

    if (student && mongoose.isValidObjectId(student)) filter.student = student;
    if (group && mongoose.isValidObjectId(group)) filter.group = group;
    if (status && ["present", "absent", "late", "excused"].includes(status)) {
      filter.status = status;
    }

    if (date) {
      const selectedDate = new Date(date);
      if (!Number.isNaN(selectedDate.getTime())) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        filter.date = { $gte: startOfDay, $lte: endOfDay };
      }
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setUTCHours(23, 59, 59, 999);
          filter.date.$lte = end;
        }
      }
    }

    const attendances = await Attendance.find(filter)
      .populate("student", "firstName lastName registrationNumber schoolLevel")
      .populate("group", "name subject schoolLevel")
      .populate("recordedBy", "fullName role")
      .sort({ date: -1, sessionStartTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: attendances.length,
      attendances,
    });
  } catch (error) {
    console.error("Get attendances error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des présences",
    });
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const attendance = await Attendance.findOne({
      _id: req.params.id,
      center: req.user.center,
    })
      .populate("student", "firstName lastName registrationNumber schoolLevel")
      .populate("group", "name subject schoolLevel")
      .populate("recordedBy", "fullName");

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Présence introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const { status, notes } = req.body;

    if (
      status !== undefined &&
      !["present", "absent", "late", "excused"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Statut de présence invalide",
      });
    }

    const attendance = await Attendance.findOne({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Présence introuvable",
      });
    }

    // Teacher permission check
    const allowed = await canManageGroup(req.user, attendance.group, req.user.center);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas l'autorisation de modifier cette présence",
      });
    }

    if (status !== undefined) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;

    await attendance.save();

    if (attendance.status === "absent") {
      try {
        await generateAbsenceNotifications(attendance._id);
      } catch (err) {
        console.error("Failed to generate absence notification:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Présence mise à jour avec succès",
      attendance,
    });
  } catch (error) {
    console.error("Update attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la présence",
    });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const attendance = await Attendance.findOne({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Présence introuvable",
      });
    }

    // Only manager/admin or the group teacher can delete
    const allowed = await canManageGroup(req.user, attendance.group, req.user.center);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas l'autorisation de supprimer cette présence",
      });
    }

    await Attendance.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Présence supprimée avec succès",
    });
  } catch (error) {
    console.error("Delete attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la présence",
    });
  }
};

export const getAttendanceStatistics = async (req, res) => {
  try {
    const { group, date, startDate, endDate } = req.query;

    const filter = {
      center: req.user.center,
    };

    if (group && mongoose.isValidObjectId(group)) filter.group = group;

    if (date) {
      const selectedDate = new Date(date);
      if (!Number.isNaN(selectedDate.getTime())) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        filter.date = { $gte: startOfDay, $lte: endOfDay };
      }
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setUTCHours(23, 59, 59, 999);
          filter.date.$lte = end;
        }
      }
    }

    const [total, present, absent, late, excused] = await Promise.all([
      Attendance.countDocuments(filter),
      Attendance.countDocuments({ ...filter, status: "present" }),
      Attendance.countDocuments({ ...filter, status: "absent" }),
      Attendance.countDocuments({ ...filter, status: "late" }),
      Attendance.countDocuments({ ...filter, status: "excused" }),
    ]);

    const attendanceRate =
      total > 0
        ? Math.round(((present + late) / total) * 10000) / 100
        : 0;

    return res.status(200).json({
      success: true,
      statistics: {
        total,
        present,
        absent,
        late,
        excused,
        attendanceRate,
      },
    });
  } catch (error) {
    console.error("Attendance statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du calcul des statistiques de présence",
    });
  }
};
