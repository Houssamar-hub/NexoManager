import React, { useState, useEffect } from "react";
import { School, User, Lock, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";
import api from "../../api/client.ts";

export const CenterSettings: React.FC = () => {
  const { user, center, refreshUser, updateCenterState } = useAuth();

  // Center form state
  const [centerName, setCenterName] = useState("");
  const [centerEmail, setCenterEmail] = useState("");
  const [centerPhone, setCenterPhone] = useState("");
  const [centerAddress, setCenterAddress] = useState("");
  const [centerSaving, setCenterSaving] = useState(false);
  const [centerFeedback, setCenterFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // User profile state
  const [fullName, setFullName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [userSaving, setUserSaving] = useState(false);
  const [userFeedback, setUserFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (center) {
      setCenterName(center.name || "");
      setCenterEmail(center.email || "");
      setCenterPhone(center.phone || "");
      setCenterAddress(center.address || "");
    }
    if (user) {
      setFullName(user.fullName || "");
      setUserPhone(user.phone || "");
      setSpecialization(user.specialization || "");
    }
  }, [center, user]);

  const handleUpdateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    setCenterSaving(true);
    setCenterFeedback(null);

    try {
      const res = await api.patch("/centers/me", {
        name: centerName.trim(),
        email: centerEmail.trim().toLowerCase() || undefined,
        phone: centerPhone.trim() || undefined,
        address: centerAddress.trim() || undefined,
      });

      if (res.data.success) {
        updateCenterState(res.data.center);
        setCenterFeedback({
          type: "success",
          text: "Informations du centre mises à jour avec succès",
        });
      }
    } catch (err: any) {
      setCenterFeedback({
        type: "error",
        text: err.response?.data?.message || "Erreur lors de la mise à jour du centre",
      });
    } finally {
      setCenterSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSaving(true);
    setUserFeedback(null);

    try {
      const res = await api.put("/auth/profile", {
        fullName: fullName.trim(),
        phone: userPhone.trim() || undefined,
        specialization: specialization.trim() || undefined,
      });

      if (res.data.success) {
        refreshUser();
        setUserFeedback({
          type: "success",
          text: "Profil utilisateur mis à jour avec succès",
        });
      }
    } catch (err: any) {
      setUserFeedback({
        type: "error",
        text: err.response?.data?.message || "Erreur lors de la mise à jour du profil",
      });
    } finally {
      setUserSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        text: "Le nouveau mot de passe doit comporter au moins 8 caractères",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        text: "La confirmation ne correspond pas au nouveau mot de passe",
      });
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await api.put("/auth/password", {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordFeedback({
          type: "success",
          text: "Mot de passe modifié avec succès",
        });
      }
    } catch (err: any) {
      setPasswordFeedback({
        type: "error",
        text: err.response?.data?.message || "Mot de passe actuel incorrect",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Paramètres & Profil
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Gérez l'identité de votre centre et vos identifiants de sécurité
        </p>
      </div>

      {/* 1. Center Settings (Admin / Manager) */}
      {isAdminOrManager && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Fiche de l'Établissement
              </h3>
              <p className="text-xs text-slate-500">
                Coordonnées officielles du centre affichées sur les rapports et factures
              </p>
            </div>
          </div>

          {centerFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                centerFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {centerFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{centerFeedback.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateCenter} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nom du Centre *
                </label>
                <input
                  type="text"
                  required
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email de Contact
                </label>
                <input
                  type="email"
                  value={centerEmail}
                  onChange={(e) => setCenterEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Téléphone Principal
                </label>
                <input
                  type="text"
                  value={centerPhone}
                  onChange={(e) => setCenterPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Adresse Physique
                </label>
                <input
                  type="text"
                  value={centerAddress}
                  onChange={(e) => setCenterAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={centerSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-60"
              >
                {centerSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Enregistrer le centre</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. User Personal Profile */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Mon Profil Utilisateur
            </h3>
            <p className="text-xs text-slate-500">
              Compte : {user?.email} ({user?.role})
            </p>
          </div>
        </div>

        {userFeedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              userFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {userFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{userFeedback.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nom Complet *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Téléphone Personnel
              </label>
              <input
                type="text"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Spécialisation / Fonction
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="Ex. Direction, Professeur de Physique..."
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={userSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-60"
            >
              {userSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Mettre à jour mon profil</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Security: Change Password */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Sécurité & Mot de Passe
            </h3>
            <p className="text-xs text-slate-500">
              Modifiez régulièrement votre mot de passe pour protéger les données du centre
            </p>
          </div>
        </div>

        {passwordFeedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {passwordFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{passwordFeedback.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mot de passe actuel *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full sm:w-80 rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nouveau mot de passe (Min. 8 car.) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirmer le nouveau mot de passe *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={passwordSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition disabled:opacity-60"
            >
              {passwordSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Changer le mot de passe</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
