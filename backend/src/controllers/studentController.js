import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Student from "../models/Student.js";
import Group from "../models/Group.js";
import Attendance from "../models/Attendance.js";
import Payment from "../models/Payment.js";
import Center from "../models/Center.js";

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

    if (!firstName || !lastName) {
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

    let parsedDob;
    if (dateOfBirth) {
      parsedDob = new Date(dateOfBirth);
      if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
        return res.status(400).json({
          success: false,
          message: "La date de naissance est invalide",
        });
      }
    }

    const regNum = registrationNumber?.trim() || undefined;

    if (regNum) {
      const existing = await Student.findOne({
        center: req.user.center,
        registrationNumber: regNum,
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Ce numéro d'inscription existe déjà dans ce centre",
        });
      }
    }

    const student = await Student.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: parsedDob,
      gender,
      parentName: parentName?.trim() || undefined,
      parentPhone: parentPhone?.trim() || undefined,
      parentEmail: parentEmail?.trim().toLowerCase() || undefined,
      schoolLevel: schoolLevel?.trim() || undefined,
      registrationNumber: regNum,
      notes: notes?.trim() || undefined,
      status: "active",
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

    console.error("Create student error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'élève",
    });
  }
};

export const getStudents = async (req, res) => {
  try {
    const { status, schoolLevel, search, page, limit } = req.query;

    const filter = {
      center: req.user.center,
    };

    if (status && ["active", "suspended", "left"].includes(status)) {
      filter.status = status;
    }

    if (schoolLevel && typeof schoolLevel === "string" && schoolLevel.trim()) {
      filter.schoolLevel = schoolLevel.trim();
    }

    if (search && typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { registrationNumber: searchRegex },
        { parentPhone: searchRegex },
        { parentName: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [total, students] = await Promise.all([
      Student.countDocuments(filter),
      Student.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      count: students.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      students,
    });
  } catch (error) {
    console.error("Get students error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des élèves",
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const student = await Student.findOne({
      _id: req.params.id,
      center: req.user.center,
    }).lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
      });
    }

    // Fetch student's groups
    const groups = await Group.find({
      center: req.user.center,
      students: student._id,
    })
      .select("_id name subject schoolLevel schedule status")
      .lean();

    // Fetch attendance summary
    const [attendanceTotal, attendancePresent, attendanceAbsent, attendanceLate] =
      await Promise.all([
        Attendance.countDocuments({ center: req.user.center, student: student._id }),
        Attendance.countDocuments({
          center: req.user.center,
          student: student._id,
          status: "present",
        }),
        Attendance.countDocuments({
          center: req.user.center,
          student: student._id,
          status: "absent",
        }),
        Attendance.countDocuments({
          center: req.user.center,
          student: student._id,
          status: "late",
        }),
      ]);

    // Fetch payments summary
    const payments = await Payment.find({
      center: req.user.center,
      student: student._id,
    })
      .sort({ dueDate: -1 })
      .lean();

    let totalBilled = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    for (const p of payments) {
      totalBilled += p.amount;
      totalPaid += p.paidAmount;
      totalRemaining += Math.max(0, p.amount - p.paidAmount);
    }

    return res.status(200).json({
      success: true,
      student: {
        ...student,
        id: student._id,
        groups,
        attendanceStats: {
          total: attendanceTotal,
          present: attendancePresent,
          absent: attendanceAbsent,
          late: attendanceLate,
          attendanceRate:
            attendanceTotal > 0
              ? Math.round(((attendancePresent + attendanceLate) / attendanceTotal) * 100)
              : 0,
        },
        financialStats: {
          totalBilled,
          totalPaid,
          totalRemaining,
          paymentsCount: payments.length,
        },
        recentPayments: payments.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Get student error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

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
    for (const key of Object.keys(req.body)) {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucune information à modifier",
      });
    }

    if (updates.dateOfBirth) {
      const d = new Date(updates.dateOfBirth);
      if (Number.isNaN(d.getTime()) || d > new Date()) {
        return res.status(400).json({
          success: false,
          message: "Date de naissance invalide",
        });
      }
      updates.dateOfBirth = d;
    }

    if (updates.registrationNumber) {
      const reg = updates.registrationNumber.trim();
      const existing = await Student.findOne({
        center: req.user.center,
        registrationNumber: reg,
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Ce numéro d'inscription existe déjà dans ce centre",
        });
      }
      updates.registrationNumber = reg;
    }

    const student = await Student.findOneAndUpdate(
      {
        _id: req.params.id,
        center: req.user.center,
      },
      { $set: updates },
      { new: true, runValidators: true }
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

    console.error("Update student error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification de l'élève",
    });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const studentId = req.params.id;

    // Check if student belongs to the center
    const student = await Student.findOne({
      _id: studentId,
      center: req.user.center,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
      });
    }

    // Safe deletion policy: check for attendance or payment references
    const [hasAttendance, hasPayments] = await Promise.all([
      Attendance.exists({ center: req.user.center, student: studentId }),
      Payment.exists({ center: req.user.center, student: studentId }),
    ]);

    if (hasAttendance || hasPayments) {
      return res.status(400).json({
        success: false,
        message:
          "Cet élève possède un historique de présences ou de paiements. Pour préserver l'intégrité comptable et pédagogique, changez son statut en 'left' (parti) ou 'suspended' au lieu de le supprimer définitivement.",
      });
    }

    // Remove student from any groups
    await Group.updateMany(
      { center: req.user.center, students: studentId },
      { $pull: { students: studentId } }
    );

    await Student.findByIdAndDelete(studentId);

    return res.status(200).json({
      success: true,
      message: "Élève supprimé avec succès",
    });
  } catch (error) {
    console.error("Delete student error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'élève",
    });
  }
};
