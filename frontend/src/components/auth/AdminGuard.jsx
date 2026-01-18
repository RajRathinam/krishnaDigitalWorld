import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
export default function AdminGuard() {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>);
    }
    // If no user or user is not admin, redirect to admin login
    if (!user || user.role !== "admin") {
        return <Navigate to="/admin/login" replace state={{ from: location.pathname }}/>;
    }
    // Allow access to admin routes
    return <Outlet />;
}
