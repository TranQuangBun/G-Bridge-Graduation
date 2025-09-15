import React, { useState } from "react";
import styles from "./ProfilePage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";

// Mock data for profile
const MOCK_PROFILE = {
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  name: "Nguyễn Minh Anh",
  email: "minh.anh@email.com",
  phone: "+84 912 345 678",
  dateOfBirth: "1995-03-15",
  gender: "female",
  address: {
    country: "Vietnam",
    city: "Ho Chi Minh City",
    district: "District 1",
    street: "123 Nguyen Hue Street, Ward Ben Nghe",
  },
  kycStatus: "verified",
  about:
    "Experienced English-Vietnamese interpreter with 5+ years in medical and business interpretation. Passionate about bridging communication gaps and helping people connect across languages.",
  languages: [
    { name: "English", level: "Native", certified: true },
    { name: "Vietnamese", level: "Native", certified: true },
    { name: "Japanese", level: "Intermediate", certified: false },
  ],
  certifications: [
    { name: "TOEIC", score: "990", year: "2023" },
    { name: "IELTS", score: "8.5", year: "2022" },
    { name: "Medical Interpreter Certification", year: "2021" },
  ],
  experience: [
    {
      title: "Senior Medical Interpreter",
      company: "MedLingua",
      period: "2021 - Present",
      description:
        "Providing interpretation services for medical consultations and procedures",
    },
    {
      title: "Conference Interpreter",
      company: "GlobalSpeak",
      period: "2019 - 2021",
      description:
        "Simultaneous interpretation for international business conferences",
    },
  ],
  reviews: [
    {
      id: 1,
      client: "Dr. Sarah Johnson",
      company: "International Medical Center",
      rating: 5,
      comment:
        "Excellent interpretation skills and very professional attitude.",
      date: "2025-01-10",
    },
    {
      id: 2,
      client: "James Wilson",
      company: "Global Tech Corp",
      rating: 5,
      comment: "Outstanding performance during our business negotiations.",
      date: "2025-01-05",
    },
    {
      id: 3,
      client: "Maria Garcia",
      company: "Healthcare Plus",
      rating: 4,
      comment:
        "Very helpful and accurate translations during patient consultations.",
      date: "2024-12-28",
    },
  ],
  stats: {
    totalJobs: 156,
    rating: 4.9,
    responseTime: "< 2 hours",
    completionRate: "99%",
  },
};

const MOCK_CVS = [
  {
    id: 1,
    name: "Medical_Interpreter_CV_2025.pdf",
    size: "2.4 MB",
    uploadDate: "2025-01-10",
    type: "primary",
  },
  {
    id: 2,
    name: "Business_Interpreter_Resume.pdf",
    size: "1.8 MB",
    uploadDate: "2025-01-08",
    type: "secondary",
  },
  {
    id: 3,
    name: "Portfolio_Translation_Works.pdf",
    size: "3.2 MB",
    uploadDate: "2025-01-05",
    type: "portfolio",
  },
];

const COUNTRIES = ["Vietnam", "United States", "Japan", "Korea", "Singapore"];
const CITIES = {
  Vietnam: ["Ho Chi Minh City", "Hanoi", "Da Nang", "Can Tho"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston"],
  Japan: ["Tokyo", "Osaka", "Kyoto", "Yokohama"],
  Korea: ["Seoul", "Busan", "Incheon", "Daegu"],
  Singapore: ["Singapore"],
};

const SIDEBAR_MENU = [
  { id: "overview", icon: "📊", labelKey: "overview", active: false },
  { id: "applications", icon: "📋", labelKey: "applications", active: false },
  { id: "favorites", icon: "❤️", labelKey: "favorites", active: false },
  { id: "alerts", icon: "🔔", labelKey: "alerts", active: false },
  { id: "profile", icon: "👤", labelKey: "profile", active: true },
  { id: "settings", icon: "⚙️", labelKey: "settings", active: false },
];

function ProfilePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [cvs, setCvs] = useState(MOCK_CVS);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [activeMenu, setActiveMenu] = useState("profile");

  const handleEditPersonal = () => {
    setIsEditingPersonal(!isEditingPersonal);
  };

  const handleEditAddress = () => {
    setIsEditingAddress(!isEditingAddress);
  };

  const handleDropdownToggle = (cvId) => {
    setActiveDropdown(activeDropdown === cvId ? null : cvId);
  };

  const handleDeleteCV = (cvId) => {
    setCvs(cvs.filter((cv) => cv.id !== cvId));
    setActiveDropdown(null);
  };

  const handleAddCV = () => {
    // Logic to add new CV
    console.log("Add new CV");
  };

  const handleUpdateProfile = () => {
    // Logic to update profile
    console.log("Update profile");
  };

  const nextReview = () => {
    setCurrentReviewIndex((prev) =>
      prev === profile.reviews.length - 1 ? 0 : prev + 1
    );
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) =>
      prev === 0 ? profile.reviews.length - 1 : prev - 1
    );
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`${styles.star} ${i < rating ? styles.starFilled : ""}`}
      >
        ★
      </span>
    ));
  };

  const getKYCStatusInfo = (status) => {
    switch (status) {
      case "verified":
        return {
          text: t("profile.kyc.verified"),
          class: styles.kycVerified,
          icon: "✓",
        };
      case "pending":
        return {
          text: t("profile.kyc.pending"),
          class: styles.kycPending,
          icon: "⏳",
        };
      case "rejected":
        return {
          text: t("profile.kyc.rejected"),
          class: styles.kycRejected,
          icon: "✗",
        };
      default:
        return {
          text: t("profile.kyc.notSubmitted"),
          class: styles.kycNotSubmitted,
          icon: "!",
        };
    }
  };

  return (
    <MainLayout>
      <div className={styles.profileRoot}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>{t("dashboard.pageTitle")}</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {SIDEBAR_MENU.map((item) => (
              <button
                key={item.id}
                className={`${styles.menuItem} ${
                  activeMenu === item.id ? styles.menuItemActive : ""
                }`}
                onClick={() => {
                  setActiveMenu(item.id);
                  if (item.id === "overview") {
                    navigate(ROUTES.DASHBOARD);
                  } else if (item.id === "applications") {
                    navigate(ROUTES.MY_APPLICATIONS);
                  }
                  // Add other navigation logic for other menu items when implemented
                }}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>
                  {t(`dashboard.navigation.${item.labelKey}`)}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Profile Section */}
          <div className={styles.profileSection}>
            <div className={styles.profileGrid}>
              {/* Left Column */}
              <div className={styles.leftColumn}>
                {/* Avatar Card */}
                <div className={styles.card}>
                  <div className={styles.avatarSection}>
                    <div className={styles.avatarContainer}>
                      <img
                        src={profile.avatar}
                        alt="Profile"
                        className={styles.avatar}
                      />
                      <button className={styles.avatarEditBtn}>
                        <span className={styles.cameraIcon}>📷</span>
                      </button>
                    </div>
                    <div className={styles.avatarInfo}>
                      <h2 className={styles.userName}>{profile.name}</h2>
                      <p className={styles.userEmail}>{profile.email}</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information Card */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {t("profile.personalInfo.title")}
                    </h3>
                    <button
                      className={styles.editBtn}
                      onClick={handleEditPersonal}
                    >
                      {isEditingPersonal
                        ? t("profile.save")
                        : t("profile.edit")}
                    </button>
                  </div>
                  <div className={styles.cardContent}>
                    {isEditingPersonal ? (
                      <div className={styles.editForm}>
                        <div className={styles.formGroup}>
                          <label>{t("profile.personalInfo.fullName")}</label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) =>
                              setProfile({ ...profile, name: e.target.value })
                            }
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>{t("profile.personalInfo.phone")}</label>
                          <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) =>
                              setProfile({ ...profile, phone: e.target.value })
                            }
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>{t("profile.personalInfo.dateOfBirth")}</label>
                          <input
                            type="date"
                            value={profile.dateOfBirth}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                dateOfBirth: e.target.value,
                              })
                            }
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>{t("profile.personalInfo.gender")}</label>
                          <select
                            value={profile.gender}
                            onChange={(e) =>
                              setProfile({ ...profile, gender: e.target.value })
                            }
                            className={styles.select}
                          >
                            <option value="male">
                              {t("profile.personalInfo.male")}
                            </option>
                            <option value="female">
                              {t("profile.personalInfo.female")}
                            </option>
                            <option value="other">
                              {t("profile.personalInfo.other")}
                            </option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.infoDisplay}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>
                            {t("profile.personalInfo.phone")}:
                          </span>
                          <span className={styles.infoValue}>
                            {profile.phone}
                          </span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>
                            {t("profile.personalInfo.dateOfBirth")}:
                          </span>
                          <span className={styles.infoValue}>
                            {new Date(profile.dateOfBirth).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>
                            {t("profile.personalInfo.gender")}:
                          </span>
                          <span className={styles.infoValue}>
                            {t(`profile.personalInfo.${profile.gender}`)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Card */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {t("profile.address.title")}
                    </h3>
                    <button
                      className={styles.editBtn}
                      onClick={handleEditAddress}
                    >
                      {isEditingAddress ? t("profile.save") : t("profile.edit")}
                    </button>
                  </div>
                  <div className={styles.cardContent}>
                    {isEditingAddress ? (
                      <div className={styles.editForm}>
                        <div className={styles.formGroup}>
                          <label>{t("profile.address.country")}</label>
                          <select
                            value={profile.address.country}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                address: {
                                  ...profile.address,
                                  country: e.target.value,
                                  city: "",
                                },
                              })
                            }
                            className={styles.select}
                          >
                            {COUNTRIES.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>{t("profile.address.city")}</label>
                          <select
                            value={profile.address.city}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                address: {
                                  ...profile.address,
                                  city: e.target.value,
                                },
                              })
                            }
                            className={styles.select}
                          >
                            {CITIES[profile.address.country]?.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>{t("profile.address.street")}</label>
                          <textarea
                            value={profile.address.street}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                address: {
                                  ...profile.address,
                                  street: e.target.value,
                                },
                              })
                            }
                            className={styles.textarea}
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className={styles.addressDisplay}>
                        <p>{profile.address.street}</p>
                        <p>
                          {profile.address.district}, {profile.address.city}
                        </p>
                        <p>{profile.address.country}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* KYC Status Card */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {t("profile.kyc.title")}
                    </h3>
                  </div>
                  <div className={styles.cardContent}>
                    <div
                      className={`${styles.kycStatus} ${
                        getKYCStatusInfo(profile.kycStatus).class
                      }`}
                    >
                      <span className={styles.kycIcon}>
                        {getKYCStatusInfo(profile.kycStatus).icon}
                      </span>
                      <span className={styles.kycText}>
                        {getKYCStatusInfo(profile.kycStatus).text}
                      </span>
                    </div>
                    {profile.kycStatus === "verified" && (
                      <p className={styles.kycDate}>
                        {t("profile.kyc.verifiedOn")}: January 15, 2025
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className={styles.rightColumn}>
                {/* About Card */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {t("profile.about.title")}
                    </h3>
                    <button className={styles.editBtn}>
                      {t("profile.edit")}
                    </button>
                  </div>
                  <div className={styles.cardContent}>
                    <p className={styles.aboutText}>{profile.about}</p>
                  </div>
                </div>

                {/* Languages & Certifications Card */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {t("profile.languages.title")}
                    </h3>
                    <button className={styles.editBtn}>
                      {t("profile.edit")}
                    </button>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.languagesSection}>
                      <h4 className={styles.subsectionTitle}>
                        {t("profile.languages.languages")}
                      </h4>
                      <div className={styles.tagsContainer}>
                        {profile.languages.map((lang, index) => (
                          <div
                            key={index}
                            className={`${styles.tag} ${
                              lang.certified ? styles.tagCertified : ""
                            }`}
                          >
                            <span className={styles.tagText}>{lang.name}</span>
                            <span className={styles.tagLevel}>
                              ({lang.level})
                            </span>
                            {lang.certified && (
                              <span className={styles.tagIcon}>✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.certificationsSection}>
                      <h4 className={styles.subsectionTitle}>
                        {t("profile.languages.certifications")}
                      </h4>
                      <div className={styles.tagsContainer}>
                        {profile.certifications.map((cert, index) => (
                          <div
                            key={index}
                            className={`${styles.tag} ${styles.tagCertification}`}
                          >
                            <span className={styles.tagText}>{cert.name}</span>
                            {cert.score && (
                              <span className={styles.tagScore}>
                                {cert.score}
                              </span>
                            )}
                            <span className={styles.tagYear}>
                              ({cert.year})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Experience Card */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {t("profile.experience.title")}
                    </h3>
                    <button className={styles.editBtn}>
                      {t("profile.edit")}
                    </button>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.experienceList}>
                      {profile.experience.map((exp, index) => (
                        <div key={index} className={styles.experienceItem}>
                          <div className={styles.expHeader}>
                            <h4 className={styles.expTitle}>{exp.title}</h4>
                            <span className={styles.expPeriod}>
                              {exp.period}
                            </span>
                          </div>
                          <p className={styles.expCompany}>{exp.company}</p>
                          <p className={styles.expDescription}>
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats Card */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {t("profile.stats.title")}
                    </h3>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.statsGrid}>
                      <div className={styles.statItem}>
                        <span className={styles.statIcon}>📊</span>
                        <div className={styles.statInfo}>
                          <span className={styles.statValue}>
                            {profile.stats.totalJobs}
                          </span>
                          <span className={styles.statLabel}>
                            {t("profile.stats.totalJobs")}
                          </span>
                        </div>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statIcon}>⭐</span>
                        <div className={styles.statInfo}>
                          <span className={styles.statValue}>
                            {profile.stats.rating}
                          </span>
                          <span className={styles.statLabel}>
                            {t("profile.stats.rating")}
                          </span>
                        </div>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statIcon}>⚡</span>
                        <div className={styles.statInfo}>
                          <span className={styles.statValue}>
                            {profile.stats.responseTime}
                          </span>
                          <span className={styles.statLabel}>
                            {t("profile.stats.responseTime")}
                          </span>
                        </div>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statIcon}>✅</span>
                        <div className={styles.statInfo}>
                          <span className={styles.statValue}>
                            {profile.stats.completionRate}
                          </span>
                          <span className={styles.statLabel}>
                            {t("profile.stats.completionRate")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Reviews Carousel */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {t("profile.reviews.title")}
                    </h3>
                    <div className={styles.carouselControls}>
                      <button
                        className={styles.carouselBtn}
                        onClick={prevReview}
                      >
                        ‹
                      </button>
                      <span className={styles.carouselIndicator}>
                        {currentReviewIndex + 1} / {profile.reviews.length}
                      </span>
                      <button
                        className={styles.carouselBtn}
                        onClick={nextReview}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.reviewCarousel}>
                      <div className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewClient}>
                            <h4 className={styles.clientName}>
                              {profile.reviews[currentReviewIndex].client}
                            </h4>
                            <p className={styles.clientCompany}>
                              {profile.reviews[currentReviewIndex].company}
                            </p>
                          </div>
                          <div className={styles.reviewRating}>
                            {renderStars(
                              profile.reviews[currentReviewIndex].rating
                            )}
                          </div>
                        </div>
                        <p className={styles.reviewComment}>
                          "{profile.reviews[currentReviewIndex].comment}"
                        </p>
                        <span className={styles.reviewDate}>
                          {new Date(
                            profile.reviews[currentReviewIndex].date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Update Profile Button */}
          <div className={styles.updateButtonSection}>
            <button className={styles.updateBtn} onClick={handleUpdateProfile}>
              {t("profile.updateProfile")}
            </button>
          </div>

          {/* CV Management Section */}
          <div className={styles.cvSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t("profile.cv.title")}</h2>
              <p className={styles.sectionSubtitle}>
                {t("profile.cv.subtitle")}
              </p>
            </div>

            <div className={styles.cvGrid}>
              {cvs.map((cv) => (
                <div key={cv.id} className={styles.cvCard}>
                  <div className={styles.cvIcon}>📄</div>
                  <div className={styles.cvInfo}>
                    <h4 className={styles.cvName}>{cv.name}</h4>
                    <div className={styles.cvMeta}>
                      <span className={styles.cvSize}>{cv.size}</span>
                      <span className={styles.cvDate}>
                        {new Date(cv.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.cvType}>
                      <span
                        className={`${styles.typeTag} ${
                          styles[`type-${cv.type}`]
                        }`}
                      >
                        {t(`profile.cv.type.${cv.type}`)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.cvActions}>
                    <button
                      className={styles.moreBtn}
                      onClick={() => handleDropdownToggle(cv.id)}
                    >
                      ⋮
                    </button>
                    {activeDropdown === cv.id && (
                      <div className={styles.dropdown}>
                        <button className={styles.dropdownItem}>
                          <span className={styles.dropdownIcon}>✏️</span>
                          {t("profile.cv.edit")}
                        </button>
                        <button
                          className={`${styles.dropdownItem} ${styles.dropdownItemDelete}`}
                          onClick={() => handleDeleteCV(cv.id)}
                        >
                          <span className={styles.dropdownIcon}>🗑️</span>
                          {t("profile.cv.delete")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add New CV Card */}
              <div
                className={styles.cvCard + " " + styles.addCvCard}
                onClick={handleAddCV}
              >
                <div className={styles.addCvContent}>
                  <div className={styles.addIcon}>+</div>
                  <span className={styles.addText}>
                    {t("profile.cv.addNew")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

export default ProfilePage;
