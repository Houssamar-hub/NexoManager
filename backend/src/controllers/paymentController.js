import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Payment from "../models/Payment.js";
import Student from "../models/Student.js";
import Group from "../models/Group.js";
import Center from "../models/Center.js";

const calculateStatus = (amount, paidAmount, dueDate) => {
  if (paidAmount >= amount) {
    return "paid";
  }

  if (paidAmount > 0) {
    if (new Date(dueDate) < new Date()) {
      return "overdue";
    }
    return "partial";
  }

  if (new Date(dueDate) < new Date()) {
    return "overdue";
  }

  return "pending";
};

export const createPayment = async (req, res) => {
  try {
    const {
      student,
      group,
      amount,
      paidAmount = 0,
      dueDate,
      paymentDate,
      paymentMethod = "cash",
      description,
    } = req.body;

    if (!student || !group || amount === undefined || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "L'élève, le groupe, le montant et la date d'échéance sont obligatoires",
      });
    }

    const parsedAmount = Number(amount);
    const parsedPaidAmount = Number(paidAmount);
    const parsedDueDate = new Date(dueDate);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      !Number.isFinite(parsedPaidAmount) ||
      parsedPaidAmount < 0 ||
      parsedPaidAmount > parsedAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Montants invalides ou incohérents",
      });
    }

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Date d'échéance invalide",
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
        message: "Élève actif introuvable dans ce centre",
      });
    }

    const groupExists = await Group.findOne({
      _id: group,
      center: req.user.center,
    });

    if (!groupExists) {
      return res.status(404).json({
        success: false,
        message: "Groupe introuvable dans ce centre",
      });
    }

    const effectivePaymentDate = paymentDate
      ? new Date(paymentDate)
      : new Date();

    const status = calculateStatus(
      parsedAmount,
      parsedPaidAmount,
      parsedDueDate
    );

    const payment = await Payment.create({
      student,
      group,
      center: req.user.center,
      amount: parsedAmount,
      paidAmount: parsedPaidAmount,
      dueDate: parsedDueDate,
      paymentDate: effectivePaymentDate,
      paymentMethod,
      status,
      description: description?.trim() || undefined,
      recordedBy: req.user._id,
    });

    const populated = await Payment.findById(payment._id)
      .populate("student", "firstName lastName registrationNumber")
      .populate("group", "name subject")
      .populate("recordedBy", "fullName")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Paiement créé avec succès",
      payment: {
        ...populated,
        remainingAmount: Math.max(0, parsedAmount - parsedPaidAmount),
      },
    });
  } catch (error) {
    console.error("Create payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du paiement",
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const {
      student,
      group,
      status,
      startDate,
      endDate,
      search,
      page,
      limit,
    } = req.query;

    const filter = {
      center: req.user.center,
    };

    if (student && mongoose.isValidObjectId(student)) filter.student = student;
    if (group && mongoose.isValidObjectId(group)) filter.group = group;

    const now = new Date();

    if (status) {
      if (status === "overdue") {
        filter.dueDate = { $lt: now };
        filter.$expr = { $lt: ["$paidAmount", "$amount"] };
      } else {
        filter.status = status;
      }
    }

    if (startDate || endDate) {
      filter.dueDate = filter.dueDate || {};
      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) filter.dueDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setUTCHours(23, 59, 59, 999);
          filter.dueDate.$lte = end;
        }
      }
    }

    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [total, payments] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter)
        .populate("student", "firstName lastName registrationNumber parentPhone")
        .populate("group", "name subject")
        .populate("recordedBy", "fullName")
        .sort({ dueDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const results = payments.map((p) => {
      const remainingAmount = Math.max(0, p.amount - p.paidAmount);
      return {
        ...p,
        id: p._id,
        remainingAmount,
        effectiveStatus: calculateStatus(p.amount, p.paidAmount, p.dueDate),
      };
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      payments: results,
    });
  } catch (error) {
    console.error("Get payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des paiements",
    });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const payment = await Payment.findOne({
      _id: req.params.id,
      center: req.user.center,
    })
      .populate("student", "firstName lastName registrationNumber parentPhone parentEmail")
      .populate("group", "name subject")
      .populate("recordedBy", "fullName")
      .lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable",
      });
    }

    const remainingAmount = Math.max(0, payment.amount - payment.paidAmount);

    return res.status(200).json({
      success: true,
      payment: {
        ...payment,
        id: payment._id,
        remainingAmount,
        effectiveStatus: calculateStatus(payment.amount, payment.paidAmount, payment.dueDate),
      },
    });
  } catch (error) {
    console.error("Get payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updatePayment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const payment = await Payment.findOne({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable",
      });
    }

    const { amount, paidAmount, dueDate, paymentDate, paymentMethod, description } =
      req.body;

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Montant total invalide",
        });
      }
      payment.amount = parsedAmount;
    }

    if (paidAmount !== undefined) {
      const parsedPaid = Number(paidAmount);
      if (!Number.isFinite(parsedPaid) || parsedPaid < 0) {
        return res.status(400).json({
          success: false,
          message: "Montant payé invalide",
        });
      }
      payment.paidAmount = parsedPaid;
    }

    if (payment.paidAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: "Le montant payé ne peut pas dépasser le montant total",
      });
    }

    if (dueDate !== undefined) {
      const parsedDue = new Date(dueDate);
      if (Number.isNaN(parsedDue.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Date d'échéance invalide",
        });
      }
      payment.dueDate = parsedDue;
    }

    if (paymentDate !== undefined) {
      const parsedPayDate = new Date(paymentDate);
      if (!Number.isNaN(parsedPayDate.getTime())) {
        payment.paymentDate = parsedPayDate;
      }
    }

    if (paymentMethod !== undefined) {
      payment.paymentMethod = paymentMethod;
    }

    if (description !== undefined) {
      payment.description = description?.trim() || "";
    }

    payment.status = calculateStatus(
      payment.amount,
      payment.paidAmount,
      payment.dueDate
    );

    await payment.save();

    const populated = await Payment.findById(payment._id)
      .populate("student", "firstName lastName registrationNumber")
      .populate("group", "name subject")
      .populate("recordedBy", "fullName")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Paiement modifié avec succès",
      payment: {
        ...populated,
        id: populated._id,
        remainingAmount: Math.max(0, populated.amount - populated.paidAmount),
      },
    });
  } catch (error) {
    console.error("Update payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du paiement",
    });
  }
};

export const deletePayment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const payment = await Payment.findOneAndDelete({
      _id: req.params.id,
      center: req.user.center,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Paiement supprimé avec succès",
    });
  } catch (error) {
    console.error("Delete payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du paiement",
    });
  }
};

export const getPaymentStatistics = async (req, res) => {
  try {
    const { group, student } = req.query;

    const filter = {
      center: req.user.center,
    };

    if (group && mongoose.isValidObjectId(group)) filter.group = group;
    if (student && mongoose.isValidObjectId(student)) filter.student = student;

    const payments = await Payment.find(filter).select(
      "amount paidAmount dueDate status"
    );

    const now = new Date();

    let totalAmount = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let overdueAmount = 0;
    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    for (const p of payments) {
      const amount = p.amount;
      const paid = p.paidAmount;
      const remaining = Math.max(0, amount - paid);

      totalAmount += amount;
      totalPaid += paid;
      totalRemaining += remaining;

      if (remaining === 0) {
        paidCount++;
      } else if (p.dueDate < now) {
        overdueCount++;
        overdueAmount += remaining;
      } else if (paid > 0) {
        partialCount++;
      } else {
        pendingCount++;
      }
    }

    const collectionRate =
      totalAmount > 0
        ? Math.round((totalPaid / totalAmount) * 10000) / 100
        : 0;

    return res.status(200).json({
      success: true,
      statistics: {
        paymentsCount: payments.length,
        totalAmount,
        totalPaid,
        totalRemaining,
        overdueAmount,
        paidCount,
        partialCount,
        pendingCount,
        overdueCount,
        collectionRate,
        currency: "MAD",
      },
    });
  } catch (error) {
    console.error("Payment statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors du calcul des statistiques financières",
    });
  }
};

export const generatePaymentReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de paiement invalide",
      });
    }

    const [payment, center] = await Promise.all([
      Payment.findOne({
        _id: id,
        center: req.user.center,
      })
        .populate("student", "firstName lastName registrationNumber schoolLevel parentName parentPhone parentEmail")
        .populate("group", "name subject")
        .populate("recordedBy", "fullName")
        .lean(),
      Center.findById(req.user.center).lean(),
    ]);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable dans votre centre",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    const receiptRef = `REC-${String(payment._id).slice(-6).toUpperCase()}`;
    const filename = `recu-${payment.student?.registrationNumber || "reg"}-${receiptRef}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    doc.pipe(res);

    const centerName = center?.name || "NexoManager Learning Center";
    const centerPhone = center?.phone || "Non spécifié";
    const centerEmail = center?.email || "contact@center.ma";
    const centerAddress = center?.address || "Maroc";

    // Top Header Banner
    doc.rect(40, 40, 515, 68).fill("#0F172A");

    doc.font("Helvetica-Bold").fontSize(18).fillColor("#FFFFFF");
    doc.text(centerName.toUpperCase(), 55, 52, { width: 340, ellipsis: true });

    doc.font("Helvetica").fontSize(8.5).fillColor("#94A3B8");
    doc.text(`${centerAddress} | Tél : ${centerPhone} | Email : ${centerEmail}`, 55, 78, { width: 340 });

    // Receipt Badge right side
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#E11D48");
    doc.text("REÇU DE RÈGLEMENT", 400, 52, { align: "right", width: 140 });

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#FFFFFF");
    doc.text(`Réf : ${receiptRef}`, 400, 72, { align: "right", width: 140 });

    doc.font("Helvetica").fontSize(8).fillColor("#CBD5E1");
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR", { timeZone: "Africa/Casablanca" })}`, 400, 86, { align: "right", width: 140 });

    const startY = 125;

    // Student Box (Left)
    doc.roundedRect(40, startY, 250, 115, 6).lineWidth(1).strokeColor("#E2E8F0").stroke();
    doc.rect(40, startY, 250, 24).fill("#F8FAFC");
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#1E293B").text("INFORMATIONS ÉLÈVE & TUTEUR", 50, startY + 7);

    const s = payment.student;
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#475569").text("Élève :", 50, startY + 32);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F172A").text(`${s?.firstName || ""} ${s?.lastName || ""}`, 105, startY + 32);

    doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text("Matricule :", 50, startY + 50);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#0F172A").text(s?.registrationNumber || "-", 105, startY + 50);

    doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text("Niveau :", 50, startY + 68);
    doc.font("Helvetica").fontSize(8.5).fillColor("#0F172A").text(s?.schoolLevel || "-", 105, startY + 68);

    doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text("Tuteur / Tél :", 50, startY + 86);
    doc.font("Helvetica").fontSize(8.5).fillColor("#0F172A").text(`${s?.parentName || "Parent"} (${s?.parentPhone || "-"})`, 105, startY + 86, { width: 175, ellipsis: true });

    // Payment Info Box (Right)
    doc.roundedRect(305, startY, 250, 115, 6).lineWidth(1).strokeColor("#E2E8F0").stroke();
    doc.rect(305, startY, 250, 24).fill("#F8FAFC");
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#1E293B").text("DÉTAILS DU GROUPE & SÉANCES", 315, startY + 7);

    const g = payment.group;
    doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text("Groupe :", 315, startY + 32);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F172A").text(g?.name || "-", 375, startY + 32);

    doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text("Matière :", 315, startY + 50);
    doc.font("Helvetica").fontSize(8.5).fillColor("#0F172A").text(g?.subject || "-", 375, startY + 50);

    doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text("Échéance :", 315, startY + 68);
    const dueDateFormatted = payment.dueDate ? new Date(payment.dueDate).toLocaleDateString("fr-FR", { timeZone: "Africa/Casablanca" }) : "-";
    doc.font("Helvetica").fontSize(8.5).fillColor("#0F172A").text(dueDateFormatted, 375, startY + 68);

    doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text("Mode :", 315, startY + 86);
    const methodLabels = { cash: "Espèces", bank_transfer: "Virement bancaire", card: "Carte bancaire", other: "Autre / Chèque" };
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#0F172A").text(methodLabels[payment.paymentMethod] || "Espèces", 375, startY + 86);

    // Table of financial items
    const tableY = 265;
    doc.rect(40, tableY, 515, 24).fill("#F1F5F9");
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#334155");
    doc.text("DESIGNATION DE LA PRESTATION", 50, tableY + 7);
    doc.text("MONTANT DÛ", 270, tableY + 7, { width: 75, align: "right" });
    doc.text("MONTANT RÉGLÉ", 365, tableY + 7, { width: 85, align: "right" });
    doc.text("RESTE À PAYER", 465, tableY + 7, { width: 80, align: "right" });

    const remaining = Math.max(0, payment.amount - payment.paidAmount);
    const rowY = tableY + 24;
    doc.rect(40, rowY, 515, 36).strokeColor("#E2E8F0").stroke();
    
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F172A");
    doc.text(`Frais de soutien & formation : ${g?.name || "Cours"} (${g?.subject || ""})`, 50, rowY + 9);
    doc.font("Helvetica").fontSize(8).fillColor("#64748B");
    doc.text(payment.description || `Règlement mensuel - Enregistré le ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("fr-FR", { timeZone: "Africa/Casablanca" }) : "-"}`, 50, rowY + 22);

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F172A");
    doc.text(`${payment.amount.toFixed(2)} MAD`, 270, rowY + 12, { width: 75, align: "right" });
    doc.text(`${payment.paidAmount.toFixed(2)} MAD`, 365, rowY + 12, { width: 85, align: "right" });
    
    const remColor = remaining === 0 ? "#16A34A" : "#E11D48";
    doc.font("Helvetica-Bold").fontSize(9).fillColor(remColor);
    doc.text(`${remaining.toFixed(2)} MAD`, 465, rowY + 12, { width: 80, align: "right" });

    // Financial Recap Totals Box
    const recapY = 345;
    doc.roundedRect(305, recapY, 250, 95, 6).fillAndStroke("#F8FAFC", "#CBD5E1");

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#475569").text("Montant Total Prévu :", 320, recapY + 14);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F172A").text(`${payment.amount.toFixed(2)} MAD`, 440, recapY + 14, { align: "right", width: 100 });

    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0F172A").text("Montant Encaissé :", 320, recapY + 36);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F172A").text(`${payment.paidAmount.toFixed(2)} MAD`, 440, recapY + 34, { align: "right", width: 100 });

    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#475569").text("Solde Restant Dû :", 320, recapY + 60);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(remColor).text(`${remaining.toFixed(2)} MAD`, 440, recapY + 58, { align: "right", width: 100 });

    // Status Badge left of recap
    const statusY = recapY + 10;
    const isFullyPaid = remaining === 0;
    const badgeBg = isFullyPaid ? "#DCFCE7" : "#FFE4E6";
    const badgeBorder = isFullyPaid ? "#86EFAC" : "#FDA4AF";
    const badgeText = isFullyPaid ? "#15803D" : "#BE123C";
    const badgeLabel = isFullyPaid ? "RÈGLEMENT SOLDÉ" : "ACOMPTE ENCAISSÉ";

    doc.roundedRect(40, statusY, 220, 60, 6).fillAndStroke(badgeBg, badgeBorder);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(badgeText);
    doc.text(badgeLabel, 40, statusY + 16, { width: 220, align: "center" });
    doc.font("Helvetica").fontSize(8).fillColor(badgeText);
    doc.text(isFullyPaid ? "Paiement intégralement reçu" : "Un solde reste à régulariser", 40, statusY + 36, { width: 220, align: "center" });

    // Signatures and Stamps
    const stampY = 475;
    doc.roundedRect(40, stampY, 230, 95, 6).lineWidth(1).strokeColor("#E2E8F0").stroke();
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#64748B").text("SIGNATURE DU CLIENT / TUTEUR", 50, stampY + 10);
    doc.font("Helvetica").fontSize(7.5).fillColor("#94A3B8").text("Bon pour accord et règlement", 50, stampY + 24);

    doc.roundedRect(305, stampY, 250, 95, 6).lineWidth(1).strokeColor("#E2E8F0").stroke();
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#64748B").text("CACHET & SIGNATURE DE L'ADMINISTRATION", 315, stampY + 10);
    doc.font("Helvetica").fontSize(7.5).fillColor("#94A3B8").text(centerName, 315, stampY + 24);

    // Footer
    const footerY = 660;
    doc.lineCap("butt").moveTo(40, footerY).lineTo(555, footerY).strokeColor("#CBD5E1").stroke();
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#0F172A").text("NexoManager SaaS — Solution de Gestion Multi-Centre Éducatif", 40, footerY + 10, { align: "center" });
    doc.font("Helvetica").fontSize(7).fillColor("#94A3B8").text("Ce document tient lieu de reçu officiel de paiement délivré par l'établissement. Conservez-le soigneusement.", 40, footerY + 22, { align: "center" });

    doc.end();
  } catch (error) {
    console.error("Payment receipt PDF generation error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la génération du reçu de paiement",
      });
    }
  }
};
