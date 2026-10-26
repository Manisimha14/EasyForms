import React from 'react'
import { useAuth } from '@clerk/react';
import { Navigate, Outlet } from "react-router-dom";
function ProtectedRoute() {
    const { isLoaded, isSignedIn } = useAuth();
    if (!isLoaded) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      );
    }
    if (!isSignedIn) {
      return <Navigate to="/sign-in" replace />;
    }
  return (
    <>
    <Outlet></Outlet>

    </>
  )
}

export default ProtectedRoute