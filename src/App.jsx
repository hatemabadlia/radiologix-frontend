// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import DetectPage from "./pages/DetectPage";
import HistoryPage from "./pages/HistoryPage";
import StatsPage from "./pages/StatsPage";
import DatabasePage from "./pages/DatabasePage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", color: "#8892a4", fontFamily: "'DM Sans', sans-serif",
    }}>
      Loading...
    </div>
  );
  return user ? children : <Navigate to="/auth" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/auth"     element={user ? <Navigate to="/detect" replace /> : <AuthPage />} />
        <Route path="/detect"   element={<PrivateRoute><DetectPage /></PrivateRoute>} />
        <Route path="/scans"    element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
        <Route path="/stats"    element={<PrivateRoute><StatsPage /></PrivateRoute>} />
        <Route path="/database" element={<PrivateRoute><DatabasePage /></PrivateRoute>} />
        <Route path="*"         element={<Navigate to="/detect" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* future flags silence the v7 deprecation warnings */}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
