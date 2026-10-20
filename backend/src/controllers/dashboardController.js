import mongoose from "mongoose";

import Student from "../models/Student.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import Attendance from "../models/Attendance.js";
import Payment from "../models/Payment.js";

const TIME_ZONE = "Africa/Casablanca";

const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "excused",
];

const getDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
};

const getTimeZoneOffset = (date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return representedAsUtc - date.getTime();
};

const getMoroccoDate = (year, month, day) => {
  const approximateDate = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0)
  );

  const offset = getTimeZoneOffset(approximateDate);

  return new Date(approximateDate.getTime() - offset);
};

const addDays = ({ year, month, day }, amount) => {
  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

const addMonths = ({ year, month }, amount) => {
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: 1,
  };
};

const getDayRange = (parts) => {
  const nextDay = addDays(parts, 1);

  return {
    start: getMoroccoDate(parts.year, parts.month, parts.day),
    end: getMoroccoDate(
      nextDay.year,
      nextDay.month,
      nextDay.day
    ),
  };
};

const getMonthRange = (parts) => {
  const nextMonth = addMonths(parts, 1);

  return {
    start: getMoroccoDate(parts.year, parts.month, 1),
    end: getMoroccoDate(
      nextMonth.year,
      nextMonth.month,
      1
    ),
  };
};

const getObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }

  return new mongoose.Types.ObjectId(value);
};

const getMonthLabel = (year, month) => {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
    "fr-FR",
    {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  );
};

const getPaymentStatus = (payment, now = new Date()) => {
  if (payment.paidAmount >= payment.amount) {
    return "paid";
  }

  if (payment.paidAmount > 0) {
    return "partial";
  }

  if (new Date(payment.dueDate) < now) {
    return "overdue";
  }

  return "pending";
};

const getDashboardStatistics = async (req, res) => {
  try {
    const centerId = getObjectId(req.user?.center);

    if (!centerId) {
      return res.status(400).json({
        success: false,
        message: "Centre invalide ou non associé à cet utilisateur.",
      });
    }

    const now = new Date();
    const today = getDateParts(now);
    const todayRange = getDayRange(today);
    const monthRange = getMonthRange(today);

    const studentFilter = {
      center: centerId,
    };

    const activeStudentFilter = {
      center: centerId,
      status: "active",
    };

    const activeTeacherFilter = {
      center: centerId,
      role: "teacher",
      status: "active",
    };

    const activeGroupFilter = {
      center: centerId,
      status: "active",
    };

    const todayAttendanceFilter = {
      center: centerId,
      date: {
        $gte: todayRange.start,
        $lt: todayRange.end,
      },
    };

    const monthAttendanceFilter = {
      center: centerId,
      date: {
        $gte: monthRange.start,
        $lt: monthRange.end,
      },
    };

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalGroups,
      activeGroups,
      todayAttendanceCount,
      todayAttendanceByStatus,
      monthAttendanceByStatus,
      paymentTotals,
      overduePayments,
      monthlyStatistics,
      recentStudents,
      recentPayments,
    ] = await Promise.all([
      Student.countDocuments(studentFilter),

      Student.countDocuments(activeStudentFilter),

      User.countDocuments({
        center: centerId,
        role: "teacher",
      }),

      User.countDocuments(activeTeacherFilter),

      Group.countDocuments({
        center: centerId,
      }),

      Group.countDocuments(activeGroupFilter),

      Attendance.countDocuments(todayAttendanceFilter),

      Attendance.aggregate([
        { $match: todayAttendanceFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Attendance.aggregate([
        { $match: monthAttendanceFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            center: centerId,
          },
        },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
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
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            center: centerId,
            dueDate: { $lt: now },
            $expr: {
              $lt: ["$paidAmount", "$amount"],
            },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amountRemaining: {
              $sum: {
                $max: [
                  0,
                  { $subtract: ["$amount", "$paidAmount"] },
                ],
              },
            },
          },
        },
      ]),

      (async () => {
        const months = [];

        for (let i = 5; i >= 0; i--) {
          const monthParts = addMonths(today, -i);
          const range = getMonthRange(monthParts);

          months.push({
            year: monthParts.year,
            month: monthParts.month,
            label: getMonthLabel(
              monthParts.year,
              monthParts.month
            ),
            start: range.start,
            end: range.end,
          });
        }

        return Promise.all(
          months.map(async (month) => {
            const [newStudents, payments] = await Promise.all([
              Student.countDocuments({
                center: centerId,
                createdAt: {
                  $gte: month.start,
                  $lt: month.end,
                },
              }),

              Payment.aggregate([
                {
                  $match: {
                    center: centerId,
                    paymentDate: {
                      $gte: month.start,
                      $lt: month.end,
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    collected: {
                      $sum: "$paidAmount",
                    },
                    paymentCount: {
                      $sum: 1,
                    },
                  },
                },
              ]),
            ]);

            return {
              year: month.year,
              month: month.month,
              label: month.label,
              newStudents,
              collected: payments[0]?.collected || 0,
              paymentCount: payments[0]?.paymentCount || 0,
            };
          })
        );
      })(),

      Student.find({
        center: centerId,
      })
        .select(
          "firstName lastName registrationNumber schoolLevel status createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Payment.find({
        center: centerId,
      })
        .populate("student", "firstName lastName")
        .populate("group", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const formatAttendanceStats = (items) => {
      const result = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };

      for (const item of items) {
        if (ATTENDANCE_STATUSES.includes(item._id)) {
          result[item._id] = item.count;
          result.total += item.count;
        }
      }

      result.attendanceRate =
        result.total > 0
          ? Number(
              (
                ((result.present + result.late) / result.total) *
                100
              ).toFixed(2)
            )
          : 0;

      return result;
    };

    const finance = paymentTotals[0] || {
      totalPayments: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalRemaining: 0,
    };

    const overdue = overduePayments[0] || {
      count: 0,
      amountRemaining: 0,
    };

    const todayAttendance = formatAttendanceStats(
      todayAttendanceByStatus
    );

    const monthAttendance = formatAttendanceStats(
      monthAttendanceByStatus
    );

    const recentPaymentData = recentPayments.map((payment) => ({
      _id: payment._id,
      student: payment.student
        ? {
            _id: payment.student._id,
            fullName: `${payment.student.firstName} ${payment.student.lastName}`,
          }
        : null,
      group: payment.group
        ? {
            _id: payment.group._id,
            name: payment.group.name,
          }
        : null,
      amount: payment.amount,
      paidAmount: payment.paidAmount,
      remainingAmount: Math.max(
        0,
        payment.amount - payment.paidAmount
      ),
      paymentDate: payment.paymentDate,
      dueDate: payment.dueDate,
      status: getPaymentStatus(payment, now),
      createdAt: payment.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        generatedAt: now,
        timeZone: TIME_ZONE,

        overview: {
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
        },

        attendance: {
          today: {
            totalRecords: todayAttendanceCount,
            ...todayAttendance,
          },

          currentMonth: monthAttendance,
        },

        finance: {
          totalPayments: finance.totalPayments,
          totalAmount: finance.totalAmount,
          totalPaid: finance.totalPaid,
          totalRemaining: finance.totalRemaining,
          overduePaymentsCount: overdue.count,
          overdueAmount: overdue.amountRemaining,
        },

        monthlyStatistics,

        recent: {
          students: recentStudents,
          payments: recentPaymentData,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des statistiques.",
    });
  }
};

export { getDashboardStatistics };