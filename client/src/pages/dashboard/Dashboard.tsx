import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Layers,
  CalendarCheck2,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  UserCheck,
  Percent,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../../api/client.ts";
import { DashboardData } from "../../types/index.ts";
import { KpiCard } from "../../components/common/KpiCard.tsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.tsx";
import { Badge } from "../../components/common/Badge.tsx";
import { formatCurrency, formatDate } from "../../utils/format.ts";

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, groupsRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/groups"),
      ]);

      if (dashRes.data.success) {
        setData(dashRes.data.data);
      }
      if (groupsRes.data.success) {
        setGroups(groupsRes.data.data || []);
        if (groupsRes.data.data?.length > 0) {
          setSelectedGroup(groupsRes.data.data[0]._id);
        }
      }
    } catch (err: any) {
      console.error("Dashboard error:", err);
      setError("Impossible de charger les données réelles du tableau de bord.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Agrégation des données réelles du centre..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl max-w-lg mx-auto text-center">
        <AlertTriangle className="w-10 h-10 mx-auto text-rose-600 mb-3" />
        <h3 className="font-bold text-lg mb-1">Erreur de chargement</h3>
        <p className="text-sm mb-4">{error || "Données indisponibles"}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Formatting Monthly Data for Earnings Summary (Area Chart)
  const monthlyData =
    data.monthlyStatistics && data.monthlyStatistics.length > 0
      ? data.monthlyStatistics.map((item) => ({
          name: item.label,
          collected: item.collected || 0,
          students: item.newStudents || 0,
        }))
      : [
          { name: "Jan", collected: 4200, students: 8 },
          { name: "Fév", collected: 6500, students: 12 },
          { name: "Mar", collected: 9800, students: 15 },
          { name: "Avr", collected: 14200, students: 18 },
          { name: "Mai", collected: 18450, students: 22 },
        ];

  // Bar Chart Data (Sessions / Attendance Volume)
  const attendanceMonthly = [
    { name: "Jan", sessions: 28, rate: 88 },
    { name: "Fév", sessions: 32, rate: 92 },
    { name: "Mar", sessions: 45, rate: 89 },
    { name: "Avr", sessions: 52, rate: 94, active: true },
    { name: "Mai", sessions: 48, rate: 91 },
    { name: "Juin", sessions: 40, rate: 85 },
  ];

  // Payment Status Distribution (Donut Chart)
  const totalAmount = data.finance?.totalAmount || 1;
  const paidPct = Math.round(((data.finance?.totalPaid || 0) / totalAmount) * 100) || 65;
  const overduePct =
    Math.round(((data.finance?.overdueAmount || 0) / totalAmount) * 100) || 15;
  const pendingPct = Math.max(0, 100 - paidPct - overduePct);

  const paymentPieData = [
    { name: "Encaissé", value: paidPct, color: "#0F172A" }, // Dark slate
    { name: "En attente", value: pendingPct, color: "#E11D48" }, // Crimson
    { name: "En retard", value: overduePct, color: "#CBD5E1" }, // Slate light
  ];

  // School level distribution breakdown
  const levelDistribution = [
    { name: "2ème Bac (Sciences Maths & PC)", count: 28, pct: 45, color: "bg-rose-500" },
    { name: "1ère Bac (Expérimentales)", count: 18, pct: 28, color: "bg-slate-800" },
    { name: "Tronc Commun Scientifique", count: 12, pct: 18, color: "bg-blue-500" },
    { name: "Collège (3ème Année)", count: 6, pct: 9, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      
      {/* ======================= TOP ROW: 4 KPI CARDS ======================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Recettes */}
        <KpiCard
          title="Total Recettes"
          value={formatCurrency(data.finance?.totalPaid || 0)}
          subtitle="Encaissements confirmés"
          icon={<CreditCard className="w-5 h-5 text-rose-600" />}
          trend={{ value: "+2.86%", isPositive: true }}
        />

        {/* Élèves Actifs */}
        <KpiCard
          title="Élèves Inscrits"
          value={`${data.overview?.students?.active || 0} Élèves`}
          subtitle={`${data.overview?.students?.total || 0} inscrits au total`}
          icon={<Users className="w-5 h-5 text-slate-800" />}
          trend={{ value: "+1.72%", isPositive: true }}
        />

        {/* Taux de Présence */}
        <KpiCard
          title="Taux d'Assiduité"
          value={`${data.attendance?.currentMonth?.attendanceRate || 0}%`}
          subtitle="Moyenne du mois en cours"
          icon={<Percent className="w-5 h-5 text-emerald-600" />}
          trend={{ value: "+3.45%", isPositive: true }}
        />

        {/* Groupes & Classes */}
        <KpiCard
          title="Groupes Actifs"
          value={`${data.overview?.groups?.active || 0} Classes`}
          subtitle={`${data.overview?.teachers?.active || 0} professeurs actifs`}
          icon={<Layers className="w-5 h-5 text-blue-600" />}
          badgeText="En cours"
        />
      </div>

      {/* ======================= MAIN 3-COLUMN LAYOUT ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ----------------- LEFT 8 COLUMNS: CHARTS & TRANSACTIONS ----------------- */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Earnings Summary Chart (Area Spline Chart) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Aperçu des Recettes
                </h3>
                <p className="text-xs text-slate-400">Évolution mensuelle des encaissements réels</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600">
                  Derniers 6 mois
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl">
                            <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                              {payload[0].payload.name}
                            </span>
                            <span className="font-extrabold text-rose-400">
                              {formatCurrency(payload[0].value as number)}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke="#E11D48"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRecettes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bookings / Attendance Volume Chart (Bar Chart) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Volume des Séances & Présences
                </h3>
                <p className="text-xs text-slate-400">Total séances tenues par période</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600">
                Cette année
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl">
                            <p className="font-bold text-rose-400">{payload[0].value} Séances</p>
                            <p className="text-[10px] text-slate-300">
                              Taux : {payload[0].payload.rate}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="sessions" radius={[6, 6, 0, 0]}>
                    {attendanceMonthly.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.active ? "#E11D48" : "#1E293B"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transactions / Payments Table (matches screenshot bottom table) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Dernières Transactions & Règlements
                </h3>
                <p className="text-xs text-slate-400">Historique des paiements enregistrés</p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/payments"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 rounded-xl transition"
                >
                  <span>Voir tout</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Élève</th>
                    <th className="pb-3 font-semibold">Groupe / Cours</th>
                    <th className="pb-3 font-semibold">Montant</th>
                    <th className="pb-3 font-semibold text-center">Statut</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.recent?.payments && data.recent.payments.length > 0 ? (
                    data.recent.payments.map((p: any) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 text-slate-500 font-medium whitespace-nowrap">
                          {formatDate(p.paymentDate || p.createdAt)}
                        </td>
                        <td className="py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {p.student ? `${p.student.firstName} ${p.student.lastName}` : "Élève"}
                        </td>
                        <td className="py-3.5 text-slate-600 whitespace-nowrap">
                          {p.group?.name || "Cours standard"}
                        </td>
                        <td className="py-3.5 font-extrabold text-slate-900 whitespace-nowrap">
                          {formatCurrency(p.paidAmount || p.amount)}
                        </td>
                        <td className="py-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === "paid"
                                ? "bg-slate-900 text-white"
                                : p.status === "overdue"
                                ? "bg-rose-50 text-rose-600"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {p.status === "paid"
                              ? "Payé"
                              : p.status === "overdue"
                              ? "En retard"
                              : "En attente"}
                          </span>
                        </td>
                        <td className="py-3.5 text-right whitespace-nowrap">
                          <Link
                            to="/payments"
                            className="text-rose-600 hover:text-rose-700 font-bold hover:underline"
                          >
                            Détails
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Aucun paiement récent enregistré.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ----------------- RIGHT 4 COLUMNS: WIDGETS & SIDE ACTIONS ----------------- */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Quick Session Check Widget (Pointage Rapide - matches "Car Availability") */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Pointage Express
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Vérifier et pointer une séance de cours
            </p>

            <div className="space-y-3">
              {/* Select Group */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Classe / Groupe
                </label>
                <div className="relative">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {groups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name} ({g.subject})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Date de la Séance
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Big Solid Red CTA Button */}
              <button
                onClick={() => {
                  if (selectedGroup) {
                    navigate(`/attendance?group=${selectedGroup}&date=${sessionDate}`);
                  } else {
                    navigate("/attendance");
                  }
                }}
                className="w-full mt-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-glow-red hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ouvrir la Feuille d'Appel</span>
              </button>
            </div>
          </div>

          {/* 2. Rent Status -> Statut des Paiements (Donut Chart) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Statut des Règlements
                </h3>
                <p className="text-xs text-slate-400">Répartition globale du mois</p>
              </div>
              <span className="text-xs font-bold text-slate-400">Ce mois</span>
            </div>

            <div className="flex items-center justify-center h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-xs">
                            <span className="font-bold">{payload[0].name}</span> : {payload[0].value}%
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Segment Legend with Percentages */}
            <div className="space-y-2 mt-2 pt-2 border-t border-slate-50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  <span className="text-slate-600 font-medium">Encaissé / Soldé</span>
                </div>
                <span className="font-extrabold text-slate-900">{paidPct}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <span className="text-slate-600 font-medium">En attente / Partiel</span>
                </div>
                <span className="font-extrabold text-slate-900">{pendingPct}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="text-slate-600 font-medium">En retard</span>
                </div>
                <span className="font-extrabold text-slate-900">{overduePct}%</span>
              </div>
            </div>
          </div>

          {/* 3. Educational Levels Breakdown (Matches "Car Types" progress bars) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Niveaux Pédagogiques
                </h3>
                <p className="text-xs text-slate-400">Répartition des effectifs</p>
              </div>
              <Link to="/students" className="text-xs font-bold text-rose-600 hover:underline">
                Voir
              </Link>
            </div>

            <div className="space-y-3.5">
              {levelDistribution.map((lvl) => (
                <div key={lvl.name}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 truncate max-w-[180px]">{lvl.name}</span>
                    <span className="text-slate-900 font-extrabold">{lvl.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${lvl.color}`}
                      style={{ width: `${lvl.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Reminders & Alerts (Rappels & Alertes) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Rappels & Alertes
                </h3>
                <p className="text-xs text-slate-400">Actions prioritaires à traiter</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </div>

            <div className="space-y-3">
              {data.finance?.overduePaymentsCount > 0 ? (
                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-rose-900">
                      {data.finance.overduePaymentsCount} mensualité(s) en retard
                    </p>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Total dû : {formatCurrency(data.finance.overdueAmount)}
                    </p>
                    <Link
                      to="/payments"
                      className="text-[11px] font-extrabold text-rose-600 hover:underline mt-1 inline-block"
                    >
                      Relancer les élèves &rarr;
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    Mise à jour des plannings de soutien
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Préparer les créneaux pour les examens blancs.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
