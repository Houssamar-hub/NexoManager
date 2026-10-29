import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarCheck2,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Save,
  Filter,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import api from "../../api/client.ts";
import { Group, AttendanceStatus } from "../../types/index.ts";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.tsx";
import { formatDate, getAttendanceStatusBadge } from "../../utils/format.ts";

export const AttendanceManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedGroupId = searchParams.get("groupId") || searchParams.get("group");
  const preselectedDate = searchParams.get("date");

  const [activeTab, setActiveTab] = useState<"take" | "history">("take");

  // Groups list
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(preselectedGroupId || "");
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

  // Session parameters
  const [date, setDate] = useState<string>(preselectedDate || new Date().toISOString().split("T")[0]);
  const [sessionStartTime, setSessionStartTime] = useState<string>("16:00");

  // Roster records for session
  const [records, setRecords] = useState<
    { studentId: string; name: string; regNo: string; status: AttendanceStatus; notes: string }[]
  >([]);

  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // History state
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyFilterGroup, setHistoryFilterGroup] = useState<string>("");
  const [historyFilterDate, setHistoryFilterDate] = useState<string>("");
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>("");
  const [stats, setStats] = useState<any | null>(null);

  // Load groups
  useEffect(() => {
    api.get("/groups?status=active").then((res) => {
      if (res.data.success) {
        setGroups(res.data.groups || []);
        if (!selectedGroupId && res.data.groups?.length > 0) {
          setSelectedGroupId(res.data.groups[0]._id);
        }
      }
    });
  }, []);

  // When selectedGroupId changes, fetch group details to populate roster
  useEffect(() => {
    if (!selectedGroupId) return;

    api.get(`/groups/${selectedGroupId}`).then((res) => {
      if (res.data.success) {
        const grp = res.data.group;
        setSelectedGroup(grp);

        // Pre-fill session start time from group schedule if available
        if (grp.schedule?.length > 0) {
          setSessionStartTime(grp.schedule[0].startTime);
        }

        // Initialize roster records
        const initialRecords = (grp.students || []).map((s: any) => ({
          studentId: s._id,
          name: `${s.firstName} ${s.lastName}`,
          regNo: s.registrationNumber || "-",
          status: "present" as AttendanceStatus,
          notes: "",
        }));
        setRecords(initialRecords);
      }
    });
  }, [selectedGroupId]);

  const setAllStatus = (newStatus: AttendanceStatus) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: newStatus })));
  };

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const updateStudentNotes = (studentId: string, notes: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, notes } : r))
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedGroupId || !date || !sessionStartTime) {
      setFeedback({ type: "error", text: "Veuillez sélectionner le groupe, la date et l'heure" });
      return;
    }

    if (records.length === 0) {
      setFeedback({ type: "error", text: "Aucun élève inscrit dans ce groupe" });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload = {
      group: selectedGroupId,
      date,
      sessionStartTime,
      records: records.map((r) => ({
        student: r.studentId,
        status: r.status,
        notes: r.notes.trim() || undefined,
      })),
    };

    try {
      const res = await api.post("/attendance/bulk", payload);
      if (res.data.success) {
        setFeedback({
          type: "success",
          text: `Présences enregistrées avec succès (${res.data.savedCount} élèves)`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Erreur lors de l'enregistrement des présences",
      });
    } finally {
      setSaving(false);
    }
  };

  // Load history records and statistics
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const params: any = {};
      if (historyFilterGroup) params.group = historyFilterGroup;
      if (historyFilterDate) params.date = historyFilterDate;
      if (historyFilterStatus) params.status = historyFilterStatus;

      const [attendancesRes, statsRes] = await Promise.all([
        api.get("/attendance", { params }),
        api.get("/attendance/statistics", { params }),
      ]);

      if (attendancesRes.data.success) {
        setHistoryRecords(attendancesRes.data.attendances || []);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.statistics);
      }
    } catch (err) {
      console.error("Failed to load attendance history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFilterGroup, historyFilterDate, historyFilterStatus]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const handleDownloadExcel = () => {
    const token = localStorage.getItem("nexomanager_token");
    const params = new URLSearchParams();
    if (historyFilterGroup) params.append("group", historyFilterGroup);
    if (historyFilterDate) params.append("date", historyFilterDate);
    if (historyFilterStatus) params.append("status", historyFilterStatus);

    window.open(`/api/reports/attendance/excel?${params.toString()}&token=${token}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Gestion des Présences & Absences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Feuille d'appel par séance, suivi des retards et notifications automatiques
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 rounded-2xl self-start sm:self-auto border border-slate-200/80">
          <button
            onClick={() => setActiveTab("take")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "take"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Faire l'appel (Séance)
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "history"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Historique & Statistiques
          </button>
        </div>
      </div>

      {activeTab === "take" ? (
        /* ================= TAB 1: FAIRE L'APPEL ================= */
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-600" />
                <span>Groupe de Cours</span>
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full rounded-2xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 py-2.5 px-3.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition shadow-sm"
              >
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.subject} • {g.schoolLevel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                <span>Date de la Séance</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 py-2.5 px-3.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>Heure Début Séance</span>
              </label>
              <input
                type="time"
                value={sessionStartTime}
                onChange={(e) => setSessionStartTime(e.target.value)}
                className="w-full rounded-2xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 py-2.5 px-3.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition shadow-sm"
              />
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span className="font-medium">{feedback.text}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-xs font-bold hover:underline"
              >
                Fermer
              </button>
            </div>
          )}

          {/* Roster Call Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Sheet Sub-header with Quick Actions */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Élèves Inscrits ({records.length})
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  Professeur : {selectedGroup?.teacher?.fullName || "Non spécifié"}
                </span>
              </div>

              {/* Mark all shortcuts */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">
                  Tout marquer :
                </span>
                <button
                  type="button"
                  onClick={() => setAllStatus("present")}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                >
                  Présents
                </button>
                <button
                  type="button"
                  onClick={() => setAllStatus("absent")}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                >
                  Absents
                </button>
                <button
                  type="button"
                  onClick={() => setAllStatus("excused")}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition"
                >
                  Excusés
                </button>
              </div>
            </div>

            {records.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Aucun élève n'est inscrit dans ce groupe. Ajoutez d'abord des élèves dans le groupe pour faire l'appel.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {records.map((r, idx) => (
                  <div
                    key={r.studentId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <span className="text-xs font-bold text-slate-400 w-5">
                        {idx + 1}.
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{r.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          N° {r.regNo}
                        </p>
                      </div>
                    </div>

                    {/* Status radio buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(r.studentId, "present")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          r.status === "present"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Présent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentStatus(r.studentId, "late")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          r.status === "late"
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>En Retard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentStatus(r.studentId, "absent")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          r.status === "absent"
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentStatus(r.studentId, "excused")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          r.status === "excused"
                            ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Excusé</span>
                      </button>
                    </div>

                    {/* Notes input */}
                    <div className="sm:w-64">
                      <input
                        type="text"
                        value={r.notes}
                        onChange={(e) => updateStudentNotes(r.studentId, e.target.value)}
                        placeholder="Remarque (facultatif)..."
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Save Button Footer */}
            {records.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  L'enregistrement d'une absence déclenchera automatiquement la notification du centre.
                </span>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 shadow-glow-red disabled:opacity-60 transition"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Enregistrer l'appel de la séance</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= TAB 2: HISTORIQUE ET STATISTIQUES ================= */
        <div className="space-y-5">
          {/* Statistics summary */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Total Séances
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase">
                  Présents
                </span>
                <p className="text-xl font-bold text-emerald-600 mt-1">{stats.present}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-amber-600 uppercase">
                  En Retard
                </span>
                <p className="text-xl font-bold text-amber-600 mt-1">{stats.late}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-rose-600 uppercase">
                  Absents
                </span>
                <p className="text-xl font-bold text-rose-600 mt-1">{stats.absent}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-sky-600 uppercase">
                  Excusés
                </span>
                <p className="text-xl font-bold text-sky-600 mt-1">{stats.excused}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-blue-600 uppercase">
                  Taux Présence
                </span>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  {stats.attendanceRate}%
                </p>
              </div>
            </div>
          )}

          {/* History Filters */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <select
                value={historyFilterGroup}
                onChange={(e) => setHistoryFilterGroup(e.target.value)}
                className="text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
              >
                <option value="">Tous les groupes</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={historyFilterDate}
                onChange={(e) => setHistoryFilterDate(e.target.value)}
                className="text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
              />

              <select
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value)}
                className="text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="present">Présent</option>
                <option value="late">En retard</option>
                <option value="absent">Absent</option>
                <option value="excused">Excusé</option>
              </select>
            </div>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition self-end sm:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exporter Excel</span>
            </button>
          </div>

          {/* History Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {historyLoading ? (
              <div className="py-16">
                <LoadingSpinner label="Chargement de l'historique..." />
              </div>
            ) : historyRecords.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Aucun enregistrement de présence ne correspond aux filtres.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Date & Séance</th>
                      <th className="py-3 px-4">Élève</th>
                      <th className="py-3 px-4">Groupe</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4">Remarque</th>
                      <th className="py-3 px-4">Enregistré par</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyRecords.map((item) => {
                      const badge = getAttendanceStatusBadge(item.status);

                      return (
                        <tr key={item._id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900">
                              {formatDate(item.date)}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              {item.sessionStartTime}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900">
                              {item.student?.firstName} {item.student?.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              N° {item.student?.registrationNumber || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {item.group?.name || "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                            {item.notes || "-"}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {item.recordedBy?.fullName || "Système"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
