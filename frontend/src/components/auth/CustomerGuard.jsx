import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
export default function CustomerGuard() {
    const { user, loading } = useAuth();
    const location = useLocation();
    // While we are resolving auth, don't render anything (or a loader)
    if (loading)
        return null;

    // Otherwise allow access to customer routes
    return <Outlet />;
}
