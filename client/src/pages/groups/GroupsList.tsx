import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Clock,
  Eye,
  Edit2,
  Trash2,
  GraduationCap,
} from "lucide-react";
import api from "../../api/client.ts";
import { Group } from "../../types/index.ts";
import { GroupFormModal } from "./GroupFormModal.tsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.tsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.tsx";
import { EmptyState } from "../../components/common/EmptyState.tsx";

const DAY_LABELS: Record<string, string> = {
  Monday: "Lun",
  Tuesday: "Mar",
  Wednesday: "Mer",
  Thursday: "Jeu",
  Friday: "Ven",
  Saturday: "Sam",
  Sunday: "Dim",
};

export const GroupsList: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/groups", { params });
      if (res.data.success) {
        setGroups(res.data.groups || []);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleDelete = async () => {
    if (!deletingGroup) return;
    setIsDeleting(true);

    try {
      await api.delete(`/groups/${deletingGroup._id || deletingGroup.id}`);
      setDeletingGroup(null);
      fetchGroups();
    } catch (err) {
      console.error("Failed to delete group:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Groupes & Emplois du Temps
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total {groups.length} classe(s) et groupe(s) pédagogique(s)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGroup(null);
            setFormModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition shadow-glow-red"
        >
          <Plus className="w-4 h-4" />
          <span>+ Créer un groupe</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom de groupe, matière ou niveau..."
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

      {/* Groups Grid */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner label="Chargement des groupes..." />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          title="Aucun groupe de cours"
          description={
            search || statusFilter
              ? "Aucun groupe ne correspond à vos filtres."
              : "Créez votre premier groupe pour y inscrire des élèves et planifier les cours."
          }
          action={
            !search && !statusFilter
              ? {
                  label: "Créer un groupe",
                  onClick: () => setFormModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const enrolled = group.enrolledCount ?? (group.students?.length || 0);
            const capacityRatio = Math.round((enrolled / group.capacity) * 100);
            const teacherName =
              typeof group.teacher === "object"
                ? (group.teacher as any)?.fullName
                : "Non assigné";

            return (
              <div
                key={group._id || group.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-300 transition"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {group.subject}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                        {group.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{group.schoolLevel}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        group.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {group.status === "active" ? "Actif" : "Archivé"}
                    </span>
                  </div>

                  {/* Teacher & Capacity */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        Professeur :
                      </span>
                      <span className="font-semibold text-slate-900 truncate max-w-[160px]">
                        {teacherName}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          Effectif :
                        </span>
                        <span className="font-semibold text-slate-800">
                          {enrolled} / {group.capacity} élèves
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            capacityRatio >= 90
                              ? "bg-rose-500"
                              : capacityRatio >= 75
                              ? "bg-amber-500"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${Math.min(capacityRatio, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Schedule Pills */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Horaires :
                    </span>
                    {group.schedule?.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        Aucun créneau configuré
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {group.schedule?.map((slot, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-700"
                          >
                            <span className="font-bold text-blue-600">
                              {DAY_LABELS[slot.day] || slot.day}
                            </span>
                            <span>
                              {slot.startTime}-{slot.endTime}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/groups/${group._id || group.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Voir effectif
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingGroup(group);
                        setFormModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingGroup(group)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Group Form Modal */}
      <GroupFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingGroup(null);
        }}
        onSuccess={fetchGroups}
        groupToEdit={editingGroup}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingGroup}
        onClose={() => setDeletingGroup(null)}
        onConfirm={handleDelete}
        title="Supprimer le groupe"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le groupe '${deletingGroup?.name}' ?`}
        confirmLabel="Supprimer"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
