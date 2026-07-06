import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Printer,
  MessageCircle,
} from "lucide-react";
import api from "../../api/client.ts";
import { PaymentRecord, Group } from "../../types/index.ts";
import { PaymentFormModal } from "./PaymentFormModal.tsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.tsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.tsx";
import { EmptyState } from "../../components/common/EmptyState.tsx";
import { Pagination } from "../../components/common/Pagination.tsx";
import {
  formatCurrency,
  formatDate,
  getPaymentStatusBadge,
} from "../../utils/format.ts";

export const PaymentsList: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Statistics
  const [stats, setStats] = useState<any | null>(null);

  // Filters
  const [groups, setGroups] = useState<Group[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [groupFilter, setGroupFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modals
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<PaymentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    api.get("/groups?status=active").then((res) => {
      if (res.data.success) setGroups(res.data.groups || []);
    });
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 12 };
      if (statusFilter) params.status = statusFilter;
      if (groupFilter) params.group = groupFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [paymentsRes, statsRes] = await Promise.all([
        api.get("/payments", { params }),
        api.get("/payments/statistics", {
          params: { group: groupFilter || undefined },
        }),
      ]);

      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.payments || []);
        setTotal(paymentsRes.data.total || 0);
        setTotalPages(paymentsRes.data.totalPages || 1);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.statistics);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, groupFilter, startDate, endDate]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleDelete = async () => {
    if (!deletingPayment) return;
    setIsDeleting(true);

    try {
      await api.delete(`/payments/${deletingPayment._id || deletingPayment.id}`);
      setDeletingPayment(null);
      fetchPayments();
    } catch (err) {
      console.error("Failed to delete payment:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (groupFilter) params.append("group", groupFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await api.get(`/reports/payments/excel?${params.toString()}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `paiements-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export Excel failed:", err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (groupFilter) params.append("group", groupFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await api.get(`/reports/payments/pdf?${params.toString()}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `releve-paiements-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export PDF failed:", err);
    }
  };

  const handleDownloadReceipt = (paymentId: string) => {
    const token = localStorage.getItem("nexomanager_token");
    window.open(`/api/payments/${paymentId}/receipt?token=${token || ""}`, "_blank");
  };

  const handleWhatsAppShare = (p: any) => {
    const rawPhone = p.student?.parentPhone || "";
    let cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "212" + cleanPhone.slice(1);
    } else if (cleanPhone && !cleanPhone.startsWith("212") && cleanPhone.length === 9) {
      cleanPhone = "212" + cleanPhone;
    }

    const studentName = `${p.student?.firstName || ""} ${p.student?.lastName || ""}`.trim();
    const groupName = p.group?.name || "Cours de soutien";
    const isPaid = p.paidAmount >= p.amount;
    const remaining = Math.max(0, p.amount - p.paidAmount);

    let message = "";
    if (isPaid) {
      message = `Bonjour,\n\nNous vous confirmons la bonne réception du règlement de ${p.paidAmount} MAD pour l'élève ${studentName} (${groupName}).\n\nMerci pour votre confiance.\nAdministration`;
    } else {
      const dueDateStr = p.dueDate ? new Date(p.dueDate).toLocaleDateString("fr-FR") : "";
      message = `Bonjour,\n\nNous vous rappelons qu'un solde de ${remaining} MAD reste à régler pour l'élève ${studentName} (${groupName}) avant le ${dueDateStr}.\n\nMerci de vous rapprocher de l'administration pour régularisation.\nAdministration`;
    }

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Finances & Règlements
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestion du grand livre, des encaissements et du suivi des impayés (MAD)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => {
              setEditingPayment(null);
              setFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition shadow-glow-red"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nouveau Règlement</span>
          </button>
        </div>
      </div>

      {/* 3 Top Financial KPI Cards (matches "Completed Payment, Awaiting Payment, Overdue" screenshot) */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Completed Payment */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Encaissé & Soldé
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(stats.totalPaid)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Taux de recouvrement : <span className="font-bold text-slate-800">{stats.collectionRate}%</span>
              </p>
            </div>
            <div className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+2.71%</span>
            </div>
          </div>

          {/* 2. Awaiting Payment */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  En Attente / Partiel
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(stats.totalRemaining)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Solde restant à percevoir
              </p>
            </div>
            <div className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              <span>En cours</span>
            </div>
          </div>

          {/* 3. Overdue Payment */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-sm">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">
                  Échéances Dépassées
                </span>
              </div>
              <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
                {formatCurrency(stats.overdueAmount || 0)}
              </div>
              <p className="text-xs text-rose-500 font-semibold mt-1">
                {stats.overdueCount} facture(s) en retard
              </p>
            </div>
            <div className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Relances</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Tous les statuts</option>
            <option value="paid">Réglé (Payé)</option>
            <option value="partial">Partiel (Acompte)</option>
            <option value="overdue">En retard (Échu)</option>
            <option value="pending">En attente</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Tous les groupes</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-50 rounded-2xl border border-slate-200 px-3 py-1 text-xs">
            <span className="text-[11px] text-slate-400 font-semibold">Du</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 font-semibold ml-2">Au</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
            />
          </div>
        </div>

        {(statusFilter || groupFilter || startDate || endDate) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setGroupFilter("");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
            className="text-xs font-bold text-rose-600 hover:underline"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20">
            <LoadingSpinner size="md" label="Chargement des transactions financières..." />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            title="Aucune facture enregistrée"
            description="Aucun paiement ne correspond aux filtres appliqués."
            action={{
              label: "Créer une facture",
              onClick: () => {
                setEditingPayment(null);
                setFormModalOpen(true);
              },
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6 font-semibold">Élève</th>
                  <th className="py-3.5 px-4 font-semibold">Groupe</th>
                  <th className="py-3.5 px-4 font-semibold">Montant Total</th>
                  <th className="py-3.5 px-4 font-semibold">Versé</th>
                  <th className="py-3.5 px-4 font-semibold">Reste Dû</th>
                  <th className="py-3.5 px-4 font-semibold">Date d'Échéance</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Statut</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((p) => {
                  const remaining = Math.max(0, p.amount - p.paidAmount);
                  const isPaid = p.status === "paid";
                  const isOverdue = p.status === "overdue" || (new Date(p.dueDate) < new Date() && remaining > 0);

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-slate-900 block">
                          {p.student?.firstName} {p.student?.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          N° {p.student?.registrationNumber || "-"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {p.group?.name || "-"}
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {formatCurrency(p.amount)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(p.paidAmount)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-rose-600">
                        {remaining > 0 ? formatCurrency(remaining) : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {formatDate(p.dueDate)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? "bg-slate-900 text-white"
                              : isOverdue
                              ? "bg-rose-50 text-rose-600"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {isPaid ? "Réglé" : isOverdue ? "En retard" : "En attente"}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownloadReceipt(p._id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                            title="Imprimer / Télécharger le reçu officiel (PDF)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleWhatsAppShare(p)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                            title="Partager le reçu / Rappel WhatsApp au parent"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPayment(p);
                              setFormModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingPayment(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={12}
          onPageChange={(newPage: number) => setPage(newPage)}
        />
      </div>

      {/* Form Modal */}
      <PaymentFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingPayment(null);
        }}
        onSuccess={fetchPayments}
        paymentToEdit={editingPayment}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleDelete}
        title="Supprimer la facture"
        message="Êtes-vous sûr de vouloir supprimer définitivement cette écriture de paiement ?"
        confirmLabel="Supprimer"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PaymentsList;
