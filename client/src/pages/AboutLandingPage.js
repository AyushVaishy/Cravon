import React from "react";
import LandingLayout from "../components/landing/LandingLayout";

const AboutLandingPage = () => {
  return (
    <LandingLayout>
      <div className="landing-page-hero pt-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="mb-3 font-display text-sm font-semibold tracking-[0.22em] text-[#E31837] uppercase">
            — About —
          </p>
        </div>
      </div>
      <div className="pb-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-28 grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
            <div className="space-y-8">
              <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight text-[#1F1F1F] dark:text-white md:text-7xl">
                Our mission is to <span className="text-[#FF7A1A]">simplify</span> how the world eats.
              </h1>
              <p className="text-lg leading-relaxed text-app-secondary">
                We started Cravon to reduce decision fatigue in food ordering. Instead of endless scrolling,
                we use intelligence and product design to make choosing what to eat feel effortless.
              </p>

              <div className="flex flex-wrap gap-10">
                <div>
                  <p className="text-4xl font-bold text-brand">2024</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-app-secondary">Founded</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-brand">500+</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-app-secondary">Team Members</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-brand">12</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-app-secondary">Countries</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=1000&fit=crop"
                alt="Cravon team"
                className="rounded-3xl shadow-2xl opacity-90"
              />
              <div className="absolute -bottom-10 -left-8 hidden rounded-[2.2rem] bg-brand p-10 shadow-2xl md:block">
                <p className="text-3xl font-bold text-white">"Food is the soul of every gathering."</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 border-y border-app-border/50 py-24 md:grid-cols-3">
            {[
              {
                title: "The Problem",
                text: "Too many options and no confidence in choices leads to wasted time and poor food decisions.",
              },
              {
                title: "The Solution",
                text: "Personalized, data-driven recommendations that understand what each user truly craves.",
              },
              {
                title: "The Future",
                text: "Collaborative food commerce where ordering for groups is as easy as ordering for one.",
              },
            ].map((item) => (
              <div key={item.title} className="space-y-4">
                <h3 className="text-2xl font-bold text-app-primary">{item.title}</h3>
                <p className="leading-relaxed text-app-secondary">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LandingLayout>
  );
};

export default AboutLandingPage;