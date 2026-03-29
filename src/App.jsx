import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import TopHeader from './components/layout/TopHeader';
import BottomNav from './components/layout/BottomNav';
import Splash from './pages/Splash';
import RoleSelect from './pages/RoleSelect';
import PharmacyLogin from './pages/PharmacyLogin';
import Home from './pages/Home';
import SearchPage from './pages/Search';
import MedicineDetail from './pages/MedicineDetail';
import BrandComparison from './pages/BrandComparison';
import PharmacyProfile from './pages/PharmacyProfile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import OrderHistory from './pages/OrderHistory';
import UploadPrescription from './pages/UploadPrescription';
import Notifications from './pages/Notifications';
import HealthProfile from './pages/HealthProfile';
import Offers from './pages/Offers';
import PharmacyDashboard from './pages/PharmacyDashboard';
import InventoryManager from './pages/InventoryManager';
import PharmacyRequests from './pages/PharmacyRequests';
import PharmacyOrders from './pages/PharmacyOrders';
import PharmacyOwnerProfile from './pages/PharmacyOwnerProfile';
import RequestMedicine from './pages/RequestMedicine';
import MyRequests from './pages/MyRequests';

// Full-screen spinner shown while Firebase resolves auth state + Firestore role
function AuthLoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'var(--gray-50)', gap: '16px'
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '4px solid var(--primary-100)',
        borderTopColor: 'var(--primary)',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Loading…</p>
    </div>
  );
}

function AppLayout() {
  const { state } = useApp();

  // Phase 1: still resolving Firebase auth & Firestore role — show spinner
  if (state.authLoading) {
    return <AuthLoadingScreen />;
  }

  // Phase 2: not logged in → show auth screens
  if (state.showSplash) {
    return (
      <Routes>
        <Route path="/role-select" element={<RoleSelect />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/pharmacy-login" element={<PharmacyLogin />} />
        <Route path="*" element={<RoleSelect />} />
      </Routes>
    );
  }

  // Phase 3: logged in as pharmacy owner
  if (state.userRole === 'pharmacy') {
    return (
      <Routes>
        <Route path="/pharmacy-dashboard" element={<PharmacyDashboard />} />
        <Route path="/pharmacy-inventory" element={<InventoryManager />} />
        <Route path="/pharmacy-requests" element={<PharmacyRequests />} />
        <Route path="/pharmacy-orders" element={<PharmacyOrders />} />
        <Route path="/pharmacy-owner-profile" element={<PharmacyOwnerProfile />} />
        <Route path="/profile" element={<HealthProfile />} />
        <Route path="*" element={<Navigate to="/pharmacy-dashboard" replace />} />
      </Routes>
    );
  }

  // Phase 4: logged in as user (default)
  return (
    <>
      <TopHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/medicine/:id" element={<MedicineDetail />} />
        <Route path="/brand-comparison/:salt" element={<BrandComparison />} />
        <Route path="/pharmacy/:id" element={<PharmacyProfile />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/upload-prescription" element={<UploadPrescription />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<HealthProfile />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/request-medicine" element={<RequestMedicine />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}
