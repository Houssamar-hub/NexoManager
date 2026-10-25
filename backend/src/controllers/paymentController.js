import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Student from "../models/Student.js";
import Group from "../models/Group.js";

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
