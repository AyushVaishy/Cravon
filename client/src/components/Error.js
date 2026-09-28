import { Component, useEffect, useState } from "react";
import { useNavigate, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { FaHome, FaRedo, FaMapMarkerAlt, FaWifi, FaHeadset } from "react-icons/fa";

/* ── Illustrations (unique per error kind) ─────────────────────────────────── */

const SvgShell = ({ children, className = "" }) => (
  <svg
    viewBox="0 0 360 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full max-w-[240px] sm:max-w-[280px] mx-auto ${className}`}
    aria-hidden
  >
    <ellipse cx="180" cy="220" rx="118" ry="11" fill="#FF7A1A" opacity="0.1" />
    {children}
  </svg>
);

const ArtSpilled = () => (
  <SvgShell>
    <path d="M118 78c0-10 8-14 8-22" stroke="#FFB06A" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    <path d="M138 70c0-12 10-16 10-26" stroke="#FFB06A" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <path d="M95 198c20-8 40-4 55 6" stroke="#E8A54B" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
    <g transform="translate(230 52) rotate(28)">
      <rect x="0" y="0" width="8" height="120" rx="4" fill="#C4A484" />
    </g>
    <g transform="translate(268 48) rotate(-18)">
      <rect x="0" y="0" width="8" height="118" rx="4" fill="#B8956C" />
    </g>
    <g transform="translate(78 95) rotate(-12)">
      <ellipse cx="90" cy="28" rx="92" ry="28" fill="#FFF8F3" stroke="#E5E7EB" strokeWidth="3" />
      <path d="M8 28c4 52 28 88 82 88s78-36 82-88" fill="#FF7A1A" />
      <path d="M40 36c20 10 40 8 60-2" stroke="#FFE066" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 48c18 8 36 6 52-2" stroke="#FFD166" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="62" y="72" width="56" height="28" rx="10" fill="#fff" />
      <text x="90" y="91" textAnchor="middle" fill="#FF7A1A" fontFamily="Sora,sans-serif" fontSize="14" fontWeight="800">ERR</text>
    </g>
    <circle cx="52" cy="168" r="5" fill="#FF5A5F" />
    <circle cx="300" cy="180" r="4" fill="#2EC4B6" opacity="0.7" />
  </SvgShell>
);

const ArtOffline = () => (
  <SvgShell>
    {/* phone */}
    <rect x="130" y="48" width="100" height="160" rx="18" fill="#1F1F1F" />
    <rect x="138" y="60" width="84" height="120" rx="8" fill="#FFF8F3" />
    <circle cx="180" cy="192" r="6" fill="#555" />
    {/* wifi slash */}
    <path d="M155 105c14-14 36-14 50 0" stroke="#FF7A1A" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M163 118c9-9 25-9 34 0" stroke="#FF7A1A" strokeWidth="5" strokeLinecap="round" fill="none" />
    <circle cx="180" cy="132" r="5" fill="#FF7A1A" />
    <path d="M152 88l56 70" stroke="#FF5A5F" strokeWidth="5" strokeLinecap="round" />
    {/* floating dots */}
    <circle cx="90" cy="90" r="6" fill="#FFD166" opacity="0.8" />
    <circle cx="270" cy="120" r="5" fill="#2EC4B6" opacity="0.7" />
  </SvgShell>
);

const ArtNotFound = () => (
  <SvgShell>
    {/* map pin with 404 */}
    <path d="M180 40c40 0 72 32 72 72 0 56-72 108-72 108S108 168 108 112c0-40 32-72 72-72z" fill="#FF7A1A" />
    <circle cx="180" cy="108" r="38" fill="#fff" />
    <text x="180" y="116" textAnchor="middle" fill="#FF7A1A" fontFamily="Sora,sans-serif" fontSize="22" fontWeight="800">404</text>
    <circle cx="95" cy="70" r="8" fill="#FFD166" opacity="0.9" />
    <circle cx="275" cy="95" r="6" fill="#2EC4B6" opacity="0.75" />
    <circle cx="80" cy="160" r="5" fill="#FF5A5F" opacity="0.7" />
  </SvgShell>
);

const ArtServer = () => (
  <SvgShell>
    {/* server rack */}
    <rect x="110" y="55" width="140" height="150" rx="16" fill="#1F1F1F" />
    <rect x="122" y="70" width="116" height="36" rx="8" fill="#2A2A2A" />
    <rect x="122" y="116" width="116" height="36" rx="8" fill="#2A2A2A" />
    <rect x="122" y="162" width="116" height="28" rx="8" fill="#2A2A2A" />
    <circle cx="140" cy="88" r="6" fill="#FF5A5F" />
    <circle cx="158" cy="88" r="6" fill="#FFD166" />
    <circle cx="140" cy="134" r="6" fill="#FF5A5F" className="animate-pulse" />
    <circle cx="158" cy="134" r="6" fill="#9CA3AF" />
    <rect x="175" y="80" width="50" height="8" rx="4" fill="#555" />
    <rect x="175" y="126" width="50" height="8" rx="4" fill="#555" />
    {/* smoke */}
    <path d="M250 50c8-16 20-20 20-36" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
    <path d="M268 55c6-12 14-16 14-28" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
  </SvgShell>
);

/** Delivery scooter stopped by road barricade — "not deliverable here" */
const ArtUnserviceable = () => (
  <SvgShell className="max-w-[300px] sm:max-w-[340px]">
    {/* road */}
    <path d="M20 200 H340" stroke="#D1D5DB" strokeWidth="10" strokeLinecap="round" />
    <path d="M40 200 H150" stroke="#fff" strokeWidth="3" strokeDasharray="14 10" opacity="0.9" />
    {/* broken / closed section of road */}
    <path d="M210 200 H320" stroke="#9CA3AF" strokeWidth="10" strokeLinecap="round" opacity="0.45" />
    <path d="M230 194l12 12M248 192l10 14M268 195l8 10" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />

    {/* motion lines behind scooter (was moving) */}
    <g opacity="0.45">
      <path d="M28 150h22" stroke="#2EC4B6" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 162h28" stroke="#2EC4B6" strokeWidth="3" strokeLinecap="round" />
      <path d="M34 174h18" stroke="#2EC4B6" strokeWidth="3" strokeLinecap="round" />
    </g>

    {/* scooter group */}
    <g className="error-scooter">
      {/* rear wheel */}
      <circle cx="95" cy="188" r="22" fill="#1F1F1F" />
      <circle cx="95" cy="188" r="11" fill="#F3F1EE" />
      <circle cx="95" cy="188" r="4" fill="#1F1F1F" />
      {/* front wheel */}
      <circle cx="175" cy="188" r="22" fill="#1F1F1F" />
      <circle cx="175" cy="188" r="11" fill="#F3F1EE" />
      <circle cx="175" cy="188" r="4" fill="#1F1F1F" />
      {/* deck / body */}
      <path d="M105 168h55l8 20H112z" fill="#FF7A1A" />
      {/* delivery box */}
      <rect x="108" y="118" width="48" height="42" rx="8" fill="#FF9A4A" />
      <rect x="116" y="128" width="32" height="8" rx="3" fill="#fff" opacity="0.55" />
      <text x="132" y="152" textAnchor="middle" fill="#fff" fontFamily="Sora,sans-serif" fontSize="11" fontWeight="800">C</text>
      {/* stem + handle */}
      <path d="M168 168V132" stroke="#1F1F1F" strokeWidth="6" strokeLinecap="round" />
      <path d="M155 132h28" stroke="#1F1F1F" strokeWidth="6" strokeLinecap="round" />
      {/* rider hint (helmet) */}
      <circle cx="155" cy="112" r="14" fill="#1F1F1F" />
      <circle cx="155" cy="112" r="8" fill="#FFD166" />
    </g>

    {/* striped barricade blocking the road ahead */}
    <g transform="translate(218 118)">
      {/* posts */}
      <rect x="8" y="28" width="8" height="58" rx="3" fill="#6B7280" />
      <rect x="86" y="28" width="8" height="58" rx="3" fill="#6B7280" />
      {/* board */}
      <rect x="0" y="8" width="102" height="36" rx="6" fill="#1F1F1F" />
      <rect x="0" y="8" width="102" height="36" rx="6" fill="url(#barricadeStripes)" />
      <text x="51" y="32" textAnchor="middle" fill="#fff" fontFamily="Sora,sans-serif" fontSize="11" fontWeight="800">CLOSED</text>
    </g>

    {/* stop / no-entry badge */}
    <g transform="translate(268 72)">
      <circle cx="18" cy="18" r="18" fill="#FF5A5F" />
      <rect x="8" y="15" width="20" height="6" rx="3" fill="#fff" />
    </g>

    <defs>
      <pattern id="barricadeStripes" patternUnits="userSpaceOnUse" width="16" height="36" patternTransform="skewX(-28)">
        <rect width="8" height="36" fill="#FF7A1A" />
        <rect x="8" width="8" height="36" fill="#1F1F1F" />
      </pattern>
    </defs>
  </SvgShell>
);

const ArtAuth = () => (
  <SvgShell>
    <rect x="120" y="70" width="120" height="140" rx="20" fill="#FF7A1A" />
    <circle cx="180" cy="125" r="28" fill="#fff" />
    <rect x="155" y="155" width="50" height="36" rx="10" fill="#fff" />
    <path d="M180 115v20" stroke="#FF7A1A" strokeWidth="5" strokeLinecap="round" />
    <circle cx="180" cy="110" r="4" fill="#FF7A1A" />
    <circle cx="95" cy="100" r="6" fill="#FFD166" />
    <circle cx="275" cy="140" r="5" fill="#2EC4B6" />
  </SvgShell>
);

/* ── Error kind catalog ────────────────────────────────────────────────────── */

export const ERROR_KINDS = {
  offline: {
    kind: "offline",
    title: "You're offline",
    detail: "Check your internet connection and try again.",
    accent: "#3B82F6",
    Art: ArtOffline,
    primaryLabel: "Try again",
    secondaryLabel: "Back to Home",
  },
  notFound: {
    kind: "notFound",
    title: "Page not found",
    detail: "This link doesn't exist. Let's get you back to something tasty.",
    accent: "#FF7A1A",
    Art: ArtNotFound,
    primaryLabel: "Go Home",
    secondaryLabel: "Get Help",
  },
  server: {
    kind: "server",
    title: "Something went wrong",
    detail: "Our servers hiccupped. Please retry in a moment.",
    accent: "#FF5A5F",
    Art: ArtServer,
    primaryLabel: "Retry",
    secondaryLabel: "Back to Home",
  },
  unserviceable: {
    kind: "unserviceable",
    title: "We're not here yet",
    detail: "Cravon isn't delivering to this area right now. Try another location.",
    accent: "#2EC4B6",
    Art: ArtUnserviceable,
    primaryLabel: "Change location",
    secondaryLabel: "Back to Home",
  },
  unauthorized: {
    kind: "unauthorized",
    title: "Sign in required",
    detail: "You need to be signed in to view this page.",
    accent: "#8B5CF6",
    Art: ArtAuth,
    primaryLabel: "Sign in",
    secondaryLabel: "Back to Home",
  },
  generic: {
    kind: "generic",
    title: "Something went wrong",
    detail: "Don't worry — your cart is safe. Hit retry and we'll get you back.",
    accent: "#FF7A1A",
    Art: ArtSpilled,
    primaryLabel: "Retry",
    secondaryLabel: "Back to Home",
  },
};

/** Resolve a stable error kind from error object / status / online state */
export const resolveErrorKind = (error, { status, online, kind: forced } = {}) => {
  if (forced && ERROR_KINDS[forced]) return forced;

  if (online === false || (typeof navigator !== "undefined" && navigator.onLine === false)) {
    return "offline";
  }

  const code = status ?? (isRouteErrorResponse(error) ? error.status : null);
  const msg = String(
    error?.message || error?.data?.message || error?.statusText || error || ""
  ).toLowerCase();

  if (code === 404 || forced === "notFound") return "notFound";
  if (code === 401 || code === 403 || msg.includes("unauthorized") || msg.includes("sign in")) {
    return "unauthorized";
  }
  if (code >= 500) return "server";

  if (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("load failed") ||
    msg.includes("offline") ||
    msg.includes("net::")
  ) {
    return "offline";
  }

  if (
    msg.includes("unserviceable") ||
    msg.includes("not serving") ||
    msg.includes("not available") ||
    msg.includes("out of delivery") ||
    msg.includes("outside delivery") ||
    msg.includes("serviceable")
  ) {
    return "unserviceable";
  }

  return "generic";
};

export const friendlyMessage = (err, opts) => {
  const kind = resolveErrorKind(err, opts);
  const cfg = ERROR_KINDS[kind];
  return { kind, ...cfg };
};

/* ── Main UI ───────────────────────────────────────────────────────────────── */

export const ErrorPageView = ({
  error = null,
  status = null,
  kind: kindProp = null,
  online,
  embedded = false,
  onRetry,
  onHome,
  onHelp,
  onChangeLocation,
  onSignIn,
}) => {
  const [liveOnline, setLiveOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const up = () => setLiveOnline(true);
    const down = () => setLiveOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const isOnline = online ?? liveOnline;
  const resolved = friendlyMessage(error, { status, online: isOnline, kind: kindProp });
  const { kind, title, detail, accent, Art, primaryLabel, secondaryLabel } = resolved;

  const handlePrimary = () => {
    if (kind === "unserviceable" && onChangeLocation) return onChangeLocation();
    if (kind === "unauthorized" && onSignIn) return onSignIn();
    if (kind === "notFound" && onHome) return onHome();
    if (onRetry) return onRetry();
  };

  const handleSecondary = () => {
    if (kind === "notFound" && onHelp) return onHelp();
    if (onHome) return onHome();
  };

  const SecondaryIcon = kind === "notFound" ? FaHeadset : kind === "unserviceable" ? FaMapMarkerAlt : FaHome;

  return (
    <div
      className={`w-full flex flex-col overflow-hidden relative bg-[var(--color-bg-main,#FFF8F3)] text-[var(--color-text-primary,#1F1F1F)] ${
        embedded
          ? "h-full min-h-0 rounded-3xl"
          : "h-[100dvh] max-h-[100dvh]"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[20rem] h-[20rem] rounded-full blur-3xl opacity-25"
        style={{ background: `radial-gradient(circle, ${accent}50 0%, transparent 70%)` }}
      />

      <div className={`relative z-10 flex-1 flex items-center justify-center px-5 min-h-0 ${embedded ? "pt-4 pb-1" : "pt-6 pb-2"}`}>
        <div key={kind} className="w-full flex justify-center" style={{ color: accent }}>
          <Art />
        </div>
        </div>

      <div className={`relative z-10 shrink-0 bg-[var(--color-bg-card,#fff)] dark:bg-[#161616] rounded-t-[1.75rem] shadow-[0_-8px_28px_rgba(0,0,0,0.05)] px-5 sm:px-7 ${embedded ? "pt-5 pb-5" : "pt-6 pb-7"}`}>
        <div className="max-w-sm mx-auto text-center">
          <h1 className="font-display text-xl sm:text-2xl font-extrabold leading-tight mb-1.5 text-foreground">
          {title}
        </h1>
          <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed mb-5 max-w-[19rem] mx-auto">
          {detail}
        </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
          <button
            type="button"
              onClick={handlePrimary}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl text-white font-bold text-sm hover:-translate-y-0.5 active:translate-y-0 transition-all"
              style={{
                background: accent,
                boxShadow: `0 8px 22px -6px ${accent}88`,
              }}
            >
              {kind === "offline" ? <FaWifi size={13} /> : kind === "unserviceable" ? <FaMapMarkerAlt size={13} /> : <FaRedo size={12} />}
              {primaryLabel}
          </button>
          <button
            type="button"
              onClick={handleSecondary}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-[var(--color-bg-main,#FFF8F3)] dark:bg-[#222] border border-[var(--color-border,#E5E7EB)] dark:border-white/10 font-semibold text-sm text-foreground hover:-translate-y-0.5 transition-all"
          >
              <SecondaryIcon size={13} style={{ color: accent }} />
              {secondaryLabel}
          </button>
        </div>

          {onHelp && kind !== "notFound" && !embedded && (
            <p className="mt-4 text-xs text-muted-foreground">
          Still stuck?{" "}
          <button
            type="button"
                onClick={onHelp}
                className="font-semibold hover:underline underline-offset-2"
                style={{ color: accent }}
          >
            Visit Help
          </button>
        </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Router / boundary wiring ──────────────────────────────────────────────── */

const useErrorActions = () => {
  const navigate = useNavigate();
  return {
    onRetry: () => window.location.reload(),
    onHome: () => navigate("/home", { replace: true }),
    onHelp: () => navigate("/home/help"),
    onChangeLocation: () => {
      navigate("/home", { replace: true });
      setTimeout(() => window.dispatchEvent(new Event("openLocationSidebar")), 120);
    },
    onSignIn: () => {
      navigate("/home", { replace: true });
      setTimeout(() => window.dispatchEvent(new Event("openSignIn")), 120);
    },
  };
};

const Error = () => {
  const err = useRouteError();
  const actions = useErrorActions();

  if (err) {
    // eslint-disable-next-line no-console
    console.error("[Cravon route error]", err);
  }

  return <ErrorPageView error={err} {...actions} />;
};

export const NotFoundPage = () => {
  const actions = useErrorActions();
  return <ErrorPageView kind="notFound" status={404} {...actions} />;
};

/** Convenience wrappers for in-app states */
export const OfflinePage = (props) => <ErrorPageView kind="offline" {...props} />;
export const UnserviceablePage = (props) => <ErrorPageView kind="unserviceable" {...props} />;
export const ServerErrorPage = (props) => <ErrorPageView kind="server" {...props} />;

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("[Cravon ErrorBoundary]", error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <ErrorPageView
          error={this.state.error}
          onRetry={() => {
            this.reset();
            window.location.reload();
          }}
          onHome={() => {
            this.reset();
            window.location.assign("/home");
          }}
          onHelp={() => {
            this.reset();
            window.location.assign("/home/help");
          }}
          onChangeLocation={() => {
            this.reset();
            window.location.assign("/home");
          }}
          onSignIn={() => {
            this.reset();
            window.location.assign("/home");
          }}
        />
      );
    }
    return this.props.children;
  }
}

export default Error;
