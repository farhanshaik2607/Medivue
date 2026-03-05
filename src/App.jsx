import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import TopHeader from './components/layout/TopHeader';
import BottomNav from './components/layout/BottomNav';
import Splash from './pages/Splash';
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

function AppLayout() {
  const { state } = useApp();

  if (state.showSplash) {
    return <Splash />;
  }

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
        <Route path="/order-tracking" element={<OrderTracking />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/upload-prescription" element={<UploadPrescription />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<HealthProfile />} />
        <Route path="/offers" element={<Offers />} />
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
