import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Identifiants incorrects. Veuillez vérifier votre email et mot de passe."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF2F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Emblem */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 border-2 border-rose-500 shadow-md mb-3">
          <div className="w-5 h-5 rounded-full bg-rose-600 shadow-sm"></div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Nexo<span className="text-rose-600">Manager</span>
        </h2>
        <p className="mt-1 text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Plateforme Multi-Tenant de Gestion Pédagogique
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/70 rounded-3xl sm:px-10 border border-slate-200/80">
          <div className="mb-6">
            <h3 className="text-xl font-extrabold text-slate-900">Connexion</h3>
            <p className="text-xs text-slate-400 mt-1">
              Accédez à l'espace de gestion de votre centre éducatif
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1"
              >
                Adresse Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex. admin@excellence.edu"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1"
              >
                Mot de Passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-glow-red transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>Se Connecter</span>
            </button>
          </form>

          {/* Quick Credential Helpers */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-[11px] text-slate-400">
            <span className="font-bold text-slate-600 block mb-1.5 uppercase text-[10px] tracking-wider">
              Comptes Démo (Seeding) :
            </span>
            <div className="space-y-1 text-slate-500 font-mono">
              <p>• Admin : admin@excellence.edu / AdminPass123!</p>
              <p>• Manager : manager@excellence.edu / ManagerPass123!</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Vous représentez un nouveau centre ?{" "}
              <Link
                to="/register"
                className="font-extrabold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Créer un compte centre
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
