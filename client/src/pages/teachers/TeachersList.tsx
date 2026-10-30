import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  UserPlus,
  Search,
  Filter,
  Layers,
  Edit2,
  Power,
  Phone,
  Mail,
  School,
} from "lucide-react";
import api from "../../api/client.ts";
import { User } from "../../types/index.ts";
import { TeacherFormModal } from "./TeacherFormModal.tsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.tsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.tsx";
import { EmptyState } from "../../components/common/EmptyState.tsx";
import { formatDate } from "../../utils/format.ts";

export const TeachersList: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [toggleTeacher, setToggleTeacher] = useState<any | null>(null);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/teachers", { params });
      if (res.data.success) {
        setTeachers(res.data.teachers || []);
      }
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleToggleStatus = async () => {
    if (!toggleTeacher) return;
    setIsToggling(true);

    try {
      await api.delete(`/teachers/${toggleTeacher.id || toggleTeacher._id}`);
      setToggleTeacher(null);
      fetchTeachers();
    } catch (err) {
      console.error("Failed to toggle teacher status:", err);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Corps Enseignant
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total {teachers.length} professeur(s) enregistré(s)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTeacher(null);
            setFormModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition shadow-glow-red"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Ajouter un professeur</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, spécialité ou téléphone..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-medium text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Statut :</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-2 px-3 focus:outline-none focus:border-blue-600"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Teachers Grid View */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner label="Chargement des enseignants..." />
        </div>
      ) : teachers.length === 0 ? (
        <EmptyState
          title="Aucun professeur trouvé"
          description={
            search || statusFilter
              ? "Aucun enseignant ne correspond à vos filtres."
              : "Ajoutez vos professeurs pour leur assigner des cours et leur permettre de faire l'appel."
          }
          action={
            !search && !statusFilter
              ? {
                  label: "Ajouter un professeur",
                  onClick: () => setFormModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => {
            const isActive = teacher.status === "active";

            return (
              <div
                key={teacher._id || teacher.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                        {teacher.fullName?.charAt(0) || "P"}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {teacher.fullName}
                        </h3>
                        <p className="text-[11px] font-medium text-blue-600 mt-0.5">
                          {teacher.specialization || "Enseignant"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  {/* Contact info */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Groups badge */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>Groupes assignés :</span>
                    </span>
                    <span className="font-bold text-slate-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      {teacher.groupsCount || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingTeacher(teacher);
                      setFormModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setToggleTeacher(teacher)}
                    className={`p-1.5 rounded-lg transition ${
                      isActive
                        ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                    }`}
                    title={isActive ? "Désactiver le compte" : "Activer le compte"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Teacher Form Modal */}
      <TeacherFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingTeacher(null);
        }}
        onSuccess={fetchTeachers}
        teacherToEdit={editingTeacher}
      />

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!toggleTeacher}
        onClose={() => setToggleTeacher(null)}
        onConfirm={handleToggleStatus}
        title={
          toggleTeacher?.status === "active"
            ? "Désactiver le professeur"
            : "Réactiver le professeur"
        }
        message={`Voulez-vous vraiment changer le statut de ${toggleTeacher?.fullName} en '${
          toggleTeacher?.status === "active" ? "inactif" : "actif"
        }' ?`}
        confirmLabel={
          toggleTeacher?.status === "active" ? "Désactiver" : "Réactiver"
        }
        isDangerous={toggleTeacher?.status === "active"}
        isLoading={isToggling}
      />
    </div>
  );
};
