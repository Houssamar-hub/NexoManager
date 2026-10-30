import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserX,
  Trash2,
  Check,
  Filter,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext.tsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.tsx";
import { EmptyState } from "../../components/common/EmptyState.tsx";
import { formatDateTime } from "../../utils/format.ts";

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filterType, setFilterType] = useState<string>("");
  const [filterRead, setFilterRead] = useState<string>("");

  const filteredNotifications = notifications.filter((n) => {
    if (filterType && n.type !== filterType) return false;
    if (filterRead === "unread" && n.isRead) return false;
    if (filterRead === "read" && !n.isRead) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment_overdue":
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case "payment_due":
        return <Clock className="w-5 h-5 text-amber-600" />;
      case "absence":
        return <UserX className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Centre de Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Alertes d'impayés, absences signalées et informations administratives
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition self-start sm:self-auto"
          >
            <Check className="w-4 h-4" />
            <span>Tout marquer comme lu ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtrer :</span>
        </div>

        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value)}
          className="text-xs rounded-xl border border-slate-300 py-1.5 px-3 focus:outline-none"
        >
          <option value="">Toutes (lues & non lues)</option>
          <option value="unread">Non lues uniquement</option>
          <option value="read">Lues uniquement</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs rounded-xl border border-slate-300 py-1.5 px-3 focus:outline-none"
        >
          <option value="">Toutes les catégories</option>
          <option value="payment_overdue">Retards de paiement</option>
          <option value="absence">Absences signalées</option>
          <option value="general">Général</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16">
            <LoadingSpinner label="Chargement des notifications..." />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            title="Aucune notification"
            description={
              filterRead || filterType
                ? "Aucune alerte ne correspond à vos filtres actuels."
                : "Vous êtes à jour ! Aucune alerte en attente pour votre centre."
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition ${
                  !notif.isRead ? "bg-blue-50/40" : "hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getTypeIcon(notif.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{formatDateTime(notif.createdAt)}</span>
                      {notif.relatedStudent && (
                        <Link
                          to={`/students/${notif.relatedStudent?._id || notif.relatedStudent}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          Fiche élève →
                        </Link>
                      )}
                      {notif.relatedPayment && (
                        <Link
                          to="/payments"
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          Voir le paiement →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsRead(notif._id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Marquer comme lu"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Supprimer la notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
