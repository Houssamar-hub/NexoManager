import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Layers,
  GraduationCap,
  Users,
  Calendar,
  Clock,
  UserPlus,
  Trash2,
  CalendarCheck2,
  AlertCircle,
  Edit2,
} from "lucide-react";
import api from "../../api/client.ts";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.tsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.tsx";
import { Modal } from "../../components/common/Modal.tsx";
import { GroupFormModal } from "./GroupFormModal.tsx";

const DAY_LABELS: Record<string, string> = {
  Monday: "Lundi",
  Tuesday: "Mardi",
  Wednesday: "Mercredi",
  Thursday: "Jeudi",
  Friday: "Vendredi",
  Saturday: "Samedi",
  Sunday: "Dimanche",
};

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add student modal
  const [addStudentModalOpen, setAddStudentModalOpen] = useState<boolean>(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [addingLoading, setAddingLoading] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit group modal
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  // Remove student confirmation
  const [removingStudent, setRemovingStudent] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/groups/${id}`);
      if (res.data.success) {
        setGroup(res.data.group);
      }
    } catch (err: any) {
      console.error("Failed to load group:", err);
      setError(err.response?.data?.message || "Groupe introuvable");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const openAddStudentModal = async () => {
    setAddError(null);
    setSelectedStudentId("");
    setAddStudentModalOpen(true);

    try {
      const res = await api.get("/students?status=active&limit=100");
      if (res.data.success) {
        const enrolledIds = new Set(
          (group?.students || []).map((s: any) => s._id || s.id)
        );
        const filtered = (res.data.students || []).filter(
          (s: any) => !enrolledIds.has(s._id)
        );
        setAvailableStudents(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch available students:", err);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setAddingLoading(true);
    setAddError(null);

    try {
      await api.post(`/groups/${id}/students`, {
        studentId: selectedStudentId,
      });
      setAddStudentModalOpen(false);
      fetchGroup();
    } catch (err: any) {
      setAddError(
        err.response?.data?.message || "Erreur lors de l'ajout de l'élève au groupe"
      );
    } finally {
      setAddingLoading(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!removingStudent) return;
    setIsRemoving(true);

    try {
      await api.delete(`/groups/${id}/students`, {
        data: { studentId: removingStudent._id },
      });
      setRemovingStudent(null);
      fetchGroup();
    } catch (err) {
      console.error("Failed to remove student:", err);
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" label="Chargement du groupe..." />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">{error || "Groupe introuvable"}</h3>
        <button
          onClick={() => navigate("/groups")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
        >
          Retour aux groupes
        </button>
      </div>
    );
  }

  const enrolledCount = group.students?.length || 0;
  const isAtCapacity = enrolledCount >= group.capacity;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/groups")}
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <span>{group.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {group.subject}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Niveau : {group.schoolLevel} • {enrolledCount} / {group.capacity} élèves inscrits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/attendance?groupId=${group._id}`}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Faire l'appel</span>
          </Link>
          <button
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
          >
            <Edit2 className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        </div>
      </div>

      {/* Group Info & Schedule Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Informations du Groupe</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Professeur Référent :</span>
              <span className="text-sm font-bold text-slate-800">
                {group.teacher?.fullName || "Aucun professeur assigné"}
              </span>
              {group.teacher?.specialization && (
                <span className="text-slate-500 block">
                  {group.teacher.specialization}
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Capacité d'accueil :</span>
              <span className="text-sm font-bold text-slate-800">
                {enrolledCount} / {group.capacity} élèves
              </span>
              {isAtCapacity && (
                <span className="text-[11px] font-semibold text-rose-600 block mt-0.5">
                  Capacité maximale atteinte
                </span>
              )}
            </div>

            {group.description && (
              <div>
                <span className="text-slate-400 block font-medium">Description :</span>
                <p className="text-slate-600 mt-1 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {group.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Schedule card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Créneaux Horaires de la Semaine</span>
          </h3>

          {group.schedule?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center italic">
              Aucun créneau configuré pour ce groupe.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {group.schedule?.map((slot: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3"
                >
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {DAY_LABELS[slot.day] || slot.day}
                    </h4>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      {slot.startTime} à {slot.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Liste des Élèves Inscrits ({enrolledCount})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Élèves participant aux séances de ce groupe
            </p>
          </div>

          <button
            onClick={openAddStudentModal}
            disabled={isAtCapacity}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ajouter un élève</span>
          </button>
        </div>

        {enrolledCount === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucun élève n'est encore inscrit dans ce groupe.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Élève</th>
                  <th className="py-3 px-4">N° Inscription</th>
                  <th className="py-3 px-4">Parent / Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {group.students?.map((student: any) => (
                  <tr key={student._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <Link
                        to={`/students/${student._id}`}
                        className="font-bold text-slate-900 hover:text-blue-600"
                      >
                        {student.firstName} {student.lastName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {student.registrationNumber || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {student.parentName || "-"} {student.parentPhone ? `(${student.parentPhone})` : ""}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setRemovingStudent(student)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Retirer du groupe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={addStudentModalOpen}
        onClose={() => setAddStudentModalOpen(false)}
        title="Inscrire un Élève dans ce Groupe"
        subtitle={`Capacité restante : ${group.capacity - enrolledCount} place(s)`}
        maxWidth="md"
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          {addError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {addError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Sélectionner un Élève Actif
            </label>
            {availableStudents.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aucun autre élève actif disponible dans votre centre.
              </p>
            ) : (
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="">Sélectionnez un élève...</option>
                {availableStudents.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} (N° {s.registrationNumber || "-"}) • {s.schoolLevel || ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddStudentModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={addingLoading || !selectedStudentId}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {addingLoading && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Ajouter au groupe
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Student Confirmation */}
      <ConfirmDialog
        isOpen={!!removingStudent}
        onClose={() => setRemovingStudent(null)}
        onConfirm={handleRemoveStudent}
        title="Retirer l'élève du groupe"
        message={`Voulez-vous retirer ${removingStudent?.firstName} ${removingStudent?.lastName} de ce groupe ?`}
        confirmLabel="Retirer"
        isDangerous={true}
        isLoading={isRemoving}
      />

      {/* Edit Group Modal */}
      <GroupFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={fetchGroup}
        groupToEdit={group}
      />
    </div>
  );
};
