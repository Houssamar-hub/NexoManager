export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return "0.00 MAD";
  }
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Casablanca",
  }).format(date);
};

export const formatDateTime = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Casablanca",
  }).format(date);
};

export const getStudentStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return { label: "Actif", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "suspended":
      return { label: "Suspendu", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    case "left":
      return { label: "Parti", bg: "bg-slate-100 text-slate-600 border-slate-200" };
    default:
      return { label: status, bg: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

export const getAttendanceStatusBadge = (status: string) => {
  switch (status) {
    case "present":
      return { label: "Présent", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "absent":
      return { label: "Absent", bg: "bg-rose-50 text-rose-700 border-rose-200" };
    case "late":
      return { label: "En retard", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    case "excused":
      return { label: "Excusé", bg: "bg-sky-50 text-sky-700 border-sky-200" };
    default:
      return { label: status, bg: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

export const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return { label: "Réglé", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "partial":
      return { label: "Partiel", bg: "bg-blue-50 text-blue-700 border-blue-200" };
    case "overdue":
      return { label: "En retard", bg: "bg-rose-50 text-rose-700 border-rose-200" };
    case "pending":
      return { label: "En attente", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    default:
      return { label: status, bg: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};
