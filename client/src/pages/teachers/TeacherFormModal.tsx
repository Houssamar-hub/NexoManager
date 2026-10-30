import React, { useState, useEffect } from "react";
import { Modal } from "../../components/common/Modal.tsx";
import { User } from "../../types/index.ts";
import api from "../../api/client.ts";

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacherToEdit?: User | null;
}

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teacherToEdit,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teacherToEdit) {
      setFullName(teacherToEdit.fullName || "");
      setEmail(teacherToEdit.email || "");
      setPassword("");
      setPhone(teacherToEdit.phone || "");
      setSpecialization(teacherToEdit.specialization || "");
      setStatus(teacherToEdit.status || "active");
    } else {
      setFullName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setSpecialization("");
      setStatus("active");
    }
    setError(null);
  }, [teacherToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim()) {
      setError("Le nom et l'email sont obligatoires");
      return;
    }

    if (!teacherToEdit && password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères");
      return;
    }

    setLoading(true);

    try {
      if (teacherToEdit) {
        const payload: any = {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          specialization: specialization.trim() || undefined,
          status,
        };
        await api.patch(`/teachers/${teacherToEdit.id || teacherToEdit._id}`, payload);
      } else {
        const payload = {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          specialization: specialization.trim() || undefined,
        };
        await api.post("/teachers", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors de l'enregistrement du professeur"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={teacherToEdit ? "Modifier le Professeur" : "Ajouter un Professeur"}
      subtitle="Créez les accès et informations de l'enseignant"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Nom et Prénom *
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex. Professeur Mohammed Alami"
            className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Email de Connexion *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alami@centre.ma"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {teacherToEdit
                ? "Mot de passe (Laisser vide pour conserver)"
                : "Mot de passe (Min. 8 car.) *"}
            </label>
            <input
              type="password"
              required={!teacherToEdit}
              minLength={teacherToEdit ? 0 : 8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Matière / Spécialisation
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="Ex. Mathématiques, Physique-Chimie..."
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Numéro de Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0600112233"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {teacherToEdit && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Statut du Professeur
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif (Désactivé)</option>
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
            {teacherToEdit ? "Enregistrer les modifications" : "Créer le professeur"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
