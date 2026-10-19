import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Group from "../models/Group.js";

import {
  generateAbsenceNotifications,
} from "../services/notificationService.js";

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

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(sessionStartTime)) {
      return res.status(400).json({
        success: false,
        message: "Format de l'heure invalide. Utilisez HH:mm",
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
      status: "active",
      students: student,
    });

    if (!groupExists) {
      return res.status(400).json({
        success: false,
        message: "Groupe invalide ou élève non inscrit dans ce groupe",
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
      } catch (notificationError) {
        console.error(
          "Failed to generate absence notification:",
          notificationError.message
        );
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

    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement de la présence",
      error: error.message,
    });
  }
};

export const getAttendances = async (req, res) => {
  try {
    const { student, group, status, date } = req.query;

    const filter = {
      center: req.user.center,
    };

    if (student) filter.student = student;
    if (group) filter.group = group;
    if (status) filter.status = status;

    if (date) {
      const selectedDate = new Date(date);

      if (Number.isNaN(selectedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Date invalide",
        });
      }

      const startOfDay = new Date(selectedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      filter.date = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const attendances = await Attendance.find(filter)
      .populate("student", "firstName lastName registrationNumber")
      .populate("group", "name subject")
      .populate("recordedBy", "fullName")
      .sort({ date: -1, sessionStartTime: 1 });

    return res.status(200).json({
      success: true,
      count: attendances.length,
      attendances,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des présences",
      error: error.message,
    });
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      _id: req.params.id,
      center: req.user.center,
    })
      .populate("student", "firstName lastName registrationNumber")
      .populate("group", "name subject")
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
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la présence",
      error: error.message,
    });
  }
};

export const updateAttendance = async (req, res) => {
  try {
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

    if (status !== undefined) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;

    await attendance.save();

    if (attendance.status === "absent") {
      try {
        await generateAbsenceNotifications(attendance._id);
      } catch (notificationError) {
        console.error(
          "Failed to generate absence notification:",
          notificationError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Présence mise à jour avec succès",
      attendance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la présence",
      error: error.message,
    });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findOneAndDelete({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Présence introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Présence supprimée avec succès",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la présence",
      error: error.message,
    });
  }
};

export const getAttendanceStatistics = async (req, res) => {
  try {
    const { group, date } = req.query;

    const filter = {
      center: req.user.center,
    };

    if (group) filter.group = group;

    if (date) {
      const selectedDate = new Date(date);

      if (Number.isNaN(selectedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Date invalide",
        });
      }

      const startOfDay = new Date(selectedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      filter.date = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
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
    return res.status(500).json({
      success: false,
      message: "Erreur lors du calcul des statistiques",
      error: error.message,
    });
  }
};