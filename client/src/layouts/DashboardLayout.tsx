import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  CalendarCheck2,
  CreditCard,
  FileSpreadsheet,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { useNotifications } from "../context/NotificationContext.tsx";
import { formatDate } from "../utils/format.ts";

export const DashboardLayout: React.FC = () => {
  const { user, center, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  const navigation = [
    { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
    { name: "Élèves", href: "/students", icon: Users },
    ...(isAdminOrManager
      ? [{ name: "Professeurs", href: "/teachers", icon: GraduationCap }]
      : []),
    { name: "Groupes & Cours", href: "/groups", icon: Layers },
    { name: "Planning & Présences", href: "/attendance", icon: CalendarCheck2 },
    ...(isAdminOrManager
      ? [{ name: "Finances & Règlements", href: "/payments", icon: CreditCard }]
      : []),
    ...(isAdminOrManager
      ? [{ name: "Rapports & Exports", href: "/reports", icon: FileSpreadsheet }]
      : []),
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: "Paramètres", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#EEF2F6] p-2 sm:p-4 lg:p-6 flex flex-col font-sans">
      {/* Outer Rounded Container mirroring modern SaaS design */}
      <div className="flex-1 flex overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 border border-slate-200/70">
        
        {/* ===================== SIDEBAR (DESKTOP) ===================== */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-slate-100 bg-white flex-shrink-0 select-none">
          {/* Logo & Brand */}
          <div className="p-6 flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 border-2 border-rose-500 shadow-sm">
              <div className="w-4 h-4 rounded-full bg-rose-600"></div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Nexo<span className="text-rose-600">Manager</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">
                {center?.name ? center.name.slice(0, 20) : "SaaS Éducatif"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-rose-50 text-rose-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? "text-rose-600" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-rose-600 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Pro Card */}
          <div className="px-4 pb-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 text-white relative overflow-hidden shadow-lg border border-rose-900/30">
              <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-rose-600/30 rounded-full blur-lg pointer-events-none" />
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-[10px] font-bold tracking-wider text-rose-300 uppercase">
                  Multi-Tenant Actif
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium mb-3 line-clamp-2">
                {center?.name || "Centre Pédagogique"}
              </p>
              <Link
                to="/settings"
                className="block text-center w-full py-1.5 px-3 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition shadow-sm"
              >
                Gérer le Centre
              </Link>
            </div>
          </div>

          {/* Logout and Footer */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
            <div className="mt-3 text-center text-[10px] text-slate-400">
              © 2026 NexoManager SaaS
            </div>
          </div>
        </aside>

        {/* ===================== MAIN CONTENT WRAPPER ===================== */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
          
          {/* Top Navbar */}
          <header className="h-20 px-6 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
            {/* Mobile menu trigger */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 focus:outline-none"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div>
                </div>
                <span className="font-extrabold text-slate-900">NexoManager</span>
              </div>
            </div>

            {/* Desktop Left: Current Page indicator */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">
                {navigation.find(
                  (n) =>
                    n.href === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(n.href)
                )?.name || "Espace de Gestion"}
              </span>
            </div>

            {/* Top Right: Search, Settings, Notifications, Profile chip */}
            <div className="flex items-center gap-3">
              {/* Search Icon / Input */}
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher élève, groupe..."
                  className="pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs rounded-full border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-rose-500 w-52 lg:w-64 transition"
                />
              </div>

              {/* Settings quick link */}
              <Link
                to="/settings"
                className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition"
                title="Paramètres"
              >
                <Settings className="w-4 h-4" />
              </Link>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded-full">
                            {unreadCount} non lues
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-rose-600 hover:underline font-semibold"
                        >
                          Tout marquer lu
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          Aucune notification pour le moment.
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => markAsRead(n._id)}
                            className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                              !n.isRead ? "bg-rose-50/30" : ""
                            }`}
                          >
                            <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {formatDate(n.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-4 pt-2 border-t border-slate-100 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Voir toutes les notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Chip (matches screenshot design) */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pl-2.5 rounded-full hover:bg-slate-50 border border-slate-200/80 transition"
                >
                  <div className="text-right hidden sm:block">
                    <span className="block text-xs font-bold text-slate-900 leading-tight">
                      {user?.fullName || "Utilisateur"}
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      {user?.role === "admin"
                        ? "Admin"
                        : user?.role === "manager"
                        ? "Responsable"
                        : "Enseignant"}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : "U"}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Paramètres du profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ===================== MOBILE DRAWER MENU ===================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-white h-full shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-rose-600"></div>
                </div>
                <span className="font-extrabold text-slate-900">NexoManager</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold ${
                      isActive
                        ? "bg-rose-50 text-rose-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold text-white bg-rose-600 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-2xl"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
