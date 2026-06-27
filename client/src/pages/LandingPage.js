import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBolt,
  FaBrain,
  FaChevronRight,
  FaClock,
  FaMapMarkerAlt,
  FaSearch,
  FaShieldAlt,
  FaShoppingBag,
  FaStar,
  FaUserFriends,
} from "react-icons/fa";
import LandingLayout, { useLandingUi } from "../components/landing/LandingLayout";

const LandingHomeContent = () => {
  const { openAuth } = useLandingUi();
  const navigate = useNavigate();

  const featureCards = [
    {
      icon: <FaMapMarkerAlt className="text-brand" size={18} />,
      title: "Location-Based Discovery",
      description: "Find the best spots nearby with live prep-time aware recommendations.",
    },
    {
      icon: <FaClock className="text-brand" size={18} />,
      title: "Lightning Delivery",
      description: "From kitchen to doorstep with real-time ETA and route tracking.",
    },
    {
      icon: <FaShieldAlt className="text-brand" size={18} />,
      title: "Trusted Checkout",
      description: "Encrypted payment flow with safe and reliable order confirmation.",
    },
    {
      icon: <FaSearch className="text-brand" size={18} />,
      title: "Precision Search",
      description: "Advanced filters across cuisine, budget, spice level, and dietary needs.",
    },
    {
      icon: <FaUserFriends className="text-brand" size={18} />,
      title: "Group Ordering",
      description: "Collaborative carts for team meals and shared party orders.",
    },
    {
      icon: <FaBrain className="text-brand" size={18} />,
      title: "AI Meal Match",
      description: "Personalized meal suggestions tuned to mood, weather, and habits.",
    },
  ];

  return (
    <div className="pt-16 overflow-x-hidden">
      <section className="relative px-6 py-20 md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(241,90,36,0.18),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            

            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-app-primary md:text-7xl">
              Smarter Food Ordering
              <span className="block text-brand">Starts Here</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-app-secondary">
              Experience premium food delivery with AI-powered suggestions, live group ordering,
              and deeply personalized discovery.
            </p>

            <div className="landing-glass flex max-w-2xl flex-col items-center gap-4 rounded-3xl border border-app-border p-2 sm:flex-row">
              <div className="flex w-full flex-1 items-center gap-3 px-4">
                <FaMapMarkerAlt className="text-brand" />
                <input
                  type="text"
                  placeholder="Enter location..."
                  className="w-full bg-transparent py-3 text-app-primary outline-none placeholder:text-app-secondary/60"
                />
              </div>
              <div className="hidden h-8 w-px bg-app-border sm:block" />
              <div className="flex w-full flex-1 items-center gap-3 px-4">
                <FaSearch className="text-app-secondary/70" />
                <input
                  type="text"
                  placeholder="Search food or restaurant"
                  className="w-full bg-transparent py-3 text-app-primary outline-none placeholder:text-app-secondary/60"
                />
              </div>
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="w-full shrink-0 rounded-2xl bg-brand px-8 py-3 font-bold text-white transition-colors hover:bg-brand-dark sm:w-auto"
              >
                Browse restaurants
              </button>
            </div>

            <div className="flex items-center gap-6 pt-3">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 overflow-hidden rounded-full border-2 border-app-surface bg-app-border"
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=cravon-${i}`}
                      alt="Customer"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-app-secondary">
                <span className="font-bold text-app-primary">10k+</span> happy foodies ordered today
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-app-border/70 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&q=80&w=1200"
                alt="Food preview"
                className="h-auto w-full opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-app-bg/50 to-transparent" />
            </div>

            <div className="landing-glass absolute -right-4 -top-4 z-20 flex items-center gap-3 rounded-2xl border border-app-border/60 p-4 shadow-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
                <FaShoppingBag className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-app-secondary">Status</p>
                <p className="font-bold text-app-primary">Order Delivered</p>
              </div>
            </div>

            <div className="landing-glass absolute -bottom-8 -left-5 z-20 w-64 rounded-2xl border border-app-border/60 p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-bold text-app-primary">Hot Picks</p>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">New</span>
              </div>
              <div className="flex gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand/10 text-xl">🍕</div>
                <div>
                  <p className="text-sm font-bold text-app-primary">Truffle Pizza</p>
                  <p className="text-xs text-app-secondary">$24.00 • 4.9 ★</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-app-border/40 bg-app-surface py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4 md:px-8">
          {[
            { icon: <FaShoppingBag className="text-brand" />, value: "2.5k+", label: "Restaurants" },
            { icon: <FaUserFriends className="text-brand" />, value: "1.2M+", label: "Happy Users" },
            { icon: <FaMapMarkerAlt className="text-brand" />, value: "50+", label: "Cities" },
            { icon: <FaShieldAlt className="text-brand" />, value: "99.9%", label: "Success Rate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
                {stat.icon}
              </div>
              <p className="font-display text-3xl font-bold text-app-primary">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-app-secondary">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-app py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
            <h2 className="text-4xl font-bold text-app-primary md:text-5xl">
              Everything you need in <span className="text-brand">one app</span>
            </h2>
            <p className="text-app-secondary">Built for speed, precision, and a smoother food journey.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-app-border/60 bg-app-surface p-8 shadow-soft transition-transform hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-app">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-bold text-app-primary">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-app-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-brand px-6 py-24 md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-black/10" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8 text-white lg:pr-8">
            <h2 className="text-5xl font-bold leading-tight md:text-6xl">
              Not just another <span className="opacity-60">delivery app.</span>
            </h2>
            <p className="text-lg text-white/85">
              We are building the intelligent commerce layer for food, helping users choose better and order together.
            </p>
            <ul className="space-y-4">
              {["AI-powered craving detector", "Live group cart sync", "Automatic bill splitting", "Dietary smart filters"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <FaStar size={12} />
                  </span>
                  <span className="text-base font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2.2rem] bg-app-surface p-8 shadow-2xl">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white">
                <FaBrain size={24} />
              </div>
              <h3 className="mb-3 text-3xl font-bold text-app-primary">Let AI pick your meal</h3>
              <p className="mb-6 text-app-secondary">
                Tell us your mood, budget, and cravings. Cravon AI returns high-confidence meal matches in seconds.
              </p>
              <div className="space-y-3">
                <div className="rounded-2xl border border-app-border bg-app p-4 text-sm text-app-primary">
                  "I want something spicy, high-protein, and under $15."
                </div>
                <div className="rounded-2xl border border-brand/20 bg-brand-soft p-4 text-sm font-semibold text-brand">
                  Try Peri Peri Bowl from Spice Yard.
                </div>
              </div>
            </div>

            <div className="rounded-[2.2rem] bg-slate-900 p-8 text-white shadow-2xl">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white">
                <FaUserFriends size={22} />
              </div>
              <h3 className="mb-3 text-3xl font-bold">Order together, effortlessly</h3>
              <p className="mb-5 text-slate-300">
                Shared carts for parties and office lunches with live updates and no manual reconciliation.
              </p>
              <div className="flex gap-2">
                {[50, 70, 90].map((v) => (
                  <div key={v} className="h-2.5 flex-1 rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${v}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-app-surface py-20">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-8">
          <h2 className="mb-16 text-4xl font-bold text-app-primary">What our community says</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                name: "Sarah J.",
                text: "The AI picks are crazy accurate. It feels like the app understands my mood.",
                icon: "✨",
              },
              {
                name: "Mark D.",
                text: "Group ordering removed all our Friday lunch chaos.",
                icon: "🍕",
              },
              {
                name: "Elena R.",
                text: "Fastest delivery and the cleanest food app UI I have used.",
                icon: "🚀",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-[2rem] border border-app-border/60 bg-app p-8 text-center shadow-soft"
              >
                <div className="mb-5 text-4xl">{item.icon}</div>
                <p className="mb-5 italic text-app-secondary">"{item.text}"</p>
                <p className="font-bold text-app-primary">{item.name}</p>
                <div className="mt-2 flex justify-center gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <FaStar key={n} size={13} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 rounded-[2.6rem] bg-slate-900 px-8 py-14 text-left text-white md:px-14">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-4xl font-bold">Grow Your Restaurant with Cravon</h3>
                <p className="mb-7 text-slate-300">
                  Reach more customers, unlock performance analytics, and manage orders with confidence.
                </p>
                <Link
                  to="/partner"
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand px-7 py-3.5 font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                  Register Your Restaurant
                  <FaChevronRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  "Reach millions of food lovers",
                  "Real-time dashboard analytics",
                  "Menu and inventory controls",
                  "Reliable logistics coverage",
                ].map((point) => (
                  <div key={point} className="rounded-xl bg-white/5 p-4 text-sm text-slate-200">
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const savedUserData = localStorage.getItem("userData");
    if (savedUserData) {
      navigate("/home");
    }
  }, [navigate]);

  return (
    <LandingLayout>
      <LandingHomeContent />
    </LandingLayout>
  );
};

export default LandingPage;
