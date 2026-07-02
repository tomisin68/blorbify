import React, { useEffect, useRef, useState, useCallback } from "react";
import AuthScreen from "./AuthScreen.jsx";

/* ============================================================
   BLORBIFY — Landing Page
   Design tokens
   Ink     #192328  (base dark)
   Ink+    #0F1518  (deep panels)
   Signal  #AFFF00  (acid lime accent)
   Paper   #F6F8F1  (light section bg)
   Slate   #93A2A6 / #5C6B6E (muted text)
   Type    Raleway (display + body), JetBrains Mono (data/eyebrows)
   Icons   hand-built, linear/duotone style modeled on Iconsax
           (the iconsax package isn't installable in this sandbox,
           so the icon set below matches its stroke language by hand)
   ============================================================ */

/* ---------------- Icon set (Iconsax-style, linear) ---------------- */
const IconBase = ({ children, size = 24, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    {children}
  </svg>
);

const IconGlobe = (p) => (
  <IconBase {...p}>
    <path d="M12 21.5c5.247 0 9.5-4.253 9.5-9.5S17.247 2.5 12 2.5 2.5 6.753 2.5 12s4.253 9.5 9.5 9.5Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 3.5c-2 2.9-3 6-3 8.5s1 5.6 3 8.5M16 3.5c2 2.9 3 6 3 8.5s-1 5.6-3 8.5M2.7 9h18.6M2.7 15h18.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </IconBase>
);

const IconTruck = (p) => (
  <IconBase {...p}>
    <path d="M2.5 6.5h11a1 1 0 0 1 1 1V16h-12a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M14.5 9.5H18l3 3.2V16h-6.5V9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="7" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17.2" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.5" />
  </IconBase>
);

const IconChart = (p) => (
  <IconBase {...p}>
    <path d="M4 20.5h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6.5 20.5v-6M11.5 20.5V8M16.5 20.5v-9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6.5 11 11 6.5l2.5 2.5L20 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 2.5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

const IconCheck = (p) => (
  <IconBase {...p}>
    <path d="M5 12.5 9.5 17 19 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

const IconArrow = (p) => (
  <IconBase {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

const IconChat = (p) => (
  <IconBase {...p}>
    <path d="M12 3C6.75 3 2.5 6.6 2.5 11c0 2.6 1.5 4.9 3.8 6.4-.1 1-.5 2.2-1.3 3.1 1.5.1 3-.4 4.3-1.3.9.2 1.7.3 2.7.3 5.25 0 9.5-3.6 9.5-8S17.25 3 12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="8" cy="11" r="1" fill="currentColor" />
    <circle cx="12" cy="11" r="1" fill="currentColor" />
    <circle cx="16" cy="11" r="1" fill="currentColor" />
  </IconBase>
);

const IconMenu = (p) => (
  <IconBase {...p}>
    <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </IconBase>
);

const IconClose = (p) => (
  <IconBase {...p}>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </IconBase>
);

const IconStar = (p) => (
  <IconBase {...p}>
    <path d="M12 2.8 14.6 9l6.6.4-5.1 4.2 1.7 6.4L12 16.6 6.2 20l1.7-6.4-5.1-4.2L9.4 9 12 2.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </IconBase>
);

const IconPlus = (p) => (
  <IconBase {...p}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </IconBase>
);

const IconShield = (p) => (
  <IconBase {...p}>
    <path d="M12 2.8 19.5 6v6.1c0 4.6-3.2 7.9-7.5 9.1-4.3-1.2-7.5-4.5-7.5-9.1V6L12 2.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

const IconTag = (p) => (
  <IconBase {...p}>
    <path d="M11.4 3.5H6a2.5 2.5 0 0 0-2.5 2.5v5.4c0 .5.2 1 .6 1.4l9 9c.8.8 2 .8 2.8 0l5.4-5.4c.8-.8.8-2 0-2.8l-9-9c-.4-.4-.9-.6-1.4-.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="8.3" cy="8.3" r="1.3" stroke="currentColor" strokeWidth="1.3" />
  </IconBase>
);

const IconWhatsapp = (p) => (
  <IconBase {...p}>
    <path d="M6.5 17.5 3.8 20.2 4.9 16A8.5 8.5 0 1 1 8 18.8l-1.5-1.3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M9 10.3c0 3 2.7 5.6 5.6 5.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </IconBase>
);

const IconInsta = (p) => (
  <IconBase {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
  </IconBase>
);

const IconX = (p) => (
  <IconBase {...p}>
    <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </IconBase>
);

/* ---------------- Scroll reveal hook ---------------- */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

const Reveal = ({ children, delay = 0, className = "" }) => {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal--in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ---------------- Section eyebrow ---------------- */
const Eyebrow = ({ children }) => <span className="eyebrow">{children}</span>;

/* ============================================================ */

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup");

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 150);
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollTo = useCallback((id) => (e) => {
    e.preventDefault();
    setNavOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openAuth = useCallback((mode = "signup") => {
    setAuthMode(mode);
    setShowAuth(true);
    setNavOpen(false);
  }, []);

  const closeAuth = useCallback(() => {
    setShowAuth(false);
  }, []);

  const painPoints = [
    { icon: IconTag, text: "A developer quoted you \u20A6300,000+ for a website you don\u2019t fully understand" },
    { icon: IconChat, text: "Your \u201Cstore\u201D is a scattered WhatsApp status and DMs you keep losing track of" },
    { icon: IconShield, text: "Customers ask \u201Cis this business real?\u201D before they trust you enough to pay" },
    { icon: IconChart, text: "You have no idea how to run ads that actually bring buyers, not just likes" },
  ];

  const features = [
    {
      icon: IconGlobe,
      tag: "WEBSITE + STORE",
      title: "A pro website + store in minutes",
      body: "Choose a template, add your products or services, and go live the same day. No code. No designer. No stress. Your link is ready to share on WhatsApp, Instagram, and business cards immediately.",
      img: "https://loremflickr.com/900/700/website,shop,laptop?lock=21",
    },
    {
      icon: IconTruck,
      tag: "LOGISTICS",
      title: "Delivery that just works",
      body: "Connected logistics means every order gets picked up and delivered without you chasing riders or explaining addresses twice. Your customers get tracking. You get peace of mind.",
      img: "https://loremflickr.com/900/700/motorcycle,delivery?lock=44",
    },
    {
      icon: IconChart,
      tag: "GROWTH",
      title: "Ads that bring buyers, not just views",
      body: "We run targeted ads engineered to reach people ready to buy — not vanity likes. You watch real customers land on your store while you focus on running your business.",
      img: "https://loremflickr.com/900/700/marketing,phone,shopping?lock=63",
    },
  ];

  const steps = [
    { n: "01", title: "Pick your plan", body: "Takes 60 seconds, no commitment beyond month-to-month." },
    { n: "02", title: "Set up your store", body: "Use our guided, fill-in-the-blank builder \u2014 no tech skill needed." },
    { n: "03", title: "Go live & take orders", body: "We handle delivery and bring you customers from day one." },
  ];

  const compareRows = [
    { label: "Delivery / logistics", others: "Not included \u2014 you sort it yourself", us: "Built in, connected automatically" },
    { label: "Pricing", others: "Dollar-based, unpredictable in Naira", us: "Naira pricing, made for Nigerian budgets" },
    { label: "Getting customers", others: "You\u2019re on your own", us: "Targeted ads run for you" },
    { label: "Setup time", others: "Days, often needs a developer", us: "Minutes, guided and self-serve" },
  ];

  const testimonials = [
    {
      quote: "I went from a scattered WhatsApp catalogue to a real online store in one afternoon. My first week, I made more sales than my whole previous month.",
      name: "Business Owner",
      meta: "Fashion \u00B7 Osogbo",
      img: "https://loremflickr.com/200/200/portrait,woman,africa?lock=8",
    },
    {
      quote: "Delivery used to be my biggest headache. Now it just happens.",
      name: "Business Owner",
      meta: "Fragrance \u00B7 Lagos",
      img: "https://loremflickr.com/200/200/portrait,man,africa?lock=15",
    },
  ];

  const plans = [
    {
      name: "Starter",
      tagline: "Your store online, taking orders",
      features: ["Pro website + storefront", "Unlimited products", "Shareable store link", "No ads included"],
      highlight: false,
    },
    {
      name: "Growth",
      tagline: "Add delivery and start running ads",
      features: ["Everything in Starter", "Connected delivery", "Ads that bring buyers", "Order tracking for customers"],
      highlight: true,
    },
    {
      name: "Pro",
      tagline: "Full campaigns, priority everything",
      features: ["Everything in Growth", "Full ad campaigns", "Priority delivery", "Dedicated support"],
      highlight: false,
    },
  ];

  const faqs = [
    { q: "Do I need any tech or design skill?", a: "None at all. If you can fill a form, you can build your store." },
    { q: "What if I already sell on WhatsApp or Instagram?", a: "Perfect \u2014 Blorbify becomes your real storefront, and you keep sharing the link on the platforms you already use." },
    { q: "How fast can I actually go live?", a: "Most businesses are live the same day they sign up." },
    { q: "Can I cancel if it\u2019s not for me?", a: "Yes \u2014 every plan is month-to-month. No lock-in." },
  ];

  if (showAuth) {
    return (
      <AuthScreen
        initialMode={authMode}
        onClose={closeAuth}
        onSuccess={() => {
          setShowAuth(false);
          setNavOpen(false);
        }}
      />
    );
  }

  return (
    <div className="bl-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,500&family=JetBrains+Mono:wght@400;500;700&display=swap');

        :root{
          --ink:#192328;
          --ink-deep:#0F1518;
          --ink-soft:#233038;
          --signal:#AFFF00;
          --signal-dim:#8FDD00;
          --paper:#F6F8F1;
          --paper-dim:#EAEFE0;
          --slate:#93A2A6;
          --slate-dark:#5C6B6E;
          --line:rgba(255,255,255,0.09);
          --line-dark:rgba(25,35,40,0.1);
          --radius:18px;
        }

        .bl-root{
          font-family:'Raleway',sans-serif;
          background:var(--paper);
          color:var(--ink);
          overflow-x:hidden;
          -webkit-font-smoothing:antialiased;
        }
        .bl-root *{ box-sizing:border-box; }
        .mono{ font-family:'JetBrains Mono',monospace; }

        .eyebrow{
          font-family:'JetBrains Mono',monospace;
          font-size:12px;
          letter-spacing:0.18em;
          text-transform:uppercase;
          font-weight:600;
          display:inline-flex;
          align-items:center;
          gap:8px;
          color:var(--slate-dark);
        }
        .eyebrow::before{
          content:"";
          width:7px;height:7px;border-radius:2px;
          background:var(--signal);
          box-shadow:0 0 0 3px rgba(175,255,0,0.18);
        }
        .eyebrow.on-dark{ color:var(--signal); }

        .wrap{ max-width:1180px; margin:0 auto; padding:0 24px; }
        section{ position:relative; }

        h1,h2,h3,h4{ margin:0; font-family:'Raleway',sans-serif; letter-spacing:-0.02em; }
        p{ margin:0; }

        .reveal{ opacity:0; transform:translateY(28px); transition:opacity .7s cubic-bezier(.16,.8,.24,1), transform .7s cubic-bezier(.16,.8,.24,1); }
        .reveal--in{ opacity:1; transform:translateY(0); }
        @media (prefers-reduced-motion: reduce){
          .reveal{ opacity:1; transform:none; transition:none; }
          *{ animation-duration:0.001ms !important; animation-iteration-count:1 !important; }
        }

        /* ---------- NAV ---------- */
        .nav{
          position:fixed; top:0; left:0; right:0; z-index:100;
          padding:18px 0;
          transition:all .35s ease;
        }
        .nav.scrolled{
          padding:12px 0;
          background:rgba(25,35,40,0.86);
          backdrop-filter:blur(14px);
          border-bottom:1px solid var(--line);
        }
        .nav-inner{ display:flex; align-items:center; justify-content:space-between; }
        .logo{ display:flex; align-items:center; gap:9px; font-weight:800; font-size:21px; color:var(--paper); letter-spacing:-0.02em; }
        .logo-dot{ width:10px; height:10px; border-radius:3px; background:var(--signal); box-shadow:0 0 14px rgba(175,255,0,0.7); }
        .logo-sub{ font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--slate); letter-spacing:0.1em; margin-left:2px; }
        .nav-links{ display:flex; gap:32px; align-items:center; }
        .nav-links a{ color:var(--paper); opacity:0.8; text-decoration:none; font-size:14.5px; font-weight:500; transition:opacity .2s; }
        .nav-links a:hover{ opacity:1; }
        .nav-cta{
          background:var(--signal); color:var(--ink); border:none; padding:11px 20px; border-radius:100px;
          font-weight:700; font-size:13.5px; cursor:pointer; letter-spacing:-0.01em;
          transition:transform .2s ease, box-shadow .2s ease;
          font-family:'Raleway',sans-serif;
        }
        .nav-cta:hover{ transform:translateY(-2px); box-shadow:0 10px 24px rgba(175,255,0,0.28); }
        .nav-burger{ display:none; background:none; border:none; color:var(--paper); cursor:pointer; }
        .nav-mobile{
          display:none; position:fixed; inset:0 0 auto 0; top:64px; z-index:99;
          background:var(--ink); flex-direction:column; padding:10px 24px 26px; gap:4px;
          border-bottom:1px solid var(--line);
        }
        .nav-mobile.open{ display:flex; }
        .nav-mobile a{ color:var(--paper); text-decoration:none; padding:14px 4px; border-bottom:1px solid var(--line); font-size:16px; }

        /* ---------- HERO ---------- */
        .hero{
          background:radial-gradient(120% 100% at 15% 0%, #223038 0%, var(--ink) 55%, var(--ink-deep) 100%);
          padding:150px 0 110px;
          position:relative;
          overflow:hidden;
        }
        .hero-glow{
          position:absolute; width:640px; height:640px; border-radius:50%;
          background:radial-gradient(circle, rgba(175,255,0,0.16) 0%, rgba(175,255,0,0) 70%);
          top:-220px; right:-160px; pointer-events:none;
          animation:float-slow 14s ease-in-out infinite;
        }
        @keyframes float-slow{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(30px) } }
        .hero-grid{ display:grid; grid-template-columns:1.05fr 1fr; gap:56px; align-items:center; }
        .hero-eyebrow-row{ margin-bottom:22px; }
        .hero h1{
          color:var(--paper); font-size:56px; line-height:1.04; font-weight:800; letter-spacing:-0.03em;
        }
        .hero h1 em{ font-style:normal; color:var(--signal); }
        .hero-sub{ color:var(--slate); font-size:18px; line-height:1.6; margin-top:22px; max-width:480px; font-weight:400; }
        .hero-cta-row{ display:flex; align-items:center; gap:18px; margin-top:34px; flex-wrap:wrap; }
        .btn-primary{
          background:var(--signal); color:var(--ink); border:none; padding:17px 26px; border-radius:100px;
          font-weight:700; font-size:15.5px; cursor:pointer; display:inline-flex; align-items:center; gap:10px;
          transition:transform .25s cubic-bezier(.2,.8,.3,1), box-shadow .25s ease;
          font-family:'Raleway',sans-serif;
        }
        .btn-primary:hover{ transform:translateY(-3px) scale(1.015); box-shadow:0 16px 32px rgba(175,255,0,0.3); }
        .btn-primary svg{ transition:transform .25s ease; }
        .btn-primary:hover svg{ transform:translateX(4px); }
        .hero-micro{ color:var(--slate); font-size:13px; font-family:'JetBrains Mono',monospace; }
        .hero-stats{ display:flex; gap:28px; margin-top:52px; flex-wrap:wrap; }
        .hero-stat{ font-family:'JetBrains Mono',monospace; }
        .hero-stat b{ display:block; color:var(--signal); font-size:15px; font-weight:700; }
        .hero-stat span{ color:var(--slate); font-size:11.5px; letter-spacing:0.06em; text-transform:uppercase; }

        /* hero visual: chaos -> order */
        .hero-visual{ position:relative; height:460px; }
        .chaos-zone, .order-zone{ position:absolute; top:0; bottom:0; width:100%; }
        .bubble{
          position:absolute; background:var(--ink-soft); border:1px solid var(--line);
          border-radius:16px; padding:10px 14px; font-size:12.5px; color:var(--slate);
          box-shadow:0 14px 30px rgba(0,0,0,0.35);
          opacity:0; transform:translateY(18px) rotate(var(--r,0deg));
          transition:opacity .6s ease, transform .6s cubic-bezier(.2,.8,.2,1);
          max-width:160px;
        }
        .bubble.loaded{ opacity:1; transform:translateY(0) rotate(var(--r,0deg)); }
        .bubble b{ color:var(--paper); display:block; font-size:11px; margin-bottom:3px; font-family:'Raleway',sans-serif; }

        .store-card{
          position:absolute; background:var(--paper); border-radius:14px; overflow:hidden;
          box-shadow:0 20px 40px rgba(0,0,0,0.4); opacity:0; transform:translateY(24px) scale(0.94);
          transition:opacity .7s cubic-bezier(.2,.8,.2,1), transform .7s cubic-bezier(.2,.8,.2,1);
        }
        .store-card.loaded{ opacity:1; transform:translateY(0) scale(1); }
        .store-card .thumb{ width:100%; height:64px; object-fit:cover; display:block; }
        .store-card .meta{ padding:8px 10px; }
        .store-card .meta .price{ color:var(--ink); font-weight:800; font-size:12px; font-family:'JetBrains Mono',monospace; }
        .store-card .meta .name{ font-size:11px; color:var(--slate-dark); margin-top:2px; }

        .flow-arrow{
          position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
          width:64px; height:64px; border-radius:50%; background:var(--signal);
          display:flex; align-items:center; justify-content:center; color:var(--ink);
          box-shadow:0 0 0 10px rgba(175,255,0,0.08), 0 0 40px rgba(175,255,0,0.5);
          opacity:0; transition:opacity .6s ease .5s, transform .6s ease .5s;
          z-index:5;
        }
        .flow-arrow.loaded{ opacity:1; animation:pulse-ring 2.6s ease-in-out infinite; }
        @keyframes pulse-ring{ 0%,100%{ box-shadow:0 0 0 10px rgba(175,255,0,0.08),0 0 40px rgba(175,255,0,0.5);} 50%{ box-shadow:0 0 0 16px rgba(175,255,0,0.14),0 0 55px rgba(175,255,0,0.7);} }

        /* ---------- PROBLEM ---------- */
        .problem{ background:var(--paper); padding:120px 0 100px; }
        .problem-head{ max-width:680px; }
        .problem h2{ font-size:38px; line-height:1.15; margin-top:16px; font-weight:800; }
        .problem-body{ color:var(--slate-dark); font-size:17px; line-height:1.7; margin-top:20px; max-width:640px; }
        .pain-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-top:52px; }
        .pain-card{
          background:var(--ink); border-radius:16px; padding:24px; display:flex; gap:16px; align-items:flex-start;
          transition:transform .3s ease, box-shadow .3s ease;
        }
        .pain-card:hover{ transform:translateY(-4px); box-shadow:0 18px 36px rgba(25,35,40,0.16); }
        .pain-ic{ width:40px; height:40px; border-radius:11px; background:rgba(175,255,0,0.12); display:flex; align-items:center; justify-content:center; color:var(--signal); flex-shrink:0; }
        .pain-card p{ color:var(--paper); font-size:14.5px; line-height:1.55; opacity:0.88; }
        .problem-close{ margin-top:40px; font-size:18px; font-style:normal; font-weight:600; color:var(--ink); border-left:3px solid var(--signal); padding-left:18px; max-width:640px; }

        /* ---------- SOLUTION ---------- */
        .solution{ background:var(--ink); padding:110px 0; position:relative; }
        .solution-inner{ display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
        .solution h2{ color:var(--paper); font-size:36px; line-height:1.16; margin-top:16px; font-weight:800; }
        .solution p{ color:var(--slate); font-size:16.5px; line-height:1.7; margin-top:20px; }
        .badge-pill{
          display:inline-flex; align-items:center; gap:8px; margin-top:26px; background:rgba(175,255,0,0.1);
          border:1px solid rgba(175,255,0,0.35); color:var(--signal); padding:9px 16px; border-radius:100px;
          font-family:'JetBrains Mono',monospace; font-size:12px; letter-spacing:0.03em;
        }
        .mini-steps{ display:flex; flex-direction:column; gap:0; }
        .mini-step{ display:flex; gap:16px; padding:20px 0; border-bottom:1px solid var(--line); align-items:center; }
        .mini-step:last-child{ border-bottom:none; }
        .mini-step .num{ font-family:'JetBrains Mono',monospace; color:var(--signal); font-weight:700; font-size:14px; width:28px; }
        .mini-step .txt{ color:var(--paper); font-size:15.5px; font-weight:500; }

        /* ---------- FEATURES ---------- */
        .features{ background:var(--paper); padding:120px 0; }
        .features-head{ max-width:680px; margin-bottom:70px; }
        .features-head h2{ font-size:38px; margin-top:16px; font-weight:800; line-height:1.15; }
        .feature-row{ display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; margin-bottom:96px; }
        .feature-row:last-child{ margin-bottom:0; }
        .feature-row.rev .f-media{ order:2; }
        .feature-row.rev .f-text{ order:1; }
        .f-tag{ display:inline-flex; align-items:center; gap:8px; font-family:'JetBrains Mono',monospace; font-size:11.5px; letter-spacing:0.14em; color:var(--slate-dark); margin-bottom:18px; }
        .f-icwrap{ width:52px; height:52px; border-radius:14px; background:var(--ink); color:var(--signal); display:flex; align-items:center; justify-content:center; margin-bottom:20px; }
        .f-text h3{ font-size:26px; font-weight:800; line-height:1.25; }
        .f-text p{ color:var(--slate-dark); font-size:15.5px; line-height:1.7; margin-top:14px; max-width:440px; }
        .f-media{ position:relative; border-radius:20px; overflow:hidden; box-shadow:0 30px 60px rgba(25,35,40,0.18); }
        .f-media img{ width:100%; height:340px; object-fit:cover; display:block; transition:transform .6s ease; }
        .f-media:hover img{ transform:scale(1.05); }
        .f-media::after{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(25,35,40,0) 55%, rgba(25,35,40,0.55) 100%); }

        /* ---------- HOW IT WORKS ---------- */
        .how{ background:var(--ink-deep); padding:120px 0; position:relative; }
        .how-head{ max-width:640px; }
        .how-head h2{ color:var(--paper); font-size:38px; margin-top:16px; font-weight:800; line-height:1.15; }
        .steps-wrap{ margin-top:64px; position:relative; }
        .steps-line{ position:absolute; left:27px; top:16px; bottom:16px; width:1px; background:linear-gradient(var(--signal), rgba(175,255,0,0.05)); }
        .step-item{ display:flex; gap:28px; padding:28px 0; position:relative; }
        .step-num{
          width:56px; height:56px; border-radius:50%; background:var(--ink); border:1px solid var(--line);
          display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace;
          color:var(--signal); font-weight:700; font-size:15px; flex-shrink:0; z-index:2;
        }
        .step-text h4{ color:var(--paper); font-size:20px; font-weight:700; }
        .step-text p{ color:var(--slate); font-size:15px; margin-top:6px; max-width:420px; line-height:1.6; }

        /* ---------- COMPARE ---------- */
        .compare{ background:var(--paper); padding:120px 0; }
        .compare-head{ max-width:640px; margin-bottom:56px; }
        .compare-head h2{ font-size:38px; margin-top:16px; font-weight:800; line-height:1.15; }
        .compare-table{ background:var(--ink); border-radius:22px; overflow:hidden; }
        .cmp-row{ display:grid; grid-template-columns:1.2fr 1fr 1fr; }
        .cmp-row.head{ background:var(--ink-deep); }
        .cmp-row.head .cmp-cell{ font-family:'JetBrains Mono',monospace; font-size:11.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--slate); padding:20px 24px; }
        .cmp-row.head .cmp-cell.us{ color:var(--signal); }
        .cmp-row:not(.head){ border-top:1px solid var(--line); }
        .cmp-cell{ padding:22px 24px; color:var(--paper); font-size:14.5px; display:flex; align-items:center; }
        .cmp-cell.label{ color:var(--paper); font-weight:700; font-size:15px; }
        .cmp-cell.others{ color:var(--slate); }
        .cmp-cell.us{ color:var(--paper); background:rgba(175,255,0,0.06); font-weight:600; gap:10px; }
        .cmp-cell.us svg{ color:var(--signal); flex-shrink:0; }

        /* ---------- TESTIMONIALS ---------- */
        .testi{ background:var(--paper); padding:100px 0 120px; }
        .testi-grid{ display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:52px; }
        .testi-card{ background:#fff; border:1px solid rgba(25,35,40,0.08); border-radius:20px; padding:32px; box-shadow:0 16px 40px rgba(25,35,40,0.06); }
        .testi-stars{ display:flex; gap:3px; color:var(--signal-dim); margin-bottom:16px; }
        .testi-quote{ font-size:18px; line-height:1.6; font-weight:500; color:var(--ink); }
        .testi-person{ display:flex; align-items:center; gap:12px; margin-top:24px; }
        .testi-person img{ width:44px; height:44px; border-radius:50%; object-fit:cover; }
        .testi-person .n{ font-weight:700; font-size:14px; }
        .testi-person .m{ color:var(--slate-dark); font-size:12.5px; }
        .testi-note{ margin-top:24px; font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--slate-dark); background:var(--paper-dim); border-radius:10px; padding:12px 16px; display:inline-block; }

        /* ---------- PRICING ---------- */
        .pricing{ background:var(--ink); padding:120px 0; }
        .pricing-head{ max-width:640px; }
        .pricing-head h2{ color:var(--paper); font-size:38px; margin-top:16px; font-weight:800; line-height:1.15; }
        .pricing-head p{ color:var(--slate); font-size:16px; margin-top:16px; line-height:1.6; }
        .plans-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:22px; margin-top:56px; }
        .plan-card{ background:var(--ink-soft); border:1px solid var(--line); border-radius:20px; padding:32px; display:flex; flex-direction:column; transition:transform .3s ease, border-color .3s ease; }
        .plan-card:hover{ transform:translateY(-6px); border-color:rgba(175,255,0,0.4); }
        .plan-card.highlight{ background:var(--signal); border-color:var(--signal); }
        .plan-card.highlight .plan-name, .plan-card.highlight .plan-tagline{ color:var(--ink); }
        .plan-card.highlight .plan-feat{ color:var(--ink); opacity:0.85; }
        .plan-card.highlight .plan-feat svg{ color:var(--ink); }
        .plan-badge{ font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:0.1em; background:var(--ink); color:var(--signal); padding:5px 10px; border-radius:100px; align-self:flex-start; margin-bottom:16px; }
        .plan-name{ color:var(--paper); font-size:22px; font-weight:800; }
        .plan-tagline{ color:var(--slate); font-size:13.5px; margin-top:6px; margin-bottom:24px; }
        .plan-feats{ display:flex; flex-direction:column; gap:12px; flex:1; }
        .plan-feat{ display:flex; align-items:center; gap:10px; color:var(--paper); font-size:14px; opacity:0.9; }
        .plan-feat svg{ color:var(--signal); flex-shrink:0; }
        .plan-cta{ margin-top:28px; padding:13px; border-radius:100px; text-align:center; font-weight:700; font-size:14px; cursor:pointer; border:1px solid var(--signal); color:var(--signal); background:transparent; transition:all .25s ease; font-family:'Raleway',sans-serif; }
        .plan-card:not(.highlight) .plan-cta:hover{ background:rgba(175,255,0,0.1); }
        .plan-card.highlight .plan-cta{ background:var(--ink); color:var(--signal); border-color:var(--ink); }
        .pricing-foot{ margin-top:28px; color:var(--slate); font-family:'JetBrains Mono',monospace; font-size:12.5px; }

        /* ---------- FAQ ---------- */
        .faq{ background:var(--paper); padding:110px 0; }
        .faq-inner{ display:grid; grid-template-columns:0.8fr 1.2fr; gap:60px; }
        .faq-head h2{ font-size:36px; font-weight:800; margin-top:16px; line-height:1.18; }
        .faq-list{ display:flex; flex-direction:column; }
        .faq-item{ border-bottom:1px solid rgba(25,35,40,0.12); padding:22px 0; cursor:pointer; }
        .faq-q{ display:flex; align-items:center; justify-content:space-between; gap:20px; }
        .faq-q span{ font-size:17px; font-weight:700; }
        .faq-ic{ width:30px; height:30px; border-radius:50%; background:var(--ink); color:var(--signal); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:transform .3s ease; }
        .faq-item.open .faq-ic{ transform:rotate(45deg); }
        .faq-a{ max-height:0; overflow:hidden; transition:max-height .35s ease, opacity .35s ease, margin-top .35s ease; opacity:0; }
        .faq-item.open .faq-a{ max-height:200px; opacity:1; margin-top:14px; }
        .faq-a p{ color:var(--slate-dark); font-size:15px; line-height:1.65; max-width:520px; }

        /* ---------- FINAL CTA ---------- */
        .final-cta{ background:var(--signal); padding:90px 0; position:relative; overflow:hidden; }
        .final-cta::before{
          content:""; position:absolute; width:500px; height:500px; border-radius:50%;
          background:rgba(25,35,40,0.06); right:-160px; top:-200px;
        }
        .final-inner{ display:flex; align-items:center; justify-content:space-between; gap:40px; flex-wrap:wrap; position:relative; z-index:1; }
        .final-inner h2{ font-size:34px; font-weight:800; color:var(--ink); max-width:560px; line-height:1.2; }
        .btn-dark{
          background:var(--ink); color:var(--signal); border:none; padding:18px 28px; border-radius:100px;
          font-weight:700; font-size:15.5px; cursor:pointer; display:inline-flex; align-items:center; gap:10px;
          transition:transform .25s ease, box-shadow .25s ease; flex-shrink:0; font-family:'Raleway',sans-serif;
        }
        .btn-dark:hover{ transform:translateY(-3px); box-shadow:0 16px 32px rgba(25,35,40,0.28); }

        /* ---------- FOOTER ---------- */
        footer{ background:var(--ink-deep); padding:76px 0 30px; }
        .foot-top{ display:grid; grid-template-columns:1.4fr 1fr 1fr 1fr; gap:40px; padding-bottom:56px; border-bottom:1px solid var(--line); }
        .foot-brand .logo{ margin-bottom:14px; }
        .foot-brand p{ color:var(--slate); font-size:14px; line-height:1.65; max-width:280px; }
        .foot-social{ display:flex; gap:10px; margin-top:22px; }
        .foot-social a{ width:36px; height:36px; border-radius:50%; background:var(--ink-soft); display:flex; align-items:center; justify-content:center; color:var(--paper); text-decoration:none; transition:background .2s ease, color .2s ease; }
        .foot-social a:hover{ background:var(--signal); color:var(--ink); }
        .foot-col h5{ color:var(--paper); font-size:13px; letter-spacing:0.08em; text-transform:uppercase; font-family:'JetBrains Mono',monospace; margin-bottom:18px; font-weight:600; }
        .foot-col a{ display:block; color:var(--slate); text-decoration:none; font-size:14.5px; padding:7px 0; transition:color .2s ease; }
        .foot-col a:hover{ color:var(--signal); }
        .foot-bottom{ display:flex; justify-content:space-between; align-items:center; padding-top:26px; flex-wrap:wrap; gap:12px; }
        .foot-bottom p{ color:var(--slate-dark); font-size:12.5px; font-family:'JetBrains Mono',monospace; }

        /* ---------- RESPONSIVE ---------- */
        @media (max-width: 980px){
          .hero-grid{ grid-template-columns:1fr; }
          .hero-visual{ height:360px; margin-top:20px; }
          .hero h1{ font-size:42px; }
          .solution-inner{ grid-template-columns:1fr; }
          .feature-row{ grid-template-columns:1fr; gap:32px; }
          .feature-row.rev .f-media, .feature-row.rev .f-text{ order:unset; }
          .pain-grid{ grid-template-columns:1fr; }
          .plans-grid{ grid-template-columns:1fr; }
          .faq-inner{ grid-template-columns:1fr; gap:30px; }
          .cmp-row{ grid-template-columns:1fr; }
          .cmp-row.head{ display:none; }
          .cmp-cell.label{ padding-bottom:6px; }
          .cmp-cell.others::before{ content:"Others: "; color:var(--slate-dark); font-family:'JetBrains Mono',monospace; font-size:10px; margin-right:6px; }
          .cmp-cell.us::before{ content:"Blorbify: "; color:var(--signal); font-family:'JetBrains Mono',monospace; font-size:10px; margin-right:6px; }
          .nav-links{ display:none; }
          .nav-burger{ display:block; }
          .final-inner{ flex-direction:column; align-items:flex-start; }
        }
        @media (max-width: 620px){
          .wrap{ padding:0 18px; }
          .hero{ padding:120px 0 80px; }
          .hero h1{ font-size:33px; }
          .hero-sub{ font-size:16px; }
          .problem h2, .solution h2, .features-head h2, .how-head h2, .compare-head h2, .pricing-head h2, .faq-head h2{ font-size:27px; }
          .testi-grid{ grid-template-columns:1fr; }
          .foot-top{ grid-template-columns:1fr 1fr; gap:32px; }
          .final-inner h2{ font-size:24px; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap nav-inner">
          <div className="logo">
            <span className="logo-dot" />
            Blorbify
            <span className="logo-sub">BY BLORBMART</span>
          </div>
          <div className="nav-links">
            <a href="#features" onClick={scrollTo("features")}>Features</a>
            <a href="#how" onClick={scrollTo("how")}>How it works</a>
            <a href="#pricing" onClick={scrollTo("pricing")}>Pricing</a>
            <a href="#faq" onClick={scrollTo("faq")}>FAQ</a>
            <button className="nav-cta" onClick={() => openAuth("signup")}>Get my free store</button>
          </div>
          <button className="nav-burger" onClick={() => setNavOpen((v) => !v)} aria-label="Menu">
            {navOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
        <div className={`nav-mobile ${navOpen ? "open" : ""}`}>
          <a href="#features" onClick={scrollTo("features")}>Features</a>
          <a href="#how" onClick={scrollTo("how")}>How it works</a>
          <a href="#pricing" onClick={scrollTo("pricing")}>Pricing</a>
          <a href="#faq" onClick={scrollTo("faq")}>FAQ</a>
          <a href="#cta" onClick={scrollTo("cta")}>Get my free store &rarr;</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="wrap hero-grid">
          <div>
            <div className="hero-eyebrow-row"><Eyebrow>Nigerian businesses, online in minutes</Eyebrow></div>
            <h1>Your business deserves<br />to be <em>found</em> online.</h1>
            <p className="hero-sub">Launch a professional website and store in minutes — no developer, no design skills, no wahala.</p>
            <div className="hero-cta-row">
              <button className="btn-primary" onClick={() => openAuth("signup")}>
                Get my free store in 5 minutes <IconArrow size={18} />
              </button>
              <span className="hero-micro">No credit card needed &middot; Cancel anytime</span>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><b>Same day</b><span>Store goes live</span></div>
              <div className="hero-stat"><b>0</b><span>Lines of code needed</span></div>
              <div className="hero-stat"><b>&#8358; Naira</b><span>Priced for Nigeria</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="chaos-zone">
              <div className={`bubble ${heroLoaded ? "loaded" : ""}`} style={{ "--r": "-6deg", top: "6%", left: "2%", transitionDelay: "120ms" }}>
                <b>WhatsApp</b> "Is this still available?"
              </div>
              <div className={`bubble ${heroLoaded ? "loaded" : ""}`} style={{ "--r": "4deg", top: "30%", left: "16%", transitionDelay: "260ms" }}>
                <b>Status</b> New scent dropped 🔥 dm to order
              </div>
              <div className={`bubble ${heroLoaded ? "loaded" : ""}`} style={{ "--r": "-3deg", top: "56%", left: "0%", transitionDelay: "400ms" }}>
                <b>DM</b> "Do you deliver to Osogbo?"
              </div>
              <div className={`bubble ${heroLoaded ? "loaded" : ""}`} style={{ "--r": "5deg", top: "80%", left: "20%", transitionDelay: "540ms" }}>
                <b>Missed</b> 3 unread messages
              </div>
            </div>

            <div className={`flow-arrow ${heroLoaded ? "loaded" : ""}`}>
              <IconArrow size={26} />
            </div>

            <div className="order-zone">
              <div className={`store-card ${heroLoaded ? "loaded" : ""}`} style={{ width: "150px", top: "4%", right: "4%", transitionDelay: "650ms" }}>
                <img className="thumb" src="https://loremflickr.com/300/200/perfume,bottle?lock=3" alt="fragrance product" />
                <div className="meta"><div className="price">&#8358;12,500</div><div className="name">Amber Musk 50ml</div></div>
              </div>
              <div className={`store-card ${heroLoaded ? "loaded" : ""}`} style={{ width: "150px", top: "34%", right: "20%", transitionDelay: "780ms" }}>
                <img className="thumb" src="https://loremflickr.com/300/200/dress,fashion?lock=5" alt="fashion product" />
                <div className="meta"><div className="price">&#8358;8,000</div><div className="name">Ankara Set</div></div>
              </div>
              <div className={`store-card ${heroLoaded ? "loaded" : ""}`} style={{ width: "150px", top: "64%", right: "2%", transitionDelay: "900ms" }}>
                <img className="thumb" src="https://loremflickr.com/300/200/skincare,cosmetics?lock=7" alt="beauty product" />
                <div className="meta"><div className="price">&#8358;5,200</div><div className="name">Glow Serum</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="problem">
        <div className="wrap">
          <Reveal className="problem-head">
            <Eyebrow>The problem</Eyebrow>
            <h2>Every day you're offline, you're losing customers to someone who isn't.</h2>
            <p className="problem-body">Your competitors are on Instagram and WhatsApp, but customers can't find them, can't trust them, and can't pay them easily — so sales slip through the cracks. Sound familiar?</p>
          </Reveal>

          <div className="pain-grid">
            {painPoints.map((p, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="pain-card">
                  <div className="pain-ic"><p.icon size={20} /></div>
                  <p>{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p className="problem-close">You don't need another app to manage. You need one place that does it all — and does it for you.</p>
          </Reveal>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="solution">
        <div className="wrap solution-inner">
          <Reveal>
            <Eyebrow>The solution</Eyebrow>
            <h2>Meet Blorbify: the fastest way for Nigerian businesses to sell online.</h2>
            <p>Blorbify is built by the team behind Blorbmart — the platform already powering student commerce at UNIOSUN. We took what works and made it available to every business ready to grow online.</p>
            <div className="badge-pill"><IconShield size={16} /> Proven on Blorbmart's live campus marketplace</div>
          </Reveal>
          <Reveal delay={150}>
            <div className="mini-steps">
              <div className="mini-step"><span className="num">01</span><span className="txt">Pick a plan</span></div>
              <div className="mini-step"><span className="num">02</span><span className="txt">Answer a few questions</span></div>
              <div className="mini-step"><span className="num">03</span><span className="txt">Watch your store come alive — today</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="wrap">
          <Reveal className="features-head">
            <Eyebrow>What you get</Eyebrow>
            <h2>Everything you need to sell online. Nothing you don't.</h2>
          </Reveal>

          {features.map((f, i) => (
            <div className={`feature-row ${i % 2 ? "rev" : ""}`} key={f.title}>
              <Reveal className="f-text">
                <span className="f-tag"><IconTag size={13} /> {f.tag}</span>
                <div className="f-icwrap"><f.icon size={24} /></div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </Reveal>
              <Reveal delay={120} className="f-media">
                <img src={f.img} alt={f.title} />
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="wrap">
          <Reveal className="how-head">
            <Eyebrow>How it works</Eyebrow>
            <h2>Three steps. Zero tech skills required.</h2>
          </Reveal>
          <div className="steps-wrap">
            <div className="steps-line" />
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 130}>
                <div className="step-item">
                  <div className="step-num">{s.n}</div>
                  <div className="step-text">
                    <h4>{s.title}</h4>
                    <p>{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className="compare">
        <div className="wrap">
          <Reveal className="compare-head">
            <Eyebrow>Why Blorbify</Eyebrow>
            <h2>Not just another store builder.</h2>
            <p className="problem-body" style={{ marginTop: 16 }}>Tools built for global merchants are priced in dollars, and page builders leave delivery and customers as your problem. Blorbify is different by design.</p>
          </Reveal>
          <Reveal delay={100}>
            <div className="compare-table">
              <div className="cmp-row head">
                <div className="cmp-cell"></div>
                <div className="cmp-cell">Others</div>
                <div className="cmp-cell us">Blorbify</div>
              </div>
              {compareRows.map((r) => (
                <div className="cmp-row" key={r.label}>
                  <div className="cmp-cell label">{r.label}</div>
                  <div className="cmp-cell others">{r.others}</div>
                  <div className="cmp-cell us"><IconCheck size={16} />{r.us}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testi">
        <div className="wrap">
          <Reveal>
            <Eyebrow>Trusted by businesses like yours</Eyebrow>
            <h2 style={{ fontSize: 32, marginTop: 16, fontWeight: 800 }}>Real businesses. Real sales.</h2>
          </Reveal>
          <div className="testi-grid">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="testi-card">
                  <div className="testi-stars">{[...Array(5)].map((_, s) => <IconStar key={s} size={15} fill="currentColor" style={{ fill: "currentColor" }} />)}</div>
                  <p className="testi-quote">&ldquo;{t.quote}&rdquo;</p>
                  <div className="testi-person">
                    <img src={t.img} alt={t.name} />
                    <div>
                      <div className="n">{t.name}</div>
                      <div className="m">{t.meta}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={220}>
            <span className="testi-note">Illustrative quotes — swap in real pilot merchant testimonials once available.</span>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="wrap">
          <Reveal className="pricing-head">
            <Eyebrow>Simple pricing</Eyebrow>
            <h2>Plans that grow with your business.</h2>
            <p>Start small. Upgrade the moment you're ready for more. No long contracts — cancel anytime.</p>
          </Reveal>
          <div className="plans-grid">
            {plans.map((p, i) => (
              <Reveal key={p.name} delay={i * 110}>
                <div className={`plan-card ${p.highlight ? "highlight" : ""}`}>
                  {p.highlight && <span className="plan-badge">MOST POPULAR</span>}
                  <div className="plan-name">{p.name}</div>
                  <div className="plan-tagline">{p.tagline}</div>
                  <div className="plan-feats">
                    {p.features.map((f) => (
                      <div className="plan-feat" key={f}><IconCheck size={16} />{f}</div>
                    ))}
                  </div>
                  <button className="plan-cta" onClick={() => openAuth("signup")}>Choose {p.name}</button>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="pricing-foot">Naira pricing revealed at signup — built for Nigerian budgets, not dollar rates.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="wrap faq-inner">
          <Reveal className="faq-head">
            <Eyebrow>Common questions</Eyebrow>
            <h2>Still deciding? Here's what other owners ask.</h2>
          </Reveal>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div className={`faq-item ${openFaq === i ? "open" : ""}`} key={f.q} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <div className="faq-q">
                  <span>{f.q}</span>
                  <div className="faq-ic"><IconPlus size={16} /></div>
                </div>
                <div className="faq-a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta" id="cta">
        <div className="wrap final-inner">
          <h2>Your customers are already searching. Let them find you.</h2>
          <button className="btn-dark" onClick={() => openAuth("signup")}>Start my store now — it's free to try <IconArrow size={18} /></button>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <div className="logo"><span className="logo-dot" />Blorbify</div>
              <p>The fastest way for Nigerian businesses to sell online — website, delivery, and ads, all in one place.</p>
              <div className="foot-social">
                <a href="#" aria-label="WhatsApp"><IconWhatsapp size={17} /></a>
                <a href="#" aria-label="Instagram"><IconInsta size={17} /></a>
                <a href="#" aria-label="X"><IconX size={16} /></a>
              </div>
            </div>
            <div className="foot-col">
              <h5>Product</h5>
              <a href="#features" onClick={scrollTo("features")}>Features</a>
              <a href="#how" onClick={scrollTo("how")}>How it works</a>
              <a href="#pricing" onClick={scrollTo("pricing")}>Pricing</a>
            </div>
            <div className="foot-col">
              <h5>Company</h5>
              <a href="#">About Blorbmart</a>
              <a href="#">UNIOSUN campus store</a>
              <a href="#">Careers</a>
            </div>
            <div className="foot-col">
              <h5>Support</h5>
              <a href="#faq" onClick={scrollTo("faq")}>FAQ</a>
              <a href="#">Contact us</a>
              <a href="#">Terms &amp; privacy</a>
            </div>
          </div>
          <div className="foot-bottom">
            <p>&copy; {new Date().getFullYear()} Blorbify, by Blorbmart. Made in Lagos, Nigeria.</p>
            <p>Built on Blorbmart infrastructure</p>
          </div>
        </div>
      </footer>
    </div>
  );
}