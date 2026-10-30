import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const AccessDenied: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <span className="text-sm font-bold text-rose-600 uppercase tracking-widest">
        Accès Refusé (403)
      </span>
      <h1 className="text-3xl font-bold text-slate-900 mt-1 mb-2">
        Permissions Insuffisantes
      </h1>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        Vous n'avez pas les autorisations nécessaires pour accéder à cette section du centre. Veuillez contacter votre administrateur d'établissement.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au tableau de bord</span>
      </Link>
    </div>
  );
};
