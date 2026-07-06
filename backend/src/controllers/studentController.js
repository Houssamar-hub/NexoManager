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

export const generateEnrollmentCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant d'élève invalide",
      });
    }

    const [student, center, groups] = await Promise.all([
      Student.findOne({
        _id: id,
        center: req.user.center,
      }).lean(),
      Center.findById(req.user.center).lean(),
      Group.find({
        center: req.user.center,
        students: id,
      })
        .select("name subject schoolLevel")
        .lean(),
    ]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable dans ce centre",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 45, bottom: 45, left: 50, right: 50 },
    });

    const certRef = `ATT-${String(student._id).slice(-6).toUpperCase()}`;
    const filename = `attestation-scolarite-${student.registrationNumber || "reg"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    doc.pipe(res);

    const centerName = center?.name || "NexoManager Learning Center";
    const centerPhone = center?.phone || "Non spécifié";
    const centerEmail = center?.email || "contact@center.ma";
    const centerAddress = center?.address || "Maroc";

    // Double frame border
    doc.rect(25, 25, 545, 792).lineWidth(2).strokeColor("#0F172A").stroke();
    doc.rect(29, 29, 537, 784).lineWidth(0.5).strokeColor("#94A3B8").stroke();

    // Center Header
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#0F172A");
    doc.text(centerName.toUpperCase(), 50, 60, { align: "center" });

    doc.font("Helvetica").fontSize(9).fillColor("#64748B");
    doc.text(`${centerAddress} | Tél : ${centerPhone} | Email : ${centerEmail}`, 50, 85, { align: "center" });

    doc.moveTo(80, 108).lineTo(515, 108).lineWidth(1).strokeColor("#CBD5E1").stroke();

    // Document Title Box
    const titleY = 135;
    doc.roundedRect(80, titleY, 435, 38, 4).fill("#0F172A");
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#FFFFFF");
    doc.text("ATTESTATION D'INSCRIPTION & DE SCOLARITÉ", 80, titleY + 11, { align: "center", width: 435 });

    doc.font("Helvetica").fontSize(9).fillColor("#64748B");
    doc.text(`Réf. Dossier : ${certRef} / Année 2025-2026`, 50, titleY + 52, { align: "right" });

    // Official Text Body
    const bodyY = 220;
    doc.font("Helvetica").fontSize(11).fillColor("#1E293B").lineGap(6);
    
    doc.text(
      "La Direction de l'établissement d'enseignement et de soutien scolaire atteste par la présente que :",
      65,
      bodyY,
      { width: 465, align: "justify" }
    );

    // Student Info Card
    const cardY = 265;
    doc.roundedRect(65, cardY, 465, 115, 6).fillAndStroke("#F8FAFC", "#E2E8F0");

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#475569").text("L'élève :", 85, cardY + 16);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F172A").text(`${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`, 175, cardY + 15);

    doc.font("Helvetica").fontSize(10).fillColor("#475569").text("Date de naissance :", 85, cardY + 38);
    const dobFormatted = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("fr-FR", { timeZone: "Africa/Casablanca" }) : "Non renseignée";
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#0F172A").text(dobFormatted, 175, cardY + 38);

    doc.font("Helvetica").fontSize(10).fillColor("#475569").text("Matricule d'inscription :", 85, cardY + 60);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#E11D48").text(student.registrationNumber || "En cours", 175, cardY + 60);

    doc.font("Helvetica").fontSize(10).fillColor("#475569").text("Niveau Pédagogique :", 85, cardY + 82);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#0F172A").text(student.schoolLevel || "Enseignement Général", 175, cardY + 82);

    // Continuation
    const followY = 405;
    doc.font("Helvetica").fontSize(11).fillColor("#1E293B").lineGap(6);
    doc.text(
      "Est régulièrement inscrit(e) au sein de notre centre et suit assidûment les cours et programmes de formation continue au titre de la session académique en cours.",
      65,
      followY,
      { width: 465, align: "justify" }
    );

    // Groups Table if enrolled
    if (groups && groups.length > 0) {
      const groupY = 460;
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0F172A").text("Modules et groupes d'affectation :", 65, groupY);

      doc.rect(65, groupY + 16, 465, 20).fill("#F1F5F9");
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#334155");
      doc.text("Groupe de cours", 75, groupY + 22);
      doc.text("Matière / Discipline", 280, groupY + 22);
      doc.text("Niveau", 430, groupY + 22);

      let currentGY = groupY + 36;
      groups.slice(0, 5).forEach((grp) => {
        doc.rect(65, currentGY, 465, 20).strokeColor("#E2E8F0").stroke();
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#0F172A").text(grp.name, 75, currentGY + 5);
        doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text(grp.subject, 280, currentGY + 5);
        doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text(grp.schoolLevel || "-", 430, currentGY + 5);
        currentGY += 20;
      });
    }

    // Formal conclusion
    const endY = 585;
    doc.font("Helvetica").fontSize(10.5).fillColor("#1E293B").lineGap(4);
    doc.text(
      "La présente attestation est délivrée à l'intéressé(e) sur sa demande pour servir et valoir ce que de droit auprès des organismes publics et privés.",
      65,
      endY,
      { width: 465, align: "justify" }
    );

    // Date & Stamp
    const today = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Casablanca",
    });

    const dateY = 645;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1E293B").text(`Fait à ${centerAddress || "Casablanca"}, le ${today}`, 320, dateY);

    doc.roundedRect(300, dateY + 25, 230, 95, 6).lineWidth(1).strokeColor("#CBD5E1").stroke();
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#475569").text("CACHET ET SIGNATURE DE LA DIRECTION", 310, dateY + 35);
    doc.font("Helvetica").fontSize(8).fillColor("#94A3B8").text(centerName, 310, dateY + 49);

    // Footer
    const footerY = 780;
    doc.font("Helvetica").fontSize(7.5).fillColor("#94A3B8").text("Document officiel certifié généré par NexoManager SaaS pour le compte de l'établissement.", 50, footerY, { align: "center" });

    doc.end();
  } catch (error) {
    console.error("Certificate generation error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la génération de l'attestation de scolarité",
      });
    }
  }
};
