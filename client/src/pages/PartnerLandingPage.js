import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCamera,
  FaChartLine,
  FaCheck,
  FaClipboardList,
  FaHeadset,
  FaIdCard,
  FaMapMarkerAlt,
  FaPlus,
  FaReceipt,
  FaStar,
  FaStore,
  FaUniversity,
  FaUtensils,
  FaWallet,
} from "react-icons/fa";
import LandingLayout, { useLandingUi } from "../components/landing/LandingLayout";

const BENEFITS_BG_LIGHT = `${process.env.PUBLIC_URL}/landing/section4.png`;
const BENEFITS_BG_DARK = `${process.env.PUBLIC_URL}/landing/section4_darkbg.png`;
const CTA_BG_LIGHT = `${process.env.PUBLIC_URL}/landing/section5.png`;
const CTA_BG_DARK = `${process.env.PUBLIC_URL}/landing/section5_darkbg.png`;

const heroStats = [
  { value: "₹0", label: "Onboarding fee" },
  { value: "48h", label: "Average go-live" },
  { value: "Weekly", label: "Bank payouts" },
];

const dashBars = [38, 52, 44, 66, 58, 80, 92];

const dashOrders = [
  { id: "#1042", items: "2× Paneer Tikka, 1× Naan", price: "₹540", status: "New", tone: "new" },
  { id: "#1041", items: "1× Veg Biryani, 1× Raita", price: "₹310", status: "Preparing", tone: "prep" },
];

const benefits = [
  {
    icon: FaMapMarkerAlt,
    title: "Reach hungry customers nearby",
    desc: "Get discovered by people searching for your cuisine, dishes and price range in your delivery radius.",
  },
  {
    icon: FaChartLine,
    title: "Live order dashboard",
    desc: "Accept, prepare and hand over orders from one screen, with sound alerts and prep timers.",
  },
  {
    icon: FaUtensils,
    title: "Smart menu editor",
    desc: "Update items, prices, add-ons and stock in seconds. Changes go live instantly.",
  },
  {
    icon: FaWallet,
    title: "Weekly payouts",
    desc: "Earnings settle straight to your bank every week, with a clear statement for every order.",
  },
  {
    icon: FaStar,
    title: "Ratings & insights",
    desc: "See what customers love, which dishes sell best and when your peak hours are.",
  },
  {
    icon: FaHeadset,
    title: "Dedicated partner support",
    desc: "A real onboarding manager for setup, plus priority chat support once you're live.",
  },
];

const steps = [
  {
    title: "Submit your details",
    desc: "Fill the short form below with your restaurant name, location, contact and cuisine.",
    time: "5 minutes",
  },
  {
    title: "Share your documents",
    desc: "Upload your FSSAI licence, PAN, bank details and menu. Our team will call to help if needed.",
    time: "10 minutes",
  },
  {
    title: "Verification & menu setup",
    desc: "We verify your documents, digitise your menu and set prep times, pricing and delivery radius.",
    time: "24–48 hours",
  },
  {
    title: "Go live & start earning",
    desc: "Your restaurant appears on Cravon. Manage orders from the partner dashboard and get paid weekly.",
    time: "Day 3 onwards",
  },
];

const documents = [
  { icon: FaIdCard, name: "FSSAI licence", note: "Registration or state/central licence" },
  { icon: FaIdCard, name: "PAN card", note: "Business or owner PAN" },
  { icon: FaReceipt, name: "GSTIN", note: "Only if your business is GST registered", optional: true },
  { icon: FaUniversity, name: "Bank account details", note: "Cancelled cheque or passbook copy" },
  { icon: FaClipboardList, name: "Menu with prices", note: "Photo or PDF of your current menu" },
  { icon: FaCamera, name: "Logo & dish photos", note: "We can arrange a shoot if you don't have them", optional: true },
];

const cuisines = [
  "North Indian",
  "South Indian",
  "Chinese",
  "Biryani",
  "Pizza & Italian",
  "Fast food",
  "Cafe & Bakery",
  "Desserts",
  "Healthy",
  "Other",
];

const outletTypes = ["Single outlet", "Multiple outlets", "Cloud kitchen"];

const faqs = [
  {
    q: "How much does it cost to join Cravon?",
    a: "There is no onboarding or listing fee. A small commission applies only on orders you receive through Cravon. Your onboarding manager shares the exact rate for your city before you sign.",
  },
  {
    q: "How long does it take to go live?",
    a: "Most restaurants go live within 48 hours of submitting complete documents. Menu digitisation and verification happen in parallel, so there is nothing extra for you to do.",
  },
  {
    q: "I don't have an FSSAI licence yet. Can I still apply?",
    a: "Yes. Submit the form and our team will guide you through applying for an FSSAI registration. You can go live as soon as the application number is issued.",
  },
  {
    q: "When and how do I get paid?",
    a: "Payouts are settled to your registered bank account every week, along with a detailed statement of orders, taxes and commission.",
  },
  {
    q: "Can I manage my menu and timings myself?",
    a: "Absolutely. From the partner dashboard you can edit items, prices, add-ons, stock and opening hours, or pause orders temporarily whenever you need.",
  },
  {
    q: "Do I need special hardware?",
    a: "No. The partner dashboard runs on any phone, tablet or computer with a browser. You can add a receipt printer later if you like.",
  },
];

const initialForm = {
  restaurant: "",
  owner: "",
  phone: "",
  email: "",
  city: "",
  cuisine: "",
  outlet: outletTypes[0],
  agree: false,
};

const validate = (values) => {
  const next = {};
  if (!values.restaurant.trim()) next.restaurant = "Enter your restaurant name";
  if (!values.owner.trim()) next.owner = "Enter the owner's name";
  if (!/^[6-9]\d{9}$/.test(values.phone.trim())) next.phone = "Enter a valid 10-digit mobile number";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = "Enter a valid email address";
  if (!values.city.trim()) next.city = "Enter your city";
  if (!values.cuisine) next.cuisine = "Choose your main cuisine";
  if (!values.agree) next.agree = "Please accept the partner terms";
  return next;
};

const useRevealOnce = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return [ref, visible];
};

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const PartnerContent = () => {
  const { isDark } = useLandingUi();
  const [benefitsRef, benefitsVisible] = useRevealOnce();
  const [stepsRef, stepsVisible] = useRevealOnce();
  const [ctaRef, ctaVisible] = useRevealOnce();
  const [openFaq, setOpenFaq] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const updateField = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setSubmitted(true);
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setSubmitted(false);
  };

  const inputClass = (name) => `pp-input ${errors[name] ? "has-error" : ""}`;

  return (
    <div className={`pp ${isDark ? "landing-home--dark" : ""}`}>
      {/* ── Hero ── */}
      <section className="pp-hero">
        <div className="pp-hero__grid">
          <div className="pp-hero__copy">
            <p className="landing-everything__eyebrow">
              <span className="landing-everything__rule" aria-hidden="true" />
              Cravon for restaurants
            </p>
            <h1 className="pp-hero__title">
              Grow your kitchen
              <span className="pp-hero__title-gold">
                with Cravon.
                <svg className="pp-swash" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M4 14 C 70 4, 150 4, 296 10" />
                </svg>
              </span>
            </h1>
            <p className="pp-hero__sub">
              List your restaurant, reach hungry customers nearby and manage every order from one
              simple dashboard. Registration takes less than 15 minutes.
            </p>
            <div className="pp-hero__actions">
              <button
                type="button"
                onClick={() => scrollToId("register")}
                className="landing-nav-cta landing-pill pp-btn"
              >
                Register your restaurant
                <FaArrowRight size={12} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => scrollToId("how")} className="landing-pill pp-btn pp-btn--ghost">
                How it works
              </button>
            </div>
            <dl className="pp-hero__stats">
              {heroStats.map((stat) => (
                <div key={stat.label} className="pp-stat">
                  <dt className="pp-stat__label">{stat.label}</dt>
                  <dd className="pp-stat__value">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="pp-hero__visual" aria-hidden="true">
            <div className="pp-dash">
              <div className="pp-dash__top">
                <span className="pp-dash__brand">
                  <FaStore size={12} /> Partner dashboard
                </span>
                <span className="pp-dash__live">
                  <span className="pp-dash__dot" /> Live
                </span>
              </div>

              <div className="pp-dash__metric">
                <span className="pp-dash__label">Today's revenue</span>
                <div className="pp-dash__value-row">
                  <span className="pp-dash__value">₹18,420</span>
                  <span className="pp-dash__change">▲ 12%</span>
                </div>
              </div>

              <div className="pp-dash__chart">
                {dashBars.map((h, i) => (
                  <span
                    key={i}
                    className={`pp-dash__bar ${i === dashBars.length - 1 ? "is-today" : ""}`}
                    style={{ "--h": `${h}%`, "--reveal-delay": `${i * 60}ms` }}
                  />
                ))}
              </div>
              <div className="pp-dash__days">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>

              <ul className="pp-dash__orders">
                {dashOrders.map((order) => (
                  <li key={order.id} className="pp-dash__order">
                    <span className="pp-dash__order-icon">
                      <FaUtensils size={11} />
                    </span>
                    <span className="pp-dash__order-text">
                      <strong>Order {order.id}</strong>
                      <span>{order.items}</span>
                    </span>
                    <span className="pp-dash__order-price">{order.price}</span>
                    <span className={`pp-dash__chip pp-dash__chip--${order.tone}`}>{order.status}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pp-float pp-float--rating">
              <span className="pp-float__icon">
                <FaStar size={12} />
              </span>
              <span>
                <strong>4.6 rating</strong>
                <span>from 1.2k reviews</span>
              </span>
            </div>

            <div className="pp-float pp-float--payout">
              <span className="pp-float__icon pp-float__icon--green">
                <FaCheck size={11} />
              </span>
              <span>
                <strong>Payout sent</strong>
                <span>₹84,250 · this week</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why partner ── */}
      <section
        ref={benefitsRef}
        className={`pp-section pp-benefits ${benefitsVisible ? "is-visible" : ""}`}
        aria-labelledby="pp-benefits-title"
      >
        <div className="pp-benefits__bg" aria-hidden="true">
          <img src={BENEFITS_BG_LIGHT} alt="" className={`pp-benefits__bg-img ${!isDark ? "is-active" : ""}`} />
          <img src={BENEFITS_BG_DARK} alt="" className={`pp-benefits__bg-img ${isDark ? "is-active" : ""}`} />
        </div>
        <div className="pp-container">
          <header className="pp-head">
            <p className="landing-everything__eyebrow">
              <span className="landing-everything__rule" aria-hidden="true" />
              Why partner with us
              <span className="landing-everything__rule" aria-hidden="true" />
            </p>
            <h2 id="pp-benefits-title" className="landing-everything__title">
              Built to help your <span className="landing-everything__title-gold">kitchen grow</span>
            </h2>
            <p className="landing-everything__sub">
              Everything you need to take orders online, delight customers and track your growth.
            </p>
          </header>

          <div className="pp-benefits__grid">
            {benefits.map(({ icon: Icon, title, desc }, i) => (
              <article
                key={title}
                className="landing-feature-card pp-reveal-item"
                style={{ "--reveal-delay": `${i * 70}ms` }}
              >
                <span className="landing-feature-card__icon" aria-hidden="true">
                  <Icon size={17} />
                </span>
                <h3 className="landing-feature-card__title">{title}</h3>
                <p className="landing-feature-card__desc">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how"
        ref={stepsRef}
        className={`pp-section pp-steps pp-anchor ${stepsVisible ? "is-visible" : ""}`}
        aria-labelledby="pp-steps-title"
      >
        <div className="pp-container">
          <header className="pp-head">
            <p className="landing-everything__eyebrow">
              <span className="landing-everything__rule" aria-hidden="true" />
              How it works
              <span className="landing-everything__rule" aria-hidden="true" />
            </p>
            <h2 id="pp-steps-title" className="landing-everything__title">
              Go live in <span className="landing-everything__title-gold">4 simple steps</span>
            </h2>
            <p className="landing-everything__sub">
              From sign-up to your first order in about two days. We handle the heavy lifting.
            </p>
          </header>

          <ol className="pp-steps__list">
            {steps.map((step, i) => (
              <li key={step.title} className="pp-step pp-reveal-item" style={{ "--reveal-delay": `${i * 110}ms` }}>
                <span className="pp-step__num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="pp-step__title">{step.title}</h3>
                <p className="pp-step__desc">{step.desc}</p>
                <span className="pp-step__time">{step.time}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Documents + registration ── */}
      <section id="register" className="pp-section pp-register pp-anchor" aria-labelledby="pp-register-title">
        <div className="pp-container">
          <header className="pp-head">
            <p className="landing-everything__eyebrow">
              <span className="landing-everything__rule" aria-hidden="true" />
              Register your restaurant
              <span className="landing-everything__rule" aria-hidden="true" />
            </p>
            <h2 id="pp-register-title" className="landing-everything__title">
              Start your <span className="landing-everything__title-gold">partner journey</span>
            </h2>
            <p className="landing-everything__sub">
              Share a few details and our partner team will call you within 24 hours to complete setup.
            </p>
          </header>

          <div className="pp-register__grid">
            <aside className="pp-docs">
              <h3 className="pp-docs__title">Keep these ready</h3>
              <p className="pp-docs__sub">Documents we'll ask for during verification.</p>
              <ul className="pp-docs__list">
                {documents.map(({ icon: Icon, name, note, optional }) => (
                  <li key={name} className="pp-docs__item">
                    <span className="pp-docs__icon" aria-hidden="true">
                      <Icon size={14} />
                    </span>
                    <span className="pp-docs__text">
                      <strong>
                        {name}
                        {optional && <em className="pp-docs__optional">Optional</em>}
                      </strong>
                      <span>{note}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="pp-docs__note">
                No FSSAI licence yet? Apply anyway. We'll guide you through the registration.
              </p>
            </aside>

            <div className="pp-form">
              {submitted ? (
                <div className="pp-success" role="status">
                  <span className="pp-success__icon" aria-hidden="true">
                    <FaCheck size={22} />
                  </span>
                  <h3 className="pp-form__title">Application received!</h3>
                  <p className="pp-success__text">
                    Thank you, {form.owner.split(" ")[0]}. Our partner team will call you at{" "}
                    <strong>+91 {form.phone}</strong> within 24 hours to verify documents and set up{" "}
                    <strong>{form.restaurant}</strong>.
                  </p>
                  <button type="button" onClick={resetForm} className="landing-pill pp-btn pp-btn--ghost">
                    Register another outlet
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <h3 className="pp-form__title">Restaurant details</h3>
                  <p className="pp-form__sub">All fields are required unless marked optional.</p>

                  <div className="pp-form__grid">
                    <div className="pp-field pp-field--full">
                      <label htmlFor="pp-restaurant">Restaurant name</label>
                      <input
                        id="pp-restaurant"
                        name="restaurant"
                        value={form.restaurant}
                        onChange={updateField}
                        placeholder="e.g. Spice Route Kitchen"
                        className={inputClass("restaurant")}
                      />
                      {errors.restaurant && <p className="pp-field__error">{errors.restaurant}</p>}
                    </div>

                    <div className="pp-field">
                      <label htmlFor="pp-owner">Owner name</label>
                      <input
                        id="pp-owner"
                        name="owner"
                        value={form.owner}
                        onChange={updateField}
                        placeholder="Full name"
                        autoComplete="name"
                        className={inputClass("owner")}
                      />
                      {errors.owner && <p className="pp-field__error">{errors.owner}</p>}
                    </div>

                    <div className="pp-field">
                      <label htmlFor="pp-phone">Mobile number</label>
                      <div className="pp-input-group">
                        <span className="pp-input-prefix">+91</span>
                        <input
                          id="pp-phone"
                          name="phone"
                          value={form.phone}
                          onChange={updateField}
                          placeholder="98765 43210"
                          inputMode="numeric"
                          maxLength={10}
                          autoComplete="tel-national"
                          className={inputClass("phone")}
                        />
                      </div>
                      {errors.phone && <p className="pp-field__error">{errors.phone}</p>}
                    </div>

                    <div className="pp-field">
                      <label htmlFor="pp-email">Email</label>
                      <input
                        id="pp-email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateField}
                        placeholder="you@restaurant.com"
                        autoComplete="email"
                        className={inputClass("email")}
                      />
                      {errors.email && <p className="pp-field__error">{errors.email}</p>}
                    </div>

                    <div className="pp-field">
                      <label htmlFor="pp-city">City</label>
                      <input
                        id="pp-city"
                        name="city"
                        value={form.city}
                        onChange={updateField}
                        placeholder="e.g. Bengaluru"
                        autoComplete="address-level2"
                        className={inputClass("city")}
                      />
                      {errors.city && <p className="pp-field__error">{errors.city}</p>}
                    </div>

                    <div className="pp-field">
                      <label htmlFor="pp-cuisine">Main cuisine</label>
                      <select
                        id="pp-cuisine"
                        name="cuisine"
                        value={form.cuisine}
                        onChange={updateField}
                        className={`${inputClass("cuisine")} pp-select`}
                      >
                        <option value="">Select cuisine</option>
                        {cuisines.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {errors.cuisine && <p className="pp-field__error">{errors.cuisine}</p>}
                    </div>

                    <div className="pp-field">
                      <label htmlFor="pp-outlet">Outlet type</label>
                      <select
                        id="pp-outlet"
                        name="outlet"
                        value={form.outlet}
                        onChange={updateField}
                        className="pp-input pp-select"
                      >
                        {outletTypes.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className={`pp-check ${errors.agree ? "has-error" : ""}`}>
                    <input type="checkbox" name="agree" checked={form.agree} onChange={updateField} />
                    <span>
                      I agree to Cravon's partner terms and consent to be contacted about my application.
                    </span>
                  </label>
                  {errors.agree && <p className="pp-field__error">{errors.agree}</p>}

                  <button type="submit" className="landing-nav-cta landing-pill pp-btn pp-form__submit">
                    Submit application
                    <FaArrowRight size={12} aria-hidden="true" />
                  </button>
                  <p className="pp-form__fine">Free to apply · No commitment until you sign</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="pp-section pp-faq" aria-labelledby="pp-faq-title">
        <div className="pp-container">
          <header className="pp-head">
            <p className="landing-everything__eyebrow">
              <span className="landing-everything__rule" aria-hidden="true" />
              Questions
              <span className="landing-everything__rule" aria-hidden="true" />
            </p>
            <h2 id="pp-faq-title" className="landing-everything__title">
              Partner <span className="landing-everything__title-gold">FAQs</span>
            </h2>
          </header>

          <div className="pp-faq__list">
            {faqs.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className={`pp-faq__item ${open ? "is-open" : ""}`}>
                  <button
                    type="button"
                    className="pp-faq__q"
                    aria-expanded={open}
                    aria-controls={`pp-faq-${i}`}
                    onClick={() => setOpenFaq(open ? -1 : i)}
                  >
                    {item.q}
                    <span className="pp-faq__icon" aria-hidden="true">
                      <FaPlus size={11} />
                    </span>
                  </button>
                  <div id={`pp-faq-${i}`} className="pp-faq__a" role="region">
                    <div>
                      <p>{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Closing CTA (same artwork as the homepage finale) ── */}
      <section
        ref={ctaRef}
        className={`landing-partner ${ctaVisible ? "is-visible" : ""}`}
        aria-labelledby="pp-cta-title"
      >
        <div className="landing-partner__bg" aria-hidden="true">
          <img src={CTA_BG_LIGHT} alt="" className={`landing-partner__bg-img ${!isDark ? "is-active" : ""}`} />
          <img src={CTA_BG_DARK} alt="" className={`landing-partner__bg-img ${isDark ? "is-active" : ""}`} />
        </div>

        <div className="landing-partner__inner">
          <div className="landing-partner__lead">
            <p className="landing-partner__eyebrow">
              <span className="landing-partner__eyebrow-rule" aria-hidden="true" />
              Ready when you are
              <span
                className="landing-partner__eyebrow-rule landing-partner__eyebrow-rule--end"
                aria-hidden="true"
              />
            </p>
            <h2 id="pp-cta-title" className="landing-partner__title">
              <span className="landing-partner__title-top">Ready to serve more?</span>
              <span className="landing-partner__title-gold">
                Start with Cravon.
                <svg className="landing-partner__swash" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M4 14 C 70 4, 150 4, 296 10" />
                </svg>
              </span>
            </h2>
          </div>

          <div className="landing-partner__side">
            <p className="landing-partner__sub">
              Join restaurants across India growing their delivery business with Cravon.
            </p>
            <div className="landing-partner__actions">
              <button
                type="button"
                onClick={() => scrollToId("register")}
                className="landing-nav-cta landing-pill landing-partner__btn"
              >
                Register now
                <FaArrowRight size={12} aria-hidden="true" />
              </button>
              <Link to="/contact" className="landing-pill landing-partner__btn landing-partner__btn--ghost">
                Talk to our team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const PartnerLandingPage = () => (
  <LandingLayout seamlessFooter>
    <PartnerContent />
  </LandingLayout>
);

export default PartnerLandingPage;
