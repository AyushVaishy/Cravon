import React from "react";
import { FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import LandingLayout from "../components/landing/LandingLayout";

const ContactLandingPage = () => {
  return (
    <LandingLayout>
      <div className="landing-page-hero pt-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="mb-3 font-display text-sm font-semibold tracking-[0.22em] text-[#E31837] uppercase">
            — Contact —
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-6 md:px-8">
        <div className="grid grid-cols-1 gap-20 lg:grid-cols-2">
          <div className="space-y-12">
            <div className="space-y-5">
              <h1 className="font-display text-6xl font-extrabold tracking-tight text-[#1F1F1F] dark:text-white">
                Get in touch
              </h1>
              <p className="text-lg text-[#6B6B6B] dark:text-white/65">
                Have questions? Reach out to our support team anytime. We are here to help.
              </p>
            </div>

            <div className="space-y-8">
              {[
                {
                  icon: <FaEnvelope size={22} />,
                  label: "Email Us",
                  value: "support@cravon.com",
                },
                {
                  icon: <FaPhone size={22} />,
                  label: "Call Us",
                  value: "+1 (888) QUICK-BITE",
                },
                {
                  icon: <FaMapMarkerAlt size={22} />,
                  label: "Visit Us",
                  value: "123 Tech Avenue, Silicon Valley, CA",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-app-secondary">{item.label}</p>
                    <p className="text-xl font-bold text-app-primary">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-app-border bg-app-surface p-10 shadow-soft">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-app-primary">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full rounded-2xl border border-app-border bg-app px-4 py-4 text-app-primary outline-none transition-all placeholder:text-app-secondary/60 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-app-primary">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full rounded-2xl border border-app-border bg-app px-4 py-4 text-app-primary outline-none transition-all placeholder:text-app-secondary/60 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-app-primary">Subject</label>
                <select className="w-full cursor-pointer appearance-none rounded-2xl border border-app-border bg-app px-4 py-4 text-app-primary outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20">
                  <option>General Inquiry</option>
                  <option>Order Support</option>
                  <option>Restaurant Partnership</option>
                  <option>Feedback</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-app-primary">Message</label>
                <textarea
                  rows={5}
                  placeholder="How can we help you?"
                  className="w-full resize-none rounded-2xl border border-app-border bg-app px-4 py-4 text-app-primary outline-none transition-all placeholder:text-app-secondary/60 focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <button className="w-full rounded-2xl bg-brand py-4 font-bold text-white shadow-xl shadow-brand/20 transition-colors hover:bg-brand-dark">
                Send Message
              </button>
            </form>
          </div>
        </div>

        <div className="mt-28 space-y-10 text-center">
          <h2 className="text-4xl font-bold text-app-primary">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                question: "How does group ordering work?",
                answer:
                  "Start a room, share the code, and everyone can add items to a shared cart in real-time.",
              },
              {
                question: "Is there a delivery fee?",
                answer:
                  "Delivery fee depends on distance and restaurant, with frequent promotions and free-delivery campaigns.",
              },
              {
                question: "Can I cancel my order?",
                answer:
                  "Orders can be cancelled before food preparation starts. If eligible, refund is processed instantly.",
              },
              {
                question: "What is Cravon AI?",
                answer:
                  "It is our recommendation engine that suggests meals based on your context and preferences.",
              },
              {
                question: "How do I track my order?",
                answer:
                  "Use the Orders screen for live progress from restaurant acceptance to doorstep delivery.",
              },
              {
                question: "Do you offer catering?",
                answer:
                  "Yes. For large team and corporate requests, reach out through the partner channel.",
              },
            ].map((item) => (
              <div key={item.question} className="space-y-3 rounded-[2rem] border border-app-border/60 bg-app-surface p-8">
                <h4 className="text-lg font-bold text-app-primary">{item.question}</h4>
                <p className="text-sm leading-relaxed text-app-secondary">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LandingLayout>
  );
};

export default ContactLandingPage;