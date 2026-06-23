import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/member/Dashboard.jsx';
import Onboarding from './pages/member/Onboarding.jsx';
import FixedBills from './pages/member/FixedBills.jsx';
import MealCalendar from './pages/member/MealCalendar.jsx';
import BazaarLog from './pages/member/BazaarLog.jsx';
import Invoice from './pages/member/Invoice.jsx';
import Corrections from './pages/member/Corrections.jsx';
import Reports from './pages/member/Reports.jsx';
import PaymentHistory from './pages/PaymentHistory.jsx';

import AdminHome from './pages/owner/AdminHome.jsx';
import RoleMatrix from './pages/owner/RoleMatrix.jsx';
import MealEntry from './pages/owner/MealEntry.jsx';
import ApprovalQueue from './pages/owner/ApprovalQueue.jsx';
import PaymentClearance from './pages/owner/PaymentClearance.jsx';
import BillsConfig from './pages/owner/BillsConfig.jsx';

const STAFF = ['ADMIN', 'MANAGER'];

export default function App() {
  return (
    <Routes>
      {/* Public marketing site */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Authenticated application, nested under /app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Member panel */}
        <Route index element={<Dashboard />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="bills" element={<FixedBills />} />
        <Route path="meals" element={<MealCalendar />} />
        <Route path="bazaar" element={<BazaarLog />} />
        <Route path="invoice" element={<Invoice />} />
        <Route path="corrections" element={<Corrections />} />
        <Route path="payments" element={<PaymentHistory />} />
        <Route path="reports" element={<Reports />} />

        {/* Owner panel (ADMIN + MANAGER) */}
        <Route path="admin" element={<ProtectedRoute roles={STAFF}><AdminHome /></ProtectedRoute>} />
        <Route path="admin/members" element={<ProtectedRoute roles={['ADMIN']}><RoleMatrix /></ProtectedRoute>} />
        <Route path="admin/meals" element={<ProtectedRoute roles={STAFF}><MealEntry /></ProtectedRoute>} />
        <Route path="admin/queue" element={<ProtectedRoute roles={STAFF}><ApprovalQueue /></ProtectedRoute>} />
        <Route path="admin/payments" element={<ProtectedRoute roles={['ADMIN']}><PaymentClearance /></ProtectedRoute>} />
        <Route path="admin/bills" element={<ProtectedRoute roles={['ADMIN']}><BillsConfig /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
