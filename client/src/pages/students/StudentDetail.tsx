import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Calendar,
  Layers,
  CalendarCheck2,
  CreditCard,
  Edit2,
  Phone,
  Mail,
  AlertCircle,
  FileText,
} from "lucide-react";
import api from "../../api/client.ts";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.tsx";
import { StudentFormModal } from "./StudentFormModal.tsx";
import {
  formatCurrency,
  formatDate,
  getStudentStatusBadge,
  getPaymentStatusBadge,
} from "../../utils/format.ts";

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  const fetchStudentDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/students/${id}`);
      if (res.data.success) {
        setStudent(res.data.student);
      }
    } catch (err: any) {
      console.error("Failed to load student detail:", err);
      setError(err.response?.data?.message || "Élève introuvable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" label="Chargement du dossier élève..." />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">
          {error || "Élève introuvable"}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Le profil demandé n'existe pas ou vous n'avez pas l'autorisation d'y accéder.
        </p>
        <button
          onClick={() => navigate("/students")}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
        >
          Retour aux élèves
        </button>
      </div>
    );
  }

  const statusBadge = getStudentStatusBadge(student.status);

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/students")}
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <span>
                {student.firstName} {student.lastName}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusBadge.bg}`}
              >
                {statusBadge.label}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              N° d'inscription :{" "}
              <span className="font-mono font-medium text-slate-700">
                {student.registrationNumber || "Non attribué"}
              </span>{" "}
              • Niveau : {student.schoolLevel || "Non spécifié"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
        >
          <Edit2 className="w-4 h-4" />
          <span>Modifier l'élève</span>
        </button>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Taux de Présence
            </span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {student.attendanceStats?.attendanceRate || 0}%
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {student.attendanceStats?.present || 0} présent(s) sur{" "}
              {student.attendanceStats?.total || 0} séances
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Solde Restant Dû
            </span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(student.financialStats?.totalRemaining || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Payé : {formatCurrency(student.financialStats?.totalPaid || 0)}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Groupes Inscrits
            </span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {student.groups?.length || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Matières et classes suivies</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Student Profile & Parent info */}
        <div className="space-y-6">
          {/* Identity card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Dossier Personnel</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Date de naissance :</span>
                <span className="font-medium text-slate-800">
                  {formatDate(student.dateOfBirth)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Genre :</span>
                <span className="font-medium text-slate-800">
                  {student.gender === "male"
                    ? "Masculin"
                    : student.gender === "female"
                    ? "Féminin"
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Niveau scolaire :</span>
                <span className="font-medium text-slate-800">
                  {student.schoolLevel || "-"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Inscrit le :</span>
                <span className="font-medium text-slate-800">
                  {formatDate(student.createdAt)}
                </span>
              </div>
            </div>

            {student.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  Observations :
                </span>
                <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {student.notes}
                </p>
              </div>
            )}
          </div>

          {/* Contact Parent */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Responsable Légal</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-500 block">Nom du tuteur :</span>
                <span className="font-semibold text-slate-900">
                  {student.parentName || "Non spécifié"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Téléphone :</span>
                {student.parentPhone ? (
                  <a
                    href={`tel:${student.parentPhone}`}
                    className="font-medium text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{student.parentPhone}</span>
                  </a>
                ) : (
                  "-"
                )}
              </div>
              <div>
                <span className="text-slate-500 block">Email :</span>
                {student.parentEmail ? (
                  <a
                    href={`mailto:${student.parentEmail}`}
                    className="font-medium text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Mail className="w-3 h-3" />
                    <span>{student.parentEmail}</span>
                  </a>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right columns: Groups enrolled and Payment History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrolled Groups */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Groupes & Classes Assignés ({student.groups?.length || 0})</span>
            </h3>

            {student.groups?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Cet élève n'est inscrit dans aucun groupe pour le moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {student.groups?.map((g: any) => (
                  <Link
                    key={g._id}
                    to={`/groups/${g._id}`}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{g.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Matière : <span className="font-medium">{g.subject}</span> •{" "}
                        {g.schoolLevel}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                      <span>{g.schedule?.length || 0} créneau(x) / sem.</span>
                      <span className="text-blue-600 font-semibold hover:underline">
                        Détails →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Historique des Factures & Paiements</span>
              </h3>
              <Link
                to="/payments"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Gérer les paiements
              </Link>
            </div>

            {student.recentPayments?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Aucun paiement enregistré pour cet élève.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="pb-2">Échéance</th>
                      <th className="pb-2">Montant</th>
                      <th className="pb-2">Payé</th>
                      <th className="pb-2">Restant</th>
                      <th className="pb-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.recentPayments?.map((p: any) => {
                      const badge = getPaymentStatusBadge(p.status);
                      const remaining = Math.max(0, p.amount - p.paidAmount);
                      return (
                        <tr key={p._id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-medium text-slate-800">
                            {formatDate(p.dueDate)}
                          </td>
                          <td className="py-2.5 text-slate-700">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="py-2.5 text-emerald-600 font-medium">
                            {formatCurrency(p.paidAmount)}
                          </td>
                          <td className="py-2.5 text-rose-600 font-medium">
                            {formatCurrency(remaining)}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <StudentFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={fetchStudentDetail}
        studentToEdit={student}
      />
    </div>
  );
};
