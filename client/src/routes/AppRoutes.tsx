import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { LoadingSpinner } from "../components/common/LoadingSpinner.tsx";

import { DashboardLayout } from "../layouts/DashboardLayout.tsx";

// Pages
import { Login } from "../pages/auth/Login.tsx";
import { Register } from "../pages/auth/Register.tsx";
import { Dashboard } from "../pages/dashboard/Dashboard.tsx";
import { StudentsList } from "../pages/students/StudentsList.tsx";
import { StudentDetail } from "../pages/students/StudentDetail.tsx";
import { TeachersList } from "../pages/teachers/TeachersList.tsx";
import { GroupsList } from "../pages/groups/GroupsList.tsx";
import { GroupDetail } from "../pages/groups/GroupDetail.tsx";
import { AttendanceManager } from "../pages/attendance/AttendanceManager.tsx";
import { PaymentsList } from "../pages/payments/PaymentsList.tsx";
import { ReportsPage } from "../pages/reports/ReportsPage.tsx";
import { NotificationsPage } from "../pages/notifications/NotificationsPage.tsx";
import { CenterSettings } from "../pages/settings/CenterSettings.tsx";
import { NotFound } from "../pages/misc/NotFound.tsx";
import { AccessDenied } from "../pages/misc/AccessDenied.tsx";

// Protected Route wrapper
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" label="Vérification de la session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Role Guard wrapper
const RoleRoute: React.FC<{ allowedRoles: string[] }> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
};

// Public Only Route wrapper (for login / register)
const PublicRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner size="lg" label="Initialisation..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Access Denied */}
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Protected Dashboard and SaaS routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<StudentsList />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/groups" element={<GroupsList />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/attendance" element={<AttendanceManager />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<CenterSettings />} />

          {/* Admin / Manager Only routes */}
          <Route element={<RoleRoute allowedRoles={["admin", "manager"]} />}>
            <Route path="/teachers" element={<TeachersList />} />
            <Route path="/payments" element={<PaymentsList />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
