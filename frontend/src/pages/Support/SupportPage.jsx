import React, { useState } from "react";
import { MainLayout } from "../../layouts";
import "./SupportPage.css";

const faqData = [
  {
    q: "How do I reset my password?",
    a: "Go to the login page and click 'Forgot password?'. We'll email you a reset link.",
  },
  {
    q: "How can I contact live support?",
    a: "Use the live chat channel (available 8:00 - 22:00 GMT+7) or send us an email any time.",
  },
  {
    q: "How do I post a new job?",
    a: "After logging in as an employer, click 'Post Job' in the dashboard and complete the form.",
  },
  {
    q: "Can I upgrade my plan later?",
    a: "Yes, you can upgrade or downgrade from Billing settings in your dashboard.",
  },
];

const channels = [
  {
    icon: "💬",
    title: "Live Chat",
    badge: "FASTEST",
    desc: "Average reply < 2 mins (08:00 - 22:00)",
    actions: ["Open Chat"],
  },
  {
    icon: "📧",
    title: "Email",
    badge: "24/7",
    desc: "support@g-bridge.com",
    actions: ["Send Email"],
  },
  {
    icon: "🧠",
    title: "Help Center",
    badge: "GUIDES",
    desc: "Articles & tutorials for self-service",
    actions: ["Browse Docs"],
  },
  {
    icon: "🐞",
    title: "Report Issue",
    badge: "BUG",
    desc: "Found a problem? Let us know.",
    actions: ["Report Bug"],
  },
  {
    icon: "📞",
    title: "Hotline",
    badge: "PHONE",
    desc: "+84 1900 1234 (08:00 - 18:00)",
    actions: ["Call Now"],
  },
  {
    icon: "🔐",
    title: "Security",
    badge: "SECURITY",
    desc: "Responsible disclosure program",
    actions: ["View Policy"],
  },
];

const steps = [
  {
    title: "Search Help Center",
    desc: "Find instant answers in curated guides.",
  },
  { title: "Use Live Chat", desc: "Chat with a specialist for quick support." },
  { title: "Create Ticket", desc: "Complex issue? Submit a detailed ticket." },
  { title: "Track & Resolve", desc: "We keep you updated until it's fixed." },
];

const resources = [
  {
    icon: "🚀",
    title: "Getting Started",
    desc: "Kickstart your first job post or application.",
  },
  {
    icon: "🧾",
    title: "Billing & Plans",
    desc: "Understand pricing, invoices & upgrades.",
  },
  {
    icon: "👥",
    title: "Account & Team",
    desc: "Manage profile, roles & permissions.",
  },
  {
    icon: "🔐",
    title: "Security & Privacy",
    desc: "Data protection & best practices.",
  },
];

const SupportPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <MainLayout>
      <div className="support-page">
        <section className="support-hero">
          <span className="halo" />
          <div className="support-hero-inner">
            <div className="support-badge">WE'RE HERE TO HELP</div>
            <h1 className="support-title">Customer Support</h1>
            <p className="support-sub">
              Find answers, contact our team, and get the most out of G-Bridge.
              We're committed to fast, friendly and effective support.
            </p>
            <div className="support-cta">
              <a href="#contact" className="support-btn">
                Contact Us
              </a>
              <a href="#faq" className="support-btn outline">
                Browse FAQ
              </a>
            </div>
          </div>
        </section>
        <div className="support-highlights">
          <div className="support-card">
            <div className="support-card-icon">⚡</div>
            <h3 className="support-card-title">Fast Response</h3>
            <p className="support-card-desc">
              Most chat replies in under 2 minutes during business hours.
            </p>
          </div>
          <div className="support-card">
            <div className="support-card-icon">🛡️</div>
            <h3 className="support-card-title">Trusted & Secure</h3>
            <p className="support-card-desc">
              Enterprise-grade security with continuous monitoring.
            </p>
          </div>
          <div className="support-card">
            <div className="support-card-icon">🤝</div>
            <h3 className="support-card-title">Human + AI Hybrid</h3>
            <p className="support-card-desc">
              Smart automation plus real experts for complex issues.
            </p>
          </div>
        </div>
        <div className="section-block">
          <div className="section-head">
            <h2>Support Channels</h2>
          </div>
          <div className="channels-grid">
            {channels.map((c, i) => (
              <div key={i} className="channel">
                <div className="channel-badge">{c.badge}</div>
                <div className="channel-title">
                  {c.icon} {c.title}
                </div>
                <p className="channel-desc">{c.desc}</p>
                <div className="channel-actions">
                  {c.actions.map((a) => (
                    <button key={a} className="channel-btn">
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="section-block">
          <div className="section-head">
            <h2>How Support Works</h2>
          </div>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="step">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="section-block">
          <div className="section-head">
            <h2>Resources</h2>
          </div>
          <div className="resources-grid">
            {resources.map((r, i) => (
              <div key={i} className="resource">
                <div className="resource-icon">{r.icon}</div>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="section-block support-contact" id="contact">
          <div className="contact-card">
            <h3>Send us a message</h3>
            <form onSubmit={(e) => e.preventDefault()} className="contact-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    className="support-input"
                    required
                    placeholder="Your name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="support-input"
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Topic</label>
                  <select className="support-select" defaultValue="general">
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="security">Security</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  className="support-textarea"
                  required
                  placeholder="Describe your issue or question..."
                />
              </div>
              <div className="submit-row">
                <button className="submit-btn" type="submit">
                  Send Message
                </button>
              </div>
            </form>
          </div>
          <div className="faq-wrapper" id="faq">
            <div className="section-head" style={{ marginTop: 0 }}>
              <h2>FAQ</h2>
            </div>
            <div className="faq-grid">
              {faqData.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} className={`faq-item ${open ? "open" : ""}`}>
                    <button
                      type="button"
                      className="faq-question"
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      <span>{f.q}</span>
                      <span>{open ? "−" : "+"}</span>
                    </button>
                    {open && <div className="faq-answer">{f.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SupportPage;
