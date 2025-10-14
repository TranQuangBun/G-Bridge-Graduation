import React, { useState, useEffect } from "react";
import styles from "./ProfilePage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/authService";
import languageService from "../../services/languageService";
import certificationService from "../../services/certificationService";
import { toast } from "react-toastify";

const SIDEBAR_MENU = [
  { id: "overview", icon: "📊", labelKey: "overview", active: false },
  { id: "applications", icon: "📋", labelKey: "applications", active: false },
  { id: "favorites", icon: "❤️", labelKey: "favorites", active: false },
  { id: "alerts", icon: "🔔", labelKey: "alerts", active: false },
  { id: "profile", icon: "👤", labelKey: "profile", active: true },
  { id: "settings", icon: "⚙️", labelKey: "settings", active: false },
];

// Language to Certification mapping
const LANGUAGE_CERTIFICATIONS = {
  English: [
    { name: "TOEIC", organization: "ETS" },
    { name: "IELTS", organization: "British Council / IDP" },
    { name: "TOEFL", organization: "ETS" },
    { name: "Cambridge English", organization: "Cambridge Assessment" },
    { name: "PTE Academic", organization: "Pearson" },
  ],
  Japanese: [
    { name: "JLPT N5", organization: "JEES" },
    { name: "JLPT N4", organization: "JEES" },
    { name: "JLPT N3", organization: "JEES" },
    { name: "JLPT N2", organization: "JEES" },
    { name: "JLPT N1", organization: "JEES" },
    { name: "J.TEST", organization: "J.TEST Foundation" },
    { name: "NAT-TEST", organization: "Senmon Kyouiku" },
  ],
  Korean: [
    { name: "TOPIK I", organization: "NIIED" },
    { name: "TOPIK II", organization: "NIIED" },
    { name: "KLPT", organization: "Korea Language Society" },
  ],
  Chinese: [
    { name: "HSK 1", organization: "Hanban" },
    { name: "HSK 2", organization: "Hanban" },
    { name: "HSK 3", organization: "Hanban" },
    { name: "HSK 4", organization: "Hanban" },
    { name: "HSK 5", organization: "Hanban" },
    { name: "HSK 6", organization: "Hanban" },
    { name: "HSKK", organization: "Hanban" },
  ],
  French: [
    { name: "DELF A1", organization: "CIEP" },
    { name: "DELF A2", organization: "CIEP" },
    { name: "DELF B1", organization: "CIEP" },
    { name: "DELF B2", organization: "CIEP" },
    { name: "DALF C1", organization: "CIEP" },
    { name: "DALF C2", organization: "CIEP" },
    { name: "TCF", organization: "CIEP" },
  ],
  German: [
    { name: "Goethe-Zertifikat A1", organization: "Goethe-Institut" },
    { name: "Goethe-Zertifikat A2", organization: "Goethe-Institut" },
    { name: "Goethe-Zertifikat B1", organization: "Goethe-Institut" },
    { name: "Goethe-Zertifikat B2", organization: "Goethe-Institut" },
    { name: "Goethe-Zertifikat C1", organization: "Goethe-Institut" },
    { name: "Goethe-Zertifikat C2", organization: "Goethe-Institut" },
    { name: "TestDaF", organization: "TestDaF Institute" },
  ],
  Spanish: [
    { name: "DELE A1", organization: "Instituto Cervantes" },
    { name: "DELE A2", organization: "Instituto Cervantes" },
    { name: "DELE B1", organization: "Instituto Cervantes" },
    { name: "DELE B2", organization: "Instituto Cervantes" },
    { name: "DELE C1", organization: "Instituto Cervantes" },
    { name: "DELE C2", organization: "Instituto Cervantes" },
    { name: "SIELE", organization: "Instituto Cervantes" },
  ],
  Vietnamese: [
    {
      name: "Vietnamese Proficiency Test",
      organization: "Vietnam National University",
    },
  ],
  Thai: [
    { name: "Thai Competency Test", organization: "Chulalongkorn University" },
  ],
  Indonesian: [{ name: "UKBI", organization: "Badan Pengembangan Bahasa" }],
  Russian: [{ name: "TORFL", organization: "Pushkin Institute" }],
  Arabic: [{ name: "ALPT", organization: "Arab Academy" }],
  Italian: [
    { name: "CELI", organization: "University of Perugia" },
    { name: "CILS", organization: "University of Siena" },
  ],
  Portuguese: [
    { name: "CELPE-Bras", organization: "Brazilian Ministry of Education" },
  ],
  Dutch: [
    { name: "NT2 Program I", organization: "DUO" },
    { name: "NT2 Program II", organization: "DUO" },
  ],
  Swedish: [{ name: "TISUS", organization: "Stockholm University" }],
  Norwegian: [{ name: "Norwegian Test", organization: "Folkeuniversitetet" }],
  Danish: [{ name: "Danish Test", organization: "Danish Ministry" }],
  Hindi: [
    { name: "Hindi Proficiency Test", organization: "Kendriya Hindi Sansthan" },
  ],
  Urdu: [{ name: "Urdu Proficiency Test", organization: "National Council" }],
  Bengali: [{ name: "Bengali Language Test", organization: "Bangla Academy" }],
  Turkish: [{ name: "TYS", organization: "Ankara University" }],
  Polish: [
    { name: "Polish Language Certificate", organization: "Polish Ministry" },
  ],
  Greek: [
    { name: "Greek Language Certificate", organization: "Greek Ministry" },
  ],
};

const ProfilePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    user,
    profile: userProfile,
    languages,
    certifications,
    isAuthenticated,
    loading: authLoading,
    refreshUser,
  } = useAuth();

  // States for editing
  const [activeMenu, setActiveMenu] = useState("profile");
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [isAddingCertification, setIsAddingCertification] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [basicInfoForm, setBasicInfoForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    avatar: "",
  });

  const [professionalForm, setProfessionalForm] = useState({
    hourlyRate: "",
    experience: "",
    specializations: [],
    portfolio: "",
  });

  const [languageForm, setLanguageForm] = useState({
    name: "",
    level: "Beginner",
  });

  const [certificationForm, setCertificationForm] = useState({
    name: "",
    score: "",
    year: "",
    organization: "",
    certificationImage: null,
  });

  const [suggestedCertifications, setSuggestedCertifications] = useState([]);
  const [showSuggestedCerts, setShowSuggestedCerts] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    // Đợi cho loading xong trước khi redirect
    if (!authLoading && !isAuthenticated) {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Initialize forms when user data loads
  useEffect(() => {
    if (user) {
      setBasicInfoForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      setProfessionalForm({
        hourlyRate: userProfile.hourlyRate || "",
        experience: userProfile.experience || "",
        specializations: userProfile.specializations || [],
        portfolio: userProfile.portfolio || "",
      });
    }
  }, [userProfile]);

  // Calculate profile completeness
  const calculateProfileCompleteness = () => {
    if (!userProfile) return 0;
    return userProfile.profileCompleteness || 0;
  };

  const profileCompleteness = calculateProfileCompleteness();

  // Get missing fields for completeness alert
  const getMissingFields = () => {
    const missing = [];
    if (!user?.phone) missing.push("Phone Number");
    if (!user?.address) missing.push("Address");
    if (!userProfile?.languages?.length) missing.push("Languages");
    if (!userProfile?.certifications?.length) missing.push("Certifications");
    if (!userProfile?.specializations?.length) missing.push("Specializations");
    if (!userProfile?.experience) missing.push("Years of Experience");
    if (!userProfile?.hourlyRate) missing.push("Hourly Rate");
    if (!userProfile?.portfolio) missing.push("Portfolio/Bio");
    return missing;
  };

  const missingFields = getMissingFields();

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setLoading(true);
    try {
      await authService.uploadAvatar(file);
      await refreshUser();
      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  // Handle click avatar to trigger file input
  const handleAvatarClick = () => {
    document.getElementById("avatar-upload-input").click();
  };

  // Handle update basic info
  const handleUpdateBasicInfo = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.updateUserProfile(basicInfoForm);
      await refreshUser();
      setIsEditingBasicInfo(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle update professional info
  const handleUpdateProfessional = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToUpdate = {
        hourlyRate: professionalForm.hourlyRate
          ? parseFloat(professionalForm.hourlyRate)
          : null,
        experience: professionalForm.experience
          ? parseInt(professionalForm.experience)
          : null,
        specializations: professionalForm.specializations,
        portfolio: professionalForm.portfolio,
      };

      await authService.updateInterpreterProfile(dataToUpdate);
      await refreshUser();
      setIsEditingProfessional(false);
      toast.success("Professional info updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update professional info");
    } finally {
      setLoading(false);
    }
  };

  // Handle add language
  const handleAddLanguage = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map form data to match backend schema
      const languageData = {
        name: languageForm.name,
        proficiencyLevel: languageForm.level || "Beginner",
        canSpeak: true, // Default values, can be expanded in the future
        canWrite: true,
        canRead: true,
        yearsOfExperience: 0,
      };

      await languageService.addLanguage(languageData);
      await refreshUser();
      setIsAddingLanguage(false);
      setLanguageForm({ name: "", level: "Beginner" });

      // Show suggested certifications based on added language
      const suggestions = LANGUAGE_CERTIFICATIONS[languageForm.name] || [];
      if (suggestions.length > 0) {
        setSuggestedCertifications(suggestions);
        setShowSuggestedCerts(true);
        toast.success(
          t("profile.languages.success.added") +
            ` ${t("profile.certifications.suggestedFound").replace(
              "{count}",
              suggestions.length
            )}`
        );
      } else {
        toast.success(t("profile.languages.success.added"));
      }
    } catch (error) {
      toast.error(error.message || t("profile.languages.errors.addFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Handle quick add suggested certification
  const handleQuickAddCertification = (suggestion) => {
    setCertificationForm({
      name: suggestion.name,
      organization: suggestion.organization,
      score: "",
      year: "",
      certificationImage: null,
    });
    setIsAddingCertification(true);
    setShowSuggestedCerts(false);
  };

  // Handle dismiss suggestions
  const handleDismissSuggestions = () => {
    setShowSuggestedCerts(false);
    setSuggestedCertifications([]);
  };

  // Handle remove language
  const handleRemoveLanguage = async (index) => {
    setLoading(true);

    try {
      const languageToRemove = languages[index];
      if (languageToRemove?.id) {
        await languageService.deleteLanguage(languageToRemove.id);
        await refreshUser();
        toast.success(t("profile.languages.success.removed"));
      } else {
        toast.error(t("profile.languages.errors.cannotRemove"));
      }
    } catch (error) {
      toast.error(error.message || t("profile.languages.errors.removeFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Handle add certification
  const handleAddCertification = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate image upload is required
      if (!certificationForm.certificationImage) {
        toast.error(t("profile.certifications.errors.uploadRequired"));
        setLoading(false);
        return;
      }

      // Map form data to match backend schema
      const certificationData = {
        name: certificationForm.name,
        score: certificationForm.score || null,
        issueDate: certificationForm.year
          ? `${certificationForm.year}-01-01`
          : null,
        issuingOrganization: certificationForm.organization || "",
      };

      // Step 1: Create certification
      const result = await certificationService.addCertification(
        certificationData
      );

      // Step 2: Upload image (this will change status to "pending")
      if (result.certification && result.certification.id) {
        await certificationService.uploadCertificationImage(
          result.certification.id,
          certificationForm.certificationImage
        );
      }

      await refreshUser();
      setIsAddingCertification(false);
      setCertificationForm({
        name: "",
        score: "",
        year: "",
        organization: "",
        certificationImage: null,
      });
      toast.success(t("profile.certifications.success.added"));
    } catch (error) {
      toast.error(
        error.message || t("profile.certifications.errors.addFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle remove certification
  const handleRemoveCertification = async (index) => {
    setLoading(true);

    try {
      const certificationToRemove = certifications[index];
      if (certificationToRemove?.id) {
        await certificationService.deleteCertification(
          certificationToRemove.id
        );
        await refreshUser();
        toast.success(t("profile.certifications.success.removed"));
      } else {
        toast.error(t("profile.certifications.errors.cannotRemove"));
      }
    } catch (error) {
      toast.error(
        error.message || t("profile.certifications.errors.removeFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle add specialization
  const handleAddSpecialization = (spec) => {
    if (spec && !professionalForm.specializations.includes(spec)) {
      setProfessionalForm((prev) => ({
        ...prev,
        specializations: [...prev.specializations, spec],
      }));
    }
  };

  // Handle remove specialization
  const handleRemoveSpecialization = (index) => {
    setProfessionalForm((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index),
    }));
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <MainLayout>
        <div className={styles.loading}>Loading...</div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className={styles.loading}>Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.profilePage}>
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
                  } else if (item.id === "favorites") {
                    navigate(ROUTES.SAVED_JOBS);
                  } else if (item.id === "alerts") {
                    navigate(ROUTES.JOB_ALERTS);
                  } else if (item.id === "profile") {
                    navigate(ROUTES.PROFILE);
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
        <div className={styles.mainContent}>
          {/* Profile Completeness Alert */}
          {profileCompleteness < 100 && (
            <div className={styles.completenessAlert}>
              <div className={styles.alertHeader}>
                <div className={styles.alertIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className={styles.alertContent}>
                  <h3>{t("profile.completeness.title")}</h3>
                  <p>{t("profile.completeness.description")}</p>
                </div>
              </div>

              <div className={styles.progressBarContainer}>
                <div className={styles.progressBarLabel}>
                  <span>{t("profile.completeness.label")}</span>
                  <span>{profileCompleteness}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
              </div>

              {missingFields.length > 0 && (
                <div className={styles.missingFieldsSection}>
                  <h4>{t("profile.completeness.missingTitle")}</h4>
                  <div className={styles.missingFieldsList}>
                    {missingFields.map((field, index) => (
                      <span key={index} className={styles.missingFieldTag}>
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Basic Information Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                {t("profile.basicInfo.title")}
              </h3>
              <button
                className={styles.editBtn}
                onClick={() => setIsEditingBasicInfo(!isEditingBasicInfo)}
              >
                {isEditingBasicInfo
                  ? t("profile.basicInfo.cancel")
                  : t("profile.basicInfo.edit")}
              </button>
            </div>

            <div className={styles.cardContent}>
              {!isEditingBasicInfo ? (
                <>
                  {/* Avatar Display */}
                  <div className={styles.avatarSection}>
                    <input
                      type="file"
                      id="avatar-upload-input"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: "none" }}
                    />
                    <div
                      className={styles.avatarContainer}
                      onClick={handleAvatarClick}
                      title="Click to change avatar"
                    >
                      {user.avatar ? (
                        <img
                          src={`http://localhost:4000${user.avatar}`}
                          alt="Profile Avatar"
                          className={styles.avatar}
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className={styles.avatarOverlay}>
                        <span>📷</span>
                        <span>{t("profile.basicInfo.changeAvatar")}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>{t("profile.basicInfo.fullName")}</label>
                      <p>
                        {user.fullName || t("profile.basicInfo.notProvided")}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{t("profile.basicInfo.email")}</label>
                      <p>{user.email}</p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{t("profile.basicInfo.phone")}</label>
                      <p>{user.phone || t("profile.basicInfo.notProvided")}</p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{t("profile.basicInfo.address")}</label>
                      <p>
                        {user.address || t("profile.basicInfo.notProvided")}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <form
                  onSubmit={handleUpdateBasicInfo}
                  className={styles.editForm}
                >
                  <div className={styles.formGroup}>
                    <label>{t("profile.basicInfo.fullNameRequired")}</label>
                    <input
                      type="text"
                      value={basicInfoForm.fullName}
                      onChange={(e) =>
                        setBasicInfoForm({
                          ...basicInfoForm,
                          fullName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>{t("profile.basicInfo.email")}</label>
                    <div className={styles.disabledFieldWrapper}>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className={styles.disabledField}
                        title={t("profile.basicInfo.contactAdmin")}
                      />
                      <span className={styles.disabledTooltip}>
                        {t("profile.basicInfo.contactAdmin")}
                      </span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>{t("profile.basicInfo.phone")}</label>
                    <input
                      type="tel"
                      value={basicInfoForm.phone}
                      onChange={(e) =>
                        setBasicInfoForm({
                          ...basicInfoForm,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>{t("profile.basicInfo.address")}</label>
                    <textarea
                      value={basicInfoForm.address}
                      onChange={(e) =>
                        setBasicInfoForm({
                          ...basicInfoForm,
                          address: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Languages & Certifications - Two Column Layout */}
          {user.role === "interpreter" && (
            <div className={styles.twoColumnGrid}>
              {/* Languages Card - Left Column */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    {t("profile.languages.title")}
                  </h3>
                  <button
                    className={styles.addBtn}
                    onClick={() => setIsAddingLanguage(true)}
                  >
                    + {t("profile.languages.add")}
                  </button>
                </div>

                <div className={styles.cardContent}>
                  {Array.isArray(languages) && languages.length > 0 ? (
                    <div className={styles.languagesList}>
                      {languages.map((lang, index) => (
                        <div key={index} className={styles.languageItem}>
                          <div className={styles.languageInfo}>
                            <h4>{lang.name}</h4>
                            <span className={styles.languageLevel}>
                              {lang.proficiencyLevel || lang.level}
                            </span>
                          </div>
                          <button
                            className={styles.removeBtn}
                            onClick={() => handleRemoveLanguage(index)}
                            disabled={loading}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyMessage}>
                      {t("profile.languages.noLanguages")}
                    </p>
                  )}

                  {isAddingLanguage && (
                    <form
                      onSubmit={handleAddLanguage}
                      className={styles.addForm}
                    >
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>{t("profile.modal.language")} *</label>
                          <select
                            value={languageForm.name}
                            onChange={(e) =>
                              setLanguageForm({
                                ...languageForm,
                                name: e.target.value,
                              })
                            }
                            required
                          >
                            <option value="">
                              {t("profile.languages.selectLanguage")}
                            </option>
                            {Object.keys(LANGUAGE_CERTIFICATIONS)
                              .sort()
                              .map((lang) => (
                                <option key={lang} value={lang}>
                                  {lang}
                                </option>
                              ))}
                            <option value="Other">
                              Other (No suggestions)
                            </option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label>{t("profile.languages.level")} *</label>
                          <select
                            value={languageForm.level}
                            onChange={(e) =>
                              setLanguageForm({
                                ...languageForm,
                                level: e.target.value,
                              })
                            }
                            required
                          >
                            <option value="Beginner">
                              {t("profile.languages.beginner")}
                            </option>
                            <option value="Intermediate">
                              {t("profile.languages.intermediate")}
                            </option>
                            <option value="Advanced">
                              {t("profile.languages.advanced")}
                            </option>
                            <option value="Native">
                              {t("profile.languages.native")}
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={() => {
                            setIsAddingLanguage(false);
                            setLanguageForm({ name: "", level: "Beginner" });
                          }}
                        >
                          {t("profile.modal.cancel")}
                        </button>
                        <button
                          type="submit"
                          className={styles.saveBtn}
                          disabled={loading}
                        >
                          {loading
                            ? t("profile.languages.adding")
                            : t("profile.modal.add")}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Certifications Card - Right Column */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    {t("profile.certifications.title")}
                  </h3>
                  <button
                    className={styles.addBtn}
                    onClick={() => setIsAddingCertification(true)}
                  >
                    + {t("profile.certifications.add")}
                  </button>
                </div>

                <div className={styles.cardContent}>
                  {/* Suggested Certifications */}
                  {showSuggestedCerts && suggestedCertifications.length > 0 && (
                    <div className={styles.suggestedCertsContainer}>
                      <div className={styles.suggestedHeader}>
                        <h4>💡 {t("profile.certifications.suggestedTitle")}</h4>
                        <button
                          className={styles.dismissBtn}
                          onClick={handleDismissSuggestions}
                          title={t("profile.modal.cancel")}
                        >
                          ×
                        </button>
                      </div>
                      <div className={styles.suggestedList}>
                        {suggestedCertifications.map((cert, index) => (
                          <button
                            key={index}
                            className={styles.suggestedItem}
                            onClick={() => handleQuickAddCertification(cert)}
                          >
                            <span className={styles.certIcon}>📜</span>
                            <div className={styles.suggestedInfo}>
                              <strong>{cert.name}</strong>
                              <small>{cert.organization}</small>
                            </div>
                            <span className={styles.addIcon}>+</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(certifications) &&
                  certifications.length > 0 ? (
                    <div className={styles.certificationsList}>
                      {certifications.map((cert, index) => (
                        <div key={index} className={styles.certificationItem}>
                          <div className={styles.certificationInfo}>
                            <div className={styles.certificationHeader}>
                              <h4>{cert.name}</h4>
                              {cert.verificationStatus && (
                                <span
                                  className={`${styles.statusBadge} ${
                                    styles[cert.verificationStatus]
                                  }`}
                                >
                                  {cert.verificationStatus === "draft" &&
                                    `📝 ${t(
                                      "profile.certifications.statusDraft"
                                    )}`}
                                  {cert.verificationStatus === "pending" &&
                                    `⏳ ${t(
                                      "profile.certifications.statusPending"
                                    )}`}
                                  {cert.verificationStatus === "approved" &&
                                    `✅ ${t(
                                      "profile.certifications.statusApproved"
                                    )}`}
                                  {cert.verificationStatus === "rejected" &&
                                    `❌ ${t(
                                      "profile.certifications.statusRejected"
                                    )}`}
                                </span>
                              )}
                            </div>
                            <div className={styles.certificationMeta}>
                              {cert.score && <span>Score: {cert.score}</span>}
                              {cert.issueDate && (
                                <span>
                                  Year: {new Date(cert.issueDate).getFullYear()}
                                </span>
                              )}
                              {cert.year && <span>Year: {cert.year}</span>}
                              {cert.issuingOrganization && (
                                <span>Org: {cert.issuingOrganization}</span>
                              )}
                            </div>
                            {cert.imageUrl && (
                              <div className={styles.certificationImage}>
                                <a
                                  href={`http://localhost:4000${cert.imageUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {t("profile.certifications.viewCertificate")}
                                </a>
                              </div>
                            )}
                          </div>
                          <button
                            className={styles.removeBtn}
                            onClick={() => handleRemoveCertification(index)}
                            disabled={loading}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyMessage}>
                      {t("profile.certifications.noCertifications")}
                    </p>
                  )}

                  {isAddingCertification && (
                    <form
                      onSubmit={handleAddCertification}
                      className={styles.addForm}
                    >
                      <div className={styles.formGroup}>
                        <label>{t("profile.certifications.name")} *</label>
                        <input
                          type="text"
                          value={certificationForm.name}
                          onChange={(e) =>
                            setCertificationForm({
                              ...certificationForm,
                              name: e.target.value,
                            })
                          }
                          placeholder={t(
                            "profile.certifications.namePlaceholder"
                          )}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>
                          {t("profile.certifications.organization")}
                        </label>
                        <input
                          type="text"
                          value={certificationForm.organization}
                          onChange={(e) =>
                            setCertificationForm({
                              ...certificationForm,
                              organization: e.target.value,
                            })
                          }
                          placeholder={t(
                            "profile.certifications.organizationPlaceholder"
                          )}
                        />
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>{t("profile.certifications.score")}</label>
                          <input
                            type="text"
                            value={certificationForm.score}
                            onChange={(e) =>
                              setCertificationForm({
                                ...certificationForm,
                                score: e.target.value,
                              })
                            }
                            placeholder={t(
                              "profile.certifications.scorePlaceholder"
                            )}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>{t("profile.certifications.year")}</label>
                          <input
                            type="text"
                            value={certificationForm.year}
                            onChange={(e) =>
                              setCertificationForm({
                                ...certificationForm,
                                year: e.target.value,
                              })
                            }
                            placeholder={t(
                              "profile.certifications.yearPlaceholder"
                            )}
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>{t("profile.certifications.uploadImage")}</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              // Check file size (max 10MB)
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error(
                                  t(
                                    "profile.certifications.errors.fileSizeLimit"
                                  )
                                );
                                e.target.value = "";
                                return;
                              }
                              setCertificationForm({
                                ...certificationForm,
                                certificationImage: file,
                              });
                            }
                          }}
                          required
                        />
                        {certificationForm.certificationImage && (
                          <small className={styles.fileInfo}>
                            {t("profile.certifications.fileSelected")}{" "}
                            {certificationForm.certificationImage.name}
                          </small>
                        )}
                      </div>

                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={() => {
                            setIsAddingCertification(false);
                            setCertificationForm({
                              name: "",
                              score: "",
                              year: "",
                              organization: "",
                              certificationImage: null,
                            });
                          }}
                        >
                          {t("profile.modal.cancel")}
                        </button>
                        <button
                          type="submit"
                          className={styles.saveBtn}
                          disabled={loading}
                        >
                          {loading
                            ? t("profile.certifications.adding")
                            : t("profile.certifications.add")}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Professional Information Card */}
          {user.role === "interpreter" && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  {t("profile.professional.title")}
                </h3>
                <button
                  className={styles.editBtn}
                  onClick={() =>
                    setIsEditingProfessional(!isEditingProfessional)
                  }
                >
                  {isEditingProfessional
                    ? t("profile.professional.cancel")
                    : t("profile.professional.edit")}
                </button>
              </div>

              <div className={styles.cardContent}>
                {!isEditingProfessional ? (
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>{t("profile.professional.hourlyRate")}</label>
                      <p>
                        {userProfile?.hourlyRate
                          ? `$${userProfile.hourlyRate} ${
                              userProfile.currency || "USD"
                            }`
                          : t("profile.professional.notProvided")}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{t("profile.professional.experience")}</label>
                      <p>
                        {userProfile?.experience ||
                          t("profile.professional.notProvided")}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{t("profile.professional.specializations")}</label>
                      <p>
                        {userProfile?.specializations?.length
                          ? userProfile.specializations.join(", ")
                          : t("profile.professional.notProvided")}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{t("profile.professional.portfolio")}</label>
                      <p>
                        {userProfile?.portfolio ||
                          t("profile.professional.notProvided")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleUpdateProfessional}
                    className={styles.editForm}
                  >
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>
                          {t("profile.professional.hourlyRate")} (USD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={professionalForm.hourlyRate}
                          onChange={(e) =>
                            setProfessionalForm({
                              ...professionalForm,
                              hourlyRate: e.target.value,
                            })
                          }
                          placeholder={t(
                            "profile.professional.hourlyRatePlaceholder"
                          )}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>{t("profile.professional.experience")}</label>
                        <input
                          type="number"
                          value={professionalForm.experience}
                          onChange={(e) =>
                            setProfessionalForm({
                              ...professionalForm,
                              experience: e.target.value,
                            })
                          }
                          placeholder="e.g., 5"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>{t("profile.professional.specializations")}</label>
                      <div className={styles.specializationsInput}>
                        <input
                          type="text"
                          placeholder={t(
                            "profile.professional.specializationsPlaceholder"
                          )}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSpecialization(e.target.value);
                              e.target.value = "";
                            }
                          }}
                        />
                        <div className={styles.specializationTags}>
                          {professionalForm.specializations.map(
                            (spec, index) => (
                              <span
                                key={index}
                                className={styles.specializationTag}
                              >
                                {spec}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveSpecialization(index)
                                  }
                                >
                                  ×
                                </button>
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>{t("profile.professional.portfolio")}</label>
                      <textarea
                        value={professionalForm.portfolio}
                        onChange={(e) =>
                          setProfessionalForm({
                            ...professionalForm,
                            portfolio: e.target.value,
                          })
                        }
                        rows={5}
                        placeholder={t(
                          "profile.professional.portfolioPlaceholder"
                        )}
                      />
                    </div>

                    <button
                      type="submit"
                      className={styles.saveBtn}
                      disabled={loading}
                    >
                      {loading
                        ? t("profile.professional.saving")
                        : t("profile.professional.save")}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Stats Card */}
          {user.role === "interpreter" && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{t("profile.stats.title")}</h3>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>⭐</div>
                    <div className={styles.statInfo}>
                      <h4>{userProfile?.rating || "0.0"}</h4>
                      <p>{t("profile.stats.rating")}</p>
                    </div>
                  </div>

                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statInfo}>
                      <h4>{userProfile?.completedJobs || 0}</h4>
                      <p>{t("profile.stats.totalJobs")}</p>
                    </div>
                  </div>

                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statInfo}>
                      <h4>{userProfile?.totalReviews || 0}</h4>
                      <p>{t("profile.stats.completionRate")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
