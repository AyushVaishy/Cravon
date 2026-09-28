import React from "react";
import { FaBrain, FaChevronRight, FaMapMarkerAlt, FaSearch, FaUserFriends } from "react-icons/fa";
import LandingLayout from "../components/landing/LandingLayout";

const features = [
  {
    title: "Smart Search & Filtering",
    description:
      "Find exactly what you want with advanced filters across budget, dietary preference, prep time, and taste profile.",
    image:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=600&fit=crop",
    icon: <FaSearch className="text-brand" size={20} />,
  },
  {
    title: "Location Intelligence",
    description:
      "Cravon prioritizes places with high ratings and faster current prep windows around your exact location.",
    image:
      "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&h=600&fit=crop",
    icon: <FaMapMarkerAlt className="text-brand" size={20} />,
  },
  {
    title: "Real-Time Group Ordering",
    description:
      "Collaborative carts where everyone can add items in sync for office meals, family dinners, and events.",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=600&fit=crop",
    icon: <FaUserFriends className="text-brand" size={20} />,
    status: "Coming Soon",
  },
  {
    title: "AI Personal Assistant",
    description:
      "An intent-aware recommender that helps you decide quickly based on context, weather, and ordering habits.",
    image:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop",
    icon: <FaBrain className="text-brand" size={20} />,
    status: "Coming Soon",
  },
];

const FeaturesLandingPage = () => {
  return (
    <LandingLayout>
      <div className="landing-page-hero pb-8 pt-28">
        <div className="mx-auto max-w-7xl space-y-5 px-5 text-center md:px-8">
          <p className="font-display text-sm font-semibold tracking-[0.22em] text-[#E31837] uppercase">
            — Product —
          </p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-[#1F1F1F] dark:text-white md:text-6xl">
            Powerful features for
            <br />
            <span className="text-[#FF7A1A]">Smarter Ordering</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[#6B6B6B] dark:text-white/65">
            Explore the product capabilities making Cravon one of the fastest-growing food platforms.
          </p>
        </div>
        <div className="landing-torn mt-10" aria-hidden="true" />
      </div>
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 md:px-8">
        <div className="space-y-28">
          {features.map((item, index) => (
            <div key={item.title} className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <div className={`space-y-6 ${index % 2 ? "lg:order-2" : ""}`}>
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
                  {item.icon}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-bold text-app-primary md:text-4xl">{item.title}</h2>
                  {item.status && (
                    <span className="rounded-full bg-app-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-app-bg">
                      {item.status}
                    </span>
                  )}
                </div>
                <p className="text-lg leading-relaxed text-app-secondary">{item.description}</p>
                <button className="group inline-flex items-center gap-2 font-bold text-brand">
                  Learn more
                  <FaChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className={`overflow-hidden rounded-[2rem] border border-app-border/60 shadow-2xl ${index % 2 ? "lg:order-1" : ""}`}>
                <img src={item.image} alt={item.title} className="h-full w-full object-cover opacity-90 transition-transform duration-700 hover:scale-105" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LandingLayout>
  );
};

export default FeaturesLandingPage;