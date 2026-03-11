import React from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("frontend_access_token");
  return token ? <>{children}</> : <Navigate to="/" replace />;
}
