import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FindJobPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { ROUTES } from "../../constants/enums";

// Mock interpreter job dataset - easily replaceable with API/database calls
const INTERPRETER_JOBS = [
  {
    id: 1,
    title: "Senior English-Vietnamese Conference Interpreter",
    company: "GlobalSpeak",
    location: "Ho Chi Minh City",
    category: "Conference",
    level: "Senior",
    type: "Full-time",
    salary: "$2,500-3,500",
    tags: ["EN-VI", "Conference", "Business"],
    desc: "Lead simultaneous interpretation for international conferences, business summits, and diplomatic events.",
    fullDesc:
      "We are seeking an experienced Senior English-Vietnamese Conference Interpreter to join our dynamic team. You will be responsible for providing high-quality simultaneous and consecutive interpretation services for international conferences, business meetings, and diplomatic events. The ideal candidate will have excellent command of both English and Vietnamese, with deep cultural understanding and professional presentation skills.",
    requirements: [
      "5+ years of conference interpretation experience",
      "Certified interpretation credentials",
      "Fluency in English and Vietnamese",
      "Strong cultural awareness",
      "Professional presentation skills",
    ],
    benefits: [
      "Competitive salary package",
      "Health insurance",
      "Professional development opportunities",
      "Flexible working arrangements",
    ],
    contact: {
      email: "hr@globalspeak.com",
      phone: "+84 28 1234 5678",
      address: "123 Nguyen Hue St, District 1, Ho Chi Minh City",
    },
  },
  {
    id: 2,
    title: "Medical Interpreter (Japanese-Vietnamese)",
    company: "MedLingua",
    location: "Hanoi",
    category: "Medical",
    level: "Mid",
    type: "Contract",
    salary: "$1,800-2,200",
    tags: ["JA-VI", "Medical", "Healthcare"],
    desc: "Provide interpretation services for Japanese patients in Vietnamese hospitals and medical facilities.",
    fullDesc:
      "Join our specialized medical interpretation team to bridge communication gaps between Japanese patients and Vietnamese healthcare providers. This role requires deep understanding of medical terminology in both languages and sensitivity to cultural differences in healthcare settings.",
    requirements: [
      "Medical interpretation certification",
      "3+ years healthcare experience",
      "Fluency in Japanese and Vietnamese",
      "Medical terminology knowledge",
      "Patient confidentiality awareness",
    ],
    benefits: [
      "Contract-based flexibility",
      "Medical training provided",
      "Competitive hourly rates",
      "Professional development",
    ],
    contact: {
      email: "careers@medlingua.vn",
      phone: "+84 24 9876 5432",
      address: "456 Ba Trieu St, Hai Ba Trung, Hanoi",
    },
  },
  {
    id: 3,
    title: "Legal Court Interpreter",
    company: "JusticeWords",
    location: "Da Nang",
    category: "Legal",
    level: "Senior",
    type: "Part-time",
    salary: "$150-250/day",
    tags: ["EN-VI", "Legal", "Court"],
    desc: "Certified court interpreter for legal proceedings, depositions, and legal consultations.",
    fullDesc:
      "Provide certified interpretation services for court proceedings, legal depositions, and attorney-client consultations. This position requires precision, neutrality, and deep understanding of legal terminology and procedures.",
    requirements: [
      "Court interpreter certification",
      "Legal terminology expertise",
      "5+ years legal interpretation",
      "Sworn interpreter status",
      "Confidentiality clearance",
    ],
    benefits: [
      "Daily rate compensation",
      "Flexible scheduling",
      "Legal training opportunities",
      "Professional certification support",
    ],
    contact: {
      email: "legal@justicewords.vn",
      phone: "+84 236 789 0123",
      address: "789 Tran Phu St, Hai Chau, Da Nang",
    },
  },
  {
    id: 4,
    title: "Remote Business Interpreter",
    company: "VirtualLink",
    location: "Remote",
    category: "Business",
    level: "Mid",
    type: "Freelance",
    salary: "$80-120/hour",
    tags: ["EN-VI", "Remote", "Business"],
    desc: "Provide remote interpretation for business meetings, negotiations, and client calls via video platforms.",
    fullDesc:
      "Join our remote interpretation team to facilitate international business communications. Work from anywhere while connecting global businesses through professional interpretation services via video conferencing platforms.",
    requirements: [
      "Business interpretation experience",
      "Reliable internet connection",
      "Professional home office setup",
      "Video conferencing proficiency",
      "Flexible schedule availability",
    ],
    benefits: [
      "Remote work flexibility",
      "Hourly rate compensation",
      "Technology allowance",
      "International client exposure",
    ],
    contact: {
      email: "remote@virtuallink.com",
      phone: "+84 90 1234 5678",
      address: "Virtual Office - Remote Position",
    },
  },
  {
    id: 5,
    title: "Tourism & Travel Guide Interpreter",
    company: "VietnamTours",
    location: "Ho Chi Minh City",
    category: "Tourism",
    level: "Junior",
    type: "Seasonal",
    salary: "$1,200-1,800",
    tags: ["EN-VI", "Tourism", "Culture"],
    desc: "Guide international tourists, provide cultural interpretation and assist with travel experiences.",
    fullDesc:
      "Enhance tourist experiences by providing interpretation and cultural guidance services. Perfect opportunity for those passionate about Vietnamese culture and hospitality industry.",
    requirements: [
      "Tourism industry knowledge",
      "Cultural expertise",
      "Friendly personality",
      "Physical stamina for tours",
      "Basic first aid certification",
    ],
    benefits: [
      "Seasonal employment",
      "Tourism perks",
      "Cultural exchange opportunities",
      "Performance bonuses",
    ],
    contact: {
      email: "tours@vietnamtours.vn",
      phone: "+84 28 5555 6666",
      address: "321 Le Loi St, District 1, Ho Chi Minh City",
    },
  },
  {
    id: 6,
    title: "Technical Interpreter - Manufacturing",
    company: "TechTrans",
    location: "Binh Duong",
    category: "Technical",
    level: "Mid",
    type: "Full-time",
    salary: "$2,000-2,800",
    tags: ["EN-VI", "Manufacturing", "Technical"],
    desc: "Support technical training, equipment installation, and manufacturing process documentation.",
    fullDesc:
      "Join our technical interpretation team to support manufacturing operations and training programs. You'll work with international technical teams to ensure smooth knowledge transfer and operational excellence.",
    requirements: [
      "Technical background preferred",
      "Manufacturing experience",
      "EN-VI fluency",
      "Technical documentation skills",
      "Team collaboration",
    ],
    benefits: [
      "Manufacturing industry exposure",
      "Technical training",
      "Career advancement",
      "Competitive package",
    ],
    contact: {
      email: "hr@techtrans.vn",
      phone: "+84 274 333 4444",
      address: "Industrial Zone 1, Thu Dau Mot, Binh Duong",
    },
  },
  {
    id: 7,
    title: "Educational Campus Interpreter",
    company: "EduBridge International",
    location: "Hanoi",
    category: "Education",
    level: "Junior",
    type: "Part-time",
    salary: "$60-90/hour",
    tags: ["EN-VI", "Education", "Campus"],
    desc: "Assist international students with academic interpretation, orientation, and campus life support.",
    fullDesc:
      "Support international students' academic journey by providing interpretation services for lectures, orientation sessions, and campus activities. Perfect role for those passionate about education and cultural exchange.",
    requirements: [
      "Education background preferred",
      "Student-friendly approach",
      "Cultural sensitivity",
      "Flexible schedule",
      "Campus familiarity",
    ],
    benefits: [
      "Educational environment",
      "Student interaction",
      "Flexible hours",
      "Professional growth",
    ],
    contact: {
      email: "campus@edubridge.edu.vn",
      phone: "+84 24 7777 8888",
      address: "Cau Giay Campus, Hanoi University District",
    },
  },
  {
    id: 8,
    title: "Chinese-Vietnamese Business Interpreter",
    company: "SinoViet Partners",
    location: "Ho Chi Minh City",
    category: "Business",
    level: "Senior",
    type: "Full-time",
    salary: "$2,800-3,500",
    tags: ["ZH-VI", "Business", "Trade"],
    desc: "Facilitate China-Vietnam business partnerships, trade negotiations, and investment meetings.",
    fullDesc:
      "Lead interpretation for high-level business negotiations between Chinese and Vietnamese companies. This role requires deep understanding of both business cultures and expertise in trade terminology.",
    requirements: [
      "Advanced Chinese-Vietnamese skills",
      "Business interpretation experience",
      "Trade knowledge",
      "Cultural expertise",
      "Professional presentation",
    ],
    benefits: [
      "High-level business exposure",
      "International networking",
      "Premium compensation",
      "Career advancement",
    ],
    contact: {
      email: "business@sinoviet.com.vn",
      phone: "+84 28 9999 0000",
      address: "Bitexco Tower, District 1, Ho Chi Minh City",
    },
  },
  {
    id: 9,
    title: "Korean Entertainment Interpreter",
    company: "K-Wave Media",
    location: "Ho Chi Minh City",
    category: "Entertainment",
    level: "Mid",
    type: "Contract",
    salary: "$1,500-2,200",
    tags: ["KO-VI", "Entertainment", "Media"],
    desc: "Support Korean entertainment events, celebrity interviews, and cultural exchange programs.",
    fullDesc:
      "Be part of the Korean entertainment wave in Vietnam! Provide interpretation for K-pop events, drama productions, celebrity interviews, and cultural exchange programs between Korea and Vietnam.",
    requirements: [
      "Korean-Vietnamese fluency",
      "Entertainment industry knowledge",
      "Media experience",
      "Fan culture understanding",
      "Event coordination",
    ],
    benefits: [
      "Entertainment industry access",
      "Celebrity interactions",
      "Cultural experiences",
      "Media exposure",
    ],
    contact: {
      email: "talent@kwavemedia.vn",
      phone: "+84 28 5678 9012",
      address: "Entertainment District, District 7, Ho Chi Minh City",
    },
  },
  {
    id: 10,
    title: "Pharmaceutical Research Interpreter",
    company: "PharmaGlobal",
    location: "Remote",
    category: "Medical",
    level: "Senior",
    type: "Contract",
    salary: "$3,000-4,200",
    tags: ["EN-VI", "Pharmaceutical", "Research"],
    desc: "Specialized interpretation for clinical trials, research meetings, and regulatory compliance discussions.",
    fullDesc:
      "Provide highly specialized interpretation services for pharmaceutical research, clinical trials, and regulatory affairs. This role requires deep understanding of medical and pharmaceutical terminology with strict confidentiality requirements.",
    requirements: [
      "Pharmaceutical background",
      "Clinical research experience",
      "Medical terminology mastery",
      "Regulatory knowledge",
      "Confidentiality clearance",
    ],
    benefits: [
      "Premium compensation",
      "Research exposure",
      "Professional development",
      "Remote flexibility",
    ],
    contact: {
      email: "research@pharmaglobal.com",
      phone: "+84 90 3456 7890",
      address: "Remote Position - Global Operations",
    },
  },
];

const unique = (arr) => Array.from(new Set(arr));

export default function FindJobPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Application modal state
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [applicationData, setApplicationData] = useState({
    pdfFile: null,
    introduction: "",
    profileLink: "",
  });
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error", // error, success, warning, info
  });
  // Advanced filter state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    salaryRange: "",
    languages: "",
    jobType: "",
    certificate: "",
    experience: "",
    workLocation: "",
  });
  const pageSize = 9; // 3 x 3 layout

  // Mock user state - replace with actual auth state later
  const [user, setUser] = useState(null); // null = not logged in
  const [hasPremium, setHasPremium] = useState(false); // false = no premium subscription

  // Demo functions for testing different states (remove in production)
  function toggleUserLogin() {
    setUser(user ? null : { id: 1, name: "Demo User" });
  }

  function togglePremium() {
    setHasPremium(!hasPremium);
  }

  // Notification functions
  function showNotification(message, type = "error") {
    setNotification({
      show: true,
      message,
      type,
    });
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  }

  function hideNotification() {
    setNotification((prev) => ({ ...prev, show: false }));
  }

  const categories = useMemo(
    () => unique(INTERPRETER_JOBS.map((j) => j.category)),
    []
  );
  const locations = useMemo(
    () => unique(INTERPRETER_JOBS.map((j) => j.location)),
    []
  );
  const levels = useMemo(
    () => unique(INTERPRETER_JOBS.map((j) => j.level)),
    []
  );

  // Helper function to extract salary range for filtering
  const getSalaryValue = (salaryStr) => {
    const match = salaryStr.match(/\$(\d+(?:,\d+)*)/);
    return match ? parseInt(match[1].replace(/,/g, "")) : 0;
  };

  const filtered = useMemo(() => {
    return INTERPRETER_JOBS.filter((j) => {
      const kw = keyword.trim().toLowerCase();
      if (
        kw &&
        !(
          j.title.toLowerCase().includes(kw) ||
          j.company.toLowerCase().includes(kw) ||
          j.tags.some((tg) => tg.toLowerCase().includes(kw))
        )
      )
        return false;
      if (location && j.location !== location) return false;
      if (category && j.category !== category) return false;
      if (level && j.level !== level) return false;

      // Salary range filtering
      if (salaryRange) {
        const jobSalary = getSalaryValue(j.salary);
        switch (salaryRange) {
          case "0-1000":
            if (jobSalary > 1000) return false;
            break;
          case "1000-2000":
            if (jobSalary < 1000 || jobSalary > 2000) return false;
            break;
          case "2000-3000":
            if (jobSalary < 2000 || jobSalary > 3000) return false;
            break;
          case "3000+":
            if (jobSalary < 3000) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  }, [keyword, location, category, level, salaryRange]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageSafe = Math.min(page, totalPages);
  const slice = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  function submit(e) {
    e.preventDefault();
    setPage(1);
  }
  function reset() {
    setKeyword("");
    setLocation("");
    setCategory("");
    setLevel("");
    setSalaryRange("");
    setPage(1);
  }

  function openJobModal(job) {
    setSelectedJob(job);
    setIsModalOpen(true);
  }

  function closeJobModal() {
    setIsModalOpen(false);
    setSelectedJob(null);
  }

  function handleApply() {
    // Open application modal instead of directly applying
    setIsApplicationModalOpen(true);
  }

  function closeApplicationModal() {
    setIsApplicationModalOpen(false);
    setApplicationData({
      pdfFile: null,
      introduction: "",
      profileLink: "",
    });
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setApplicationData((prev) => ({
        ...prev,
        pdfFile: file,
      }));
    } else {
      showNotification(t("findJob.applicationModal.pdfOnlyError"), "error");
    }
  }

  function handleApplicationSubmit() {
    // Validate required fields with specific error messages
    if (!applicationData.pdfFile && !applicationData.introduction.trim()) {
      showNotification(t("findJob.applicationModal.validationError"), "error");
      return;
    }

    if (!applicationData.pdfFile) {
      showNotification(t("findJob.applicationModal.missingCV"), "error");
      return;
    }

    if (!applicationData.introduction.trim()) {
      showNotification(t("findJob.applicationModal.missingIntro"), "error");
      return;
    }

    // Submit application logic here
    console.log("Application submitted:", {
      job: selectedJob?.title,
      pdfFile: applicationData.pdfFile.name,
      introduction: applicationData.introduction,
      profileLink: applicationData.profileLink,
    });

    // Close both modals
    closeApplicationModal();
    closeJobModal();
    showNotification(t("findJob.applicationModal.successMessage"), "success");
  }

  function handleUpgradeToPremium() {
    // Close modal and navigate to pricing page
    closeJobModal();
    navigate(ROUTES.PRICING);
  }

  return (
    <MainLayout>
      <div className={styles.findJobRoot}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>{t("findJob.title")}</h1>
            <p className={styles.subtitle}>{t("findJob.subtitle")}</p>

            {/* Demo buttons for testing - remove in production */}
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={toggleUserLogin}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: user ? "#22c55e" : "#f3f4f6",
                  color: user ? "white" : "black",
                  cursor: "pointer",
                }}
              >
                {user ? "✓ Logged In" : "⚪ Not Logged In"}
              </button>
              <button
                onClick={togglePremium}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: hasPremium ? "#f59e0b" : "#f3f4f6",
                  color: hasPremium ? "white" : "black",
                  cursor: "pointer",
                }}
              >
                {hasPremium ? "👑 Premium" : "🔒 Free"}
              </button>
            </div>
          </header>

          <form className={styles.searchBar} onSubmit={submit}>
            <div className={styles.field}>
              <label>{t("findJob.keywordLabel")}</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("findJob.keywordPlaceholder")}
              />
            </div>
            <div className={styles.field}>
              <label>{t("findJob.locationLabel")}</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">{t("findJob.allLocations")}</option>
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>{t("findJob.specializationLabel")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{t("findJob.allSpecializations")}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>{t("findJob.levelLabel")}</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">{t("findJob.allLevels")}</option>
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>{t("findJob.salaryLabel")}</label>
              <select
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
              >
                <option value="">{t("findJob.allSalaryRanges")}</option>
                <option value="0-1000">{t("findJob.salaryUnder1000")}</option>
                <option value="1000-2000">
                  {t("findJob.salary1000to2000")}
                </option>
                <option value="2000-3000">
                  {t("findJob.salary2000to3000")}
                </option>
                <option value="3000+">{t("findJob.salary3000plus")}</option>
              </select>
            </div>
            <div className={styles.actions}>
              <button type="submit" className={styles.searchBtn}>
                {t("findJob.searchBtn")}
              </button>
              <button type="button" onClick={reset} className={styles.resetBtn}>
                {t("findJob.clearBtn")}
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedFilter(true)}
                className={styles.advancedBtn}
              >
                🔍 {t("findJob.advancedFilter")}
              </button>
            </div>
          </form>

          {/* Jobs Grid và các phần khác */}

          <div className={styles.jobsGrid}>
            {slice.length === 0 && (
              <div className={styles.empty}>{t("findJob.noJobsFound")}</div>
            )}
            {slice.map((job) => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobTop}>
                  <div className={styles.logo}>{job.company[0]}</div>
                  <div className={styles.jobInfo}>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <p className={styles.company}>{job.company}</p>
                    <div className={styles.meta}>
                      <span>📍 {job.location}</span>
                      <span>🎯 {job.category}</span>
                      <span>💼 {job.type}</span>
                      <span>⭐ {job.level}</span>
                      <span>💰 {job.salary}</span>
                    </div>
                  </div>
                </div>
                <p className={styles.desc}>{job.desc}</p>
                <div className={styles.tags}>
                  {job.tags.map((tg) => (
                    <span key={tg}>{tg}</span>
                  ))}
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.applyBtn}
                    onClick={() => openJobModal(job)}
                  >
                    {t("common.apply")}
                  </button>
                  <button className={styles.saveBtn}>{t("common.save")}</button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.pagination}>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`${styles.pageBtn} ${
                    p === pageSafe ? styles.active : ""
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Job Details Modal */}
        {isModalOpen && selectedJob && (
          <div className={styles.modalOverlay} onClick={closeJobModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.closeBtn} onClick={closeJobModal}>
                ×
              </button>

              <div className={styles.modalHeader}>
                <div className={styles.modalLogo}>{selectedJob.company[0]}</div>
                <div className={styles.modalJobInfo}>
                  <h2 className={styles.modalJobTitle}>{selectedJob.title}</h2>
                  <p className={styles.modalCompany}>{selectedJob.company}</p>
                  <div className={styles.modalMeta}>
                    <span>📍 {selectedJob.location}</span>
                    <span>🎯 {selectedJob.category}</span>
                    <span>💼 {selectedJob.type}</span>
                    <span>⭐ {selectedJob.level}</span>
                    <span>💰 {selectedJob.salary}</span>
                  </div>
                </div>
                <div className={styles.modalHeaderActions}>
                  <button
                    className={styles.modalApplyBtn}
                    onClick={handleApply}
                  >
                    {t("common.applyNow")}
                  </button>
                  <button className={styles.modalSaveBtn}>
                    {t("common.save")}
                  </button>
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalLeft}>
                  <h3>Contact Information</h3>
                  <div className={styles.contactInfo}>
                    <div
                      className={`${styles.contactItem} ${
                        !user || !hasPremium ? styles.blurred : ""
                      }`}
                    >
                      <span className={styles.contactLabel}>📧 Email:</span>
                      <span className={styles.contactValue}>
                        {selectedJob.contact?.email}
                      </span>
                    </div>
                    <div
                      className={`${styles.contactItem} ${
                        !user || !hasPremium ? styles.blurred : ""
                      }`}
                    >
                      <span className={styles.contactLabel}>📞 Phone:</span>
                      <span className={styles.contactValue}>
                        {selectedJob.contact?.phone}
                      </span>
                    </div>
                    <div
                      className={`${styles.contactItem} ${
                        !user || !hasPremium ? styles.blurred : ""
                      }`}
                    >
                      <span className={styles.contactLabel}>📍 Address:</span>
                      <span className={styles.contactValue}>
                        {selectedJob.contact?.address}
                      </span>
                    </div>
                  </div>

                  {(!user || !hasPremium) && (
                    <div className={styles.premiumNotice}>
                      <p>
                        🔒 Contact information is only available for premium
                        members.
                      </p>
                      <button
                        className={styles.upgradeBtn}
                        onClick={handleUpgradeToPremium}
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.modalRight}>
                  <div className={styles.section}>
                    <h3>Job Description</h3>
                    <p>{selectedJob.fullDesc || selectedJob.desc}</p>
                  </div>

                  <div className={styles.section}>
                    <h3>Requirements</h3>
                    <ul>
                      {selectedJob.requirements?.map((req, index) => (
                        <li key={index}>{req}</li>
                      )) || <li>No specific requirements listed</li>}
                    </ul>
                  </div>

                  <div className={styles.section}>
                    <h3>Benefits</h3>
                    <ul>
                      {selectedJob.benefits?.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      )) || <li>Benefits to be discussed</li>}
                    </ul>
                  </div>

                  <div className={styles.section}>
                    <h3>Skills & Tags</h3>
                    <div className={styles.modalTags}>
                      {selectedJob.tags.map((tag) => (
                        <span key={tag} className={styles.modalTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Modal */}
        {isApplicationModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.applicationModal}>
              <div className={styles.applicationModalHeader}>
                <h2>
                  {t("findJob.applicationModal.title")} {selectedJob?.title}
                </h2>
                <button
                  className={styles.closeBtn}
                  onClick={closeApplicationModal}
                >
                  ×
                </button>
              </div>

              <div className={styles.applicationModalBody}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    {t("findJob.applicationModal.uploadCV")}{" "}
                    <span className={styles.required}>
                      {t("findJob.applicationModal.required")}
                    </span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className={styles.fileInput}
                  />
                  {applicationData.pdfFile && (
                    <div className={styles.filePreview}>
                      📄 {t("findJob.applicationModal.fileSelected")}{" "}
                      {applicationData.pdfFile.name}
                    </div>
                  )}
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    {t("findJob.applicationModal.introduction")}{" "}
                    <span className={styles.required}>
                      {t("findJob.applicationModal.required")}
                    </span>
                  </label>
                  <textarea
                    value={applicationData.introduction}
                    onChange={(e) =>
                      setApplicationData((prev) => ({
                        ...prev,
                        introduction: e.target.value,
                      }))
                    }
                    placeholder={t("findJob.applicationModal.introPlaceholder")}
                    className={styles.textArea}
                    rows={5}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    {t("findJob.applicationModal.profileLink")}
                  </label>
                  <input
                    type="url"
                    value={applicationData.profileLink}
                    onChange={(e) =>
                      setApplicationData((prev) => ({
                        ...prev,
                        profileLink: e.target.value,
                      }))
                    }
                    placeholder={t(
                      "findJob.applicationModal.profilePlaceholder"
                    )}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.applicationModalActions}>
                  <button
                    className={styles.cancelBtn}
                    onClick={closeApplicationModal}
                  >
                    {t("findJob.applicationModal.cancel")}
                  </button>
                  <button
                    className={styles.submitBtn}
                    onClick={handleApplicationSubmit}
                  >
                    {t("findJob.applicationModal.submit")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Filter Modal */}
        {showAdvancedFilter && (
          <div className={styles.modalOverlay}>
            <div className={styles.advancedFilterModal}>
              <div className={styles.advancedFilterHeader}>
                <h2>{t("findJob.advancedFilter")}</h2>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowAdvancedFilter(false)}
                >
                  ×
                </button>
              </div>

              <div className={styles.advancedFilterBody}>
                <div className={styles.advancedFilterGrid}>
                  {/* Salary Range */}
                  <div className={styles.field}>
                    <label>{t("findJob.advancedSalaryRange")}</label>
                    <select
                      value={advancedFilters.salaryRange}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          salaryRange: e.target.value,
                        }))
                      }
                    >
                      <option value="">{t("findJob.allSalaryRanges")}</option>
                      <option value="0-1000">
                        {t("findJob.salaryUnder1000")}
                      </option>
                      <option value="1000-2000">
                        {t("findJob.salary1000to2000")}
                      </option>
                      <option value="2000-3000">
                        {t("findJob.salary2000to3000")}
                      </option>
                      <option value="3000-4000">
                        {t("findJob.salary3000to4000")}
                      </option>
                      <option value="4000-5000">
                        {t("findJob.salary4000to5000")}
                      </option>
                      <option value="5000+">
                        {t("findJob.salary5000plus")}
                      </option>
                    </select>
                  </div>

                  {/* Languages */}
                  <div className={styles.field}>
                    <label>{t("findJob.advancedLanguages")}</label>
                    <select
                      value={advancedFilters.languages}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          languages: e.target.value,
                        }))
                      }
                    >
                      <option value="">{t("findJob.allLanguages")}</option>
                      <option value="EN-VI">English - Vietnamese</option>
                      <option value="JA-VI">Japanese - Vietnamese</option>
                      <option value="KO-VI">Korean - Vietnamese</option>
                      <option value="ZH-VI">Chinese - Vietnamese</option>
                      <option value="FR-VI">French - Vietnamese</option>
                      <option value="DE-VI">German - Vietnamese</option>
                      <option value="ES-VI">Spanish - Vietnamese</option>
                    </select>
                  </div>

                  {/* Job Type */}
                  <div className={styles.field}>
                    <label>{t("findJob.advancedJobType")}</label>
                    <select
                      value={advancedFilters.jobType}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          jobType: e.target.value,
                        }))
                      }
                    >
                      <option value="">{t("findJob.allJobTypes")}</option>
                      <option value="Full-time">{t("findJob.fullTime")}</option>
                      <option value="Part-time">{t("findJob.partTime")}</option>
                      <option value="Contract">{t("findJob.contract")}</option>
                      <option value="Freelance">
                        {t("findJob.freelance")}
                      </option>
                    </select>
                  </div>

                  {/* Certificate */}
                  <div className={styles.field}>
                    <label>{t("findJob.advancedCertificate")}</label>
                    <select
                      value={advancedFilters.certificate}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          certificate: e.target.value,
                        }))
                      }
                    >
                      <option value="">{t("findJob.allCertificates")}</option>
                      <option value="TOEIC">{t("findJob.toeic")}</option>
                      <option value="IELTS">{t("findJob.ielts")}</option>
                      <option value="TOPIK">{t("findJob.topik")}</option>
                      <option value="JLPT">{t("findJob.jlpt")}</option>
                      <option value="HSK">{t("findJob.hsk")}</option>
                      <option value="DELF">{t("findJob.delf")}</option>
                    </select>
                  </div>

                  {/* Experience */}
                  <div className={styles.field}>
                    <label>{t("findJob.advancedExperience")}</label>
                    <select
                      value={advancedFilters.experience}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          experience: e.target.value,
                        }))
                      }
                    >
                      <option value="">{t("findJob.allExperience")}</option>
                      <option value="0-1">{t("findJob.experience01")}</option>
                      <option value="1-3">{t("findJob.experience13")}</option>
                      <option value="3-5">{t("findJob.experience35")}</option>
                      <option value="5+">{t("findJob.experience5plus")}</option>
                    </select>
                  </div>

                  {/* Work Location */}
                  <div className={styles.field}>
                    <label>{t("findJob.advancedWorkLocation")}</label>
                    <select
                      value={advancedFilters.workLocation}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          workLocation: e.target.value,
                        }))
                      }
                    >
                      <option value="">{t("findJob.allWorkLocations")}</option>
                      <option value="On-site">{t("findJob.onSite")}</option>
                      <option value="Remote">{t("findJob.remote")}</option>
                      <option value="Hybrid">{t("findJob.hybrid")}</option>
                    </select>
                  </div>
                </div>

                <div className={styles.advancedFilterActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setAdvancedFilters({
                        salaryRange: "",
                        languages: "",
                        jobType: "",
                        certificate: "",
                        experience: "",
                        workLocation: "",
                      });
                    }}
                    className={styles.clearAdvancedBtn}
                  >
                    {t("findJob.clearAdvanced")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setShowAdvancedFilter(false);
                      // Apply filters will be implemented
                    }}
                    className={styles.applyAdvancedBtn}
                  >
                    {t("findJob.applyFilters")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Notification */}
        {notification.show && (
          <div className={styles.notificationOverlay}>
            <div
              className={`${styles.notification} ${styles[notification.type]}`}
            >
              <div className={styles.notificationContent}>
                <div className={styles.notificationIcon}>
                  {notification.type === "error" && "⚠️"}
                  {notification.type === "success" && "✅"}
                  {notification.type === "warning" && "🔔"}
                  {notification.type === "info" && "ℹ️"}
                </div>
                <div className={styles.notificationMessage}>
                  {notification.message}
                </div>
                <button
                  className={styles.notificationClose}
                  onClick={hideNotification}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
