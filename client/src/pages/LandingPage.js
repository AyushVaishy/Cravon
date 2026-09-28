import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBolt,
  FaBrain,
  FaMagic,
  FaMapMarkerAlt,
  FaSearch,
  FaShieldAlt,
  FaUserFriends,
} from "react-icons/fa";
import LandingLayout, { useLandingUi } from "../components/landing/LandingLayout";

const UNIQUE_BG_LIGHT = `${process.env.PUBLIC_URL}/landing/section3_bg.png`;
const UNIQUE_BG_DARK = `${process.env.PUBLIC_URL}/landing/section3_bg_dark.png`;
const EVERYTHING_BG_LIGHT = `${process.env.PUBLIC_URL}/landing/section4.png`;
const EVERYTHING_BG_DARK = `${process.env.PUBLIC_URL}/landing/section4_darkbg.png`;
const PARTNER_BG_LIGHT = `${process.env.PUBLIC_URL}/landing/section5.png`;
const PARTNER_BG_DARK = `${process.env.PUBLIC_URL}/landing/section5_darkbg.png`;
const groupMembers = [
  { initial: "A", name: "Aarav", fill: 46 },
  { initial: "M", name: "Meera", fill: 72 },
  { initial: "K", name: "Kabir", fill: 90 },
];

const FRESH_VIDEO_LIGHT = `${process.env.PUBLIC_URL}/landing/section2.mp4`;
const FRESH_VIDEO_DARK = `${process.env.PUBLIC_URL}/landing/section2_dark.mp4`;
const HERO_VIDEO_LIGHT = `${process.env.PUBLIC_URL}/landing/section1.mp4`;
const HERO_VIDEO_DARK = `${process.env.PUBLIC_URL}/landing/section1_dark.mp4`;

const freshCuisines = [
  { label: "Biryani", query: "biryani" },
  { label: "Burgers", query: "burger" },
  { label: "Pizza", query: "pizza" },
  { label: "North Indian", query: "north indian" },
];

const everythingFeatures = [
  {
    icon: FaMapMarkerAlt,
    title: "Location-Based Discovery",
    desc: "Find the best spots nearby with live, prep-time aware recommendations.",
  },
  {
    icon: FaBolt,
    title: "Lightning Delivery",
    desc: "From kitchen to doorstep with real-time ETA and route tracking.",
  },
  {
    icon: FaShieldAlt,
    title: "Trusted Checkout",
    desc: "Encrypted payment flow with safe, reliable order confirmation.",
  },
  {
    icon: FaSearch,
    title: "Precision Search",
    desc: "Advanced filters across cuisine, budget, spice level and dietary needs.",
  },
  {
    icon: FaUserFriends,
    title: "Group Ordering",
    desc: "Collaborative carts for team meals and shared party orders.",
    soon: true,
  },
  {
    icon: FaBrain,
    title: "AI Meal Match",
    desc: "Personalised suggestions tuned to your mood, the weather and your habits.",
    soon: true,
  },
];

const LandingHomeContent = () => {
  const { openAuth, isDark } = useLandingUi();
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");
  const everythingRef = useRef(null);
  const [everythingVisible, setEverythingVisible] = useState(false);
  const uniqueRef = useRef(null);
  const [uniqueVisible, setUniqueVisible] = useState(false);
  const partnerRef = useRef(null);
  const [partnerVisible, setPartnerVisible] = useState(false);
  const heroSectionRef = useRef(null);
  const heroLightVideoRef = useRef(null);
  const heroDarkVideoRef = useRef(null);
  const heroInViewRef = useRef(false);
  const isDarkRef = useRef(isDark);
  const freshSectionRef = useRef(null);
  const freshLightVideoRef = useRef(null);
  const freshDarkVideoRef = useRef(null);
  const freshInViewRef = useRef(false);
  const freshLockRef = useRef(false);
  const freshHalfDoneRef = useRef(false);
  const [freshScrollLocked, setFreshScrollLocked] = useState(false);
  const [freshBlockDown, setFreshBlockDown] = useState(false);

  isDarkRef.current = isDark;

  const goBrowseRestro = () => navigate("/home");

  const goExplore = (overrideQuery) => {
    const q = (typeof overrideQuery === "string" ? overrideQuery : heroQuery).trim();
    navigate(q ? `/home/search?q=${encodeURIComponent(q)}` : "/home");
  };

  const getActiveHeroVideo = () =>
    isDarkRef.current ? heroDarkVideoRef.current : heroLightVideoRef.current;

  const getInactiveHeroVideo = () =>
    isDarkRef.current ? heroLightVideoRef.current : heroDarkVideoRef.current;

  const getActiveFreshVideo = () =>
    isDarkRef.current ? freshDarkVideoRef.current : freshLightVideoRef.current;

  const getInactiveFreshVideo = () =>
    isDarkRef.current ? freshLightVideoRef.current : freshDarkVideoRef.current;

  const playVideoOnce = (video) => {
    if (!video) return;
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const pauseVideo = (video) => {
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  /** Decode & paint frame 0 while paused (avoids black void when posters are missing). */
  const paintFirstFrame = (video) => {
    if (!video) return;
    const reveal = () => {
      try {
        if (video.currentTime < 0.05) video.currentTime = 0.05;
      } catch (_) {
        /* ignore seek errors before ready */
      }
    };
    if (video.readyState >= 2) reveal();
    else video.addEventListener("loadeddata", reveal, { once: true });
  };

  const unlockFreshScroll = () => {
    freshLockRef.current = false;
    freshHalfDoneRef.current = false;
    setFreshScrollLocked(false);
    setFreshBlockDown(false);
  };

  const lockFreshScroll = () => {
    freshLockRef.current = true;
    freshHalfDoneRef.current = false;
    setFreshScrollLocked(true);
    setFreshBlockDown(true);
  };

  const startFreshPlayback = () => {
    const active = getActiveFreshVideo();
    const inactive = getInactiveFreshVideo();
    if (!active) return;
    pauseVideo(inactive);
    lockFreshScroll();
    playVideoOnce(active);
  };

  useEffect(() => {
    const targets = [
      [uniqueRef.current, setUniqueVisible],
      [everythingRef.current, setEverythingVisible],
      [partnerRef.current, setPartnerVisible],
    ].filter(([el]) => el);
    const observers = targets.map(([el, setVisible]) => {
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
      return observer;
    });
    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  // Theme swap: crossfade between preloaded videos (no remount)
  useEffect(() => {
    pauseVideo(getInactiveHeroVideo());
    pauseVideo(getInactiveFreshVideo());
    if (heroInViewRef.current) {
      playVideoOnce(getActiveHeroVideo());
    }
    if (freshLockRef.current || freshInViewRef.current) {
      startFreshPlayback();
    }
  }, [isDark]);

  useEffect(() => {
    const section = heroSectionRef.current;
    const lightVideo = heroLightVideoRef.current;
    const darkVideo = heroDarkVideoRef.current;
    if (!section || !lightVideo || !darkVideo) return undefined;

    paintFirstFrame(lightVideo);
    paintFirstFrame(darkVideo);

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowInView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
        if (nowInView && !heroInViewRef.current) {
          playVideoOnce(getActiveHeroVideo());
        } else if (!nowInView && heroInViewRef.current) {
          pauseVideo(lightVideo);
          pauseVideo(darkVideo);
          paintFirstFrame(lightVideo);
          paintFirstFrame(darkVideo);
        }
        heroInViewRef.current = nowInView;
      },
      { threshold: [0, 0.25, 0.5] }
    );

    observer.observe(section);
    playVideoOnce(getActiveHeroVideo());
    heroInViewRef.current = true;

    return () => {
      observer.disconnect();
      pauseVideo(lightVideo);
      pauseVideo(darkVideo);
      heroInViewRef.current = false;
    };
  }, []);

  useEffect(() => {
    const section = freshSectionRef.current;
    const lightVideo = freshLightVideoRef.current;
    const darkVideo = freshDarkVideoRef.current;
    if (!section || !lightVideo || !darkVideo) return undefined;

    let fillStableTimer = null;

    paintFirstFrame(lightVideo);
    paintFirstFrame(darkVideo);

    const clearFillTimer = () => {
      if (!fillStableTimer) return;
      window.clearTimeout(fillStableTimer);
      fillStableTimer = null;
    };

    const exitFreshSession = () => {
      clearFillTimer();
      freshInViewRef.current = false;
      pauseVideo(lightVideo);
      pauseVideo(darkVideo);
      paintFirstFrame(lightVideo);
      paintFirstFrame(darkVideo);
      unlockFreshScroll();
    };

    const onEnded = (event) => {
      // Only unlock for the theme video that was actually playing
      const active = getActiveFreshVideo();
      if (active && event.target !== active) return;
      unlockFreshScroll();
    };

    const onTimeUpdate = (event) => {
      const active = getActiveFreshVideo();
      if (!active || event.target !== active) return;
      const video = event.target;
      if (!video.duration || Number.isNaN(video.duration) || video.duration <= 0) return;
      const pct = (video.currentTime / video.duration) * 100;
      // After halfway, allow scrolling down too
      if (pct >= 50 && !freshHalfDoneRef.current) {
        freshHalfDoneRef.current = true;
        setFreshBlockDown(false);
      }
    };

    const bindVideo = (video) => {
      video.addEventListener("ended", onEnded);
      video.addEventListener("timeupdate", onTimeUpdate);
    };

    const unbindVideo = (video) => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };

    bindVideo(lightVideo);
    bindVideo(darkVideo);

    // Only lock + play once section 2 fully fills the viewport (no snap)
    const readsAsFullScreen = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (vh <= 0) return false;
      return rect.top <= 2 && rect.bottom >= vh - 2;
    };

    // Left via top→down or down→up — enough that a re-enter should replay from start
    const hasLeftSection = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return rect.top > vh * 0.28 || rect.bottom < vh * 0.72;
    };

    const tryStartWhenSettled = () => {
      if (freshLockRef.current || freshInViewRef.current) return;
      if (!readsAsFullScreen()) {
        clearFillTimer();
        return;
      }
      // Brief settle so mid-scroll doesn't lock early
      if (fillStableTimer) return;
      fillStableTimer = window.setTimeout(() => {
        fillStableTimer = null;
        if (freshLockRef.current || freshInViewRef.current) return;
        if (!readsAsFullScreen()) return;
        freshInViewRef.current = true;
        startFreshPlayback();
      }, 120);
    };

    const onScrollOrResize = () => {
      // Always clear the visit when leaving — even after video ended (unlocked).
      // That way top→down and down→up both replay from the start.
      if (hasLeftSection()) {
        exitFreshSession();
        return;
      }
      if (freshLockRef.current) return;
      tryStartWhenSettled();
    };

    const observer = new IntersectionObserver(
      () => {
        onScrollOrResize();
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1] }
    );

    observer.observe(section);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    tryStartWhenSettled();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      clearFillTimer();
      unbindVideo(lightVideo);
      unbindVideo(darkVideo);
      pauseVideo(lightVideo);
      pauseVideo(darkVideo);
      unlockFreshScroll();
      freshInViewRef.current = false;
    };
  }, []);

  // First half of video: allow up, block down. After 50%: free scroll.
  useEffect(() => {
    if (!freshBlockDown) return undefined;

    let touchStartY = 0;

    const blockDown = (event) => {
      event.preventDefault();
    };

    const onWheel = (event) => {
      if (event.deltaY > 0) blockDown(event);
    };

    const onTouchStart = (event) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event) => {
      const y = event.touches[0]?.clientY ?? 0;
      if (touchStartY - y > 2) blockDown(event);
    };

    const onKeyDown = (event) => {
      if (["ArrowDown", "PageDown", "End", " ", "Spacebar"].includes(event.key)) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [freshBlockDown]);

  return (
    <div className={`landing-home ${isDark ? "landing-home--dark" : "landing-home--light"}`}>
      <section ref={heroSectionRef} className="landing-panel landing-panel--hero">
        <div className="landing-mode-media">
          <video
            ref={heroLightVideoRef}
            className={`landing-panel__img landing-panel__video landing-mode-video landing-mode-video--light ${
              !isDark ? "is-active" : ""
            }`}
            src={`${HERO_VIDEO_LIGHT}#t=0.1`}
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            aria-hidden={isDark}
            aria-label={isDark ? undefined : "Cravon food delivery"}
          />
          <video
            ref={heroDarkVideoRef}
            className={`landing-panel__img landing-panel__video landing-mode-video landing-mode-video--dark ${
              isDark ? "is-active" : ""
            }`}
            src={`${HERO_VIDEO_DARK}#t=0.1`}
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            aria-hidden={!isDark}
            aria-label={!isDark ? undefined : "Cravon food delivery"}
          />
        </div>
        <div className="landing-panel__veil landing-panel__veil--hero" aria-hidden="true" />
        <div className="landing-panel__content landing-panel__content--hero">
          <h1 className="landing-hero-title">
            <span className="landing-hero-title__line">
              <span className="landing-hero-title__gold">Satisfy</span>
              {" "}
              <span className="landing-hero-title__white">Every</span>
            </span>
            <span className="landing-hero-title__line">
              <span className="landing-hero-title__gold">Craving</span>
            </span>
          </h1>
          <p className="landing-hero-desc">
            <span className="landing-hero-desc__rule" aria-hidden="true" />
            From local hidden gems to top-tier international cuisine — get all
            your favorite dishes, fresh and on time.
          </p>
          <form
            className="landing-hero-search"
            onSubmit={(e) => {
              e.preventDefault();
              goExplore();
            }}
          >
            <div className="landing-hero-search__shell">
              <FaSearch className="landing-hero-search__icon" aria-hidden="true" />
              <input
                type="search"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Search your nearest restaurants or dishes (Biryani, North Indian)..."
                aria-label="Search your nearest restaurants or dishes"
              />
              <button type="submit" className="landing-hero-search__cta">
                FIND FOOD
              </button>
            </div>
          </form>
        </div>
      </section>

      <section
        ref={freshSectionRef}
        className={`landing-panel landing-panel--fresh ${
          freshScrollLocked ? "landing-panel--fresh-locked" : ""
        }`}
      >
        <div className="landing-mode-media">
          <video
            ref={freshLightVideoRef}
            className={`landing-panel__img landing-panel__video landing-mode-video landing-mode-video--light ${
              !isDark ? "is-active" : ""
            }`}
            src={`${FRESH_VIDEO_LIGHT}#t=0.1`}
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            aria-hidden={isDark}
            aria-label={isDark ? undefined : "Fresh food near you"}
          />
          <video
            ref={freshDarkVideoRef}
            className={`landing-panel__img landing-panel__video landing-mode-video landing-mode-video--dark ${
              isDark ? "is-active" : ""
            }`}
            src={`${FRESH_VIDEO_DARK}#t=0.1`}
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            aria-hidden={!isDark}
            aria-label={!isDark ? undefined : "Fresh food near you"}
          />
        </div>
        <div className="landing-panel__content landing-panel__content--fresh">
          <div className="landing-fresh-inner">
            <h2 className="landing-fresh-title">
              FRESH, HOT &amp; <span className="landing-fresh-title__accent">FAST</span>
            </h2>
            <p className="landing-fresh-desc">
              Nearby kitchens. Real-time search. Food that arrives hot.
            </p>

            <div className="landing-fresh-cuisines" aria-label="Popular cuisines">
              {freshCuisines.map((item) => (
                <button
                  key={item.query}
                  type="button"
                  className="landing-fresh-cuisine"
                  onClick={() => goExplore(item.query)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="landing-fresh-actions">
              <button
                type="button"
                onClick={goBrowseRestro}
                className="landing-cta-red landing-pill"
              >
                Explore kitchens
              </button>
              <button
                type="button"
                onClick={() => goExplore()}
                className="landing-pill landing-fresh-secondary"
              >
                Search dishes
                <FaArrowRight size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={uniqueRef}
        className={`landing-unique ${uniqueVisible ? "is-visible" : ""}`}
        aria-labelledby="landing-unique-title"
      >
        <div className="landing-unique__bg" aria-hidden="true">
          <img
            src={UNIQUE_BG_LIGHT}
            alt=""
            className={`landing-unique__bg-img ${!isDark ? "is-active" : ""}`}
          />
          <img
            src={UNIQUE_BG_DARK}
            alt=""
            className={`landing-unique__bg-img ${isDark ? "is-active" : ""}`}
          />
        </div>

        <div className="landing-unique__inner">
          <div className="landing-unique__copy">
            <h2 id="landing-unique-title" className="landing-unique__title">
              <span className="landing-unique__title-top">
                Not just <em>another</em>
              </span>
              <span className="landing-unique__title-gold">
                food website.
                <svg
                  className="landing-unique__swash"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M4 14 C 70 4, 150 4, 296 10" />
                </svg>
              </span>
            </h2>
            <p className="landing-unique__desc">
              <span className="landing-unique__desc-rule" aria-hidden="true" />
              The intelligent layer for food
            </p>
            <button
              type="button"
              onClick={goBrowseRestro}
              className="landing-nav-cta landing-pill landing-everything__btn landing-unique__cta"
            >
              Try Cravon
              <FaArrowRight size={13} aria-hidden="true" />
            </button>
          </div>

          <div className="landing-unique__cards">
            <article className="landing-unique-card landing-unique-card--ai">
              <div className="landing-unique-card__head">
                <span className="landing-unique-card__icon">
                  <FaBrain size={17} aria-hidden="true" />
                </span>
                <span className="landing-unique-card__tag">Cravon AI</span>
              </div>
              <h3 className="landing-unique-card__title">Let AI Pick Your Meal</h3>
              <p className="landing-unique-card__desc">
                Tell us your mood, budget and cravings. Cravon AI returns high-confidence
                meal matches in seconds.
              </p>
              <div className="landing-unique-chat">
                <p className="landing-unique-chat__user">
                  &ldquo;Something spicy, high-protein and under ₹300.&rdquo;
                </p>
                <div className="landing-unique-chat__ai">
                  <span className="landing-unique-chat__spark" aria-hidden="true">
                    <FaMagic size={11} />
                  </span>
                  <p>
                    Try the <strong>Peri Peri Bowl</strong> from Spice Yard
                  </p>
                  <span className="landing-unique-chat__match">94% match</span>
                </div>
              </div>
            </article>

            <article className="landing-unique-card landing-unique-card--group">
              <div className="landing-unique-card__head">
                <span className="landing-unique-card__icon">
                  <FaUserFriends size={17} aria-hidden="true" />
                </span>
                <div className="landing-unique-card__avatars" aria-hidden="true">
                  {groupMembers.map((m) => (
                    <span key={m.name}>{m.initial}</span>
                  ))}
                  <span className="is-more">+2</span>
                </div>
              </div>
              <h3 className="landing-unique-card__title">Order Together, Effortlessly</h3>
              <p className="landing-unique-card__desc">
                Shared carts for parties and office lunches — live updates, zero manual
                reconciliation.
              </p>
              <div className="landing-unique-group">
                {groupMembers.map((m) => (
                  <div key={m.name} className="landing-unique-group__row">
                    <span className="landing-unique-group__name">{m.name}</span>
                    <span className="landing-unique-group__track">
                      <span
                        className="landing-unique-group__fill"
                        style={{ "--fill": `${m.fill}%` }}
                      />
                    </span>
                  </div>
                ))}
              </div>
              <p className="landing-unique-group__split">
                Bill split automatically: <strong>₹412 each</strong>
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        ref={everythingRef}
        className={`landing-everything ${everythingVisible ? "is-visible" : ""}`}
        aria-labelledby="landing-everything-title"
      >
        <div className="landing-everything__bg" aria-hidden="true">
          <img
            src={EVERYTHING_BG_LIGHT}
            alt=""
            className={`landing-everything__bg-img ${!isDark ? "is-active" : ""}`}
          />
          <img
            src={EVERYTHING_BG_DARK}
            alt=""
            className={`landing-everything__bg-img ${isDark ? "is-active" : ""}`}
          />
        </div>
        <div className="landing-everything__inner">
          <header className="landing-everything__head">
            <p className="landing-everything__eyebrow">
              <span className="landing-everything__rule" aria-hidden="true" />
              Why Cravon
              <span className="landing-everything__rule" aria-hidden="true" />
            </p>
            <h2 id="landing-everything-title" className="landing-everything__title">
              Everything you need{" "}
              <span className="landing-everything__title-gold">in one place</span>
            </h2>
            <p className="landing-everything__sub">
              Built for speed, precision and a smoother food journey — from the first
              craving to the last bite.
            </p>
          </header>

          <div className="landing-everything__grid">
            {everythingFeatures.map(({ icon: Icon, title, desc, soon }, i) => (
              <article
                key={title}
                className="landing-feature-card"
                style={{ "--reveal-delay": `${i * 70}ms` }}
              >
                <span className="landing-feature-card__icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <h3 className="landing-feature-card__title">
                  {title}
                  {soon ? <span className="landing-feature-card__soon">Soon</span> : null}
                </h3>
                <p className="landing-feature-card__desc">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={partnerRef}
        className={`landing-partner ${partnerVisible ? "is-visible" : ""}`}
        aria-labelledby="landing-partner-title"
      >
        <div className="landing-partner__bg" aria-hidden="true">
          <img
            src={PARTNER_BG_LIGHT}
            alt=""
            className={`landing-partner__bg-img ${!isDark ? "is-active" : ""}`}
          />
          <img
            src={PARTNER_BG_DARK}
            alt=""
            className={`landing-partner__bg-img ${isDark ? "is-active" : ""}`}
          />
        </div>

        <div className="landing-partner__inner">
          <div className="landing-partner__lead">
            <p className="landing-partner__eyebrow">
              <span className="landing-partner__eyebrow-rule" aria-hidden="true" />
              For restaurant partners
              <span
                className="landing-partner__eyebrow-rule landing-partner__eyebrow-rule--end"
                aria-hidden="true"
              />
            </p>
            <h2 id="landing-partner-title" className="landing-partner__title">
              <span className="landing-partner__title-top">Own a kitchen?</span>
              <span className="landing-partner__title-gold">
                Partner with Cravon.
                <svg
                  className="landing-partner__swash"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M4 14 C 70 4, 150 4, 296 10" />
                </svg>
              </span>
            </h2>
          </div>

          <div className="landing-partner__side">
            <p className="landing-partner__sub">
              List your menu, reach hungry customers nearby and grow with live order tools.
            </p>
            <div className="landing-partner__actions">
              <Link to="/partner" className="landing-nav-cta landing-pill landing-partner__btn">
                Partner With Us
                <FaArrowRight size={12} aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={openAuth}
                className="landing-pill landing-partner__btn landing-partner__btn--ghost"
              >
                Join Now
              </button>
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
