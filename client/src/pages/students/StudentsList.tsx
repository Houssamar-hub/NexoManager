import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Eye,
  Edit2,
  Trash2,
  Phone,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import api from "../../api/client.ts";
import { Student } from "../../types/index.ts";
import { StudentFormModal } from "./StudentFormModal.tsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.tsx";
import { Pagination } from "../../components/common/Pagination.tsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.tsx";
import { EmptyState } from "../../components/common/EmptyState.tsx";
import { formatDate, getStudentStatusBadge } from "../../utils/format.ts";

export const StudentsList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [schoolLevelFilter, setSchoolLevelFilter] = useState<string>("");

  // Modals
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (schoolLevelFilter.trim()) params.schoolLevel = schoolLevelFilter.trim();

      const res = await api.get("/students", { params });
      if (res.data.success) {
        setStudents(res.data.students || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, schoolLevelFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await api.delete(`/students/${deletingStudent._id}`);
      if (res.data.success) {
        setDeletingStudent(null);
        fetchStudents();
      }
    } catch (err: any) {
      console.error("Delete student failed:", err);
      const message =
        err.response?.data?.message ||
        "Impossible de supprimer cet élève (historique de présences ou paiements existant).";
      setDeleteError(message);
      setDeletingStudent(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await api.get("/reports/students/excel", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `eleves-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export Excel failed:", err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get("/reports/students/pdf", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `eleves-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export PDF failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Élèves & Inscriptions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total {total} élève(s) inscrit(s) dans le centre
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition shadow-glow-red"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Inscrire un élève</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par nom, matricule ou téléphone..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="left">Parti</option>
          </select>

          <input
            type="text"
            value={schoolLevelFilter}
            onChange={(e) => {
              setSchoolLevelFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Niveau scolaire..."
            className="text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 w-36"
          />
        </div>
      </div>

      {/* Delete Error Notification Banner */}
      {deleteError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Suppression refusée</p>
            <p className="mt-0.5">{deleteError}</p>
          </div>
          <button
            onClick={() => setDeleteError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20">
            <LoadingSpinner size="md" label="Chargement des élèves..." />
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            title="Aucun élève trouvé"
            description="Aucun dossier d'élève ne correspond à vos critères de recherche."
            action={{
              label: "Inscrire un élève",
              onClick: () => {
                setEditingStudent(null);
                setFormModalOpen(true);
              },
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6 font-semibold">Élève</th>
                  <th className="py-3.5 px-4 font-semibold">Matricule</th>
                  <th className="py-3.5 px-4 font-semibold">Niveau Scolaire</th>
                  <th className="py-3.5 px-4 font-semibold">Parent / Tuteur</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Statut</th>
                  <th className="py-3.5 px-4 font-semibold">Date d'inscription</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map((student) => {
                  const statusBadge = getStudentStatusBadge(student.status);
                  return (
                    <tr
                      key={student._id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <Link
                          to={`/students/${student._id}`}
                          className="flex items-center gap-3 font-bold text-slate-900 hover:text-rose-600 transition"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold text-xs uppercase shrink-0">
                            {student.firstName[0]}
                          </div>
                          <div>
                            <span className="block">
                              {student.firstName} {student.lastName}
                            </span>
                            {student.parentEmail && (
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {student.parentEmail}
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-500">
                        {student.registrationNumber || "-"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {student.schoolLevel || "-"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {student.parentName && (
                          <div className="font-semibold text-slate-800">
                            {student.parentName}
                          </div>
                        )}
                        {student.parentPhone && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Phone className="w-3 h-3" />
                            <span>{student.parentPhone}</span>
                          </div>
                        )}
                        {!student.parentName && !student.parentPhone && "-"}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            student.status === "active"
                              ? "bg-slate-900 text-white"
                              : student.status === "suspended"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        {formatDate(student.createdAt)}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/students/${student._id}`}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                            title="Voir la fiche"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={12}
          onPageChange={(newPage: number) => setPage(newPage)}
        />
      </div>

      {/* Student Form Modal (Create / Edit) */}
      <StudentFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingStudent(null);
        }}
        onSuccess={fetchStudents}
        studentToEdit={editingStudent}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDelete}
        title="Supprimer l'élève"
        message={`Êtes-vous sûr de vouloir supprimer définitivement l'élève ${deletingStudent?.firstName} ${deletingStudent?.lastName} ? Cette action est irréversible et sera refusée si l'élève possède un historique de présences ou de paiements.`}
        confirmLabel="Supprimer"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default StudentsList;
