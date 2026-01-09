import React, { useState, useEffect } from "react";
import styles from "./ProfilePage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/authService";
import languageService from "../../services/languageService";
import certificationService from "../../services/certificationService";
import toastService from "../../services/toastService";
import {
  FaChartBar,
  FaClipboardList,
  FaUser,
  FaCog,
  FaCamera,
  FaBriefcase,
  FaEnvelope,
  FaBookmark,
  FaEdit,
  FaQuestionCircle,
  FaUpload,
  FaFilePdf,
  FaFileImage,
  FaTimes,
} from "react-icons/fa";
import ReviewList from "../../components/Review/ReviewList";

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
    id: "savedJobs",
    icon: FaBookmark,
    labelKey: "savedJobs",
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
    id: "savedInterpreters",
    icon: FaBookmark,
    labelKey: "savedInterpreters",
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false);
  const [isEditingBusinessLicense, setIsEditingBusinessLicense] = useState(false);
  const [isDraggingLicense, setIsDraggingLicense] = useState(false);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [isAddingCertification, setIsAddingCertification] = useState(false);
  const [editingCertificationIndex, setEditingCertificationIndex] =
    useState(null);
  const [loading, setLoading] = useState(false);
  // Removed isActiveStatus state as it was never updated

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

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
    businessLicense: null,
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
    credentialId: "",
    description: "",
    expiryYear: "",
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
      if (
        clientProfile?.companyName &&
        clientProfile.companyName.trim().length > 0
      )
        completedFields++;
      if (
        clientProfile?.companyType &&
        clientProfile.companyType.trim().length > 0
      )
        completedFields++;
      if (
        clientProfile?.companySize &&
        clientProfile.companySize.trim().length > 0
      )
        completedFields++;
      if (clientProfile?.website && clientProfile.website.trim().length > 0)
        completedFields++;
      if (clientProfile?.industry && clientProfile.industry.trim().length > 0)
        completedFields++;
      if (
        clientProfile?.description &&
        clientProfile.description.trim().length > 0
      )
        completedFields++;

      return Math.round((completedFields / totalFields) * 100);
    }

    return 0;
  };

  const profileCompleteness = calculateProfileCompleteness();

  // Format company size value to readable text
  const formatCompanySize = (sizeValue) => {
    if (!sizeValue) return t("profile.company.notProvided") || "Not provided";
    
    const sizeMap = {
      "size_1_10": "1-10",
      "size_11_50": "11-50",
      "size_51_200": "51-200",
      "size_201_500": "201-500",
      "size_501_1000": "501-1000",
      "size_1000_plus": "1001+",
    };
    
    const sizeText = sizeMap[sizeValue] || sizeValue;
    return `${sizeText} ${t("profile.company.employees") || "employees"}`;
  };

  // Get missing fields for completeness alert
  const getMissingFields = () => {
    const missing = [];

    if (user?.role === "interpreter") {
      // Missing fields for interpreter role
      if (!user?.phone || user.phone.trim().length === 0)
        missing.push("phoneNumber");
      if (!user?.address || user.address.trim().length === 0)
        missing.push("address");
      if (!languages || languages.length === 0) missing.push("languages");
      if (!certifications || certifications.length === 0)
        missing.push("certifications");
      if (
        !userProfile?.specializations ||
        userProfile.specializations.length === 0
      )
        missing.push("specializations");
      if (!userProfile?.experience || userProfile.experience <= 0)
        missing.push("yearsOfExperience");
      if (
        !userProfile?.hourlyRate ||
        (typeof userProfile.hourlyRate === "number"
          ? userProfile.hourlyRate <= 0
          : parseFloat(userProfile.hourlyRate) <= 0)
      )
        missing.push("hourlyRate");
      if (!userProfile?.portfolio || userProfile.portfolio.trim().length === 0)
        missing.push("portfolioBio");
    } else if (user?.role === "client") {
      // Missing fields for client role
      // userProfile is clientProfile for client role
      const clientProfile = userProfile || user?.clientProfile;

      if (!user?.phone || user.phone.trim().length === 0)
        missing.push("phoneNumber");
      if (!user?.address || user.address.trim().length === 0)
        missing.push("address");
      if (
        !clientProfile?.companyName ||
        clientProfile.companyName.trim().length === 0
      )
        missing.push("companyName");
      if (
        !clientProfile?.companyType ||
        clientProfile.companyType.trim().length === 0
      )
        missing.push("companyType");
      if (
        !clientProfile?.companySize ||
        clientProfile.companySize.trim().length === 0
      )
        missing.push("companySize");
      if (!clientProfile?.website || clientProfile.website.trim().length === 0)
        missing.push("website");
      if (
        !clientProfile?.industry ||
        clientProfile.industry.trim().length === 0
      )
        missing.push("industry");
      if (
        !clientProfile?.description ||
        clientProfile.description.trim().length === 0
      )
        missing.push("companyDescription");
    }

    return missing;
  };

  const missingFields = getMissingFields();

  // Check if user came from registration and show onboarding modal
  useEffect(() => {
    if (location.state?.showOnboarding && user?.role === "interpreter") {
      setShowOnboardingModal(true);
      // Clear state to prevent showing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, user?.role]);

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toastService.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastService.error("File size must be less than 5MB");
      return;
    }

    setLoading(true);
    try {
      await authService.uploadAvatar(file);
      await refreshUser();
      toastService.success("Avatar updated successfully!");
    } catch (error) {
      toastService.error(error.message || "Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  // Handle click avatar to trigger file input
  const handleAvatarClick = (isEditMode = false) => {
    const inputId = isEditMode ? "avatar-upload-input-edit" : "avatar-upload-input";
    document.getElementById(inputId)?.click();
  };

  // Handle update basic info
  const handleUpdateBasicInfo = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.updateUserProfile(basicInfoForm);
      await refreshUser();
      setIsEditingBasicInfo(false);
      toastService.success("Profile updated successfully!");
    } catch (error) {
      toastService.error(error.message || "Failed to update profile");
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

      const result = await authService.updateInterpreterProfile(dataToUpdate);

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
      toastService.success("Professional info updated successfully!");
    } catch (error) {
      console.error("Frontend - Update error:", error);
      toastService.error(error.message || "Failed to update professional info");
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

      // First update the basic company info
      await authService.updateClientProfile(dataToUpdate);

      // If there's a new business license file, upload it
      if (companyInfoForm.businessLicense) {
        const formData = new FormData();
        formData.append("businessLicense", companyInfoForm.businessLicense);

        await authService.uploadBusinessLicense(formData);
      }

      await refreshUser();
      setIsEditingCompanyInfo(false);
      setCompanyInfoForm({
        ...companyInfoForm,
        businessLicense: null,
      });

      toastService.success(
        t("profile.company.updateSuccess") || "Company information updated successfully!"
      );
    } catch (error) {
      toastService.error(
        error.message ||
          t("profile.company.updateFailed") || "Failed to update company information"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for business license
  const handleLicenseFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toastService.error(
        t("profile.company.invalidFileType") || "Please select a PDF, JPG, or PNG file"
      );
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toastService.error(
        t("profile.company.fileTooLarge") || "File size must be less than 10MB"
      );
      return;
    }

    setCompanyInfoForm({
      ...companyInfoForm,
      businessLicense: file,
    });
  };

  // Handle drag and drop for business license
  const handleLicenseDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLicense(true);
  };

  const handleLicenseDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLicense(false);
  };

  const handleLicenseDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLicense(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleLicenseFileSelect(file);
    }
  };

  // Handle upload business license
  const handleUploadBusinessLicense = async (e) => {
    e.preventDefault();
    if (!companyInfoForm.businessLicense) {
      toastService.error(
        t("profile.company.licenseRequired") || "Please select a file to upload"
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("businessLicense", companyInfoForm.businessLicense);

      await authService.uploadBusinessLicense(formData);
      await refreshUser();
      
      setIsEditingBusinessLicense(false);
      setCompanyInfoForm({
        ...companyInfoForm,
        businessLicense: null,
      });

      toastService.success(
        t("profile.company.licenseUploaded") || "Business license uploaded successfully. Please wait for admin approval."
      );
    } catch (error) {
      toastService.error(
        error.message ||
          t("profile.company.licenseUploadFailed") || "Failed to upload business license"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle profile visibility (public/private)
  const handleToggleProfileVisibility = async () => {
    // Allow both interpreter and client to toggle profile visibility
    if (user.role !== "interpreter" && user.role !== "client") return;

    const isCurrentlyPublic = user.isPublic !== false;
    
    // If trying to make private, show confirmation
    if (isCurrentlyPublic) {
      showConfirmModal(
        t("profile.visibility.makePrivateTitle") || "Make Profile Private",
        t("profile.visibility.makePrivateMessage") || "Are you sure you want to make your profile private? Other users will not be able to view your profile.",
        async () => {
          setLoading(true);
          try {
            await authService.toggleProfileVisibility();
            // Wait for refreshUser to complete to ensure state is updated
            const refreshResult = await refreshUser();
            if (refreshResult.success) {
              toastService.success(
                t("profile.visibility.madePrivate") || "Profile is now private"
              );
            } else {
              throw new Error(refreshResult.error || "Failed to refresh user data");
            }
          } catch (error) {
            toastService.error(
              error.message ||
                t("profile.visibility.toggleFailed") || "Failed to change profile visibility"
            );
          } finally {
            setLoading(false);
          }
        }
      );
    } else {
      // Make public directly without confirmation
      setLoading(true);
      try {
        await authService.toggleProfileVisibility();
        // Wait for refreshUser to complete to ensure state is updated
        const refreshResult = await refreshUser();
        if (refreshResult.success) {
          toastService.success(
            t("profile.visibility.madePublic") || "Profile is now public"
          );
        } else {
          throw new Error(refreshResult.error || "Failed to refresh user data");
        }
      } catch (error) {
        toastService.error(
          error.message ||
            t("profile.visibility.toggleFailed") || "Failed to change profile visibility"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Confirmation modal helpers
  const showConfirmModal = (title, message, onConfirm, onCancel = null) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel,
    });
  };

  const hideConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const handleConfirm = async () => {
    if (confirmModal.onConfirm) {
      await confirmModal.onConfirm();
    }
    hideConfirmModal();
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
        toastService.success(
          t("profile.languages.success.added") +
            ` ${t("profile.certifications.suggestedFound").replace(
              "{count}",
              suggestions.length
            )}`
        );
      } else {
        toastService.success(t("profile.languages.success.added"));
      }
    } catch (error) {
      toastService.error(error.message || t("profile.languages.errors.addFailed"));
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
      credentialId: "",
      description: "",
      expiryYear: "",
      certificationImage: null,
    });
    setIsAddingCertification(true);
    setShowSuggestedCerts(false);
  };

  const resetCertificationForm = () => {
    setCertificationForm({
      name: "",
      score: "",
      year: "",
      organization: "",
      credentialId: "",
      description: "",
      expiryYear: "",
      certificationImage: null,
    });
  };

  // Removed handleEditCertification as it was never used

  const closeCertificationModal = () => {
    setIsAddingCertification(false);
    setEditingCertificationIndex(null);
    resetCertificationForm();
  };

  // Handle dismiss suggestions
  const handleDismissSuggestions = () => {
    setShowSuggestedCerts(false);
    setSuggestedCertifications([]);
  };

  // Handle remove language
  const handleRemoveLanguage = async (languageId) => {
    showConfirmModal(
      t("profile.confirm.deleteLanguage") || "Confirm Delete",
      t("profile.confirm.deleteLanguageMessage") || "Are you sure you want to delete this language?",
      async () => {
        setLoading(true);

        try {
          if (languageId) {
            await languageService.deleteLanguage(languageId);
            await refreshUser();
            toastService.success(t("profile.languages.success.removed"));
          } else {
            toastService.error(t("profile.languages.errors.cannotRemove"));
          }
        } catch (error) {
          toastService.error(
            error.message || t("profile.languages.errors.removeFailed")
          );
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Handle add certification
  const handleAddCertification = async (e, isDraft = false) => {
    e.preventDefault();
    setLoading(true);

    const isEditing = editingCertificationIndex !== null;
    const editingCert = isEditing
      ? certifications[editingCertificationIndex]
      : null;

    try {
      const errors = [];
      if (!certificationForm.name?.trim()) {
        errors.push(
          t("profile.certifications.errors.nameRequired") ||
            "Please enter certification name"
        );
      }
      if (!isDraft && !certificationForm.organization?.trim()) {
        errors.push(
          t("profile.certifications.errors.organizationRequired") ||
            "Please enter issuing organization"
        );
      }
      if (
        certificationForm.year &&
        !/^\d{4}$/.test(String(certificationForm.year))
      ) {
        errors.push(
          t("profile.certifications.errors.yearInvalid") ||
            "Year must be a 4-digit number"
        );
      }
      if (
        certificationForm.expiryYear &&
        !/^\d{4}$/.test(String(certificationForm.expiryYear))
      ) {
        errors.push(t("profile.certifications.errors.expiryYearInvalid") || "Expiry year must be a 4-digit number");
      }
      if (!isDraft && !certificationForm.certificationImage) {
        errors.push(
          t("profile.certifications.errors.uploadRequired") ||
            "Please upload a certification image"
        );
      } else if (certificationForm.certificationImage) {
        const file = certificationForm.certificationImage;
        const validTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
        ];
        if (!validTypes.includes(file.type)) {
          errors.push(t("profile.certifications.errors.invalidFileTypeImageOrPdf") || "File must be an image or PDF");
        }
        if (file.size > 10 * 1024 * 1024) {
          errors.push(t("profile.certifications.errors.fileSizeMax") || "File size must be less than 10MB");
        }
      }

      if (errors.length > 0) {
        errors.forEach((msg) => toastService.error(msg));
        setLoading(false);
        return;
      }


      // Validate image upload is required (skip for draft)
      if (!isDraft && !certificationForm.certificationImage) {
        console.error("No image file provided");
        toastService.error(t("profile.certifications.errors.uploadRequired"));
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
        credentialId: certificationForm.credentialId || null,
        description: certificationForm.description || "",
        expiryDate: certificationForm.expiryYear
          ? `${certificationForm.expiryYear}-01-01`
          : null,
        verificationStatus: isDraft ? "draft" : "pending",
      };

      // If editing, use update API instead of create
      if (isEditing && editingCert?.id) {
        await certificationService.updateCertification(
          editingCert.id,
          certificationData
        );

        // Upload new image if provided
        if (certificationForm.certificationImage) {
          await certificationService.uploadCertificationImage(
            editingCert.id,
            certificationForm.certificationImage
          );
        }

        await refreshUser();
        setIsAddingCertification(false);
        setEditingCertificationIndex(null);
        resetCertificationForm();

        const successMessage = isDraft
          ? t("profile.certifications.draftSaved") || "Draft saved successfully"
          : t("profile.certifications.updated") ||
            "Certification updated successfully";
        toastService.success(successMessage);
        setLoading(false);
        return;
      }


      // Step 1: Create certification
      const result = await certificationService.addCertification(
        certificationData
      );


      // Step 2: Upload image (this will change status to "pending")
      // Try multiple possible response structures
      const certId =
        result.data?.id ||
        result.certification?.id ||
        result.id ||
        (result.data && typeof result.data === "object" && result.data.id
          ? result.data.id
          : null);


      if (certId && certificationForm.certificationImage) {
        await certificationService.uploadCertificationImage(
          certId,
          certificationForm.certificationImage
        );

      } else {
        console.error("No certification ID returned from create:", result);
      }

      await refreshUser();

      setIsAddingCertification(false);
      setEditingCertificationIndex(null);
      setCertificationForm({
        name: "",
        score: "",
        year: "",
        organization: "",
        credentialId: "",
        credentialUrl: "",
        description: "",
        expiryYear: "",
        certificationImage: null,
      });
      const successMessage = isDraft
        ? t("profile.certifications.draftSaved") || "Draft saved successfully"
        : t("profile.certifications.success.added") ||
          "Certification submitted for review";
      toastService.success(successMessage);
    } catch (error) {
      console.error("Error adding certification:", error);
      toastService.error(
        error.message || t("profile.certifications.errors.addFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle remove certification
  const handleRemoveCertification = async (index) => {
    showConfirmModal(
      t("profile.confirm.deleteCertification") || "Confirm Delete",
      t("profile.confirm.deleteCertificationMessage") || "Are you sure you want to delete this certification?",
      async () => {
        setLoading(true);

        try {
          const certificationToRemove = certifications[index];
          if (certificationToRemove?.id) {
            await certificationService.deleteCertification(
              certificationToRemove.id
            );
            await refreshUser();
            toastService.success(t("profile.certifications.success.removed"));
          } else {
            toastService.error(t("profile.certifications.errors.cannotRemove"));
          }
        } catch (error) {
          toastService.error(
            error.message || t("profile.certifications.errors.removeFailed")
          );
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Handle add specialization
  // eslint-disable-next-line no-unused-vars
  const handleAddSpecialization = (spec) => {
    const trimmedSpec = spec?.trim();

    if (trimmedSpec && trimmedSpec.length > 0) {
      setProfessionalForm((prev) => {
        // Check if already exists (case-insensitive)
        const exists = prev.specializations.some(
          (s) => s.toLowerCase() === trimmedSpec.toLowerCase()
        );
        if (!exists) {
          const newSpecializations = [...prev.specializations, trimmedSpec];
          return {
            ...prev,
            specializations: newSpecializations,
          };
        }
        return prev;
      });
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
                  } else if (item.id === "savedJobs") {
                    navigate(ROUTES.SAVED_JOBS);
                  } else if (item.id === "profile") {
                    // Stay on current page
                    setActiveMenu(item.id);
                  } else if (item.id === "myJobs") {
                    navigate(ROUTES.MY_JOBS);
                  } else if (item.id === "jobApplications") {
                    navigate(ROUTES.MY_APPLICATIONS);
                  } else if (item.id === "savedInterpreters") {
                    navigate(ROUTES.SAVED_INTERPRETERS);
                  } else if (item.id === "notifications") {
                    navigate(ROUTES.DASHBOARD + "?tab=notifications");
                  } else if (item.id === "settings") {
                    navigate(ROUTES.SETTINGS);
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
            {/* Onboarding Modal */}
            {showOnboardingModal && user?.role === "interpreter" && (
              <div className={styles.onboardingModalOverlay}>
                <div className={styles.onboardingModal}>
                  <div className={styles.onboardingModalHeader}>
                    <h2>{t("profile.onboarding.title")}</h2>
                    <button
                      className={styles.onboardingModalClose}
                      onClick={() => setShowOnboardingModal(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.onboardingModalContent}>
                    <p>{t("profile.onboarding.description")}</p>
                    <div className={styles.onboardingProgressInfo}>
                      <div className={styles.onboardingProgressItem}>
                        <span className={styles.onboardingProgressLabel}>
                          {t("profile.onboarding.currentProgress")}:
                        </span>
                        <span className={styles.onboardingProgressValue}>
                          {profileCompleteness}%
                        </span>
                      </div>
                      {missingFields.length > 0 && (
                        <div className={styles.onboardingProgressItem}>
                          <span className={styles.onboardingProgressLabel}>
                            {t("profile.onboarding.missingFields")}:
                          </span>
                          <span className={styles.onboardingProgressValue}>
                            {missingFields.length}
                          </span>
                        </div>
                      )}
                    </div>
                    {missingFields.length > 0 && (
                      <div className={styles.onboardingMissingFields}>
                        <p className={styles.onboardingMissingFieldsTitle}>
                          {t("profile.onboarding.missingFieldsList")}:
                        </p>
                        <div className={styles.onboardingMissingFieldsList}>
                          {missingFields.slice(0, 5).map((field, index) => (
                            <span
                              key={index}
                              className={styles.onboardingMissingFieldTag}
                            >
                              {t(`profile.completeness.fields.${field}`)}
                            </span>
                          ))}
                          {missingFields.length > 5 && (
                            <span className={styles.onboardingMissingFieldTag}>
                              +{missingFields.length - 5} {t("profile.onboarding.more")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.onboardingModalFooter}>
                    <button
                      className={styles.onboardingModalButton}
                      onClick={() => setShowOnboardingModal(false)}
                    >
                      {t("profile.onboarding.start")}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                          {t(`profile.completeness.fields.${field}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Basic Information */}
            <div className={styles.basicInfoContainer}>
              <div className={styles.basicInfoHeader}>
                <h3 className={styles.basicInfoTitle}>
                  {t("profile.basicInfo.title") || "BASIC INFORMATION"}
                </h3>
                <button
                  className={styles.editBtn}
                  onClick={() => setIsEditingBasicInfo(!isEditingBasicInfo)}
                  title={isEditingBasicInfo ? t("profile.basicInfo.cancel") : t("profile.basicInfo.edit")}
                >
                  {isEditingBasicInfo ? (
                    t("profile.basicInfo.cancel")
                  ) : (
                    <FaEdit />
                  )}
                </button>
              </div>

              {!isEditingBasicInfo ? (
                <div className={styles.basicInfoContent}>
                  {/* Avatar Display - Top */}
                  <div className={styles.basicInfoAvatar}>
                    <input
                      type="file"
                      id="avatar-upload-input"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: "none" }}
                    />
                    <div
                      className={styles.avatarContainer}
                      onClick={() => handleAvatarClick(false)}
                      title="Click to change avatar"
                    >
                      {user.avatar ? (
                        <img
                          src={
                            user.avatar.startsWith("http")
                              ? user.avatar
                              : `http://localhost:4000${user.avatar}`
                          }
                          alt="Profile Avatar"
                          className={styles.avatar}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : null}
                      <div className={`${styles.avatarPlaceholder} ${user.avatar ? styles.avatarPlaceholderHidden : ""}`}>
                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className={styles.avatarOverlay}>
                        <span>
                          <FaCamera />
                        </span>
                        <span>{t("profile.basicInfo.changeAvatar")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Display - Bottom */}
                  <div className={styles.basicInfoFields}>
                    <div className={styles.basicInfoRow}>
                      {user.fullName && (
                        <div className={styles.infoItem}>
                          <label className={styles.basicInfoLabel}>
                            {t("profile.basicInfo.fullName") || "Full Name"}
                          </label>
                          <p>{user.fullName}</p>
                        </div>
                      )}
                      {user.email && (
                        <div className={styles.infoItem}>
                          <label className={styles.basicInfoLabel}>
                            {t("profile.basicInfo.email") || "Email"}
                          </label>
                          <p>{user.email}</p>
                        </div>
                      )}
                      <div className={styles.infoItem}>
                        <label className={styles.basicInfoLabel}>
                          {t("profile.basicInfo.phone") || "Phone"}
                        </label>
                        <p>{user.phone || (t("profile.basicInfo.notProvided") || "Not provided")}</p>
                      </div>
                      {/* Profile Visibility Toggle - For interpreters and clients */}
                      {(user.role === "interpreter" || user.role === "client") && (
                        <div className={styles.infoItem}>
                          <label className={styles.basicInfoLabel}>
                            {t("profile.visibility.label") || "PROFILE VISIBILITY"}
                            <span
                              className={styles.infoIcon}
                              title={t("profile.visibility.whenPrivate") || "When private, your profile will not be visible to other users"}
                            >
                              <FaQuestionCircle />
                            </span>
                          </label>
                          <div className={styles.toggleContainer}>
                            <label className={styles.toggleSwitch}>
                              <input
                                type="checkbox"
                                checked={user.isPublic !== false}
                                onChange={handleToggleProfileVisibility}
                                disabled={loading}
                              />
                              <span className={styles.toggleSlider}></span>
                            </label>
                            <span className={styles.toggleLabel}>
                              {(user.isPublic !== false)
                                ? t("profile.visibility.public") || "Public"
                                : t("profile.visibility.private") || "Private"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    {user.address && (
                      <div className={`${styles.infoItem} ${styles.infoItemFullWidth}`}>
                        <label className={styles.basicInfoLabel}>
                          {t("profile.basicInfo.address") || "Address"}
                        </label>
                        <p>{user.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleUpdateBasicInfo}
                  className={styles.basicInfoEditForm}
                >
                  <div className={styles.basicInfoEditContent}>
                    {/* Form Fields */}
                    <div className={styles.basicInfoEditFields}>
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
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Professional Information */}
            {user.role === "interpreter" && (
              <div className={styles.professionalInfoContainer}>
                <div className={styles.professionalInfoHeader}>
                  <h3 className={styles.professionalInfoTitle}>
                    {t("profile.professional.title") || "PROFESSIONAL INFORMATION"}
                  </h3>
                  <button
                    className={styles.editBtn}
                    onClick={() =>
                      setIsEditingProfessional(!isEditingProfessional)
                    }
                    title={isEditingProfessional ? t("profile.professional.cancel") : t("profile.professional.edit")}
                  >
                    {isEditingProfessional ? (
                      t("profile.professional.cancel")
                    ) : (
                      <FaEdit />
                    )}
                  </button>
                </div>

                {!isEditingProfessional ? (
                  <div className={styles.professionalInfoFields}>
                    <div className={styles.professionalInfoRow}>
                      {userProfile?.hourlyRate && (
                        <div className={styles.infoItem}>
                          <label className={styles.professionalInfoLabel}>
                            {t("profile.professional.hourlyRate") || "Hourly Rate"}
                          </label>
                          <p>
                            ${userProfile.hourlyRate} {userProfile.currency || "USD"}
                          </p>
                        </div>
                      )}
                      {userProfile?.experience && (
                        <div className={styles.infoItem}>
                          <label className={styles.professionalInfoLabel}>
                            {t("profile.professional.experience") || "Years of Experience"}
                          </label>
                          <p>{userProfile.experience} {t("profile.professional.years") || "years"}</p>
                        </div>
                      )}
                      {userProfile?.specializations?.length > 0 && (
                        <div className={styles.infoItem}>
                          <label className={styles.professionalInfoLabel}>
                            {t("profile.professional.specializations") || "Specializations"}
                          </label>
                          <p>{userProfile.specializations.join(", ")}</p>
                        </div>
                      )}
                    </div>
                    {userProfile?.portfolio && (
                      <div className={`${styles.infoItem} ${styles.infoItemFullWidth}`}>
                        <label className={styles.professionalInfoLabel}>
                          {t("profile.professional.portfolio") || "Portfolio/Bio"}
                        </label>
                        <p>{userProfile.portfolio}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={handleUpdateProfessional}
                    className={styles.professionalInfoEditForm}
                  >
                    <div className={styles.professionalInfoEditFields}>
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

                      <div className={styles.formGroup}>
                        <label>
                          {t("profile.professional.specializations")}
                        </label>
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
                              if (value && value.trim().length > 0) {
                                handleAddSpecialization(value);
                                input.value = "";
                              }
                            }}
                            className={styles.addSpecializationBtn}
                          >
                            {t("profile.add") || "Add"}
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
                    </div>
                  </form>
                )}
              </div>
            )}

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
                        {languages.map((lang) => (
                          <div
                            key={lang.id || lang.name}
                            className={styles.languageItem}
                          >
                            <div className={styles.languageInfo}>
                              <h4>{lang.name}</h4>
                              <span className={styles.languageLevel}>
                                {lang.proficiencyLevel || lang.level}
                              </span>
                            </div>
                            <button
                              className={styles.removeBtn}
                              onClick={() => handleRemoveLanguage(lang.id)}
                              disabled={loading}
                              title={t("profile.languages.remove")}
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
                    {showSuggestedCerts &&
                      suggestedCertifications.length > 0 && (
                        <div className={styles.suggestedCertsContainer}>
                          <div className={styles.suggestedHeader}>
                            <h4>
                              {t("profile.certifications.suggestedTitle")}
                            </h4>
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
                                onClick={() =>
                                  handleQuickAddCertification(cert)
                                }
                              >
                                <span className={styles.certIcon}></span>
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
                                      t("profile.certifications.statusDraft")}
                                    {cert.verificationStatus === "pending" &&
                                      t("profile.certifications.statusPending")}
                                    {cert.verificationStatus === "approved" &&
                                      t("profile.certifications.statusApproved")}
                                    {cert.verificationStatus === "rejected" &&
                                      t("profile.certifications.statusRejected")}
                                  </span>
                                )}
                              </div>
                              <div className={styles.certificationMeta}>
                                {cert.score && <span>Score: {cert.score}</span>}
                                {cert.issueDate && (
                                  <span>
                                    Year:{" "}
                                    {new Date(cert.issueDate).getFullYear()}
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
                                    href={
                                      cert.imageUrl.startsWith("http")
                                        ? cert.imageUrl
                                        : `http://localhost:4000${cert.imageUrl}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.viewCertBtn}
                                  >
                                    {t(
                                      "profile.certifications.viewCertificate"
                                    ) || "View Certificate"}
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className={styles.certActions}>
                              <button
                                className={styles.removeBtn}
                                onClick={() => handleRemoveCertification(index)}
                                disabled={loading}
                                title={t("common.delete") || "Delete"}
                              >
                                ×
                              </button>
                            </div>
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
                        <h4 className={styles.formTitle}>
                          {editingCertificationIndex !== null
                            ? t("profile.certifications.editTitle") ||
                              "Edit Certification"
                            : t("profile.certifications.addTitle") ||
                              "Add New Certification"}
                        </h4>
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

                        <div className={styles.formGrid2}>
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
                        </div>

                        <div className={styles.formGrid3}>
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

                          <div className={styles.formGroup}>
                            <label>{t("profile.certifications.expiryYear") || "Expiry Year"}</label>
                            <input
                              type="text"
                              value={certificationForm.expiryYear}
                              onChange={(e) =>
                                setCertificationForm({
                                  ...certificationForm,
                                  expiryYear: e.target.value,
                                })
                              }
                              placeholder={t("profile.certifications.expiryYearPlaceholder") || "e.g., 2026"}
                            />
                          </div>
                        </div>

                        <div className={styles.formGrid2}>
                          <div className={styles.formGroup}>
                            <label>{t("profile.certifications.credentialId") || "Credential ID"}</label>
                            <input
                              type="text"
                              value={certificationForm.credentialId}
                              onChange={(e) =>
                                setCertificationForm({
                                  ...certificationForm,
                                  credentialId: e.target.value,
                                })
                              }
                              placeholder={t("profile.certifications.credentialIdPlaceholder") || "e.g., ABC-12345"}
                            />
                          </div>
                        </div>

                        <div
                          className={`${styles.formGroup} ${styles.fullWidth}`}
                        >
                          <label>{t("profile.certifications.description") || "Description"}</label>
                          <textarea
                            rows={3}
                            value={certificationForm.description}
                            onChange={(e) =>
                              setCertificationForm({
                                ...certificationForm,
                                description: e.target.value,
                              })
                            }
                            placeholder={t("profile.certifications.descriptionPlaceholder") || "Short description about the certification"}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>
                            {t("profile.certifications.uploadImage")}
                          </label>
                          <input
                            type="file"
                            id="certification-image-input"
                            accept=".pdf,application/pdf"
                            disabled={loading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const validTypes = ["application/pdf"];
                                if (!validTypes.includes(file.type)) {
                                  toastService.error(
                                    t(
                                      "profile.certifications.errors.invalidFileType"
                                    ) || "Please select a PDF file only"
                                  );
                                  e.target.value = "";
                                  return;
                                }

                                // Check file size (10MB max)
                                const maxSize = 10 * 1024 * 1024;
                                if (file.size > maxSize) {
                                  toastService.error(
                                    t(
                                      "profile.certifications.errors.fileTooLarge"
                                    ) || "File size must be less than 10MB"
                                  );
                                  e.target.value = "";
                                  return;
                                }
                                if (file.size > 10 * 1024 * 1024) {
                                  toastService.error(
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
                            onClick={closeCertificationModal}
                          >
                            {t("profile.modal.cancel")}
                          </button>
                          <button
                            type="button"
                            className={styles.draftBtn}
                            onClick={(e) => handleAddCertification(e, true)}
                            disabled={loading}
                          >
                            {loading
                              ? t("profile.certifications.saving")
                              : t("profile.certifications.saveAsDraft") ||
                                "Save as Draft"}
                          </button>
                          <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={loading}
                          >
                            {loading
                              ? t("profile.certifications.submitting")
                              : t("profile.certifications.submitForReview") ||
                                "Submit for Review"}
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
                    {t("profile.company.title") || "Company Information"}
                  </h3>
                  <button
                    className={styles.editBtn}
                    onClick={() =>
                      setIsEditingCompanyInfo(!isEditingCompanyInfo)
                    }
                    title={isEditingCompanyInfo ? t("profile.basicInfo.cancel") : t("profile.basicInfo.edit")}
                  >
                    {isEditingCompanyInfo ? (
                      t("profile.basicInfo.cancel")
                    ) : (
                      <FaEdit />
                    )}
                  </button>
                </div>

                <div className={styles.cardContent}>
                  {!isEditingCompanyInfo ? (
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <label>
                          {t("profile.company.companyName") || "Company Name"}
                        </label>
                        <p>
                          {userProfile?.companyName ||
                            (t("profile.company.notProvided") || "Not provided")}
                        </p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>
                          {t("profile.company.companyType") || "Company Type"}
                        </label>
                        <p>
                          {userProfile?.companyType ||
                            (t("profile.company.notProvided") || "Not provided")}
                        </p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>
                          {t("profile.company.companySize") || "Company Size"}
                        </label>
                        <p>
                          {formatCompanySize(userProfile?.companySize)}
                        </p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>{t("profile.company.website") || "Website"}</label>
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
                            t("profile.company.notProvided") || "Not provided"
                          )}
                        </p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>
                          {t("profile.company.industry") || "Industry"}
                        </label>
                        <p>
                          {userProfile?.industry ||
                            (t("profile.company.notProvided") || "Not provided")}
                        </p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>{t("profile.company.description") || "Description"}</label>
                        <p>
                          {userProfile?.description ||
                            (t("profile.company.notProvided") || "Not provided")}
                        </p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>
                          {t("profile.company.headquarters") || "Headquarters"}
                        </label>
                        <p>
                          {userProfile?.headquarters ||
                            (t("profile.company.notProvided") || "Not provided")}
                        </p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>
                          {t("profile.company.foundedYear") || "Founded Year"}
                        </label>
                        <p>
                          {userProfile?.foundedYear ||
                            (t("profile.company.notProvided") || "Not provided")}
                        </p>
                      </div>
                      <div className={`${styles.infoItem} ${styles.infoItemFullWidth}`}>
                        <label>
                          {t("profile.company.businessLicense") || "Business License"}
                        </label>
                        {!isEditingBusinessLicense ? (
                          userProfile?.businessLicense ? (
                          <div className={styles.licenseInfo}>
                              {/* File Info Section */}
                              {(() => {
                                const licenseUrl = userProfile.businessLicense;
                                const fileName = licenseUrl.split('/').pop() || '';
                                const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                                const isPdf = fileExtension === 'pdf';
                                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                                const fileTypeDisplay = isPdf 
                                  ? 'PDF Document' 
                                  : isImage 
                                    ? fileExtension.toUpperCase() + ' Image' 
                                    : 'File';
                                const fullLicenseUrl = licenseUrl.startsWith("http")
                                  ? licenseUrl
                                  : `http://localhost:4000${licenseUrl}`;
                                
                                return (
                                  <div className={styles.licenseFileInfo}>
                                    <div className={styles.licenseFileIcon}>
                                      {isPdf ? (
                                        <FaFilePdf data-file-type="pdf" />
                                      ) : (
                                        <FaFileImage data-file-type="image" />
                                      )}
                                    </div>
                                    <div className={styles.licenseFileDetails}>
                                      <a
                                        href={fullLicenseUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.licenseFileName}
                                      >
                                        {fileName || t("profile.company.businessLicense") || "Business License"}
                                      </a>
                                      <p className={styles.licenseFileType}>
                                        {fileTypeDisplay}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingBusinessLicense(true)}
                                      className={styles.licenseEditBtn}
                                      disabled={loading}
                                      title={t("profile.company.editLicense") || "Edit"}
                                    >
                                      <FaEdit />
                                    </button>
                                  </div>
                                );
                              })()}

                              {/* Status Section */}
                            {userProfile?.licenseVerificationStatus && (
                              <div className={styles.licenseStatusWrapper}>
                                <span className={styles.licenseStatusLabel}>
                                  {t("profile.verificationStatus.status") || "Status:"}
                                </span>
                                <span
                                  className={`${styles.statusBadge} ${
                                    styles[userProfile.licenseVerificationStatus]
                                  }`}
                                >
                                  {(userProfile.licenseVerificationStatus ===
                                    "pending" &&
                                    t("profile.verificationStatus.pending")) || "Pending"}
                                  {(userProfile.licenseVerificationStatus ===
                                    "approved" &&
                                    (t("profile.verificationStatus.verified") || "Verified"))}
                                  {(userProfile.licenseVerificationStatus ===
                                    "rejected" &&
                                    (t("profile.verificationStatus.rejected") || "Rejected"))}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                            <div className={styles.licenseEmptyState}>
                          <p className={styles.licenseEmptyText}>
                            {t("profile.company.notUploaded") || "Not uploaded"}
                              </p>
                              <button
                                type="button"
                                onClick={() => setIsEditingBusinessLicense(true)}
                                className={styles.uploadBtn}
                                disabled={loading}
                              >
                                <FaUpload style={{ marginRight: "8px" }} />
                                {t("profile.company.uploadLicense") || "Upload License"}
                              </button>
                            </div>
                          )
                        ) : (
                          <form
                            onSubmit={handleUploadBusinessLicense}
                            className={styles.licenseEditForm}
                          >
                            <div className={styles.formGroup}>
                              <label className={styles.formLabel}>
                                {t("profile.company.selectLicenseFile") || "CHỌN FILE GIẤY PHÉP KINH DOANH"} *
                              </label>
                              
                              <div
                                className={`${styles.fileUploadArea} ${
                                  isDraggingLicense ? styles.fileUploadAreaDragging : ""
                                } ${companyInfoForm.businessLicense ? styles.fileUploadAreaHasFile : ""}`}
                                onDragOver={handleLicenseDragOver}
                                onDragLeave={handleLicenseDragLeave}
                                onDrop={handleLicenseDrop}
                                onClick={() => document.getElementById("business-license-input")?.click()}
                              >
                                <input
                                  id="business-license-input"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleLicenseFileSelect(e.target.files[0])}
                                  required
                                  style={{ display: "none" }}
                                />
                                
                                {companyInfoForm.businessLicense ? (
                                  <div className={styles.fileSelected}>
                                    <div className={styles.fileIcon}>
                                      {companyInfoForm.businessLicense.type === "application/pdf" ? (
                                        <FaFilePdf />
                                      ) : (
                                        <FaFileImage />
                                      )}
                                    </div>
                                    <div className={styles.fileDetails}>
                                      <span className={styles.fileName}>
                                        {companyInfoForm.businessLicense.name}
                                      </span>
                                      <span className={styles.fileSize}>
                                        {(companyInfoForm.businessLicense.size / 1024 / 1024).toFixed(2)} MB
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      className={styles.fileRemoveBtn}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCompanyInfoForm({
                                          ...companyInfoForm,
                                          businessLicense: null,
                                        });
                                      }}
                                    >
                                      <FaTimes />
                                    </button>
                                  </div>
                                ) : (
                                  <div className={styles.fileUploadPlaceholder}>
                                    <FaUpload className={styles.uploadIcon} />
                                    <p className={styles.uploadText}>
                                      {t("profile.company.dragDropFile") || "Kéo thả file vào đây hoặc click để chọn"}
                                    </p>
                                    <button
                                      type="button"
                                      className={styles.chooseFileBtn}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        document.getElementById("business-license-input")?.click();
                                      }}
                                    >
                                      {t("profile.company.chooseFile") || "Chọn tệp"}
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              <p className={styles.fileHint}>
                                {t("profile.company.licenseFileHint") || "Định dạng chấp nhận: PDF, JPG, PNG (Tối đa 10MB)"}
                              </p>
                            </div>
                            
                            <div className={styles.formActions}>
                              <button
                                type="submit"
                                className={styles.saveBtn}
                                disabled={loading || !companyInfoForm.businessLicense}
                              >
                                <FaUpload style={{ marginRight: "8px" }} />
                                {loading
                                  ? t("profile.company.uploading") || "Đang tải lên..."
                                  : t("profile.company.upload") || "Tải lên"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingBusinessLicense(false);
                                  setCompanyInfoForm({
                                    ...companyInfoForm,
                                    businessLicense: null,
                                  });
                                }}
                                className={styles.cancelBtn}
                                disabled={loading}
                              >
                                {t("profile.company.cancel") || "Hủy"}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleUpdateCompanyInfo}
                      className={styles.editForm}
                    >
                      <div className={styles.formGroup}>
                        <label>
                          {t("profile.company.companyName") || "Company Name"} *
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
                          placeholder={t("profile.company.companyNamePlaceholder") || "Enter company name"}
                        />
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>
                            {t("profile.company.companyType") || "Company Type"}
                          </label>
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
                              {t("profile.company.selectCompanyType") || "Select company type"}
                            </option>
                            <option value="startup">
                              {t("profile.company.types.startup") || "Startup"}
                            </option>
                            <option value="corporation">
                              {t("profile.company.types.corporation") || "Corporation"}
                            </option>
                            <option value="nonprofit">
                              {t("profile.company.types.nonprofit") || "Nonprofit"}
                            </option>
                            <option value="government">
                              {t("profile.company.types.government") || "Government"}
                            </option>
                            <option value="healthcare">
                              {t("profile.company.types.healthcare") || "Healthcare"}
                            </option>
                            <option value="education">
                              {t("profile.company.types.education") || "Education"}
                            </option>
                            <option value="other">
                              {t("profile.company.types.other") || "Other"}
                            </option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label>
                            {t("profile.company.companySize") || "Company Size"}
                          </label>
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
                              {t("profile.company.selectCompanySize") || "Select company size"}
                            </option>
                            <option value="size_1_10">
                              1-10 {t("profile.company.employees") || "employees"}
                            </option>
                            <option value="size_11_50">
                              11-50 {t("profile.company.employees") || "employees"}
                            </option>
                            <option value="size_51_200">
                              51-200 {t("profile.company.employees") || "employees"}
                            </option>
                            <option value="size_201_500">
                              201-500{" "}
                              {t("profile.company.employees") || "employees"}
                            </option>
                            <option value="size_501_1000">
                              501-1000{" "}
                              {t("profile.company.employees") || "employees"}
                            </option>
                            <option value="size_1000_plus">
                              1001+ {t("profile.company.employees") || "employees"}
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>{t("profile.company.website") || "Website"}</label>
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
                          <label>
                            {t("profile.company.foundedYear") || "Founded Year"}
                          </label>
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
                        <label>
                          {t("profile.company.industry") || "Industry"}
                        </label>
                        <input
                          type="text"
                          value={companyInfoForm.industry}
                          onChange={(e) =>
                            setCompanyInfoForm({
                              ...companyInfoForm,
                              industry: e.target.value,
                            })
                          }
                          placeholder={t("profile.company.industryPlaceholder") || "e.g., Technology, Services, Manufacturing..."}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>
                          {t("profile.company.headquarters") || "Headquarters"}
                        </label>
                        <input
                          type="text"
                          value={companyInfoForm.headquarters}
                          onChange={(e) =>
                            setCompanyInfoForm({
                              ...companyInfoForm,
                              headquarters: e.target.value,
                            })
                          }
                          placeholder={t("profile.company.headquartersPlaceholder") || "Headquarters address"}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>
                          {t("profile.company.description") || "Description"}
                        </label>
                        <textarea
                          value={companyInfoForm.description}
                          onChange={(e) =>
                            setCompanyInfoForm({
                              ...companyInfoForm,
                              description: e.target.value,
                            })
                          }
                          rows={5}
                          placeholder={t("profile.company.descriptionPlaceholder") || "Describe your company..."}
                        />
                      </div>

                      <button
                        type="submit"
                        className={styles.saveBtn}
                        disabled={loading}
                      >
                        {loading
                          ? t("profile.company.saving") || "Saving..."
                          : t("profile.company.saveChanges") || "Save Changes"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  {t("reviews.title") || t("profile.reviews.title") || "Reviews"}
                </h3>
              </div>
              <div className={styles.cardContent}>
                <ReviewList
                  revieweeId={user.id}
                  showForm={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className={styles.modalOverlay} onClick={hideConfirmModal}>
          <div
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.confirmModalHeader}>
              <h3>{confirmModal.title}</h3>
            </div>
            <div className={styles.confirmModalBody}>
              <p>{confirmModal.message}</p>
            </div>
            <div className={styles.confirmModalFooter}>
              {confirmModal.onConfirm ? (
                <>
                  <button
                    className={styles.confirmCancelBtn}
                    onClick={hideConfirmModal}
                  >
                    {t("profile.cancel") || t("common.cancel") || "Cancel"}
                  </button>
                  <button
                    className={styles.confirmDeleteBtn}
                    onClick={handleConfirm}
                  >
                    {t("common.confirm") || "Confirm"}
                  </button>
                </>
              ) : (
                <button
                  className={styles.confirmCancelBtn}
                  onClick={hideConfirmModal}
                  style={{ width: "100%" }}
                >
                  {t("common.close") || "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ProfilePage;
