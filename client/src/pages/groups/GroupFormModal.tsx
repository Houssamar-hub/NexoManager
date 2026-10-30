import React, { useState, useEffect } from "react";
import { Plus, Trash2, Clock, Calendar } from "lucide-react";
import { Modal } from "../../components/common/Modal.tsx";
import { Group, ScheduleSlot, DayOfWeek } from "../../types/index.ts";
import api from "../../api/client.ts";

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupToEdit?: Group | null;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "Monday", label: "Lundi" },
  { key: "Tuesday", label: "Mardi" },
  { key: "Wednesday", label: "Mercredi" },
  { key: "Thursday", label: "Jeudi" },
  { key: "Friday", label: "Vendredi" },
  { key: "Saturday", label: "Samedi" },
  { key: "Sunday", label: "Dimanche" },
];

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  groupToEdit,
}) => {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [schoolLevel, setSchoolLevel] = useState("");
  const [teacher, setTeacher] = useState("");
  const [capacity, setCapacity] = useState(20);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);

  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch available active teachers
      api.get("/teachers?status=active").then((res) => {
        if (res.data.success) {
          setTeachersList(res.data.teachers || []);
        }
      });
    }

    if (groupToEdit) {
      setName(groupToEdit.name || "");
      setSubject(groupToEdit.subject || "");
      setSchoolLevel(groupToEdit.schoolLevel || "");
      setTeacher(
        typeof groupToEdit.teacher === "object"
          ? (groupToEdit.teacher as any)?._id
          : groupToEdit.teacher || ""
      );
      setCapacity(groupToEdit.capacity || 20);
      setDescription(groupToEdit.description || "");
      setStatus(groupToEdit.status || "active");
      setSchedule(groupToEdit.schedule || []);
    } else {
      setName("");
      setSubject("");
      setSchoolLevel("");
      setTeacher("");
      setCapacity(20);
      setDescription("");
      setStatus("active");
      setSchedule([]);
    }
    setError(null);
  }, [groupToEdit, isOpen]);

  const addScheduleSlot = () => {
    setSchedule([
      ...schedule,
      { day: "Monday", startTime: "16:00", endTime: "18:00" },
    ]);
  };

  const removeScheduleSlot = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, val: string) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: val };
    setSchedule(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !subject.trim() || !schoolLevel.trim()) {
      setError("Le nom, la matière et le niveau scolaire sont obligatoires");
      return;
    }

    for (const slot of schedule) {
      if (slot.startTime >= slot.endTime) {
        setError(`L'heure de début doit être antérieure à l'heure de fin pour le créneau du ${slot.day}`);
        return;
      }
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      schoolLevel: schoolLevel.trim(),
      teacher: teacher || undefined,
      capacity: Number(capacity),
      description: description.trim() || undefined,
      schedule,
      status: groupToEdit ? status : "active",
    };

    try {
      if (groupToEdit) {
        await api.patch(`/groups/${groupToEdit._id || groupToEdit.id}`, payload);
      } else {
        await api.post("/groups", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors de l'enregistrement du groupe"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={groupToEdit ? "Modifier le Groupe" : "Créer un Groupe de Cours"}
      subtitle="Configurez la matière, le niveau, le professeur et les créneaux"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Nom du Groupe *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Maths Bac Sciences - Gr. A"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Matière Enseignée *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex. Mathématiques"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Niveau Scolaire *
            </label>
            <input
              type="text"
              required
              value={schoolLevel}
              onChange={(e) => setSchoolLevel(e.target.value)}
              placeholder="Ex. 2ème Bac SM"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Professeur Assigné
            </label>
            <select
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Aucun professeur assigné</option>
              {teachersList.map((t) => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.fullName} ({t.specialization || "Enseignant"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Capacité Max (Élèves)
            </label>
            <input
              type="number"
              min={1}
              max={150}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Weekly Schedule Builder */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Emploi du Temps Hebdomadaire</span>
            </h4>
            <button
              type="button"
              onClick={addScheduleSlot}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un créneau</span>
            </button>
          </div>

          {schedule.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Aucun créneau configuré. Cliquez sur 'Ajouter un créneau' ci-dessus.
            </p>
          ) : (
            <div className="space-y-2">
              {schedule.map((slot, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <select
                    value={slot.day}
                    onChange={(e) =>
                      updateScheduleSlot(idx, "day", e.target.value as DayOfWeek)
                    }
                    className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white font-medium text-slate-800 focus:outline-none"
                  >
                    {DAYS.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        updateScheduleSlot(idx, "startTime", e.target.value)
                      }
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-800 bg-white"
                    />
                    <span>à</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        updateScheduleSlot(idx, "endTime", e.target.value)
                      }
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-800 bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeScheduleSlot(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg ml-auto transition"
                    title="Supprimer ce créneau"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Description / Objectifs
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex. Préparation concours & examens nationaux..."
            className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {groupToEdit && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Statut du Groupe
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none font-semibold"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif (Archivé)</option>
            </select>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-60 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {groupToEdit ? "Enregistrer les modifications" : "Créer le groupe"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
