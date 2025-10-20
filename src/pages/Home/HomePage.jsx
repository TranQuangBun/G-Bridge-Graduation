import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "../../layouts";
import { ROUTES } from "../../constants";
import "./HomePage.css";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  useScrollAnimation,
  useStaggeredAnimation,
  useCounter,
  useMotionPreferences,
} from "../../hooks/useScrollAnimation";
import minhAnhAvatar from "../../assets/images/avatar/minhanh.png";
import namAvatar from "../../assets/images/avatar/nam.png";
import huongAvatar from "../../assets/images/avatar/huonng.png";
import samsungLogo from "../../assets/images/company/amazon.png";
import ministryLogo from "../../assets/images/company/fpt.png";
import vinmecLogo from "../../assets/images/company/Family Caregiver Alliance.png";

const jobsData = [
  {
    id: 1,
    title: "English-Japanese Interpreter",
    company: "Samsung Electronics",
    companyLogo: samsungLogo,
    location: "Ho Chi Minh City",
    salary: "$1,200-1,600",
    type: "Full-time",
    urgent: true,
    skills: ["English", "Japanese", "Technology"],
  },
  {
    id: 2,
    title: "International Conference Interpreter",
    company: "Ministry of Foreign Affairs",
    companyLogo: ministryLogo,
    location: "Hanoi",
    salary: "$1,400-2,200",
    type: "Project-based",
    urgent: false,
    skills: ["English", "French", "Diplomacy"],
  },
  {
    id: 3,
    title: "Medical Interpreter - General Hospital",
    company: "Vinmec Hospital",
    companyLogo: vinmecLogo,
    location: "Ho Chi Minh City",
    salary: "$900-1,400",
    type: "Part-time",
    urgent: false,
    skills: ["English", "Medicine", "Healthcare"],
  },
  {
    id: 4,
    title: "On-site Factory Interpreter",
    company: "Samsung Electronics",
    companyLogo: samsungLogo,
    location: "Bac Ninh",
    salary: "$750-1,050",
    type: "Shift-based",
    urgent: true,
    skills: ["Korean", "Manufacturing", "Reporting"],
  },
  {
    id: 5,
    title: "Legal Contract Interpreter",
    company: "Ministry of Foreign Affairs",
    companyLogo: ministryLogo,
    location: "Hanoi",
    salary: "$1,800-2,700",
    type: "Full-time",
    urgent: false,
    skills: ["English", "Law", "Contracts"],
  },
  {
    id: 6,
    title: "Medical Documentation Translator",
    company: "Vinmec Hospital",
    companyLogo: vinmecLogo,
    location: "Da Nang",
    salary: "$950-1,450",
    type: "Remote",
    urgent: false,
    skills: ["English", "Medical", "Translation"],
  },
  {
    id: 7,
    title: "Internal Training Interpreter",
    company: "Samsung Electronics",
    companyLogo: samsungLogo,
    location: "Thai Nguyen",
    salary: "$950-1,350",
    type: "Full-time",
    urgent: false,
    skills: ["English", "Training", "Note-taking"],
  },
  {
    id: 8,
    title: "Logistics & Supply Chain Interpreter",
    company: "Ministry of Foreign Affairs",
    companyLogo: ministryLogo,
    location: "Hai Phong",
    salary: "$1,150-1,550",
    type: "Project-based",
    urgent: false,
    skills: ["Chinese", "Logistics", "Supply Chain"],
  },
  {
    id: 9,
    title: "Medical Symposium Interpreter",
    company: "Vinmec Hospital",
    companyLogo: vinmecLogo,
    location: "Ho Chi Minh City",
    salary: "$1,600-2,000",
    type: "Event-based",
    urgent: true,
    skills: ["English", "Conference", "Medical"],
  },
];

const HomePage = () => {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Anim refs
  const heroRef = useScrollAnimation("animate-on-scroll");
  const statsRef = useStaggeredAnimation(200);
  const featuresRef = useStaggeredAnimation(150);
  const jobsRef = useScrollAnimation("slide-in-left");
  const testimonialsRef = useScrollAnimation("slide-in-right");
  useMotionPreferences();

  // Counters
  const counter1 = useCounter(50000, 2000);
  const counter2 = useCounter(25000, 2000);
  const counter3 = useCounter(5000, 2000);
  const counter4 = useCounter(98, 2000);

  // Animated hero text interval
  useEffect(() => {
    const arr = t("home.animatedTexts", []);
    const interval = setInterval(() => {
      setCurrentTextIndex((i) => (arr.length ? (i + 1) % arr.length : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, [t]);

  // Slider state
  const [groupIndex, setGroupIndex] = useState(0);
  const [isJobPaused, setIsJobPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const compute = () =>
      window.innerWidth >= 1400 ? 3 : window.innerWidth >= 900 ? 2 : 1;
    const handle = () => {
      setVisibleCount((prev) => {
        const next = compute();
        if (next !== prev) {
          const maxGroups = Math.ceil(jobsData.length / next);
          setGroupIndex((g) => (g >= maxGroups ? 0 : g));
        }
        return next;
      });
    };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const totalGroups = useMemo(
    () => Math.ceil(jobsData.length / visibleCount),
    [visibleCount]
  );

  useEffect(() => {
    if (isJobPaused || totalGroups <= 1) return;
    const id = setInterval(
      () => setGroupIndex((g) => (g + 1) % totalGroups),
      3000
    );
    return () => clearInterval(id);
  }, [isJobPaused, totalGroups]);

  useEffect(() => setGroupIndex(0), [lang, visibleCount]);

  const stats = t("home.stats", []);
  const features = t("home.features", []);
  const testimonials = t("home.testimonials.reviews", []);

  return (
    <MainLayout>
      <div className="modern-homepage">
        <div className="hero-background">
          <div className="background-animation">
            <div className="floating-shape shape-1 float-animation"></div>
            <div className="floating-shape shape-2 float-animation"></div>
            <div className="floating-shape shape-3 float-animation"></div>
            <div className="floating-shape shape-4 float-animation"></div>
            <div className="floating-shape shape-5 float-animation"></div>
          </div>
          <div className="gradient-overlay"></div>
          <div className="particle-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`particle particle-${i + 1} float-animation`}
              ></div>
            ))}
          </div>
        </div>
        <section className="hero-section" ref={heroRef}>
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-title-wrapper">
                <h1 className="hero-title animated-gradient-text">
                  <span className="title-main">{t("home.heroTitle")}</span>
                  <span className="title-accent">{t("home.heroSubtitle")}</span>
                </h1>
                <div className="animated-text-container">
                  <span className="animated-text">
                    {t("home.animatedTexts", [])[currentTextIndex]}
                  </span>
                </div>
              </div>
              <p className="hero-description">{t("home.heroDescription")}</p>
              <div className="hero-actions">
                <Link
                  to="/find-job"
                  className="action-button primary ripple-effect"
                >
                  <i className="fas fa-briefcase"></i>
                  <span>{lang === "vi" ? "Tìm việc làm" : "Find Jobs"}</span>
                </Link>
                <Link
                  to="/find-interpreter"
                  className="action-button secondary ripple-effect"
                >
                  <i className="fas fa-language"></i>
                  <span>
                    {lang === "vi" ? "Tìm phiên dịch" : "Find Interpreter"}
                  </span>
                </Link>
                {/* Hide Post Job button for interpreter role */}
                {user?.role !== "interpreter" && (
                  <Link
                    to="/post-job"
                    className="action-button outlined ripple-effect"
                  >
                    <i className="fas fa-plus"></i>
                    <span>
                      {lang === "vi" ? "Đăng tuyển dụng" : "Post Job"}
                    </span>
                  </Link>
                )}
              </div>
            </div>
            <div className="hero-stats" ref={statsRef}>
              {stats.map((stat, index) => (
                <div key={index} className="stat-item hover-lift">
                  <div
                    className="stat-number"
                    ref={
                      index === 0
                        ? counter1
                        : index === 1
                        ? counter2
                        : index === 2
                        ? counter3
                        : counter4
                    }
                  >
                    {stat.number}
                  </div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="features-section">
          <div className="features-container">
            <div className="section-header">
              <h2 className="section-title animated-gradient-text">
                {lang === "vi"
                  ? "Tại sao chọn G-Bridge?"
                  : "Why Choose G-Bridge?"}
              </h2>
              <p className="section-subtitle">
                {lang === "vi"
                  ? "Nền tảng công nghệ hiện đại với các tính năng vượt trội"
                  : "Modern technology platform with superior features"}
              </p>
            </div>
            <div className="features-grid" ref={featuresRef}>
              {features.map((feature, i) => (
                <div key={i} className="feature-card hover-lift magnetic-hover">
                  <div className="feature-icon">
                    <span>{feature.icon}</span>
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="featured-jobs-section" ref={jobsRef}>
          <div className="featured-jobs-container">
            <div className="section-header">
              <h2 className="section-title animated-gradient-text">
                {t("home.featuredJobs.title")}
              </h2>
              <p className="section-subtitle">
                {t("home.featuredJobs.subtitle")}
              </p>
            </div>
            <div
              className="jobs-slider"
              onMouseEnter={() => setIsJobPaused(true)}
              onMouseLeave={() => setIsJobPaused(false)}
            >
              <div
                className="jobs-track"
                style={{ transform: `translateX(-${groupIndex * 100}%)` }}
              >
                {jobsData.map((job, idx) => (
                  <div
                    className="job-slide"
                    key={job.id}
                    aria-hidden={Math.floor(idx / visibleCount) !== groupIndex}
                  >
                    <div className="job-card hover-lift magnetic-hover breathing-effect">
                      {job.urgent && <div className="urgent-badge">URGENT</div>}
                      <div className="job-header">
                        <h3 className="job-title">{job.title}</h3>
                        <div className="job-actions">
                          <button
                            className="action-btn save-btn"
                            title={t("common.save")}
                            aria-label={t("common.save")}
                          >
                            <i className="fas fa-bookmark"></i>
                          </button>
                        </div>
                      </div>
                      <div className="job-company">
                        <div className="company-logo">
                          <img src={job.companyLogo} alt={job.company} />
                        </div>
                        <span>{job.company}</span>
                      </div>
                      <div className="job-details">
                        <div className="job-detail">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{job.location}</span>
                        </div>
                        <div className="job-detail">
                          <i className="fas fa-dollar-sign"></i>
                          <span>{job.salary}</span>
                        </div>
                        <div className="job-detail">
                          <i className="fas fa-clock"></i>
                          <span>{job.type}</span>
                        </div>
                      </div>
                      <div className="job-skills">
                        {job.skills.map((skill, i2) => (
                          <span key={i2} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <button className="apply-btn ripple-effect">
                        <span>{t("common.apply")}</span>
                        <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="jobs-dots"
                role="tablist"
                aria-label="Featured jobs"
              >
                {Array.from({ length: totalGroups }).map((_, idx) => (
                  <button
                    key={idx}
                    className={`jobs-dot ${groupIndex === idx ? "active" : ""}`}
                    onClick={() => setGroupIndex(idx)}
                    aria-label={`Go to job group ${idx + 1}`}
                    aria-selected={groupIndex === idx}
                    role="tab"
                  />
                ))}
              </div>
              <button
                type="button"
                className="jobs-nav prev"
                onClick={() =>
                  setGroupIndex((g) => (g - 1 + totalGroups) % totalGroups)
                }
                aria-label="Previous job"
              >
                <i className="fas fa-chevron-left" />
              </button>
              <button
                type="button"
                className="jobs-nav next"
                onClick={() => setGroupIndex((g) => (g + 1) % totalGroups)}
                aria-label="Next job"
              >
                <i className="fas fa-chevron-right" />
              </button>
            </div>
            <div className="view-all-container">
              <Link to="/jobs" className="view-all-btn">
                {t("common.viewAll")} <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </section>
        <section className="testimonials-section" ref={testimonialsRef}>
          <div className="testimonials-container">
            <div className="section-header">
              <h2 className="section-title animated-gradient-text">
                {t("home.testimonials.title")}
              </h2>
              <p className="section-subtitle">
                {t("home.testimonials.subtitle")}
              </p>
            </div>
            <div className="testimonials-grid">
              {testimonials.map((rev) => {
                const avatar =
                  rev.id === 1
                    ? minhAnhAvatar
                    : rev.id === 2
                    ? namAvatar
                    : huongAvatar;
                return (
                  <div
                    key={rev.id}
                    className="testimonial-card hover-lift tilt-effect"
                  >
                    <div className="testimonial-content">
                      <div className="quote-icon">
                        <i className="fas fa-quote-left"></i>
                      </div>
                      <p className="testimonial-text">{rev.content}</p>
                      <div className="rating">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`fas fa-star ${
                              i < rev.rating ? "active" : ""
                            }`}
                          ></i>
                        ))}
                      </div>
                    </div>
                    <div className="testimonial-author">
                      <div className="author-avatar">
                        <img src={avatar} alt={rev.name} />
                      </div>
                      <div className="author-info">
                        <h4 className="author-name">{rev.name}</h4>
                        <p className="author-role">{rev.role}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              <h2 className="cta-title">{t("home.cta.title")}</h2>
              <p className="cta-description">{t("home.cta.description")}</p>
              <div className="cta-buttons">
                <Link to={ROUTES.REGISTER} className="cta-button primary">
                  {t("home.cta.registerNow")}
                </Link>
                <Link to={ROUTES.LOGIN} className="cta-button secondary">
                  {t("home.cta.login")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default HomePage;
// End of file
