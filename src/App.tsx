import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import LocatorPage from './pages/LocatorPage';
import AdminToPGOPage from './pages/AdminToPGOPage';
import LeavePage from './pages/LeavePage';
import LetterPage from './pages/LetterPage';
import OvertimePage from './pages/OvertimePage';
import TravelOrderPage from './pages/TravelOrderPage';
import VoucherPage from './pages/VoucherPage';
import OthersPage from './pages/OthersPage';
import ReportPage from './pages/ReportPage';
import ObligationRequestPage from './pages/ObligationRequestPage';
import PurchaseRequestPage from './pages/PurchaseRequestPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/locator"
        element={
          <ProtectedRoute>
            <LocatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-to-pgo"
        element={
          <ProtectedRoute>
            <AdminToPGOPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedRoute>
            <LeavePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/letter"
        element={
          <ProtectedRoute>
            <LetterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/overtime"
        element={
          <ProtectedRoute>
            <OvertimePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/travel-order"
        element={
          <ProtectedRoute>
            <TravelOrderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/voucher"
        element={
          <ProtectedRoute>
            <VoucherPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/others"
        element={
          <ProtectedRoute>
            <OthersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/obligation-request"
        element={
          <ProtectedRoute>
            <ObligationRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-request"
        element={
          <ProtectedRoute>
            <PurchaseRequestPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
