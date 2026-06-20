import React from "react";
import { Navigate } from "react-router-dom";
import RestrictedAreasPage from "./RestrictedAreasPage.jsx";

export default function RestrictedAreasPageRoute(props) {
  const { user } = props;
  const allowed =
    user?.role === "admin" ||
    (user?.allowedPages || []).includes("adminListings");

  if (!allowed) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <RestrictedAreasPage {...props} />;
}
