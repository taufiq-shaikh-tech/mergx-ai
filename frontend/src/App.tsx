import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import NewAnalysis from "./pages/NewAnalysis";
import UploadProject from "./pages/UploadProject";
import AnalysisProgress from "./pages/AnalysisProgress";
import AnalysisResults from "./pages/AnalysisResults";
import Integration from "./pages/Integration";
import Security from "./pages/Security";
import Dependencies from "./pages/Dependencies";
import ScanHistory from "./pages/ScanHistory";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Authenticated Application Workspace (with persistent Sidebar & Topbar) */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="overview" element={<Overview />} />

          {/* Projects */}
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="projects/new" element={<UploadProject />} />
          <Route path="projects/upload" element={<UploadProject />} />
          {/* Fallback alias for /app/upload */}
          <Route path="upload" element={<Navigate to="/app/projects/upload" replace />} />

          {/* Code Analysis */}
          <Route path="analysis/new" element={<NewAnalysis />} />
          <Route path="analysis/:id" element={<AnalysisProgress />} />
          <Route path="results/:id" element={<AnalysisResults />} />
          <Route path="analysis/:id/results" element={<AnalysisResults />} />

          {/* Inspection & Quality */}
          <Route path="integration" element={<Integration />} />
          <Route path="security" element={<Security />} />
          <Route path="dependencies" element={<Dependencies />} />

          {/* History & Reports */}
          <Route path="history" element={<ScanHistory />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />

          {/* Account */}
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 Route */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}