import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import jobService from "../../services/jobService.js";
import interpreterService from "../../services/interpreterService.js";
import { FaGlobe, FaBolt, FaBriefcase, FaBriefcase as FaBriefcaseIcon, FaLanguage, FaPlus, FaBookmark, FaMapMarkerAlt, FaDollarSign, FaClock, FaTachometerAlt } from "react-icons/fa";

const HomePage = () => {
  const { lang, t } = useLanguage();
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [jobsData, setJobsData] = useState([]);
  const [interpretersData, setInterpretersData] = useState([]);
  const [testimonialsData, setTestimonialsData] = useState([]);
  const [statsData, setStatsData] = useState({
    totalJobs: 50000,
    totalInterpreters: 25000,
    totalOrganizations: 5000,
    successRate: 98,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Redirect admin to admin dashboard when accessing home page
  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "admin") {
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    }
  }, [loading, isAuthenticated, user?.role, navigate]);

  // Anim refs
  const heroRef = useScrollAnimation("animate-on-scroll");
  const statsRef = useStaggeredAnimation(200);
  const featuresRef = useStaggeredAnimation(150);
  const jobsRef = useScrollAnimation("slide-in-left");
  const testimonialsRef = useScrollAnimation("slide-in-right");
  useMotionPreferences();

  // Counters - use real data from API
  const counter1 = useCounter(statsData.totalJobs, 2000);
  const counter2 = useCounter(statsData.totalInterpreters, 2000);
  const counter3 = useCounter(statsData.totalOrganizations, 2000);
  const counter4 = useCounter(statsData.successRate, 2000);

  // Fetch public stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await jobService.getPublicStats();
        if (response.success && response.data) {
          setStatsData({
            totalJobs: response.data.totalJobs || 0,
            totalInterpreters: response.data.totalInterpreters || 0,
            totalOrganizations: response.data.totalOrganizations || 0,
            successRate: response.data.successRate || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching public stats:", error);
        // Keep default values on error
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch featured jobs or interpreters based on user role
  useEffect(() => {
    const fetchData = async () => {
      try {
        // If user is client, fetch interpreters; otherwise fetch jobs
        if (user?.role === "client") {
          const response = await interpreterService.getTopRatedInterpreters(9);
          if (response.success && response.data) {
            // Transform interpreter data to match UI format
            const transformedInterpreters = response.data.map((interpreter) => ({
              id: interpreter.id,
              name: interpreter.fullName || "Interpreter",
              avatar: interpreter.avatar || null,
              location: interpreter.address || interpreter.province || "Location TBD",
              rate: interpreter.hourlyRate
                ? `$${interpreter.hourlyRate}/${interpreter.currency || "USD"}`
                : "Negotiable",
              experience: interpreter.experience ? `${interpreter.experience} years` : "N/A",
              rating: interpreter.rating || 0,
              languages: interpreter.languages?.map((l) => l.language?.name || l.name || "").filter(Boolean) || [],
              specializations: interpreter.specializations?.map((s) => s.name || s).filter(Boolean) || [],
            }));
            setInterpretersData(transformedInterpreters);
          } else {
            setInterpretersData([]);
          }
        } else {
          // Fetch jobs for interpreters or non-logged-in users
          const response = await jobService.getFeaturedJobs(9);
          if (response.success && response.data) {
            // Transform API data to match UI format
            const transformedJobs = response.data.map((job) => ({
              id: job.id,
              title: job.title,
              company: job.organization?.name || "Company",
              companyLogo: job.organization?.logo || "/default-logo.png",
              location: job.province || job.address || "Location TBD",
              salary: job.minSalary && job.maxSalary
                ? `$${job.minSalary}-${job.maxSalary}`
                : job.minSalary
                ? `$${job.minSalary}+`
                : "Negotiable",
              type: job.workingMode?.name || "Full-time",
              urgent: job.statusOpenStop === "open" && new Date(job.expirationDate) > new Date(),
              skills: [
                ...(job.requiredLanguages?.map((rl) => rl.language?.name || "") || []),
                ...(job.domains?.map((d) => d.domain?.name || d.name || "") || []),
              ].filter(Boolean),
            }));
            setJobsData(transformedJobs);
          } else {
            setJobsData([]);
          }
        }
      } catch (error) {
        console.error("Error fetching featured data:", error);
        if (user?.role === "client") {
          setInterpretersData([]);
        } else {
          setJobsData([]);
        }
      }
    };

    fetchData();
  }, [user?.role]);

  // Fetch testimonials from API
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await interpreterService.getTopRatedInterpreters(3);
        if (response.success && response.data && response.data.length > 0) {
          // Transform interpreter data to testimonial format
          const transformedTestimonials = response.data
            .filter(interpreter => interpreter.portfolio && interpreter.portfolio.trim()) // Only include interpreters with portfolio
            .map((interpreter) => ({
              id: interpreter.id,
              name: interpreter.fullName || "Interpreter",
              role: interpreter.role || "Interpreter",
              rating: Math.round(interpreter.rating || 5),
              content: interpreter.portfolio,
              avatar: interpreter.avatar || null,
            }));
          setTestimonialsData(transformedTestimonials);
        } else {
          // No data, set empty array
          setTestimonialsData([]);
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        // On error, set empty array
        setTestimonialsData([]);
      }
    };

    fetchTestimonials();
  }, []);

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
  }, [jobsData.length]);

  // Determine which data to use based on user role
  const displayData = user?.role === "client" ? interpretersData : jobsData;
  const isClient = user?.role === "client";

  const totalGroups = useMemo(
    () => Math.ceil(displayData.length / visibleCount),
    [visibleCount, displayData.length]
  );

  useEffect(() => {
    if (isJobPaused || totalGroups <= 1) return;
    const id = setInterval(
      () => setGroupIndex((g) => (g + 1) % totalGroups),
      3000
    );
    return () => clearInterval(id);
  }, [isJobPaused, totalGroups]);

  useEffect(() => setGroupIndex(0), [lang, visibleCount, user?.role]);

  // Format stats with real data from API
  const formatNumber = (num) => {
    if (num >= 1000) {
      // Format as "50,000" style
      return num.toLocaleString("en-US");
    }
    return num.toString();
  };

  const stats = [
    {
      number: statsLoading ? "..." : `${formatNumber((statsData.totalJobs || 0) * 1000)}+`,
      label: t("home.stats", [])[0]?.label || "Jobs",
    },
    {
      number: statsLoading ? "..." : `${formatNumber((statsData.totalInterpreters || 0) * 1000)}+`,
      label: t("home.stats", [])[1]?.label || "Candidates",
    },
    {
      number: statsLoading ? "..." : `${formatNumber((statsData.totalOrganizations || 0) * 1000)}+`,
      label: t("home.stats", [])[2]?.label || "Companies",
    },
    {
      number: statsLoading ? "..." : `${statsData.successRate || 0}%`,
      label: t("home.stats", [])[3]?.label || "Success Rate",
    },
  ];
  const featuresData = t("home.features", []);
  // Use real testimonials from API only, no fallback
  const testimonials = testimonialsData;
  
  // Map icon keys to FontAwesome icons
  const iconMap = {
    globe: FaGlobe,
    bolt: FaBolt,
    briefcase: FaBriefcase,
  };
  
  // Transform features to include icon components
  const features = featuresData.map((feature) => ({
    ...feature,
    iconComponent: iconMap[feature.icon] || FaGlobe,
  }));

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
                {user?.role === "client" ? (
                  <>
                    <Link
                      to={ROUTES.FIND_INTERPRETER}
                      className="action-button primary ripple-effect"
                    >
                      <FaLanguage />
                      <span>{t("common.findInterpreter") || "Find Interpreter"}</span>
                    </Link>
                    <Link
                      to={ROUTES.POST_JOB}
                      className="action-button secondary ripple-effect"
                    >
                      <FaPlus />
                      <span>{t("common.postJob") || "Post Job"}</span>
                    </Link>
                  </>
                ) : user?.role === "interpreter" ? (
                  <Link
                    to={ROUTES.FIND_JOB}
                    className="action-button primary ripple-effect"
                  >
                    <FaBriefcaseIcon />
                    <span>{t("common.findJob") || "Find Jobs"}</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to={ROUTES.FIND_JOB}
                      className="action-button primary ripple-effect"
                    >
                      <FaBriefcaseIcon />
                      <span>{t("common.findJob") || "Find Jobs"}</span>
                    </Link>
                    <Link
                      to={ROUTES.FIND_INTERPRETER}
                      className="action-button secondary ripple-effect"
                    >
                      <FaLanguage />
                      <span>{t("common.findInterpreter") || "Find Interpreter"}</span>
                    </Link>
                  </>
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
                    {feature.iconComponent ? <feature.iconComponent /> : <span>{feature.icon}</span>}
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
                {isClient 
                  ? t("home.featuredInterpreters.title") || "Featured Interpreters"
                  : t("home.featuredJobs.title") || "Featured Interpreter Jobs"}
              </h2>
              <p className="section-subtitle">
                {isClient
                  ? t("home.featuredInterpreters.subtitle") || "Top-rated professional interpreters ready to help"
                  : t("home.featuredJobs.subtitle") || "Great opportunities for professional interpreters"}
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
                {displayData.map((item, idx) => {
                  if (isClient) {
                    // Render interpreter card for client
                    const interpreter = item;
                    return (
                      <div
                        className="job-slide"
                        key={interpreter.id}
                        aria-hidden={Math.floor(idx / visibleCount) !== groupIndex}
                      >
                        <div className="job-card hover-lift magnetic-hover breathing-effect">
                          <div className="job-header">
                            <h3 className="job-title">{interpreter.name}</h3>
                            <div className="job-actions">
                              <button
                                className="action-btn save-btn"
                                title={t("common.save")}
                                aria-label={t("common.save")}
                              >
                                <FaBookmark />
                              </button>
                            </div>
                          </div>
                          <div className="job-company">
                            <div className="company-logo">
                              {interpreter.avatar ? (
                                <img 
                                  src={interpreter.avatar.startsWith("http") 
                                    ? interpreter.avatar 
                                    : `http://localhost:4000${interpreter.avatar}`} 
                                  alt={interpreter.name}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    const placeholder = e.target.nextElementSibling;
                                    if (placeholder) {
                                      placeholder.style.display = "flex";
                                    }
                                  }}
                                />
                              ) : null}
                              <div 
                                className="company-logo-placeholder" 
                                style={{ 
                                  display: interpreter.avatar ? "none" : "flex" 
                                }}
                              >
                                {interpreter.name?.charAt(0)?.toUpperCase() || "I"}
                              </div>
                            </div>
                            <span>{interpreter.name}</span>
                          </div>
                          <div className="job-details">
                            <div className="job-detail">
                              <FaMapMarkerAlt />
                              <span>{interpreter.location}</span>
                            </div>
                            <div className="job-detail">
                              <FaDollarSign />
                              <span>{interpreter.rate}</span>
                            </div>
                            <div className="job-detail">
                              <FaClock />
                              <span>{interpreter.experience}</span>
                            </div>
                          </div>
                          <div className="job-skills">
                            {[...(interpreter.languages || []), ...(interpreter.specializations || [])].slice(0, 3).map((skill, i2) => (
                              <span key={i2} className="skill-tag">
                                {skill}
                              </span>
                            ))}
                          </div>
                          <button 
                            className="apply-btn ripple-effect"
                            onClick={() => navigate(`${ROUTES.FIND_INTERPRETER}?id=${interpreter.id}`)}
                          >
                            <span>{t("common.viewDetails")}</span>
                            <i className="fas fa-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    // Render job card for interpreter or non-logged-in users
                    const job = item;
                    return (
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
                                <FaBookmark />
                              </button>
                            </div>
                          </div>
                          <div className="job-company">
                            <div className="company-logo">
                              {job.companyLogo && job.companyLogo !== "/default-logo.png" ? (
                                <img 
                                  src={job.companyLogo.startsWith("http") 
                                    ? job.companyLogo 
                                    : `http://localhost:4000${job.companyLogo}`} 
                                  alt={job.company}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    const placeholder = e.target.nextElementSibling;
                                    if (placeholder) {
                                      placeholder.style.display = "flex";
                                    }
                                  }}
                                />
                              ) : null}
                              <div 
                                className="company-logo-placeholder" 
                                style={{ 
                                  display: (job.companyLogo && job.companyLogo !== "/default-logo.png") ? "none" : "flex" 
                                }}
                              >
                                {job.company?.charAt(0)?.toUpperCase() || "C"}
                              </div>
                            </div>
                            <span>{job.company}</span>
                          </div>
                          <div className="job-details">
                            <div className="job-detail">
                              <FaMapMarkerAlt />
                              <span>{job.location}</span>
                            </div>
                            <div className="job-detail">
                              <FaDollarSign />
                              <span>{job.salary}</span>
                            </div>
                            <div className="job-detail">
                              <FaClock />
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
                          <button 
                            className="apply-btn ripple-effect"
                            onClick={() => navigate(ROUTES.JOB_DETAIL.replace(":id", job.id))}
                          >
                            <span>{t("common.apply")}</span>
                            <i className="fas fa-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    );
                  }
                })}
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
            </div>
            <div className="view-all-container">
              <Link 
                to={isClient ? ROUTES.FIND_INTERPRETER : ROUTES.FIND_JOB} 
                className="view-all-btn"
              >
                {t("common.viewAll")} <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </section>
        {testimonials.length > 0 && (
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
                // Handle avatar: use from API if available, otherwise use placeholder
                const avatarUrl = rev.avatar 
                  ? (rev.avatar.startsWith("http") 
                      ? rev.avatar 
                      : `http://localhost:4000${rev.avatar}`)
                  : null;
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
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={rev.name} onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextElementSibling.style.display = "flex";
                          }} />
                        ) : null}
                        <div className="avatar-placeholder" style={{ display: avatarUrl ? "none" : "flex" }}>
                          {rev.name?.charAt(0)?.toUpperCase() || "I"}
                        </div>
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
        )}
        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              {user ? (
                <>
                  <h2 className="cta-title">
                    {t("home.cta.loggedIn.title") || `Welcome back, ${user.fullName || user.email}!`}
                  </h2>
                  <p className="cta-description">
                    {t("home.cta.loggedIn.description") || "Continue exploring opportunities and grow your career"}
                  </p>
                  <div className="cta-buttons">
                    {user.role === "client" ? (
                      <>
                        <Link to={ROUTES.FIND_INTERPRETER} className="cta-button primary">
                          <FaLanguage /> {t("common.findInterpreter") || "Find Interpreter"}
                        </Link>
                        <Link to={ROUTES.POST_JOB} className="cta-button secondary">
                          <FaPlus /> {t("common.postJob") || "Post Job"}
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to={ROUTES.FIND_JOB} className="cta-button primary">
                          <FaBriefcaseIcon /> {t("common.findJob") || "Find Jobs"}
                        </Link>
                        <Link to={ROUTES.DASHBOARD} className="cta-button secondary">
                          <FaTachometerAlt /> {t("common.dashboard") || "Dashboard"}
                        </Link>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default HomePage;
// End of file
