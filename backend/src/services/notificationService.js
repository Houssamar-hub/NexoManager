import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";

export const generateOverduePaymentNotifications = async (
  centerId
) => {
  const now = new Date();

  const overduePayments = await Payment.find({
    center: centerId,
    dueDate: { $lt: now },
    $expr: {
      $lt: ["$paidAmount", "$amount"],
    },
  }).select("_id center student amount paidAmount dueDate");

  let created = 0;

  for (const payment of overduePayments) {
    const remainingAmount = Math.max(
      0,
      payment.amount - payment.paidAmount
    );

    const dedupeKey = `payment-overdue:${payment._id}`;

    try {
      const result = await Notification.updateOne(
        {
          center: payment.center,
          dedupeKey,
        },
        {
          $setOnInsert: {
            center: payment.center,
            recipient: null,
            title: "Paiement en retard",
            message: `Un paiement est en retard. Montant restant : ${remainingAmount}.`,
            type: "payment_overdue",
            relatedStudent: payment.student,
            relatedPayment: payment._id,
            dedupeKey,
            createdBy: null,
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        created++;
      }
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  return {
    checked: overduePayments.length,
    created,
  };
};

export const generateAbsenceNotifications = async (
  attendanceId
) => {
  const attendance = await Attendance.findById(attendanceId)
    .populate("student", "firstName lastName")
    .select(
      "center student status date group recordedBy"
    );

  if (
    !attendance ||
    attendance.status !== "absent" ||
    !attendance.student
  ) {
    return null;
  }

  const dedupeKey = `absence:${attendance._id}`;

  const notification = await Notification.findOneAndUpdate(
    {
      center: attendance.center,
      dedupeKey,
    },
    {
      $setOnInsert: {
        center: attendance.center,
        recipient: null,
        title: "Absence d'un élève",
        message: `L'élève ${attendance.student.firstName} ${attendance.student.lastName} a été marqué absent.`,
        type: "absence",
        relatedStudent: attendance.student._id,
        relatedAttendance: attendance._id,
        dedupeKey,
        createdBy: attendance.recordedBy ?? null,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  return notification;
};