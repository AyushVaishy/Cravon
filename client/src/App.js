import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import FeaturesLandingPage from "./pages/FeaturesLandingPage";
import AboutLandingPage from "./pages/AboutLandingPage";
import PartnerLandingPage from "./pages/PartnerLandingPage";
import ContactLandingPage from "./pages/ContactLandingPage";
import HomePage from "./pages/HomePage";
import RestaurantMenuPage from "./pages/RestaurantMenuPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProfilePage from "./pages/ProfilePage";
import ContactPage from "./pages/ContactPage";
import HelpPage from "./pages/HelpPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Error from "./components/Error";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerOnboarding from "./pages/OwnerOnboarding";
import AdminPanel from "./pages/AdminPanel";
import GoogleAuthCallbackPage from "./pages/GoogleAuthCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const appRouter = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/auth/google/callback", element: <GoogleAuthCallbackPage /> },
  { path: "/auth/reset-password", element: <ResetPasswordPage /> },
  { path: "/features", element: <FeaturesLandingPage /> },
  { path: "/about", element: <AboutLandingPage /> },
  { path: "/partner", element: <PartnerLandingPage /> },
  { path: "/contact", element: <ContactLandingPage /> },
  {
    path: "/owner/onboard",
    element: (
      <RoleProtectedRoute roles={["RESTAURANT_OWNER", "ADMIN"]}>
        <OwnerOnboarding />
      </RoleProtectedRoute>
    ),
  },
  {
    path: "/owner",
    element: (
      <RoleProtectedRoute roles={["RESTAURANT_OWNER", "ADMIN"]}>
        <OwnerDashboard />
      </RoleProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <RoleProtectedRoute roles={["ADMIN"]}>
        <AdminPanel />
      </RoleProtectedRoute>
    ),
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <Error />,
    children: [
      { path: "", element: <HomePage /> },
      { path: "help", element: <HelpPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "restaurants/:resId", element: <RestaurantMenuPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/:orderId", element: <OrderDetailPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "search", element: <SearchResultsPage /> },
    ],
  },
]);

export default appRouter;
