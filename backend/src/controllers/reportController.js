import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Payment from "../models/Payment.js";

const STUDENT_STATUSES = ["active", "suspended", "left"];
const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"];
const PAYMENT_STATUSES = ["pending", "partial", "paid", "overdue"];

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

const getDateRange = (query, field = "date") => {
  const { date, startDate, endDate } = query;

  if (date && (startDate || endDate)) {
    throw new Error(
      `Utilisez ${field} ou startDate/endDate, pas les deux.`
    );
  }

  if (date) {
    if (!isValidDate(date)) {
      throw new Error(`${field} doit être une date valide au format YYYY-MM-DD.`);
    }

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return { $gte: start, $lt: end };
  }

  if (startDate || endDate) {
    if (
      (startDate && !isValidDate(startDate)) ||
      (endDate && !isValidDate(endDate))
    ) {
      throw new Error(
        "startDate et endDate doivent être au format YYYY-MM-DD."
      );
    }

    if (startDate && endDate && startDate > endDate) {
      throw new Error("startDate doit être antérieure ou égale à endDate.");
    }

    const range = {};

    if (startDate) {
      range.$gte = new Date(`${startDate}T00:00:00.000Z`);
    }

    if (endDate) {
      const end = new Date(`${endDate}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      range.$lt = end;
    }

    return range;
  }

  return null;
};

const getStudentFilter = (query, center) => {
  const filter = { center };

  if (query.status) {
    if (!STUDENT_STATUSES.includes(query.status)) {
      throw new Error("Statut étudiant invalide.");
    }

    filter.status = query.status;
  }

  if (query.schoolLevel) {
    filter.schoolLevel = query.schoolLevel;
  }

  return filter;
};

const getAttendanceFilter = (query, center) => {
  const filter = { center };

  if (query.status) {
    if (!ATTENDANCE_STATUSES.includes(query.status)) {
      throw new Error("Statut de présence invalide.");
    }

    filter.status = query.status;
  }

  if (query.group) filter.group = query.group;
  if (query.student) filter.student = query.student;

  const dateRange = getDateRange(query);

  if (dateRange) {
    filter.date = dateRange;
  }

  return filter;
};

const getPaymentFilter = (query, center) => {
  const filter = { center };

  if (query.student) filter.student = query.student;
  if (query.group) filter.group = query.group;

  if (query.status) {
    if (!PAYMENT_STATUSES.includes(query.status)) {
      throw new Error("Statut de paiement invalide.");
    }

    if (query.status === "overdue") {
      const now = new Date();

      filter.dueDate = { $lt: now };
      filter.$expr = { $lt: ["$paidAmount", "$amount"] };
    } else {
      filter.status = query.status;
    }
  }

  const dueDateRange = getDateRange(
    {
      startDate: query.startDate,
      endDate: query.endDate,
    },
    "dueDate"
  );

  if (dueDateRange) {
    filter.dueDate = dueDateRange;
  }

  return filter;
};

const handleFilterError = (error, res) => {
  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Erreur lors de la préparation du rapport.",
  });
};

const getStudents = (filter) =>
  Student.find(filter)
    .select(
      "firstName lastName registrationNumber schoolLevel parentName parentPhone status createdAt"
    )
    .sort({ lastName: 1, firstName: 1 })
    .lean();

const getPaymentStatus = (payment) => {
  if (payment.paidAmount >= payment.amount) return "paid";
  if (payment.paidAmount > 0) return "partial";

  if (new Date(payment.dueDate) < new Date()) {
    return "overdue";
  }

  return "pending";
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("fr-FR", {
    timeZone: "Africa/Casablanca",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("fr-FR", {
    timeZone: "Africa/Casablanca",
  });
};

const getStudentName = (student) => {
  if (!student) return "-";

  return `${student.firstName || ""} ${student.lastName || ""}`.trim() || "-";
};

const createWorkbook = async (sheetName, columns, rows) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "NexoManager";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns;
  worksheet.addRows(rows);

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  worksheet.columns.forEach((column) => {
    let maxLength = String(column.header || "").length;

    column.eachCell?.({ includeEmpty: true }, (cell) => {
      maxLength = Math.max(maxLength, String(cell.value ?? "").length);
    });

    column.width = Math.min(Math.max(maxLength + 2, 12), 35);
  });

  return workbook;
};

const sendExcel = async (res, workbook, filename) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );

  await workbook.xlsx.write(res);
  res.end();
};

const createPdf = (res, filename, title, headers, rows, widths) => {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: {
      top: 45,
      bottom: 45,
      left: 30,
      right: 30,
    },
    bufferPages: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );

  doc.pipe(res);

  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const columnWidths =
    widths ||
    headers.map(() => pageWidth / headers.length);

  const drawHeader = () => {
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#1F2937");

    let x = doc.page.margins.left;
    const y = doc.y;
    const height = 24;

    headers.forEach((header, index) => {
      doc.rect(x, y, columnWidths[index], height).stroke("#9CA3AF");

      doc.text(String(header), x + 4, y + 7, {
        width: columnWidths[index] - 8,
        height: height - 8,
        ellipsis: true,
      });

      x += columnWidths[index];
    });

    doc.y = y + height;
  };

  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor("#111827")
    .text(title, { align: "center" });

  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#4B5563")
    .text(`Généré le ${formatDateTime(new Date())}`, {
      align: "right",
    });

  doc.moveDown();

  drawHeader();

  rows.forEach((row) => {
    const cellHeight = 30;

    if (doc.y + cellHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawHeader();
    }

    let x = doc.page.margins.left;
    const y = doc.y;

    row.forEach((value, index) => {
      doc.rect(x, y, columnWidths[index], cellHeight).stroke("#D1D5DB");

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#111827")
        .text(String(value ?? "-"), x + 4, y + 5, {
          width: columnWidths[index] - 8,
          height: cellHeight - 8,
          ellipsis: true,
        });

      x += columnWidths[index];
    });

    doc.y = y + cellHeight;
  });

  doc.end();
};

export const exportStudentsExcel = async (req, res) => {
  try {
    const filter = getStudentFilter(req.query, req.user.center);
    const students = await getStudents(filter);

    const rows = students.map((student) => ({
      firstName: student.firstName,
      lastName: student.lastName,
      registrationNumber: student.registrationNumber || "-",
      schoolLevel: student.schoolLevel || "-",
      parentName: student.parentName || "-",
      parentPhone: student.parentPhone || "-",
      status: student.status,
      createdAt: formatDate(student.createdAt),
    }));

    const workbook = await createWorkbook(
      "Étudiants",
      [
        { header: "Prénom", key: "firstName" },
        { header: "Nom", key: "lastName" },
        { header: "N° inscription", key: "registrationNumber" },
        { header: "Niveau", key: "schoolLevel" },
        { header: "Parent", key: "parentName" },
        { header: "Téléphone parent", key: "parentPhone" },
        { header: "Statut", key: "status" },
        { header: "Date création", key: "createdAt" },
      ],
      rows
    );

    return await sendExcel(res, workbook, "etudiants.xlsx");
  } catch (error) {
    return handleFilterError(error, res);
  }
};

export const exportStudentsPDF = async (req, res) => {
  try {
    const filter = getStudentFilter(req.query, req.user.center);
    const students = await getStudents(filter);

    const rows = students.map((student) => [
      student.firstName,
      student.lastName,
      student.registrationNumber || "-",
      student.schoolLevel || "-",
      student.parentName || "-",
      student.parentPhone || "-",
      student.status,
    ]);

    const pageWidth = 842 - 60;

    const widths = [
      pageWidth * 0.13,
      pageWidth * 0.13,
      pageWidth * 0.15,
      pageWidth * 0.13,
      pageWidth * 0.16,
      pageWidth * 0.17,
      pageWidth * 0.13,
    ];

    return createPdf(
      res,
      "etudiants.pdf",
      "Rapport des étudiants",
      [
        "Prénom",
        "Nom",
        "N° inscription",
        "Niveau",
        "Parent",
        "Téléphone",
        "Statut",
      ],
      rows,
      widths
    );
  } catch (error) {
    return handleFilterError(error, res);
  }
};

export const exportAttendanceExcel = async (req, res) => {
  try {
    const filter = getAttendanceFilter(req.query, req.user.center);

    const attendanceRecords = await Attendance.find(filter)
      .populate("student", "firstName lastName registrationNumber")
      .populate("group", "name subject")
      .populate("recordedBy", "fullName")
      .sort({ date: -1, sessionStartTime: 1 })
      .lean();

    const rows = attendanceRecords.map((record) => ({
      firstName: record.student?.firstName || "-",
      lastName: record.student?.lastName || "-",
      registrationNumber: record.student?.registrationNumber || "-",
      group: record.group?.name || "-",
      subject: record.group?.subject || "-",
      date: formatDate(record.date),
      sessionStartTime: record.sessionStartTime || "-",
      status: record.status,
      recordedBy: record.recordedBy?.fullName || "-",
      notes: record.notes || "-",
    }));

    const workbook = await createWorkbook(
      "Présences",
      [
        { header: "Prénom", key: "firstName" },
        { header: "Nom", key: "lastName" },
        { header: "N° inscription", key: "registrationNumber" },
        { header: "Groupe", key: "group" },
        { header: "Matière", key: "subject" },
        { header: "Date", key: "date" },
        { header: "Heure", key: "sessionStartTime" },
        { header: "Statut", key: "status" },
        { header: "Enregistré par", key: "recordedBy" },
        { header: "Notes", key: "notes" },
      ],
      rows
    );

    return await sendExcel(res, workbook, "presences.xlsx");
  } catch (error) {
    return handleFilterError(error, res);
  }
};

export const exportPaymentsExcel = async (req, res) => {
  try {
    const filter = getPaymentFilter(req.query, req.user.center);

    const payments = await Payment.find(filter)
      .populate("student", "firstName lastName registrationNumber")
      .populate("group", "name subject")
      .populate("recordedBy", "fullName")
      .sort({ dueDate: -1 })
      .lean();

    const rows = payments.map((payment) => {
      const remainingAmount = Math.max(
        0,
        payment.amount - payment.paidAmount
      );

      return {
        student: getStudentName(payment.student),
        registrationNumber: payment.student?.registrationNumber || "-",
        group: payment.group?.name || "-",
        amount: payment.amount,
        paidAmount: payment.paidAmount,
        remainingAmount,
        paymentDate: formatDate(payment.paymentDate),
        dueDate: formatDate(payment.dueDate),
        paymentMethod: payment.paymentMethod,
        status: getPaymentStatus(payment),
        recordedBy: payment.recordedBy?.fullName || "-",
        description: payment.description || "-",
      };
    });

    const workbook = await createWorkbook(
      "Paiements",
      [
        { header: "Étudiant", key: "student" },
        { header: "N° inscription", key: "registrationNumber" },
        { header: "Groupe", key: "group" },
        { header: "Montant total", key: "amount" },
        { header: "Montant payé", key: "paidAmount" },
        { header: "Montant restant", key: "remainingAmount" },
        { header: "Date paiement", key: "paymentDate" },
        { header: "Date échéance", key: "dueDate" },
        { header: "Mode paiement", key: "paymentMethod" },
        { header: "Statut", key: "status" },
        { header: "Enregistré par", key: "recordedBy" },
        { header: "Description", key: "description" },
      ],
      rows
    );

    return await sendExcel(res, workbook, "paiements.xlsx");
  } catch (error) {
    return handleFilterError(error, res);
  }
};

export const exportPaymentsPDF = async (req, res) => {
  try {
    const filter = getPaymentFilter(req.query, req.user.center);

    const payments = await Payment.find(filter)
      .populate("student", "firstName lastName registrationNumber")
      .populate("group", "name")
      .sort({ dueDate: -1 })
      .lean();

    const rows = payments.map((payment) => [
      getStudentName(payment.student),
      payment.student?.registrationNumber || "-",
      payment.group?.name || "-",
      `${Number(payment.amount).toFixed(2)} MAD`,
      `${Number(payment.paidAmount).toFixed(2)} MAD`,
      `${Math.max(0, payment.amount - payment.paidAmount).toFixed(2)} MAD`,
      formatDate(payment.dueDate),
      getPaymentStatus(payment),
    ]);

    const pageWidth = 842 - 60;

    const widths = [
      pageWidth * 0.16,
      pageWidth * 0.12,
      pageWidth * 0.12,
      pageWidth * 0.11,
      pageWidth * 0.11,
      pageWidth * 0.13,
      pageWidth * 0.12,
      pageWidth * 0.13,
    ];

    return createPdf(
      res,
      "paiements.pdf",
      "Rapport des paiements",
      [
        "Étudiant",
        "N° inscription",
        "Groupe",
        "Montant",
        "Payé",
        "Restant",
        "Échéance",
        "Statut",
      ],
      rows,
      widths
    );
  } catch (error) {
    return handleFilterError(error, res);
  }
};