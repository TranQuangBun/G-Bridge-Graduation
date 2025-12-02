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
import {
  FaChartBar,
  FaClipboardList,
  FaStar,
  FaUser,
  FaCog,
  FaCamera,
  FaBriefcase,
  FaEnvelope,
} from "react-icons/fa";

// Sidebar menu for Interpreter role
const INTERPRETER_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  {
    id: "applications",
    icon: FaClipboardList,
    labelKey: "applications",
    active: false,
  },
  {
    id: "notifications",
    icon: FaEnvelope,
    labelKey: "notifications",
    active: false,
  },
  { id: "profile", icon: FaUser, labelKey: "profile", active: true },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
];

// Sidebar menu for Client/Company role
const CLIENT_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  { id: "myJobs", icon: FaBriefcase, labelKey: "myJobs", active: false },
  {
    id: "jobApplications",
    icon: FaClipboardList,
    labelKey: "jobApplications",
    active: false,
  },
  {
    id: "notifications",
    icon: FaEnvelope,
    labelKey: "notifications",
    active: false,
  },
  { id: "profile", icon: FaUser, labelKey: "profile", active: true },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
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
  const { t, lang } = useLanguage();
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

  // Get sidebar menu based on user role
  const SIDEBAR_MENU =
    user?.role === "client" ? CLIENT_SIDEBAR_MENU : INTERPRETER_SIDEBAR_MENU;

  // States for editing
  const [activeMenu, setActiveMenu] = useState("profile");
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false);
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

  const [companyInfoForm, setCompanyInfoForm] = useState({
    companyName: "",
    companyType: "",
    companySize: "",
    website: "",
    industry: "",
    description: "",
    headquarters: "",
    foundedYear: "",
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
    if (userProfile && user?.role === "interpreter" && !isEditingProfessional) {
      // Only reset form when not editing and userProfile changes
      console.log("Resetting professional form from userProfile:", {
        userProfile,
        specializations: userProfile.specializations,
        specializationsType: typeof userProfile.specializations,
        isArray: Array.isArray(userProfile.specializations),
      });
      setProfessionalForm({
        hourlyRate: userProfile.hourlyRate || "",
        experience: userProfile.experience || "",
        specializations: Array.isArray(userProfile.specializations)
          ? userProfile.specializations
          : userProfile.specializations
          ? [userProfile.specializations]
          : [],
        portfolio: userProfile.portfolio || "",
      });
    }
  }, [userProfile, user?.role, isEditingProfessional]);

  // Initialize company info form when client profile loads
  useEffect(() => {
    if (userProfile && user?.role === "client" && !isEditingCompanyInfo) {
      const clientProfile = userProfile;
      setCompanyInfoForm({
        companyName: clientProfile.companyName || "",
        companyType: clientProfile.companyType || "",
        companySize: clientProfile.companySize || "",
        website: clientProfile.website || "",
        industry: clientProfile.industry || "",
        description: clientProfile.description || "",
        headquarters: clientProfile.headquarters || "",
        foundedYear: clientProfile.foundedYear || "",
      });
    }
  }, [userProfile, user?.role, isEditingCompanyInfo]);

  // Calculate profile completeness
  const calculateProfileCompleteness = () => {
    if (!userProfile && !user) return 0;
    
    // For interpreter role, use backend-calculated completeness
    if (user?.role === "interpreter") {
      return userProfile?.profileCompleteness || 0;
    }
    
    // For client role, calculate manually based on company information
    if (user?.role === "client") {
      // userProfile is clientProfile for client role
      const clientProfile = userProfile || user?.clientProfile;
      let completedFields = 0;
      const totalFields = 8; // Total number of fields to check
      
      // Basic user info
      if (user?.phone && user.phone.trim().length > 0) completedFields++;
      if (user?.address && user.address.trim().length > 0) completedFields++;
      
      // Company information
      if (clientProfile?.companyName && clientProfile.companyName.trim().length > 0) completedFields++;
      if (clientProfile?.companyType && clientProfile.companyType.trim().length > 0) completedFields++;
      if (clientProfile?.companySize && clientProfile.companySize.trim().length > 0) completedFields++;
      if (clientProfile?.website && clientProfile.website.trim().length > 0) completedFields++;
      if (clientProfile?.industry && clientProfile.industry.trim().length > 0) completedFields++;
      if (clientProfile?.description && clientProfile.description.trim().length > 0) completedFields++;
      
      return Math.round((completedFields / totalFields) * 100);
    }
    
    return 0;
  };

  const profileCompleteness = calculateProfileCompleteness();

  // Get missing fields for completeness alert
  const getMissingFields = () => {
    const missing = [];
    
    if (user?.role === "interpreter") {
      // Missing fields for interpreter role
      if (!user?.phone || user.phone.trim().length === 0)
        missing.push("Phone Number");
      if (!user?.address || user.address.trim().length === 0)
        missing.push("Address");
      if (!languages || languages.length === 0) missing.push("Languages");
      if (!certifications || certifications.length === 0)
        missing.push("Certifications");
      if (
        !userProfile?.specializations ||
        userProfile.specializations.length === 0
      )
        missing.push("Specializations");
      if (!userProfile?.experience || userProfile.experience <= 0)
        missing.push("Years of Experience");
      if (
        !userProfile?.hourlyRate ||
        (typeof userProfile.hourlyRate === "number"
          ? userProfile.hourlyRate <= 0
          : parseFloat(userProfile.hourlyRate) <= 0)
      )
        missing.push("Hourly Rate");
      if (!userProfile?.portfolio || userProfile.portfolio.trim().length === 0)
        missing.push("Portfolio/Bio");
    } else if (user?.role === "client") {
      // Missing fields for client role
      // userProfile is clientProfile for client role
      const clientProfile = userProfile || user?.clientProfile;
      
      if (!user?.phone || user.phone.trim().length === 0)
        missing.push("Phone Number");
      if (!user?.address || user.address.trim().length === 0)
        missing.push("Address");
      if (!clientProfile?.companyName || clientProfile.companyName.trim().length === 0)
        missing.push("Company Name");
      if (!clientProfile?.companyType || clientProfile.companyType.trim().length === 0)
        missing.push("Company Type");
      if (!clientProfile?.companySize || clientProfile.companySize.trim().length === 0)
        missing.push("Company Size");
      if (!clientProfile?.website || clientProfile.website.trim().length === 0)
        missing.push("Website");
      if (!clientProfile?.industry || clientProfile.industry.trim().length === 0)
        missing.push("Industry");
      if (!clientProfile?.description || clientProfile.description.trim().length === 0)
        missing.push("Company Description");
    }
    
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
      // Ensure specializations is an array and filter out empty values
      const specializationsArray = Array.isArray(
        professionalForm.specializations
      )
        ? professionalForm.specializations.filter(
            (spec) => spec && typeof spec === "string" && spec.trim().length > 0
          )
        : [];

      const dataToUpdate = {
        hourlyRate: professionalForm.hourlyRate
          ? parseFloat(professionalForm.hourlyRate)
          : null,
        experience: professionalForm.experience
          ? parseInt(professionalForm.experience)
          : null,
        specializations: specializationsArray,
        portfolio: professionalForm.portfolio,
      };

      console.log("Frontend - Sending update request:", {
        dataToUpdate,
        specializations: dataToUpdate.specializations,
        specializationsType: typeof dataToUpdate.specializations,
        isArray: Array.isArray(dataToUpdate.specializations),
        length: dataToUpdate.specializations?.length,
        professionalFormState: professionalForm,
        professionalFormSpecializations: professionalForm.specializations,
        specializationsArray: specializationsArray,
      });

      const result = await authService.updateInterpreterProfile(dataToUpdate);

      console.log("Frontend - Update response:", {
        result,
        profile: result.profile,
        specializations: result.profile?.specializations,
        specializationsType: typeof result.profile?.specializations,
        isArray: Array.isArray(result.profile?.specializations),
      });

      // Update profile immediately from response before refreshing
      if (result.profile) {
        // Force update the form state to reflect the new data
        setProfessionalForm({
          hourlyRate: result.profile.hourlyRate || "",
          experience: result.profile.experience || "",
          specializations: result.profile.specializations || [],
          portfolio: result.profile.portfolio || "",
        });
      }

      // Then refresh from backend to ensure consistency
      await refreshUser();
      setIsEditingProfessional(false);
      toast.success("Professional info updated successfully!");
    } catch (error) {
      console.error("Frontend - Update error:", error);
      toast.error(error.message || "Failed to update professional info");
    } finally {
      setLoading(false);
    }
  };

  // Handle update company info
  const handleUpdateCompanyInfo = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToUpdate = {
        companyName: companyInfoForm.companyName || null,
        companyType: companyInfoForm.companyType || null,
        companySize: companyInfoForm.companySize || null,
        website: companyInfoForm.website || null,
        industry: companyInfoForm.industry || null,
        description: companyInfoForm.description || null,
        headquarters: companyInfoForm.headquarters || null,
        foundedYear: companyInfoForm.foundedYear
          ? parseInt(companyInfoForm.foundedYear)
          : null,
      };

      await authService.updateClientProfile(dataToUpdate);
      await refreshUser();
      setIsEditingCompanyInfo(false);
      toast.success(
        lang === "vi"
          ? "Cập nhật thông tin công ty thành công!"
          : "Company information updated successfully!"
      );
    } catch (error) {
      toast.error(
        error.message ||
          (lang === "vi"
            ? "Cập nhật thông tin công ty thất bại"
            : "Failed to update company information")
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle active status
  const handleToggleActiveStatus = async () => {
    if (user.role !== "interpreter") return;

    const previousStatus = user.isActive !== false;
    setLoading(true);
    try {
      await authService.toggleActiveStatus();
      await refreshUser();
      // After refresh, the new status will be the opposite of previous
      const newStatus = !previousStatus;
      toast.success(
        newStatus
          ? lang === "vi"
            ? "Đã bật trạng thái hoạt động"
            : "Profile activated"
          : lang === "vi"
          ? "Đã tắt trạng thái hoạt động"
          : "Profile deactivated"
      );
    } catch (error) {
      toast.error(
        error.message ||
          (lang === "vi"
            ? "Không thể thay đổi trạng thái"
            : "Failed to toggle active status")
      );
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
    const trimmedSpec = spec?.trim();
    console.log("handleAddSpecialization called:", {
      spec,
      trimmedSpec,
      trimmedLength: trimmedSpec?.length,
      currentForm: professionalForm,
      currentSpecializations: professionalForm.specializations,
    });

    if (trimmedSpec && trimmedSpec.length > 0) {
      setProfessionalForm((prev) => {
        // Check if already exists (case-insensitive)
        const exists = prev.specializations.some(
          (s) => s.toLowerCase() === trimmedSpec.toLowerCase()
        );
        if (!exists) {
          const newSpecializations = [...prev.specializations, trimmedSpec];
          console.log("Adding specialization:", {
            newSpec: trimmedSpec,
            currentSpecializations: prev.specializations,
            newArray: newSpecializations,
            newLength: newSpecializations.length,
          });
          return {
            ...prev,
            specializations: newSpecializations,
          };
        } else {
          console.log("Specialization already exists:", trimmedSpec);
        }
        return prev;
      });
    } else {
      console.log("Invalid specialization (empty or null):", spec);
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
                  if (item.id === "overview") {
                    navigate(ROUTES.DASHBOARD);
                  } else if (item.id === "applications") {
                    navigate(ROUTES.MY_APPLICATIONS);
                  } else if (item.id === "profile") {
                    // Stay on current page
                    setActiveMenu(item.id);
                  } else if (item.id === "myJobs") {
                    navigate(ROUTES.MY_JOBS);
                  } else if (item.id === "jobApplications") {
                    navigate(ROUTES.MY_APPLICATIONS);
                  } else if (item.id === "notifications") {
                    navigate(ROUTES.DASHBOARD + "?section=notifications");
                  }
                }}
              >
                <span className={styles.menuIcon}>
                  {typeof item.icon === "string" ? item.icon : <item.icon />}
                </span>
                <span className={styles.menuLabel}>
                  {t(`dashboard.navigation.${item.labelKey}`)}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.profileContentWrapper}>
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
                        <span>
                          <FaCamera />
                        </span>
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
                    {/* Active Status Toggle - Only for interpreters */}
                    {user.role === "interpreter" && (
                      <div className={styles.infoItem}>
                        <label>
                          {lang === "vi"
                            ? "Trạng thái hoạt động"
                            : "Active Status"}
                        </label>
                        <div className={styles.toggleContainer}>
                          <label className={styles.toggleSwitch}>
                            <input
                              type="checkbox"
                              checked={user.isActive !== false}
                              onChange={handleToggleActiveStatus}
                              disabled={loading}
                            />
                            <span className={styles.toggleSlider}></span>
                          </label>
                          <span className={styles.toggleLabel}>
                            {user.isActive !== false
                              ? lang === "vi"
                                ? "Đang hoạt động"
                                : "Active"
                              : lang === "vi"
                              ? "Đã tắt"
                              : "Inactive"}
                          </span>
                        </div>
                        <p className={styles.toggleDescription}>
                          {lang === "vi"
                            ? "Khi tắt, hồ sơ của bạn sẽ không hiển thị trong kết quả tìm kiếm"
                            : "When off, your profile will not appear in search results"}
                        </p>
                      </div>
                    )}
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
                          id="certification-image-input"
                          accept="image/*,.pdf"
                          disabled={loading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Validate file type
                              const validTypes = [
                                "image/jpeg",
                                "image/jpg",
                                "image/png",
                                "image/gif",
                                "image/webp",
                                "application/pdf",
                              ];
                              if (!validTypes.includes(file.type)) {
                                toast.error(
                                  t(
                                    "profile.certifications.errors.invalidFileType"
                                  ) || "Please select an image or PDF file"
                                );
                                e.target.value = "";
                                return;
                              }

                              // Check file size (max 10MB)
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error(
                                  t(
                                    "profile.certifications.errors.fileSizeLimit"
                                  ) || "File size must be less than 10MB"
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
                          style={{
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.6 : 1,
                          }}
                        />
                        {certificationForm.certificationImage && (
                          <small className={styles.fileInfo}>
                            {t("profile.certifications.fileSelected") ||
                              "Selected"}{" "}
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

          {/* Company Information Card - For Client Role */}
          {user.role === "client" && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  {lang === "vi" ? "Thông tin công ty" : "Company Information"}
                </h3>
                <button
                  className={styles.editBtn}
                  onClick={() =>
                    setIsEditingCompanyInfo(!isEditingCompanyInfo)
                  }
                >
                  {isEditingCompanyInfo
                    ? (lang === "vi" ? "Hủy" : "Cancel")
                    : (lang === "vi" ? "Chỉnh sửa" : "Edit")}
                </button>
              </div>

              <div className={styles.cardContent}>
                {!isEditingCompanyInfo ? (
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>{lang === "vi" ? "Tên công ty" : "Company Name"}</label>
                      <p>
                        {userProfile?.companyName ||
                          (lang === "vi" ? "Chưa cung cấp" : "Not provided")}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{lang === "vi" ? "Loại công ty" : "Company Type"}</label>
                      <p>
                        {userProfile?.companyType ||
                          (lang === "vi" ? "Chưa cung cấp" : "Not provided")}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{lang === "vi" ? "Quy mô công ty" : "Company Size"}</label>
                      <p>
                        {userProfile?.companySize ||
                          (lang === "vi" ? "Chưa cung cấp" : "Not provided")}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{lang === "vi" ? "Website" : "Website"}</label>
                      <p>
                        {userProfile?.website ? (
                          <a
                            href={userProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.link}
                          >
                            {userProfile.website}
                          </a>
                        ) : (
                          lang === "vi" ? "Chưa cung cấp" : "Not provided"
                        )}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{lang === "vi" ? "Ngành nghề" : "Industry"}</label>
                      <p>
                        {userProfile?.industry ||
                          (lang === "vi" ? "Chưa cung cấp" : "Not provided")}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{lang === "vi" ? "Mô tả" : "Description"}</label>
                      <p>
                        {userProfile?.description ||
                          (lang === "vi" ? "Chưa cung cấp" : "Not provided")}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{lang === "vi" ? "Trụ sở chính" : "Headquarters"}</label>
                      <p>
                        {userProfile?.headquarters ||
                          (lang === "vi" ? "Chưa cung cấp" : "Not provided")}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>{lang === "vi" ? "Năm thành lập" : "Founded Year"}</label>
                      <p>
                        {userProfile?.foundedYear ||
                          (lang === "vi" ? "Chưa cung cấp" : "Not provided")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleUpdateCompanyInfo}
                    className={styles.editForm}
                  >
                    <div className={styles.formGroup}>
                      <label>
                        {lang === "vi" ? "Tên công ty" : "Company Name"} *
                      </label>
                      <input
                        type="text"
                        value={companyInfoForm.companyName}
                        onChange={(e) =>
                          setCompanyInfoForm({
                            ...companyInfoForm,
                            companyName: e.target.value,
                          })
                        }
                        required
                        placeholder={lang === "vi" ? "Nhập tên công ty" : "Enter company name"}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>{lang === "vi" ? "Loại công ty" : "Company Type"}</label>
                        <select
                          value={companyInfoForm.companyType}
                          onChange={(e) =>
                            setCompanyInfoForm({
                              ...companyInfoForm,
                              companyType: e.target.value,
                            })
                          }
                        >
                          <option value="">
                            {lang === "vi" ? "Chọn loại công ty" : "Select company type"}
                          </option>
                          <option value="startup">
                            {lang === "vi" ? "Startup" : "Startup"}
                          </option>
                          <option value="corporation">
                            {lang === "vi" ? "Tập đoàn" : "Corporation"}
                          </option>
                          <option value="nonprofit">
                            {lang === "vi" ? "Phi lợi nhuận" : "Nonprofit"}
                          </option>
                          <option value="government">
                            {lang === "vi" ? "Chính phủ" : "Government"}
                          </option>
                          <option value="healthcare">
                            {lang === "vi" ? "Y tế" : "Healthcare"}
                          </option>
                          <option value="education">
                            {lang === "vi" ? "Giáo dục" : "Education"}
                          </option>
                          <option value="other">
                            {lang === "vi" ? "Khác" : "Other"}
                          </option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label>{lang === "vi" ? "Quy mô công ty" : "Company Size"}</label>
                        <select
                          value={companyInfoForm.companySize}
                          onChange={(e) =>
                            setCompanyInfoForm({
                              ...companyInfoForm,
                              companySize: e.target.value,
                            })
                          }
                        >
                          <option value="">
                            {lang === "vi" ? "Chọn quy mô" : "Select company size"}
                          </option>
                          <option value="size_1_10">1-10 {lang === "vi" ? "nhân viên" : "employees"}</option>
                          <option value="size_11_50">11-50 {lang === "vi" ? "nhân viên" : "employees"}</option>
                          <option value="size_51_200">51-200 {lang === "vi" ? "nhân viên" : "employees"}</option>
                          <option value="size_201_500">201-500 {lang === "vi" ? "nhân viên" : "employees"}</option>
                          <option value="size_501_1000">501-1000 {lang === "vi" ? "nhân viên" : "employees"}</option>
                          <option value="size_1001_plus">1001+ {lang === "vi" ? "nhân viên" : "employees"}</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>{lang === "vi" ? "Website" : "Website"}</label>
                        <input
                          type="url"
                          value={companyInfoForm.website}
                          onChange={(e) =>
                            setCompanyInfoForm({
                              ...companyInfoForm,
                              website: e.target.value,
                            })
                          }
                          placeholder="https://example.com"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>{lang === "vi" ? "Năm thành lập" : "Founded Year"}</label>
                        <input
                          type="number"
                          min="1800"
                          max={new Date().getFullYear()}
                          value={companyInfoForm.foundedYear}
                          onChange={(e) =>
                            setCompanyInfoForm({
                              ...companyInfoForm,
                              foundedYear: e.target.value,
                            })
                          }
                          placeholder="YYYY"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>{lang === "vi" ? "Ngành nghề" : "Industry"}</label>
                      <input
                        type="text"
                        value={companyInfoForm.industry}
                        onChange={(e) =>
                          setCompanyInfoForm({
                            ...companyInfoForm,
                            industry: e.target.value,
                          })
                        }
                        placeholder={lang === "vi" ? "Ví dụ: Công nghệ, Dịch vụ, Sản xuất..." : "e.g., Technology, Services, Manufacturing..."}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>{lang === "vi" ? "Trụ sở chính" : "Headquarters"}</label>
                      <input
                        type="text"
                        value={companyInfoForm.headquarters}
                        onChange={(e) =>
                          setCompanyInfoForm({
                            ...companyInfoForm,
                            headquarters: e.target.value,
                          })
                        }
                        placeholder={lang === "vi" ? "Địa chỉ trụ sở chính" : "Headquarters address"}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>{lang === "vi" ? "Mô tả công ty" : "Company Description"}</label>
                      <textarea
                        value={companyInfoForm.description}
                        onChange={(e) =>
                          setCompanyInfoForm({
                            ...companyInfoForm,
                            description: e.target.value,
                          })
                        }
                        rows={5}
                        placeholder={lang === "vi" ? "Mô tả về công ty của bạn..." : "Describe your company..."}
                      />
                    </div>

                    <button
                      type="submit"
                      className={styles.saveBtn}
                      disabled={loading}
                    >
                      {loading
                        ? (lang === "vi" ? "Đang lưu..." : "Saving...")
                        : (lang === "vi" ? "Lưu thay đổi" : "Save Changes")}
                    </button>
                  </form>
                )}
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
                          id="specialization-input"
                          placeholder={t(
                            "profile.professional.specializationsPlaceholder"
                          )}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const value = e.target.value;
                              console.log(
                                "Enter pressed, adding specialization:",
                                {
                                  value,
                                  trimmed: value?.trim(),
                                  currentSpecializations:
                                    professionalForm.specializations,
                                }
                              );
                              if (value && value.trim().length > 0) {
                                handleAddSpecialization(value);
                                e.target.value = "";
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const input = document.getElementById(
                              "specialization-input"
                            );
                            const value = input?.value;
                            console.log(
                              "Add button clicked, adding specialization:",
                              {
                                value,
                                trimmed: value?.trim(),
                                currentSpecializations:
                                  professionalForm.specializations,
                              }
                            );
                            if (value && value.trim().length > 0) {
                              handleAddSpecialization(value);
                              input.value = "";
                            }
                          }}
                          className={styles.addSpecializationBtn}
                        >
                          {lang === "vi" ? "Thêm" : "Add"}
                        </button>
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
                    <div className={styles.statIcon}>
                      <FaStar />
                    </div>
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
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
