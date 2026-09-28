import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardTopBar from "../components/dashboard/DashboardTopBar";
import DashboardCartPanel from "../components/dashboard/DashboardCartPanel";
import LocationPanel from "../components/LocationPanel";
import SignInSidebar from "../components/SignInSidebar";
import { loadBrowseLocation, saveBrowseLocation } from "../utils/locationStorage";

const DashboardLayout = () => {
  const routeLocation = useLocation();
  const [location, setLocation] = useState(loadBrowseLocation);
  const [isDark, setIsDark] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInTab, setSignInTab] = useState("login");

  const handleSetLocation = (loc) => {
    setLocation(loc);
    saveBrowseLocation(loc);
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const dark = saved ? saved === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    const handler = () => setLocationOpen(true);
    window.addEventListener("openLocationSidebar", handler);
    return () => window.removeEventListener("openLocationSidebar", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      setSignInTab(e?.detail?.tab || "login");
      setSignInOpen(true);
    };
    window.addEventListener("openSignIn", handler);
    return () => window.removeEventListener("openSignIn", handler);
  }, []);

  // Hide floating cart panel on full cart / checkout page to avoid duplication
  const hideCartPanel = routeLocation.pathname.startsWith("/home/cart");

  return (
    <div className="dashboard-root flex h-screen overflow-hidden">
      <DashboardSidebar isDark={isDark} />

      <div
        className={`flex-1 flex flex-col overflow-hidden min-w-0 md:ml-[88px] mb-16 md:mb-0 ${
          hideCartPanel ? "xl:mr-4" : "xl:mr-0"
        }`}
      >
        <DashboardTopBar location={location} isDark={isDark} toggleTheme={toggleTheme} />

        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet context={{ location, setLocation: handleSetLocation }} />
        </main>
      </div>

      {!hideCartPanel && <DashboardCartPanel location={location} />}

      <LocationPanel
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
        location={location}
        setLocation={handleSetLocation}
      />
      <SignInSidebar isOpen={signInOpen} onClose={() => setSignInOpen(false)} initialTab={signInTab} />
    </div>
  );
};

export default DashboardLayout;
