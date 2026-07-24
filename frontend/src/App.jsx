import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import TouristLayout from './layouts/TouristLayout'
import VendorLayout from './layouts/VendorLayout'
import AdminLayout from './layouts/AdminLayout'
import HomePage, { PlaceholderPage } from './pages/HomePage'
import PlanTripPage from './pages/PlanTripPage'
import BookingPassPage from './pages/BookingPassPage'
import TripFlowPage from './pages/TripFlowPage'
import MyTripPage from './pages/MyTripPage'
import VendorLoginPage from './pages/VendorLoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import CarpoolPage from './pages/CarpoolPage'
import { VendorDashboardPage, VendorPlaceholderPage } from './pages/VendorPages'
import VendorInventoryPage from './pages/VendorInventoryPage'
import VendorTariffsPage from './pages/VendorTariffsPage'
import VendorKycPage from './pages/VendorKycPage'
import { AdminOverviewPage, AdminVendorsPage } from './pages/AdminPages'
import AdminEscrowPage from './pages/AdminEscrowPage'
import AdminPricingPage from './pages/AdminPricingPage'
import AdminDisputesPage from './pages/AdminDisputesPage'
import AdminTripsPage from './pages/AdminTripsPage'
import PaymentCheckoutPage from './pages/PaymentCheckoutPage'
import PaymentStripeResultPage from './pages/PaymentStripeResultPage'
import AdminPayoutsPage from './pages/AdminPayoutsPage'
import AdminFleetPage from './pages/AdminFleetPage'
import AdminRegistryPage from './pages/AdminRegistryPage'
import ForumPage from './pages/ForumPage'
import VendorTripsPage from './pages/VendorTripsPage'
import VendorOnboardingPage from './pages/VendorOnboardingPage'
import VendorProfilePage from './pages/VendorProfilePage'
import VendorGuidesPage from './pages/VendorGuidesPage'
import VendorPackagesPage from './pages/VendorPackagesPage'
import VendorExperiencesPage from './pages/VendorExperiencesPage'
import VendorStorefrontPage from './pages/VendorStorefrontPage'
import AdminCampaignsPage from './pages/AdminCampaignsPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminSecurityPage from './pages/AdminSecurityPage'
import AdminApprovalsPage from './pages/AdminApprovalsPage'
import PackagesPage from './pages/PackagesPage'
import PackageDetailPage from './pages/PackageDetailPage'
import DestinationsPage from './pages/DestinationsPage'
import ExplorePage from './pages/ExplorePage'
import NotFoundPage from './pages/NotFoundPage'
import './styles/app.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<TouristLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/packages/:slug" element={<PackageDetailPage />} />
            <Route path="/destinations" element={<DestinationsPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/vendors/:slug" element={<VendorStorefrontPage />} />
            <Route path="/plan" element={<PlanTripPage />} />
            <Route path="/trip" element={<MyTripPage />} />
            <Route path="/trip/pass/:reference" element={<BookingPassPage />} />
            <Route path="/trip/:reference" element={<TripFlowPage />} />
            <Route path="/pools" element={<CarpoolPage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/pay/:sessionId" element={<PaymentCheckoutPage />} />
            <Route path="/pay/stripe/success" element={<PaymentStripeResultPage success />} />
            <Route path="/pay/stripe/cancel" element={<PaymentStripeResultPage success={false} />} />
          </Route>

          <Route path="/vendor/login" element={<VendorLoginPage />} />
          <Route path="/vendor" element={<ProtectedRoute roles={['vendor']}><VendorLayout /></ProtectedRoute>}>
            <Route index element={<VendorDashboardPage />} />
            <Route path="onboarding" element={<VendorOnboardingPage />} />
            <Route path="profile" element={<VendorProfilePage />} />
            <Route path="guides" element={<VendorGuidesPage />} />
            <Route path="packages" element={<VendorPackagesPage />} />
            <Route path="experiences" element={<VendorExperiencesPage />} />
            <Route path="inventory" element={<VendorInventoryPage />} />
            <Route path="tariffs" element={<VendorTariffsPage />} />
            <Route path="kyc" element={<VendorKycPage />} />
            <Route path="trips" element={<VendorTripsPage />} />
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="vendors" element={<AdminVendorsPage />} />
            <Route path="escrow" element={<AdminEscrowPage />} />
            <Route path="fleet" element={<AdminFleetPage />} />
            <Route path="registry" element={<AdminRegistryPage />} />
            <Route path="disputes" element={<AdminDisputesPage />} />
            <Route path="pricing" element={<AdminPricingPage />} />
            <Route path="trips" element={<AdminTripsPage />} />
            <Route path="payouts" element={<AdminPayoutsPage />} />
            <Route path="campaigns" element={<AdminCampaignsPage />} />
            <Route path="approvals" element={<AdminApprovalsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="security" element={<AdminSecurityPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
