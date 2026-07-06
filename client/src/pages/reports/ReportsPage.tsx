import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Users,
  CalendarCheck2,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import api from "../../api/client.ts";
import { Group } from "../../types/index.ts";

export const ReportsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);

  // Student report filters
  const [studentStatus, setStudentStatus] = useState<string>("");
  const [studentSchoolLevel, setStudentSchoolLevel] = useState<string>("");

  // Attendance report filters
  const [attendanceGroup, setAttendanceGroup] = useState<string>("");
  const [attendanceStatus, setAttendanceStatus] = useState<string>("");
  const [attendanceStartDate, setAttendanceStartDate] = useState<string>("");
  const [attendanceEndDate, setAttendanceEndDate] = useState<string>("");

  // Payment report filters
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [paymentGroup, setPaymentGroup] = useState<string>("");
  const [paymentStartDate, setPaymentStartDate] = useState<string>("");
  const [paymentEndDate, setPaymentEndDate] = useState<string>("");

  useEffect(() => {
    api.get("/groups?status=active").then((res) => {
      if (res.data.success) setGroups(res.data.groups || []);
    });
  }, []);

  const downloadReport = (path: string, params: Record<string, string>) => {
    const token = localStorage.getItem("nexomanager_token");
    const query = new URLSearchParams();
    if (token) query.append("token", token);

    Object.entries(params).forEach(([key, val]) => {
      if (val && val.trim()) query.append(key, val.trim());
    });

    window.open(`/api/reports/${path}?${query.toString()}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Centre de Rapports & Exports
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Générez et téléchargez des rapports certifiés aux formats Microsoft Excel et Adobe PDF
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ================= 1. RAPPORTS ÉLÈVES ================= */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rapports des Élèves
                </h3>
                <p className="text-xs text-slate-500">
                  Registres d'inscriptions et coordonnées parents
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Filtrer par statut
                </label>
                <select
                  value={studentStatus}
                  onChange={(e) => setStudentStatus(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actif uniquement</option>
                  <option value="suspended">Suspendu</option>
                  <option value="left">Parti</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Niveau scolaire
                </label>
                <input
                  type="text"
                  value={studentSchoolLevel}
                  onChange={(e) => setStudentSchoolLevel(e.target.value)}
                  placeholder="Ex. 1ère Bac..."
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                downloadReport("students/excel", {
                  status: studentStatus,
                  schoolLevel: studentSchoolLevel,
                })
              }
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={() =>
                downloadReport("students/pdf", {
                  status: studentStatus,
                  schoolLevel: studentSchoolLevel,
                })
              }
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* ================= 2. RAPPORTS PRÉSENCES ================= */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rapports des Présences
                </h3>
                <p className="text-xs text-slate-500">
                  Feuilles d'émargement et relevés d'absences
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Groupe de cours
                </label>
                <select
                  value={attendanceGroup}
                  onChange={(e) => setAttendanceGroup(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Tous les groupes</option>
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Statut de présence
                </label>
                <select
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="present">Présents</option>
                  <option value="absent">Absents uniquement</option>
                  <option value="late">En retard</option>
                  <option value="excused">Excusés</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={attendanceStartDate}
                    onChange={(e) => setAttendanceStartDate(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={attendanceEndDate}
                    onChange={(e) => setAttendanceEndDate(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                downloadReport("attendance/excel", {
                  group: attendanceGroup,
                  status: attendanceStatus,
                  startDate: attendanceStartDate,
                  endDate: attendanceEndDate,
                })
              }
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={() =>
                downloadReport("attendance/pdf", {
                  group: attendanceGroup,
                  status: attendanceStatus,
                  startDate: attendanceStartDate,
                  endDate: attendanceEndDate,
                })
              }
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* ================= 3. RAPPORTS PAIEMENTS ================= */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rapports Financiers
                </h3>
                <p className="text-xs text-slate-500">
                  Journal des encaissements et suivi des créances
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Statut de paiement
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="paid">Payé en totalité</option>
                  <option value="partial">Partiellement réglé</option>
                  <option value="overdue">En retard (Impayé échu)</option>
                  <option value="pending">En attente d'échéance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Groupe concerné
                </label>
                <select
                  value={paymentGroup}
                  onChange={(e) => setPaymentGroup(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Tous les groupes</option>
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Échéance début
                  </label>
                  <input
                    type="date"
                    value={paymentStartDate}
                    onChange={(e) => setPaymentStartDate(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Échéance fin
                  </label>
                  <input
                    type="date"
                    value={paymentEndDate}
                    onChange={(e) => setPaymentEndDate(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                downloadReport("payments/excel", {
                  status: paymentStatus,
                  group: paymentGroup,
                  startDate: paymentStartDate,
                  endDate: paymentEndDate,
                })
              }
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={() =>
                downloadReport("payments/pdf", {
                  status: paymentStatus,
                  group: paymentGroup,
                  startDate: paymentStartDate,
                  endDate: paymentEndDate,
                })
              }
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>PDF (.pdf)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
