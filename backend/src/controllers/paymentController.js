import Payment from "../models/Payment.js";
import Student from "../models/Student.js";
import Group from "../models/Group.js";

const calculateStatus = (amount, paidAmount, dueDate) => {
  if (paidAmount >= amount) {
    return "paid";
  }

  if (paidAmount > 0) {
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
        message: "Student, group, amount et date limite sont obligatoires",
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
        message: "Montant invalide",
      });
    }

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Date limite invalide",
      });
    }

    const validMethods = [
      "cash",
      "bank_transfer",
      "card",
      "other",
    ];

    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Mode de paiement invalide",
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
        message: "Étudiant introuvable ou inactif",
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
        message: "L'étudiant n'appartient pas à ce groupe",
      });
    }

    const effectivePaymentDate = paymentDate
      ? new Date(paymentDate)
      : new Date();

    if (Number.isNaN(effectivePaymentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Date de paiement invalide",
      });
    }

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
      description,
      recordedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Paiement créé avec succès",
      payment,
      remainingAmount: parsedAmount - parsedPaidAmount,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    console.error("Create payment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du paiement",
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { student, group, status } = req.query;

    const filter = {
      center: req.user.center,
    };

    if (student) filter.student = student;
    if (group) filter.group = group;

    if (status) {
      const validStatuses = [
        "pending",
        "partial",
        "paid",
        "overdue",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Statut de paiement invalide",
        });
      }

      filter.status = status;
    }

    const payments = await Payment.find(filter)
      .populate("student", "firstName lastName registrationNumber")
      .populate("group", "name subject")
      .populate("recordedBy", "fullName")
      .sort({ dueDate: 1 });

    const results = payments.map((payment) => {
      const item = payment.toObject();

      item.remainingAmount = Math.max(
        0,
        item.amount - item.paidAmount
      );

      return item;
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      payments: results,
    });
  } catch (error) {
    console.error("Get payments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des paiements",
    });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      center: req.user.center,
    })
      .populate("student", "firstName lastName registrationNumber")
      .populate("group", "name subject")
      .populate("recordedBy", "fullName");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable",
      });
    }

    const result = payment.toObject();

    result.remainingAmount = Math.max(
      0,
      result.amount - result.paidAmount
    );

    return res.status(200).json({
      success: true,
      payment: result,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    console.error("Get payment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updatePayment = async (req, res) => {
  try {
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

    const { amount, paidAmount, dueDate, paymentMethod, description } =
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
      const parsedPaidAmount = Number(paidAmount);

      if (
        !Number.isFinite(parsedPaidAmount) ||
        parsedPaidAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Montant payé invalide",
        });
      }

      payment.paidAmount = parsedPaidAmount;
    }

    if (payment.paidAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: "Le montant payé ne peut pas dépasser le montant total",
      });
    }

    if (dueDate !== undefined) {
      const parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Date limite invalide",
        });
      }

      payment.dueDate = parsedDueDate;
    }

    if (paymentMethod !== undefined) {
      const validMethods = [
        "cash",
        "bank_transfer",
        "card",
        "other",
      ];

      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: "Mode de paiement invalide",
        });
      }

      payment.paymentMethod = paymentMethod;
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description invalide",
        });
      }

      payment.description = description;
    }

    payment.status = calculateStatus(
      payment.amount,
      payment.paidAmount,
      payment.dueDate
    );

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Paiement modifié avec succès",
      payment,
      remainingAmount: Math.max(
        0,
        payment.amount - payment.paidAmount
      ),
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    console.error("Update payment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du paiement",
    });
  }
};

export const deletePayment = async (req, res) => {
  try {
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
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    console.error("Delete payment error:", error.message);

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

    if (group) {
      filter.group = group;
    }

    if (student) {
      filter.student = student;
    }

    const payments = await Payment.find(filter).select(
      "amount paidAmount dueDate status"
    );

    const now = new Date();

    let totalAmount = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    for (const payment of payments) {
      const amount = payment.amount;
      const paidAmount = payment.paidAmount;
      const remaining = Math.max(0, amount - paidAmount);

      totalAmount += amount;
      totalPaid += paidAmount;
      totalRemaining += remaining;

      if (remaining === 0) {
        paidCount++;
      } else if (payment.dueDate < now) {
        overdueCount++;
      } else if (paidAmount > 0) {
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
        paidCount,
        partialCount,
        pendingCount,
        overdueCount,
        collectionRate,
      },
    });
  } catch (error) {
    console.error("Payment statistics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors du calcul des statistiques financières",
    });
  }
};