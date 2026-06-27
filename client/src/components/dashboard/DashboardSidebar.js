import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaHome,
  FaQuestionCircle,
  FaEnvelope,
  FaShoppingCart,
  FaUserCircle,
} from "react-icons/fa";

const NAV_ITEMS = [
  { icon: FaHome, label: "Home", to: "/home" },
  { icon: FaQuestionCircle, label: "Help", to: "/home/help" },
  { icon: FaEnvelope, label: "Contact", to: "/home/contact" },
  { icon: FaShoppingCart, label: "Cart", to: "/home/cart" },
];

const DashboardSidebar = ({ isDark }) => {
  const routeLocation = useLocation();
  const cartItems = useSelector((s) => s.cart.items);
  const user = useSelector((s) => s.auth.user);
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated) || !!localStorage.getItem("accessToken");
  const cartCount = cartItems.reduce((a, i) => a + (i.quantity || 1), 0);
  const brandIcon = `${process.env.PUBLIC_URL}/${isDark ? "cravon_dark_mode_icon.png" : "cravon_light_mode_icon.png"}`;

  const openSignIn = () => window.dispatchEvent(new Event("openSignIn"));

  const handleProfileClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openSignIn();
    }
  };

  const isActive = (to) =>
    to === "/home"
      ? routeLocation.pathname === "/home"
      : routeLocation.pathname.startsWith(to);

  return (
    <>
      {/* ── Desktop vertical sidebar ── */}
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 w-[64px] z-50 flex-col items-center py-6 rounded-[40px] bg-white dark:bg-[#1A1A1A] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 justify-between transition-all duration-300">

        <div className="flex flex-col items-center gap-6 w-full">
          {/* Brand */}
          <Link
            to="/home"
            className="w-14 h-14 flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform duration-200 mt-2"
          >
            <img src={brandIcon} alt="Cravon" className="w-12 h-12 object-contain drop-shadow-md" />
          </Link>

          {/* Nav Items Grouped at the top */}
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
              <Link
                key={to}
                to={to}
                title={label}
                className={`relative group w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${isActive(to)
                  ? "bg-[#FF5A5F] shadow-[0_6px_16px_rgba(255,90,95,0.4)]"
                  : "hover:bg-gray-50 dark:hover:bg-white/5 hover:scale-110"
                  }`}
              >
                <Icon
                  size={18}
                  className={isActive(to) ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"}
                />
                {label === "Cart" && cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] text-[8px] font-bold rounded-full flex items-center justify-center px-1 ${isActive(to) ? "bg-white text-[#FF5A5F]" : "bg-[#FF5A5F] text-white"}`}>
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
                {/* Tooltip */}
                <span className="pointer-events-none absolute left-14 bg-gray-800 dark:bg-white text-white dark:text-black font-semibold text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200 shadow-lg z-50">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Profile at bottom */}
        <Link
          to="/home/profile"
          onClick={handleProfileClick}
          title={isAuthenticated ? "Profile" : "Sign in"}
          className="w-11 h-11 mb-2 rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-white/10 hover:ring-[#FF5A5F]/60 hover:scale-110 transition-all duration-300 flex-shrink-0 shadow-sm"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF5A5F] to-[#FF8A8F] flex items-center justify-center">
              {user?.name ? (
                <span className="text-white font-bold text-[14px]">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <FaUserCircle size={20} className="text-white" />
              )}
            </div>
          )}
        </Link>
      </aside>

      {/* ── Mobile bottom navbar ── */}
      <nav className="dashboard-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 py-3 bg-white dark:bg-[#1A1A1A] rounded-t-3xl shadow-[0_-8px_24px_rgba(0,0,0,0.04)] border-t border-gray-100 dark:border-gray-800">
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
          <Link
            key={to}
            to={to}
            className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${isActive(to) ? "text-[#FF5A5F] scale-110" : "text-gray-400 dark:text-gray-500 hover:text-gray-600"
              }`}
          >
            <div className={`p-2 rounded-full ${isActive(to) ? "bg-[#FF5A5F]/10" : ""}`}>
              <Icon size={18} />
            </div>
            {label === "Cart" && cartCount > 0 && (
              <span className="absolute top-0 right-2 min-w-[14px] h-[14px] bg-[#FF5A5F] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
            <span className="text-[9px] font-medium hidden sm:block">{label}</span>
          </Link>
        ))}
        <Link
          to="/home/profile"
          onClick={handleProfileClick}
          className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
        >
          <div className="p-2 rounded-full">
            <FaUserCircle size={18} />
          </div>
          <span className="text-[9px] font-medium hidden sm:block">Profile</span>
        </Link>
      </nav>
    </>
  );
};

export default DashboardSidebar;
