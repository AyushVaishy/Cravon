import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaFacebook,
  FaInstagram,
  FaMoon,
  FaSun,
  FaTimes,
  FaTwitter,
} from "react-icons/fa";
import { FiArrowUp, FiArrowUpRight } from "react-icons/fi";
import SignInSidebar from "../SignInSidebar";

const LandingUiContext = createContext({
  openAuth: () => {},
  isDark: false,
  toggleTheme: () => {},
});

export const useLandingUi = () => useContext(LandingUiContext);

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
  { label: "About", path: "/about" },
  { label: "Partner", path: "/partner" },
  { label: "Contact", path: "/contact" },
];

const footerSocials = [
  { Icon: FaInstagram, label: "Instagram" },
  { Icon: FaTwitter, label: "Twitter" },
  { Icon: FaFacebook, label: "Facebook" },
];

const footerColumns = [
  {
    title: "Explore",
    links: [
      { label: "Home", to: "/" },
      { label: "Features", to: "/features" },
      { label: "About", to: "/about" },
      { label: "Browse restaurants", to: "/home" },
    ],
  },
  {
    title: "For partners",
    links: [
      { label: "Partner with us", to: "/partner" },
      { label: "List your restaurant", to: "/partner" },
      { label: "Contact sales", to: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", to: "/contact" },
      { label: "Terms of service" },
      { label: "Privacy policy" },
    ],
  },
];

const LandingLayout = ({ children, seamlessFooter = false }) => {
  const [signInSidebarOpen, setSignInSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  // Home hero is always a dark food plate — gold logo until user scrolls
  const onDarkHero = isHome && !isScrolled;
  const brandLogo = `${process.env.PUBLIC_URL}/${
    onDarkHero
      ? "cravon_gold_logo.png"
      : isDark
        ? "dark_mode_cravon_logo.png"
        : "cravon_light_mode_logo.png"
  }`;
  const brandIcon = `${process.env.PUBLIC_URL}/${isDark ? "cravon_dark_mode_icon.png" : "cravon_light_mode_icon.png"}`;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const enableDark = savedTheme ? savedTheme === "dark" : prefersDark;
    setIsDark(enableDark);
    document.documentElement.classList.toggle("dark", enableDark);

    const handleStorage = (e) => {
      if (e.key === "theme") {
        const nextIsDark = e.newValue === "dark";
        setIsDark(nextIsDark);
        document.documentElement.classList.toggle("dark", nextIsDark);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    // Header shows on section 1; hides once section 2 takes the screen
    const isOnHomeSection1 = () => {
      const hero = document.querySelector(".landing-panel--hero");
      if (!hero) return window.scrollY < 80;
      const rect = hero.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (vh <= 0) return true;
      const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      return visible / vh >= 0.6;
    };

    const updateHeader = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      setIsScrolled(y > 20);

      if (isHome) {
        if (isMenuOpen) {
          setHeaderHidden(false);
        } else {
          // Visible on section 1; vanished on section 2+ (both themes)
          setHeaderHidden(!isOnHomeSection1());
        }
      } else if (isMenuOpen || y < 48) {
        setHeaderHidden(false);
      } else if (delta > 6) {
        setHeaderHidden(true);
      } else if (delta < -6) {
        setHeaderHidden(false);
      }

      lastY = y;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateHeader();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMenuOpen, isHome]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMenuOpen(false);
    setHeaderHidden(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMenuOpen) setHeaderHidden(false);
  }, [isMenuOpen]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const openAuth = () => setSignInSidebarOpen(true);

  const contextValue = useMemo(
    () => ({ openAuth, isDark, toggleTheme }),
    [isDark]
  );

  return (
    <LandingUiContext.Provider value={contextValue}>
      <div className="landing-shell min-h-screen transition-theme">
        <SignInSidebar
          isOpen={signInSidebarOpen}
          onClose={() => setSignInSidebarOpen(false)}
          onSignIn={() => setSignInSidebarOpen(false)}
        />

        <header
          className={`landing-header fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-all duration-300 md:px-5 ${
            headerHidden ? "landing-header--hidden" : ""
          } ${onDarkHero ? "landing-header--on-hero" : ""}`}
        >
          <div
            className={`landing-header-bar mx-auto flex max-w-7xl items-center justify-between ${
              onDarkHero ? "landing-header-bar--hero" : "is-glass"
            }`}
          >
            <Link to="/" className="group flex shrink-0 items-center gap-2.5">
              <img
                src={brandLogo}
                alt="Cravon"
                className={`w-auto transition-transform duration-300 group-hover:scale-[1.02] ${
                  onDarkHero ? "h-11 max-w-[220px]" : "h-9 max-w-[170px]"
                }`}
              />
            </Link>

            <nav className="landing-header-nav hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`landing-nav-link ${active ? "is-active" : ""}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={toggleTheme}
                className="landing-header-theme"
                aria-label="Toggle theme"
              >
                {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>
              <button onClick={openAuth} className="landing-header-login">
                Log in
              </button>
              <button onClick={openAuth} className="landing-nav-cta landing-header-join">
                Join Now
                <FiArrowUpRight size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={toggleTheme}
                className="landing-header-theme"
                aria-label="Toggle theme"
              >
                {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="landing-header-theme"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="landing-header-menu mx-auto mt-2 max-w-7xl px-5 pb-6 pt-4 md:hidden">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="text-base font-semibold text-[#1F1F1F] dark:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    onClick={openAuth}
                    className="rounded-full border border-brand/40 py-2.5 font-semibold text-brand"
                  >
                    Login
                  </button>
                  <button
                    onClick={openAuth}
                    className="landing-nav-cta rounded-full py-2.5 font-extrabold"
                  >
                    Join Now
                  </button>
                </div>
                <button
                  onClick={() => navigate("/home")}
                  className="landing-cta-red rounded-full py-3 font-bold"
                >
                  Browse Restro
                </button>
              </div>
            </div>
          )}
        </header>

        <main>{children}</main>

        <footer
          className={`landing-footer ${isHome || seamlessFooter ? "landing-footer--home" : ""}`}
        >
          {!isHome && !seamlessFooter && (
            <div className="landing-torn landing-torn--flip landing-footer__torn" />
          )}

          <div className="landing-footer__body">
            <div className="landing-footer__inner">
              <div className="landing-footer__grid">
                <div className="landing-footer__brand">
                  <Link to="/" className="landing-footer__logo">
                    <img src={brandIcon} alt="" className="landing-footer__logo-icon" />
                    <span>CRAVON</span>
                  </Link>
                  <p className="landing-footer__tagline">
                    Big cravings. <em>Bold kitchens.</em>
                  </p>
                  <p className="landing-footer__about">
                    Browse nearby restaurants, search any dish and order in seconds.
                  </p>
                  <div className="landing-footer__social">
                    {footerSocials.map(({ Icon, label }) => (
                      <a key={label} href="#" aria-label={label} className="landing-footer__social-btn">
                        <Icon size={14} />
                      </a>
                    ))}
                  </div>
                </div>

                {footerColumns.map((column) => (
                  <nav key={column.title} className="landing-footer__col" aria-label={column.title}>
                    <h4 className="landing-footer__heading">{column.title}</h4>
                    <ul>
                      {column.links.map((link) => (
                        <li key={link.label}>
                          {link.to ? (
                            <Link to={link.to} className="landing-footer__link">
                              {link.label}
                            </Link>
                          ) : (
                            <a href="#" className="landing-footer__link">
                              {link.label}
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
              </div>

              <div className="landing-footer__bottom">
                <p>© 2026 Cravon. All rights reserved.</p>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="landing-footer__top"
                >
                  Back to top
                  <span className="landing-footer__top-icon" aria-hidden="true">
                    <FiArrowUp size={13} />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </LandingUiContext.Provider>
  );
};

export default LandingLayout;
