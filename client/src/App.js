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
import SearchHistoryPage from "./pages/SearchHistoryPage";
import BrowseHistoryPage from "./pages/BrowseHistoryPage";
import OffersPage from "./pages/OffersPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Error, { NotFoundPage } from "./components/Error";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerOnboarding from "./pages/OwnerOnboarding";
import AdminPanel from "./pages/AdminPanel";
import GoogleAuthCallbackPage from "./pages/GoogleAuthCallbackPage";
import FacebookAuthCallbackPage from "./pages/FacebookAuthCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const appRouter = createBrowserRouter([
  { path: "/", element: <LandingPage />, errorElement: <Error /> },
  { path: "/auth/google/callback", element: <GoogleAuthCallbackPage />, errorElement: <Error /> },
  { path: "/auth/facebook/callback", element: <FacebookAuthCallbackPage />, errorElement: <Error /> },
  { path: "/auth/reset-password", element: <ResetPasswordPage />, errorElement: <Error /> },
  { path: "/features", element: <FeaturesLandingPage />, errorElement: <Error /> },
  { path: "/about", element: <AboutLandingPage />, errorElement: <Error /> },
  { path: "/partner", element: <PartnerLandingPage />, errorElement: <Error /> },
  { path: "/contact", element: <ContactLandingPage />, errorElement: <Error /> },
  {
    path: "/owner/onboard",
    element: (
      <RoleProtectedRoute roles={["RESTAURANT_OWNER", "ADMIN"]}>
        <OwnerOnboarding />
      </RoleProtectedRoute>
    ),
    errorElement: <Error />,
  },
  {
    path: "/owner",
    element: (
      <RoleProtectedRoute roles={["RESTAURANT_OWNER", "ADMIN"]}>
        <OwnerDashboard />
      </RoleProtectedRoute>
    ),
    errorElement: <Error />,
  },
  {
    path: "/admin",
    element: (
      <RoleProtectedRoute roles={["ADMIN"]}>
        <AdminPanel />
      </RoleProtectedRoute>
    ),
    errorElement: <Error />,
  },
  {
    path: "/home",
    element: <DashboardLayout />,
    errorElement: <Error />,
    children: [
      { path: "", element: <HomePage /> },
      { path: "help", element: <HelpPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "restaurants/:resId", element: <RestaurantMenuPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "search", element: <SearchResultsPage /> },
      { path: "search/history", element: <SearchHistoryPage /> },
      { path: "browse-history", element: <BrowseHistoryPage /> },
      { path: "offers", element: <OffersPage /> },
      {
        path: "orders",
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders/:orderId",
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

export default appRouter;
