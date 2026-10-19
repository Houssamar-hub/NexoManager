import Student from "../models/Student.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import Attendance from "../models/Attendance.js";
import Payment from "../models/Payment.js";

export const getDashboardStatistics = async (req, res) => {
  try {
    const center = req.user.center;

    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalGroups,
      activeGroups,
      totalAttendancesToday,
      presentToday,
      absentToday,
      lateToday,
      paymentSummary,
      recentStudents,
      recentPayments,
    ] = await Promise.all([
      Student.countDocuments({ center }),
      Student.countDocuments({ center, status: "active" }),

      User.countDocuments({ center, role: "teacher" }),
      User.countDocuments({
        center,
        role: "teacher",
        status: "active",
      }),

      Group.countDocuments({ center }),
      Group.countDocuments({ center, status: "active" }),

      Attendance.countDocuments({
        center,
        date: { $gte: startOfDay, $lte: endOfDay },
      }),

      Attendance.countDocuments({
        center,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: "present",
      }),

      Attendance.countDocuments({
        center,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: "absent",
      }),

      Attendance.countDocuments({
        center,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: "late",
      }),

      Payment.aggregate([
        { $match: { center: req.user.center } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            totalPaid: { $sum: "$paidAmount" },
            totalRemaining: {
              $sum: {
                $max: [
                  0,
                  { $subtract: ["$amount", "$paidAmount"] },
                ],
              },
            },
            totalPayments: { $sum: 1 },
          },
        },
      ]),

      Student.find({ center })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("firstName lastName registrationNumber status createdAt"),

      Payment.find({ center })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student", "firstName lastName")
        .select("amount paidAmount status dueDate createdAt"),
    ]);

    const financial = paymentSummary[0] || {
      totalAmount: 0,
      totalPaid: 0,
      totalRemaining: 0,
      totalPayments: 0,
    };

    const collectionRate =
      financial.totalAmount > 0
        ? Math.round(
            (financial.totalPaid / financial.totalAmount) * 10000
          ) / 100
        : 0;

    return res.status(200).json({
      success: true,
      dashboard: {
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents,
        },

        teachers: {
          total: totalTeachers,
          active: activeTeachers,
          inactive: totalTeachers - activeTeachers,
        },

        groups: {
          total: totalGroups,
          active: activeGroups,
          inactive: totalGroups - activeGroups,
        },

        attendanceToday: {
          total: totalAttendancesToday,
          present: presentToday,
          absent: absentToday,
          late: lateToday,
        },

        payments: {
          total: financial.totalAmount,
          paid: financial.totalPaid,
          remaining: financial.totalRemaining,
          count: financial.totalPayments,
          collectionRate,
        },

        recentStudents,
        recentPayments,
      },
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement du dashboard",
    });
  }
};