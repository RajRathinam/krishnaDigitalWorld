import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
export default function AdminGuard() {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return <PageSkeleton />;
    }
    // If no user or user is not admin, redirect to login
    if (!user || user.role !== "admin") {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    // Allow access to admin routes
    return <Outlet />;
}
