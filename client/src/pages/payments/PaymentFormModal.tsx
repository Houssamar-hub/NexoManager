import React, { useState, useEffect } from "react";
import { Modal } from "../../components/common/Modal.tsx";
import { PaymentRecord } from "../../types/index.ts";
import api from "../../api/client.ts";
import { formatCurrency } from "../../utils/format.ts";

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentToEdit?: PaymentRecord | null;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  paymentToEdit,
}) => {
  const [student, setStudent] = useState("");
  const [group, setGroup] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState<number | "">(0);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
  );
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "bank_transfer" | "card" | "other"
  >("cash");
  const [description, setDescription] = useState("");

  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.get("/students?status=active&limit=150"),
        api.get("/groups?status=active"),
      ]).then(([sRes, gRes]) => {
        if (sRes.data.success) setStudentsList(sRes.data.students || []);
        if (gRes.data.success) setGroupsList(gRes.data.groups || []);
      });
    }

    if (paymentToEdit) {
      setStudent(
        typeof paymentToEdit.student === "object"
          ? paymentToEdit.student?._id
          : paymentToEdit.student || ""
      );
      setGroup(
        typeof paymentToEdit.group === "object"
          ? paymentToEdit.group?._id
          : paymentToEdit.group || ""
      );
      setAmount(paymentToEdit.amount || 0);
      setPaidAmount(paymentToEdit.paidAmount || 0);
      setDueDate(
        paymentToEdit.dueDate
          ? new Date(paymentToEdit.dueDate).toISOString().split("T")[0]
          : ""
      );
      setPaymentDate(
        paymentToEdit.paymentDate
          ? new Date(paymentToEdit.paymentDate).toISOString().split("T")[0]
          : ""
      );
      setPaymentMethod(paymentToEdit.paymentMethod || "cash");
      setDescription(paymentToEdit.description || "");
    } else {
      setStudent("");
      setGroup("");
      setAmount("");
      setPaidAmount(0);
      setDueDate(
        new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
      );
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("cash");
      setDescription("");
    }
    setError(null);
  }, [paymentToEdit, isOpen]);

  const numAmount = typeof amount === "number" ? amount : 0;
  const numPaid = typeof paidAmount === "number" ? paidAmount : 0;
  const calculatedRemaining = Math.max(0, numAmount - numPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!paymentToEdit && (!student || !group)) {
      setError("Veuillez sélectionner un élève et un groupe");
      return;
    }

    if (numAmount <= 0) {
      setError("Le montant total doit être strictement supérieur à 0");
      return;
    }

    if (numPaid < 0 || numPaid > numAmount) {
      setError("Le montant payé ne peut pas dépasser le montant total");
      return;
    }

    setLoading(true);

    const payload: any = {
      amount: numAmount,
      paidAmount: numPaid,
      dueDate,
      paymentDate,
      paymentMethod,
      description: description.trim() || undefined,
    };

    if (!paymentToEdit) {
      payload.student = student;
      payload.group = group;
    }

    try {
      if (paymentToEdit) {
        await api.patch(
          `/payments/${paymentToEdit._id || paymentToEdit.id}`,
          payload
        );
      } else {
        await api.post("/payments", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors de l'enregistrement du paiement"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paymentToEdit ? "Modifier le Paiement" : "Enregistrer un Paiement"}
      subtitle="Facturation mensuelle, frais d'inscription ou versement partiel"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {!paymentToEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Élève Concerné *
              </label>
              <select
                required
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="">Sélectionnez un élève...</option>
                {studentsList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} (N° {s.registrationNumber || "-"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Groupe / Matière *
              </label>
              <select
                required
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="">Sélectionnez un groupe...</option>
                {groupsList.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.subject})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Montant Total (MAD) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? parseFloat(e.target.value) : "")
              }
              placeholder="Ex. 500.00"
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Montant Payé Immédiat (MAD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={numAmount || undefined}
              value={paidAmount}
              onChange={(e) =>
                setPaidAmount(e.target.value ? parseFloat(e.target.value) : 0)
              }
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm font-bold text-emerald-600 bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Reste à payer (Solde Dû) :</span>
            <span
              className={`text-sm font-bold ${
                calculatedRemaining > 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {formatCurrency(calculatedRemaining)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Date Limite (Échéance) *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Date de Versement
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mode de Règlement
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="cash">Espèces</option>
              <option value="bank_transfer">Virement Bancaire</option>
              <option value="card">Carte Bancaire</option>
              <option value="other">Autre / Chèque</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Motif / Libellé du paiement
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex. Mensualité Octobre 2026, Frais de dossier..."
            className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>

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
            {paymentToEdit ? "Modifier le paiement" : "Enregistrer le paiement"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
