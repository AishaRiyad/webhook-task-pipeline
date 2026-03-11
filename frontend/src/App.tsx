import React from "react";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import PipelinesPage from "./pages/PipelinesPage";
import JobsPage from "./pages/JobsPage";
import ChainingPage from "./pages/ChainingPage";
import SubscribersPage from "./pages/SubscribersPage";
import WebhookTesterPage from "./pages/WebhookTesterPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import MetricsPage from "./pages/MetricsPage";
import NotificationsPage from "./pages/NotificationsPage";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/pipelines"
        element={
          <PrivateRoute>
            <PipelinesPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/jobs"
        element={
          <PrivateRoute>
            <JobsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/chaining"
        element={
          <PrivateRoute>
            <ChainingPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/subscribers"
        element={
          <PrivateRoute>
            <SubscribersPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/webhook-tester"
        element={
          <PrivateRoute>
            <WebhookTesterPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/jobs/:id"
        element={
          <PrivateRoute>
            <JobDetailsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/metrics"
        element={
          <PrivateRoute>
            <MetricsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
