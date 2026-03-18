import { Navigate } from "react-router-dom";
import type { PropsWithChildren } from "react";

import { useAuth } from "../context/AuthContext";

type Props = PropsWithChildren & {
  role: "teacher" | "student";
};

export default function ProtectedRoute({ children, role }: Props) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}

