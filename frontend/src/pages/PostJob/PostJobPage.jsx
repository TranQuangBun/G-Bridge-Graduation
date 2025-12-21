import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../constants";
import jobService from "../../services/jobService";
import organizationService from "../../services/organizationService";
import languageService from "../../services/languageService";
import aiMatchingService from "../../services/aiMatchingService";
import { AIMatchModal, MatchReasonsCard } from "../../components/AIMatching";
import { toast } from "react-toastify";
import styles from "./PostJobPage.module.css";

const defaultOrganizationForm = {
  name: "",
  email: "",
  phone: "",
  website: "",
  province: "",
  address: "",
  description: "",
  businessLicense: null,
};

// Common languages list for job posting
const COMMON_LANGUAGES = [
  "English",
  "Vietnamese",
  "Japanese",
  "Korean",
  "Chinese",
  "French",
  "German",
  "Spanish",
  "Italian",
  "Portuguese",
  "Russian",
  "Arabic",
  "Thai",
  "Indonesian",
  "Malay",
  "Hindi",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
  "Polish",
  "Turkish",
  "Greek",
  "Czech",
  "Hungarian",
  "Romanian",
  "Finnish",
];

// Default working modes fallback (if API doesn't return data)
const DEFAULT_WORKING_MODES = [
  { id: 1, name: "Full-time" },
  { id: 2, name: "Part-time" },
  { id: 3, name: "Remote" },
  { id: 4, name: "Hybrid" },
  { id: 5, name: "Contract" },
  { id: 6, name: "Freelance" },
];

// Default proficiency levels fallback (if API doesn't return data)
const DEFAULT_LEVELS = [
  { id: 1, name: "Beginner", nameVi: "Sơ cấp" },
  { id: 2, name: "Elementary", nameVi: "Cơ bản" },
  { id: 3, name: "Intermediate", nameVi: "Trung cấp" },
  { id: 4, name: "Upper Intermediate", nameVi: "Trung cấp cao" },
  { id: 5, name: "Advanced", nameVi: "Cao cấp" },
  { id: 6, name: "Native", nameVi: "Bản ngữ" },
];

// Domain names mapping for Vietnamese
const DOMAIN_NAMES_VI = {
  Business: "Kinh doanh",
  Conference: "Hội nghị",
  Education: "Giáo dục",
  Legal: "Pháp lý",
  Media: "Truyền thông",
  Medical: "Y tế",
  Technical: "Kỹ thuật",
  Tourism: "Du lịch",
};

// Level names mapping for Vietnamese
const LEVEL_NAMES_VI = {
  Beginner: "Sơ cấp",
  Elementary: "Cơ bản",
  Intermediate: "Trung cấp",
  "Upper Intermediate": "Trung cấp cao",
  Advanced: "Cao cấp",
  Native: "Bản ngữ",
};

const defaultJobData = {
  organizationId: "",
  workingModeId: "",
  title: "",
  province: "",
  commune: "",
  address: "",
  expirationDate: "",
  quantity: 1,
  descriptions: "",
  responsibility: "",
  benefits: "",
  salaryType: "NEGOTIABLE",
  minSalary: "",
  maxSalary: "",
  contactEmail: "",
  contactPhone: "",
  domainIds: [],
  statusOpenStop: "open",
};

const PostJobPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const editJobId = searchParams.get("edit");
  const isEditMode = !!editJobId;

  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [loadingJobData, setLoadingJobData] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [savingOrganization, setSavingOrganization] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [workingModes, setWorkingModes] = useState([]);
  const [domains, setDomains] = useState([]);
  const [levels, setLevels] = useState([]);
  const [hasApiWorkingModes, setHasApiWorkingModes] = useState(false);
  const [hasApiLevels, setHasApiLevels] = useState(false);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [availableLanguages, setAvailableLanguages] =
    useState(COMMON_LANGUAGES);
  const [showOrganizationForm, setShowOrganizationForm] = useState(false);
  const [organizationForm, setOrganizationForm] = useState(
    defaultOrganizationForm
  );
  const [editingOrganizationId, setEditingOrganizationId] = useState(null);
  const [jobData, setJobData] = useState(defaultJobData);
  const [languageRequirements, setLanguageRequirements] = useState([]);
  
  // AI Matching states
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiMatches, setAiMatches] = useState([]);
  const [selectedMatchDetails, setSelectedMatchDetails] = useState(null);
  const [loadingAISuggestions, setLoadingAISuggestions] = useState(false);
  const [createdJobId, setCreatedJobId] = useState(null); // Store job ID after creation
  const [aiSuggestionsFetched, setAiSuggestionsFetched] = useState(false); // Track if AI suggestions have been fetched
  
  // License confirmation states
  const [showLicenseConfirmation, setShowLicenseConfirmation] = useState(false);
  const [pendingOrgId, setPendingOrgId] = useState(null);

  const isClientOrAdmin = user?.role === "client" || user?.role === "admin";

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (!isClientOrAdmin) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [authLoading, isAuthenticated, isClientOrAdmin, navigate]);

  useEffect(() => {
    if (!user) return;
    setJobData((prev) => ({
      ...prev,
      contactEmail: prev.contactEmail || user.email || "",
      contactPhone: prev.contactPhone || user.phone || "",
    }));
    setOrganizationForm((prev) => ({
      ...prev,
      email: prev.email || user.email || "",
      phone: prev.phone || user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !isClientOrAdmin) return;
    const fetchLookups = async () => {
      try {
        setLookupsLoading(true);
        const [domainsRes, workingModesRes, levelsRes, orgsRes, languagesRes] =
          await Promise.all([
            jobService.getDomains(),
            jobService.getWorkingModes(),
            jobService.getLevels(),
            organizationService.getOrganizations({
              ownerUserId: user?.id,
              limit: 100,
            }),
            languageService.getMyLanguages().catch(() => null),
          ]);

        if (domainsRes?.success) {
          setDomains(domainsRes.data || []);
        }
        // Handle working modes - use API data if available, otherwise use defaults for display only
        if (
          workingModesRes?.success &&
          Array.isArray(workingModesRes.data) &&
          workingModesRes.data.length > 0
        ) {
          console.log("Using working modes from API:", workingModesRes.data);
          setWorkingModes(workingModesRes.data);
          setHasApiWorkingModes(true);
        } else {
          // If API call failed, returned empty, or returned error, use defaults for display only
          console.log("Working modes API response:", workingModesRes);
          if (!workingModesRes) {
            console.warn(
              "Working modes API call failed (no response), using defaults for display"
            );
          } else if (!workingModesRes.success) {
            console.warn(
              "Working modes API call failed:",
              workingModesRes.message || "Unknown error"
            );
          } else if (
            Array.isArray(workingModesRes.data) &&
            workingModesRes.data.length === 0
          ) {
            console.warn(
              "Working modes API returned empty array - database may be empty"
            );
          } else {
            console.warn(
              "Working modes API returned invalid data format:",
              workingModesRes
            );
          }
          // Use defaults for display only - these IDs won't work when submitting
          console.log(
            "Using default working modes for display:",
            DEFAULT_WORKING_MODES
          );
          setWorkingModes(DEFAULT_WORKING_MODES);
          setHasApiWorkingModes(false);
        }
        // Handle proficiency levels - use API data if available, otherwise use defaults for display only
        const apiLevels =
          levelsRes?.success &&
          Array.isArray(levelsRes.data) &&
          levelsRes.data.length > 0
            ? levelsRes.data
            : null;
        if (apiLevels) {
          console.log("Using levels from API:", apiLevels);
          setLevels(apiLevels);
          setHasApiLevels(true);
        } else {
          // If API call failed, returned empty, or returned error, use defaults for display only
          console.log("Levels API response:", levelsRes);
          if (!levelsRes?.success) {
            console.warn("Levels API call failed, using defaults for display");
          } else if (
            levelsRes.data &&
            Array.isArray(levelsRes.data) &&
            levelsRes.data.length === 0
          ) {
            console.warn(
              "Levels API returned empty array, using defaults for display"
            );
          } else {
            console.warn(
              "Levels API returned invalid data, using defaults for display"
            );
          }
          // Use defaults for display only - these IDs won't work when submitting
          console.log("Using default levels for display:", DEFAULT_LEVELS);
          setLevels(DEFAULT_LEVELS);
          setHasApiLevels(false);
        }
        if (orgsRes?.success) {
          const orgList = Array.isArray(orgsRes.data) ? orgsRes.data : [];
          const owned = orgList.filter((org) => org.ownerUserId === user?.id);
          setOrganizations(owned);
          if (!jobData.organizationId && owned.length > 0) {
            setJobData((prev) => ({
              ...prev,
              organizationId: String(owned[0].id),
            }));
          }
        }
        // Combine common languages with user's languages
        const allLanguages = new Set(COMMON_LANGUAGES);
        if (languagesRes?.data) {
          const langs = Array.isArray(languagesRes.data)
            ? languagesRes.data
            : [];
          langs.forEach((lang) => {
            if (lang.name) {
              allLanguages.add(lang.name);
            }
          });
        }
        // Convert to array of objects with id (using index as temporary id for common languages)
        const languageList = Array.from(allLanguages).map((name, idx) => ({
          id: idx + 1000, // Use high number to avoid conflicts
          name: name,
        }));
        setLanguageOptions(languageList);
        setAvailableLanguages(Array.from(allLanguages).sort());
      } catch (error) {
        console.error("Error fetching job posting data:", error);
        toast.error(error.message || t("postJob.messages.error"));
      } finally {
        setLookupsLoading(false);
      }
    };

    fetchLookups();
  }, [isAuthenticated, isClientOrAdmin, t, user, jobData.organizationId]);

  // Fetch job data for edit mode
  useEffect(() => {
    if (
      !isEditMode ||
      !editJobId ||
      !isAuthenticated ||
      !isClientOrAdmin ||
      lookupsLoading
    )
      return;

    const fetchJobForEdit = async () => {
      try {
        setLoadingJobData(true);
        const response = await jobService.getJobById(editJobId);

        if (response && (response.success || response.data)) {
          const job = response.data?.job || response.data || {};

          // Check if user owns this job (via organization)
          const isOwner =
            job.organization?.ownerUserId === user?.id ||
            user?.role === "admin";
          if (!isOwner) {
            toast.error("You don't have permission to edit this job");
            navigate(ROUTES.MY_JOBS);
            return;
          }

          // Populate job data
          setJobData({
            organizationId: String(job.organizationId || ""),
            workingModeId: String(job.workingModeId || ""),
            title: job.title || "",
            province: job.province || "",
            commune: job.commune || "",
            address: job.address || "",
            expirationDate: job.expirationDate
              ? new Date(job.expirationDate).toISOString().split("T")[0]
              : "",
            quantity: job.quantity || 1,
            descriptions: job.descriptions || "",
            responsibility: job.responsibility || "",
            benefits: job.benefits || "",
            salaryType: job.salaryType || "NEGOTIABLE",
            minSalary: job.minSalary ? String(job.minSalary) : "",
            maxSalary: job.maxSalary ? String(job.maxSalary) : "",
            contactEmail:
              job.contactEmail || job.organization?.email || user?.email || "",
            contactPhone:
              job.contactPhone || job.organization?.phone || user?.phone || "",
            domainIds:
              job.domains?.map((d) => String(d.domainId || d.id)) || [],
            statusOpenStop: job.statusOpenStop || "open",
          });

          // Store job data temporarily for later processing
          // We'll populate language requirements after languageOptions are loaded
          if (job.requiredLanguages && job.requiredLanguages.length > 0) {
            const langReqs = job.requiredLanguages.map((rl) => ({
              languageId: "",
              levelId: String(rl.levelId || ""),
              isSourceLanguage: rl.isSourceLanguage || false,
              languageName: rl.language?.name || "",
            }));
            setLanguageRequirements(langReqs);
          }
        } else {
          toast.error("Job not found");
          navigate(ROUTES.MY_JOBS);
        }
      } catch (error) {
        console.error("Error fetching job for edit:", error);
        toast.error(error.message || "Error loading job data");
        navigate(ROUTES.MY_JOBS);
      } finally {
        setLoadingJobData(false);
      }
    };

    fetchJobForEdit();
  }, [
    isEditMode,
    editJobId,
    isAuthenticated,
    isClientOrAdmin,
    lookupsLoading,
    user,
    navigate,
  ]);

  // Update language requirements with proper languageId after languageOptions are loaded
  useEffect(() => {
    if (!isEditMode || !languageOptions.length || !languageRequirements.length)
      return;

    // Only update if languageId is empty (meaning it was set from edit mode)
    const needsUpdate = languageRequirements.some(
      (req) => req.languageName && !req.languageId
    );
    if (needsUpdate) {
      const updatedReqs = languageRequirements.map((req) => {
        if (req.languageName && !req.languageId) {
          // Find language option by name
          let langOption = languageOptions.find(
            (lang) => lang.name === req.languageName
          );
          // If not found, create a temporary one
          if (!langOption && req.languageName) {
            const newId =
              languageOptions.length > 0
                ? Math.max(...languageOptions.map((l) => l.id)) + 1
                : 1000;
            langOption = { id: newId, name: req.languageName };
            setLanguageOptions((prev) => [...prev, langOption]);
          }
          return {
            ...req,
            languageId: langOption ? String(langOption.id) : "",
          };
        }
        return req;
      });
      setLanguageRequirements(updatedReqs);
    }
  }, [isEditMode, languageOptions, languageRequirements]);

  const handleJobInputChange = (field) => (event) => {
    const value = event.target.value;
    setJobData((prev) => ({
      ...prev,
      [field]:
        field === "quantity"
          ? Math.max(1, parseInt(value, 10) || 1)
          : field === "minSalary" || field === "maxSalary"
          ? value.replace(/[^\d.]/g, "")
          : value,
    }));
  };

  const toggleDomainSelection = (domainId) => {
    setJobData((prev) => {
      const exists = prev.domainIds.includes(domainId);
      return {
        ...prev,
        domainIds: exists
          ? prev.domainIds.filter((id) => id !== domainId)
          : [...prev.domainIds, domainId],
      };
    });
  };

  const handleLanguageRequirementChange = (index, field, value) => {
    setLanguageRequirements((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: field === "isSourceLanguage" ? value : value,
            }
          : item
      )
    );
  };

  const handleLanguageNameChange = (index, languageName) => {
    // Find or create language option
    let langOption = languageOptions.find((lang) => lang.name === languageName);
    if (!langOption && languageName) {
      // Create new language option
      const newId =
        languageOptions.length > 0
          ? Math.max(...languageOptions.map((l) => l.id)) + 1
          : 1000;
      langOption = { id: newId, name: languageName };
      setLanguageOptions((prev) => [...prev, langOption]);
    }
    // Update both languageId and languageName
    setLanguageRequirements((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              languageId: langOption ? String(langOption.id) : "",
              languageName: languageName,
            }
          : item
      )
    );
  };

  const addLanguageRequirement = () => {
    setLanguageRequirements((prev) => [
      ...prev,
      { languageId: "", levelId: "", isSourceLanguage: false },
    ]);
  };

  const removeLanguageRequirement = (index) => {
    setLanguageRequirements((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOrganizationFormChange = (field) => (event) => {
    setOrganizationForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleEditOrganization = (org) => {
    setEditingOrganizationId(org.id);
    setOrganizationForm({
      name: org.name || "",
      description: org.description || "",
      email: org.email || "",
      phone: org.phone || "",
      website: org.website || "",
      province: org.province || "",
      address: org.address || "",
      logo: org.logo || "",
    });
    setShowOrganizationForm(true);
  };

  const handleCancelEdit = () => {
    setEditingOrganizationId(null);
    setOrganizationForm(defaultOrganizationForm);
    setShowOrganizationForm(false);
  };

  const handleCreateOrganization = async (event) => {
    event.preventDefault();
    if (!organizationForm.name) {
      toast.error(t("postJob.messages.organizationRequired"));
      return;
    }
    if (!organizationForm.businessLicense) {
      toast.error(
        t("postJob.organization.errors.licenseRequired") ||
          "Business Registration License is required"
      );
      return;
    }
    setSavingOrganization(true);
    try {
      const payload = {
        name: organizationForm.name,
        email: organizationForm.email,
        phone: organizationForm.phone,
        website: organizationForm.website,
        province: organizationForm.province,
        address: organizationForm.address,
        description: organizationForm.description,
      };

      let response;
      if (editingOrganizationId) {
        // Update existing organization
        response = await organizationService.updateOrganization(
          editingOrganizationId,
          payload
        );

        // Upload business license if provided
        if (organizationForm.businessLicense) {
          const formData = new FormData();
          formData.append("businessLicense", organizationForm.businessLicense);
          await organizationService.uploadOrganizationLicense(
            editingOrganizationId,
            formData
          );
        }

        if (response?.success && response.data) {
          toast.success(
            "Cập nhật tổ chức thành công! Đang chờ admin duyệt lại."
          );
          // Update organization in list
          setOrganizations((prev) =>
            prev.map((org) =>
              org.id === editingOrganizationId ? response.data : org
            )
          );
          setEditingOrganizationId(null);
        }
      } else {
        // Create new organization
        response = await organizationService.createOrganization(payload);

        if (response?.success && response.data) {
          const newOrg = response.data;

          setOrganizations((prev) => [newOrg, ...prev]);
          setJobData((prev) => ({
            ...prev,
            organizationId: String(newOrg.id),
          }));

          // Show confirmation modal BEFORE uploading license
          if (organizationForm.businessLicense) {
            setPendingOrgId(newOrg.id);
            setShowLicenseConfirmation(true);
            setSavingOrganization(false);
            return; // Stop here, wait for user confirmation
          } else {
            // Only show success if no license to upload
            toast.success(t("postJob.messages.orgSuccess"));
          }
        }
      }

      if (!response?.success) {
        throw new Error(response?.message || "Unable to save");
      }

      setOrganizationForm(defaultOrganizationForm);
      setShowOrganizationForm(false);
    } catch (error) {
      toast.error(error.message || t("postJob.messages.error"));
    } finally {
      setSavingOrganization(false);
    }
  };

  const handleConfirmLicense = async () => {
    if (!pendingOrgId || !organizationForm.businessLicense) {
      setShowLicenseConfirmation(false);
      setPendingOrgId(null);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("businessLicense", organizationForm.businessLicense);
      await organizationService.uploadOrganizationLicense(
        pendingOrgId,
        formData
      );
      toast.success(
        t("postJob.organization.licenseConfirmation.uploadSuccess") ||
          "Business license uploaded successfully!"
      );
    } catch (error) {
      toast.error(
        error.message ||
          t("postJob.organization.errors.uploadFailed") ||
          "Failed to upload business license"
      );
    } finally {
      setShowLicenseConfirmation(false);
      setPendingOrgId(null);
      setOrganizationForm(defaultOrganizationForm);
      setShowOrganizationForm(false);
    }
  };

  const handleCancelLicense = () => {
    setShowLicenseConfirmation(false);
    setPendingOrgId(null);
    // Keep form open so user can edit
  };

  const validateJobData = () => {
    if (!jobData.organizationId) {
      return t("postJob.messages.organizationRequired");
    }
    if (!jobData.title) {
      return t("postJob.messages.titleRequired");
    }
    if (!jobData.workingModeId) {
      return t("postJob.messages.workingModeRequired");
    }
    // Validate that workingModeId exists in the actual API data
    if (
      !hasApiWorkingModes ||
      !workingModes.find((m) => String(m.id) === String(jobData.workingModeId))
    ) {
      return "Working mode data is not available. Please refresh the page and try again.";
    }
    if (!jobData.descriptions) {
      return t("postJob.messages.descriptionRequired");
    }
    if (!jobData.contactEmail) {
      return t("postJob.messages.contactEmailRequired");
    }
    if (jobData.minSalary && jobData.maxSalary) {
      if (parseFloat(jobData.minSalary) > parseFloat(jobData.maxSalary)) {
        return t("postJob.messages.salaryRangeInvalid");
      }
    }
    // Validate language requirements if any
    if (languageRequirements.length > 0) {
      for (const req of languageRequirements) {
        if (req.languageId && req.levelId) {
          // Validate levelId exists in actual API data
          if (
            !hasApiLevels ||
            !levels.find((l) => String(l.id) === String(req.levelId))
          ) {
            return "Proficiency level data is not available. Please refresh the page and try again.";
          }
        }
      }
    }
    return "";
  };

  const handleSubmitJob = async (event) => {
    event.preventDefault();
    const validationMessage = validateJobData();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload = {
      organizationId: parseInt(jobData.organizationId),
      workingModeId: jobData.workingModeId
        ? parseInt(jobData.workingModeId)
        : null,
      title: jobData.title,
      province: jobData.province || null,
      commune: jobData.commune || null,
      address: jobData.address || null,
      expirationDate: jobData.expirationDate || null,
      quantity: parseInt(jobData.quantity, 10) || 1,
      descriptions: jobData.descriptions,
      responsibility: jobData.responsibility,
      benefits: jobData.benefits,
      minSalary: jobData.minSalary ? parseFloat(jobData.minSalary) : null,
      maxSalary: jobData.maxSalary ? parseFloat(jobData.maxSalary) : null,
      salaryType: jobData.salaryType,
      contactEmail: jobData.contactEmail,
      contactPhone: jobData.contactPhone,
      domains: jobData.domainIds.map((id) => parseInt(id)),
      requiredLanguages: languageRequirements
        .filter((lr) => {
          const selectedLang = languageOptions.find(
            (lang) => String(lang.id) === lr.languageId
          );
          return selectedLang && selectedLang.name && lr.levelId;
        })
        .map((lr) => {
          const selectedLang = languageOptions.find(
            (lang) => String(lang.id) === lr.languageId
          );
          // Send languageName for common languages, languageId for user's languages
          const payload = {
            levelId: parseInt(lr.levelId),
            isSourceLanguage: !!lr.isSourceLanguage,
          };
          // If it's a common language (ID >= 1000), send name; otherwise send ID
          if (selectedLang.id >= 1000) {
            payload.languageName = selectedLang.name;
          } else {
            payload.languageId = parseInt(lr.languageId);
          }
          return payload;
        }),
    };

    // Include statusOpenStop only in edit mode
    if (isEditMode) {
      payload.statusOpenStop = jobData.statusOpenStop || "open";
    }

    setSubmittingJob(true);
    try {
      let response;
      if (isEditMode && editJobId) {
        // Update existing job
        response = await jobService.updateJob(editJobId, payload);
        if (response?.success) {
          toast.success("Job updated successfully");
          // Auto-fetch AI suggestions after job update
          if (response.data?.id) {
            setCreatedJobId(response.data.id);
            handleFetchAISuggestions();
          }
          navigate(ROUTES.MY_JOBS);
        } else {
          throw new Error(response?.message || "Unable to update job");
        }
      } else {
        // Create new job
        response = await jobService.createJob(payload);
        if (response?.success) {
          toast.success(t("postJob.messages.success"));
          
          // Store job ID for AI suggestions
          const jobId = response.data?.id || response.data?.job?.id;
          if (jobId) {
            setCreatedJobId(jobId);
            // Auto-fetch AI suggestions after a short delay
            setTimeout(() => {
              handleFetchAISuggestions();
            }, 500);
          }
          
          // Don't navigate away, stay on page to see AI suggestions
          // User can manually navigate if needed
        } else {
          throw new Error(response?.message || "Unable to submit job");
        }
      }
    } catch (error) {
      toast.error(error.message || t("postJob.messages.error"));
    } finally {
      setSubmittingJob(false);
    }
  };

  const salaryPreview = useMemo(() => {
    if (jobData.salaryType === "FIXED" && jobData.minSalary) {
      return `$${jobData.minSalary}`;
    }
    if (
      jobData.salaryType === "RANGE" &&
      jobData.minSalary &&
      jobData.maxSalary
    ) {
      return `$${jobData.minSalary} - $${jobData.maxSalary}`;
    }
    if (jobData.salaryType === "NEGOTIABLE") {
      return t("postJob.salaryTypes.NEGOTIABLE");
    }
    return t("postJob.salaryTypes.RANGE");
  }, [jobData.maxSalary, jobData.minSalary, jobData.salaryType, t]);

  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, []);

  // Fetch AI suggested interpreters
  const handleFetchAISuggestions = async () => {
    const jobId = createdJobId || editJobId;
    if (!jobId) {
      return; // Silently return if no job ID
    }

    if (aiSuggestionsFetched) {
      return; // Don't fetch again if already fetched
    }

    setLoadingAISuggestions(true);
    try {
      const aiResponse = await aiMatchingService.matchJobToInterpreters(jobId, 5); // Fetch top 5 for sidebar
      if (aiResponse.success && aiResponse.data?.matched_interpreters) {
        setAiMatches(aiResponse.data.matched_interpreters);
        setAiSuggestionsFetched(true);
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      // Don't show error toast, just fail silently
    } finally {
      setLoadingAISuggestions(false);
    }
  };

  // Auto-fetch AI suggestions when job is created
  useEffect(() => {
    if (createdJobId && !aiSuggestionsFetched && !loadingAISuggestions) {
      handleFetchAISuggestions();
    }
  }, [createdJobId]);

  // Show loading state while fetching job data for edit
  if (isEditMode && loadingJobData) {
    return (
      <MainLayout>
        <div className={styles.postJobPage}>
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "1.1rem", color: "#64748b" }}>
              Loading job data...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.postJobPage}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>
              {isEditMode ? "Edit Job" : t("postJob.eyebrow")}
            </p>
            <h1 className={styles.pageTitle}>
              {isEditMode ? "Edit Job Posting" : t("postJob.title")}
            </h1>
            <p className={styles.pageSubtitle}>
              {isEditMode
                ? "Update your job posting information"
                : t("postJob.subtitle")}
            </p>
          </div>
          <div className={styles.reviewNotice}>
            <span>⚠️</span>
            <p>{t("postJob.reviewNotice")}</p>
          </div>
        </header>

        <div className={styles.layout}>
          <section className={styles.formColumn}>
            <form onSubmit={handleSubmitJob} className={styles.formContent}>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>
                      {t("postJob.organization.title")}
                    </h2>
                    <p className={styles.sectionDescription}>
                      {t("postJob.organization.description")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.inlineButton}
                    onClick={() => setShowOrganizationForm((prev) => !prev)}
                  >
                    {showOrganizationForm
                      ? t("postJob.organization.cancel")
                      : t("postJob.organization.add")}
                  </button>
                </div>

                {organizations.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>{t("postJob.organization.none")}</p>
                    {!showOrganizationForm && (
                      <button
                        type="button"
                        className={styles.inlineButton}
                        onClick={() => setShowOrganizationForm(true)}
                      >
                        {t("postJob.organization.add")}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={styles.orgList}>
                    {organizations.map((org) => (
                      <div key={org.id} className={styles.orgCardWrapper}>
                        <label
                          className={`${styles.orgCard} ${
                            jobData.organizationId === String(org.id)
                              ? styles.selected
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="organizationId"
                            value={org.id}
                            checked={jobData.organizationId === String(org.id)}
                            onChange={() =>
                              setJobData((prev) => ({
                                ...prev,
                                organizationId: String(org.id),
                              }))
                            }
                            disabled={org.approvalStatus === "rejected"}
                          />
                          <div className={styles.orgInfo}>
                            <div className={styles.orgHeader}>
                              <strong>{org.name}</strong>
                              {org.approvalStatus === "pending" && (
                                <span
                                  className={styles.statusBadge}
                                  style={{ background: "#fbbf24" }}
                                >
                                  Chờ duyệt
                                </span>
                              )}
                              {org.approvalStatus === "approved" && (
                                <span
                                  className={styles.statusBadge}
                                  style={{ background: "#10b981" }}
                                >
                                  Đã duyệt
                                </span>
                              )}
                              {org.approvalStatus === "rejected" && (
                                <span
                                  className={styles.statusBadge}
                                  style={{ background: "#ef4444" }}
                                >
                                  Bị từ chối
                                </span>
                              )}
                            </div>
                            {org.province && <p>{org.province}</p>}
                            {org.approvalStatus === "rejected" &&
                              org.rejectionReason && (
                                <p className={styles.rejectionReason}>
                                  <strong>Lý do:</strong> {org.rejectionReason}
                                </p>
                              )}
                          </div>
                        </label>
                        {org.approvalStatus === "rejected" && (
                          <button
                            type="button"
                            className={styles.editOrgBtn}
                            onClick={() => handleEditOrganization(org)}
                          >
                            Chỉnh sửa & nộp lại
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {showOrganizationForm && (
                  <div className={styles.organizationForm}>
                    <h3>
                      {editingOrganizationId
                        ? "Chỉnh sửa tổ chức"
                        : t("postJob.organization.formTitle")}
                    </h3>
                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label>{t("postJob.organization.fields.name")}</label>
                        <input
                          type="text"
                          value={organizationForm.name}
                          onChange={handleOrganizationFormChange("name")}
                          required
                        />
                      </div>
                      <div className={styles.field}>
                        <label>{t("postJob.organization.fields.email")}</label>
                        <input
                          type="email"
                          value={organizationForm.email}
                          onChange={handleOrganizationFormChange("email")}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>{t("postJob.organization.fields.phone")}</label>
                        <input
                          type="tel"
                          value={organizationForm.phone}
                          onChange={handleOrganizationFormChange("phone")}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>
                          {t("postJob.organization.fields.website")}
                        </label>
                        <input
                          type="text"
                          value={organizationForm.website}
                          onChange={handleOrganizationFormChange("website")}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>
                          {t("postJob.organization.fields.province")}
                        </label>
                        <input
                          type="text"
                          value={organizationForm.province}
                          onChange={handleOrganizationFormChange("province")}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>
                          {t("postJob.organization.fields.address")}
                        </label>
                        <input
                          type="text"
                          value={organizationForm.address}
                          onChange={handleOrganizationFormChange("address")}
                        />
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label>
                        {t("postJob.organization.fields.description")}
                      </label>
                      <textarea
                        value={organizationForm.description}
                        onChange={handleOrganizationFormChange("description")}
                        rows={3}
                      />
                    </div>
                    <div className={styles.field}>
                      <label>
                        {t("postJob.organization.fields.businessLicense") ||
                          "Business Registration License (PDF)"}
                        <span style={{ color: "red", marginLeft: "4px" }}>
                          *
                        </span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type !== "application/pdf") {
                              toast.error(
                                t(
                                  "postJob.organization.errors.invalidFileType"
                                ) || "Only PDF files are accepted"
                              );
                              e.target.value = "";
                              return;
                            }
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error(
                                t("postJob.organization.errors.fileTooLarge") ||
                                  "File size must be less than 10MB"
                              );
                              e.target.value = "";
                              return;
                            }
                            setOrganizationForm({
                              ...organizationForm,
                              businessLicense: file,
                            });
                          }
                        }}
                      />
                      {organizationForm.businessLicense && (
                        <small
                          style={{
                            display: "block",
                            marginTop: "6px",
                            color: "#64748b",
                            fontSize: "0.85rem",
                          }}
                        >
                          {t("common.selected") || "Selected"}:{" "}
                          {organizationForm.businessLicense.name}
                        </small>
                      )}
                    </div>
                    <div className={styles.orgFormActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleCancelEdit}
                      >
                        {t("postJob.organization.cancel")}
                      </button>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleCreateOrganization}
                        disabled={savingOrganization}
                      >
                        {savingOrganization
                          ? editingOrganizationId
                            ? "Đang lưu..."
                            : t("postJob.actions.savingOrg")
                          : editingOrganizationId
                          ? "Lưu & nộp lại"
                          : t("postJob.organization.save")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("postJob.form.basicInfo")}
                </h2>
                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <label>{t("postJob.form.labels.title")}</label>
                    <input
                      type="text"
                      value={jobData.title}
                      onChange={handleJobInputChange("title")}
                      required
                      placeholder="e.g. EN-VI Medical Interpreter"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>{t("postJob.form.labels.workingMode")} *</label>
                    <select
                      value={jobData.workingModeId}
                      onChange={handleJobInputChange("workingModeId")}
                      required
                      className={
                        !jobData.workingModeId && !lookupsLoading
                          ? styles.requiredField
                          : ""
                      }
                      disabled={lookupsLoading}
                    >
                      <option value="">
                        {t("postJob.form.placeholders.selectOption")}
                      </option>
                      {(workingModes && workingModes.length > 0
                        ? workingModes
                        : DEFAULT_WORKING_MODES
                      ).map((mode) => (
                        <option key={mode.id} value={mode.id}>
                          {mode.name || mode.nameVi || `Mode ${mode.id}`}
                        </option>
                      ))}
                    </select>
                    {lookupsLoading && (
                      <p className={styles.helperText}>
                        {t("common.loading") || "Loading..."}
                      </p>
                    )}
                    {!lookupsLoading && !hasApiWorkingModes && (
                      <p
                        className={styles.helperText}
                        style={{ color: "#ef4444" }}
                      >
                        ⚠️ Working mode data is not available from server.
                        Please check your connection or contact administrator.
                        The form cannot be submitted until working modes are
                        loaded.
                      </p>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label>{t("postJob.form.labels.province")}</label>
                    <input
                      type="text"
                      value={jobData.province}
                      onChange={handleJobInputChange("province")}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>{t("postJob.form.labels.commune")}</label>
                    <input
                      type="text"
                      value={jobData.commune}
                      onChange={handleJobInputChange("commune")}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>{t("postJob.form.labels.address")}</label>
                    <input
                      type="text"
                      value={jobData.address}
                      onChange={handleJobInputChange("address")}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>{t("postJob.form.labels.quantity")}</label>
                    <input
                      type="number"
                      min={1}
                      value={jobData.quantity}
                      onChange={handleJobInputChange("quantity")}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>{t("postJob.form.labels.expirationDate")}</label>
                    <input
                      type="date"
                      min={minDate}
                      value={jobData.expirationDate}
                      onChange={handleJobInputChange("expirationDate")}
                    />
                  </div>
                  {isEditMode && (
                    <div className={styles.field}>
                      <label>Job Status *</label>
                      <select
                        value={jobData.statusOpenStop}
                        onChange={handleJobInputChange("statusOpenStop")}
                        required
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="expired">Expired</option>
                      </select>
                      <p className={styles.helperText}>
                        Change the status of this job posting. Closed jobs will
                        not accept new applications.
                      </p>
                    </div>
                  )}
                  <div className={styles.field}>
                    <label>{t("postJob.form.labels.salaryType")}</label>
                    <select
                      value={jobData.salaryType}
                      onChange={handleJobInputChange("salaryType")}
                    >
                      <option value="NEGOTIABLE">
                        {t("postJob.salaryTypes.NEGOTIABLE")}
                      </option>
                      <option value="FIXED">
                        {t("postJob.salaryTypes.FIXED")}
                      </option>
                      <option value="RANGE">
                        {t("postJob.salaryTypes.RANGE")}
                      </option>
                    </select>
                  </div>
                  {jobData.salaryType !== "NEGOTIABLE" && (
                    <>
                      <div className={styles.field}>
                        <label>{t("postJob.form.labels.minSalary")}</label>
                        <input
                          type="number"
                          min="0"
                          value={jobData.minSalary}
                          onChange={handleJobInputChange("minSalary")}
                          placeholder="e.g. 1200"
                        />
                      </div>
                      {jobData.salaryType === "RANGE" && (
                        <div className={styles.field}>
                          <label>{t("postJob.form.labels.maxSalary")}</label>
                          <input
                            type="number"
                            min="0"
                            value={jobData.maxSalary}
                            onChange={handleJobInputChange("maxSalary")}
                            placeholder="e.g. 1600"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("postJob.form.jobDetails")}
                </h2>
                <div className={styles.field}>
                  <label>{t("postJob.form.labels.descriptions")}</label>
                  <textarea
                    rows={4}
                    value={jobData.descriptions}
                    onChange={handleJobInputChange("descriptions")}
                    placeholder={t("postJob.form.placeholders.description")}
                  />
                </div>
                <div className={styles.field}>
                  <label>{t("postJob.form.labels.responsibility")}</label>
                  <textarea
                    rows={3}
                    value={jobData.responsibility}
                    onChange={handleJobInputChange("responsibility")}
                    placeholder={t("postJob.form.placeholders.responsibility")}
                  />
                </div>
                <div className={styles.field}>
                  <label>{t("postJob.form.labels.benefits")}</label>
                  <textarea
                    rows={3}
                    value={jobData.benefits}
                    onChange={handleJobInputChange("benefits")}
                    placeholder={t("postJob.form.placeholders.benefits")}
                  />
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("postJob.form.requirements")}
                </h2>
                <div className={styles.field}>
                  <label>{t("postJob.form.labels.domains")}</label>
                  <div className={styles.domainList}>
                    {domains.map((domain) => {
                      const displayName =
                        lang === "vi"
                          ? DOMAIN_NAMES_VI[domain.name] ||
                            domain.nameVi ||
                            domain.name
                          : domain.name || domain.nameVi;
                      return (
                        <label key={domain.id} className={styles.domainOption}>
                          <input
                            type="checkbox"
                            value={domain.id}
                            checked={jobData.domainIds.includes(domain.id)}
                            onChange={() => toggleDomainSelection(domain.id)}
                          />
                          {displayName}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.languageSection}>
                  <div className={styles.languageHeader}>
                    <label>{t("postJob.form.labels.languages")}</label>
                    <button
                      type="button"
                      className={styles.inlineButton}
                      onClick={addLanguageRequirement}
                    >
                      + {t("postJob.actions.addLanguage")}
                    </button>
                  </div>
                  {languageRequirements.length === 0 ? (
                    <div className={styles.emptyLanguageState}>
                      <p className={styles.helperText}>
                        {t("postJob.form.placeholders.languages")}
                      </p>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={addLanguageRequirement}
                      >
                        {t("postJob.actions.addFirstLanguage") ||
                          "Add First Language"}
                      </button>
                    </div>
                  ) : (
                    <div className={styles.languageList}>
                      {languageRequirements.map((req, index) => {
                        // Try to find language by ID first, then by name
                        const selectedLanguage = languageOptions.find(
                          (lang) =>
                            String(lang.id) === req.languageId ||
                            lang.name === req.languageName
                        );
                        // Use languageName if available, otherwise use selectedLanguage name
                        const selectedLanguageName =
                          req.languageName || selectedLanguage?.name || "";
                        return (
                          <div
                            key={`lang-${index}`}
                            className={styles.languageCard}
                          >
                            <div className={styles.languageCardHeader}>
                              <span className={styles.languageNumber}>
                                #{index + 1}
                              </span>
                              <button
                                type="button"
                                className={styles.removeButton}
                                onClick={() => removeLanguageRequirement(index)}
                                title={
                                  t("postJob.actions.removeLanguage") ||
                                  "Remove"
                                }
                              >
                                ×
                              </button>
                            </div>
                            <div className={styles.languageCardBody}>
                              <div className={styles.field}>
                                <label>
                                  {t("postJob.form.labels.language") ||
                                    "Language"}
                                </label>
                                <select
                                  value={selectedLanguageName}
                                  onChange={(e) =>
                                    handleLanguageNameChange(
                                      index,
                                      e.target.value
                                    )
                                  }
                                  required
                                >
                                  <option value="">
                                    {t(
                                      "postJob.form.placeholders.selectLanguage"
                                    ) || "Select Language"}
                                  </option>
                                  {availableLanguages.map((langName) => (
                                    <option key={langName} value={langName}>
                                      {langName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className={styles.field}>
                                <label>
                                  {t("postJob.form.labels.level") ||
                                    "Proficiency Level"}
                                </label>
                                <select
                                  value={req.levelId}
                                  onChange={(e) =>
                                    handleLanguageRequirementChange(
                                      index,
                                      "levelId",
                                      e.target.value
                                    )
                                  }
                                  required
                                >
                                  <option value="">
                                    {t(
                                      "postJob.form.placeholders.selectLevel"
                                    ) || "Chọn cấp độ thành thạo"}
                                  </option>
                                  {(levels && levels.length > 0
                                    ? levels
                                    : DEFAULT_LEVELS
                                  ).map((level) => {
                                    const displayName =
                                      lang === "vi"
                                        ? LEVEL_NAMES_VI[level.name] ||
                                          level.nameVi ||
                                          level.name ||
                                          `Level ${level.id}`
                                        : level.name ||
                                          level.nameVi ||
                                          `Level ${level.id}`;
                                    return (
                                      <option key={level.id} value={level.id}>
                                        {displayName}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              <label className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={req.isSourceLanguage}
                                  onChange={(e) =>
                                    handleLanguageRequirementChange(
                                      index,
                                      "isSourceLanguage",
                                      e.target.checked
                                    )
                                  }
                                />
                                <span>
                                  {t("postJob.form.labels.sourceLanguage") ||
                                    "Ngôn ngữ nguồn"}
                                </span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className={styles.addMoreButton}
                        onClick={addLanguageRequirement}
                      >
                        +{" "}
                        {t("postJob.actions.addAnotherLanguage") ||
                          "Add Another Language"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("postJob.form.contact")}
                </h2>
                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <label>{t("postJob.form.labels.contactEmail")}</label>
                    <input
                      type="email"
                      value={jobData.contactEmail}
                      onChange={handleJobInputChange("contactEmail")}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label>{t("postJob.form.labels.contactPhone")}</label>
                    <input
                      type="tel"
                      value={jobData.contactPhone}
                      onChange={handleJobInputChange("contactPhone")}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() =>
                    navigate(isEditMode ? ROUTES.MY_JOBS : ROUTES.DASHBOARD)
                  }
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={submittingJob || lookupsLoading || loadingJobData}
                >
                  {submittingJob
                    ? isEditMode
                      ? "Updating..."
                      : t("postJob.actions.saving")
                    : isEditMode
                    ? "Update Job"
                    : t("postJob.actions.submit")}
                </button>
              </div>
            </form>
          </section>

          <aside className={styles.previewColumn}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <span className={styles.previewStatus}>
                  {t("postJob.preview.pendingReview")}
                </span>
                <h3>
                  {jobData.title || t("postJob.form.placeholders.previewTitle")}
                </h3>
                <p className={styles.previewCompany}>
                  {organizations.find(
                    (org) => String(org.id) === jobData.organizationId
                  )?.name || t("postJob.form.placeholders.previewCompany")}
                </p>
              </div>
              <div className={styles.previewMeta}>
                <span>
                  {jobData.province || t("postJob.form.placeholders.province")}
                </span>
                <span>{salaryPreview}</span>
                <span>
                  {workingModes.find(
                    (mode) => String(mode.id) === jobData.workingModeId
                  )?.name || t("postJob.form.placeholders.mode")}
                </span>
              </div>
              <div className={styles.previewSection}>
                <h4>{t("postJob.form.labels.descriptions")}</h4>
                <p>
                  {jobData.descriptions ||
                    t("postJob.form.placeholders.descriptionFallback")}
                </p>
              </div>
              {jobData.responsibility && (
                <div className={styles.previewSection}>
                  <h4>{t("postJob.form.labels.responsibility")}</h4>
                  <p>{jobData.responsibility}</p>
                </div>
              )}
              {jobData.benefits && (
                <div className={styles.previewSection}>
                  <h4>{t("postJob.form.labels.benefits")}</h4>
                  <p>{jobData.benefits}</p>
                </div>
              )}
              {languageRequirements.length > 0 && (
                <div className={styles.previewSection}>
                  <h4>{t("postJob.form.labels.languages")}</h4>
                  <ul>
                    {languageRequirements.map((req, idx) => {
                      // Use languageName if available, otherwise find by ID
                      const languageName =
                        req.languageName ||
                        languageOptions.find(
                          (lang) => String(lang.id) === req.languageId
                        )?.name ||
                        t("postJob.form.placeholders.selectOption");
                      const levelName =
                        (levels && levels.length > 0
                          ? levels
                          : DEFAULT_LEVELS
                        ).find((level) => String(level.id) === req.levelId)
                          ?.name || t("postJob.form.placeholders.selectLevel");
                      return (
                        <li key={`prev-lang-${idx}`}>
                          {languageName} - {levelName}
                          {req.isSourceLanguage
                            ? ` (${t("postJob.form.labels.sourceLanguage")})`
                            : ""}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <div className={styles.previewSection}>
                <h4>{t("postJob.preview.contact") || "Contact"}</h4>
                {jobData.contactEmail ? (
                  <p>
                    <strong>Email:</strong> {jobData.contactEmail}
                  </p>
                ) : (
                  <p className={styles.previewPlaceholder}>
                    {t("postJob.form.placeholders.contactEmail") ||
                      "No email provided"}
                  </p>
                )}
                {jobData.contactPhone ? (
                  <p>
                    <strong>Phone:</strong> {jobData.contactPhone}
                  </p>
                ) : (
                  <p className={styles.previewPlaceholder}>
                    {t("postJob.form.placeholders.contactPhone") ||
                      "No phone provided"}
                  </p>
                )}
              </div>

              {/* AI Suggested Interpreters Section - Integrated naturally */}
              {createdJobId && (
                <div className={styles.previewSection}>
                  <div className={styles.aiSectionHeader}>
                    <h4>
                      <span className={styles.aiBadge}>AI</span>{" "}
                      {t("postJob.preview.aiSuggestions") || "Suggested Interpreters"}
                    </h4>
                    {loadingAISuggestions && (
                      <span className={styles.aiLoadingText}>Analyzing...</span>
                    )}
                  </div>
                  {loadingAISuggestions ? (
                    <div className={styles.aiLoadingState}>
                      <p>Finding the best interpreters for this job...</p>
                    </div>
                  ) : aiMatches.length > 0 ? (
                    <div className={styles.aiMatchesList}>
                      {aiMatches.slice(0, 3).map((match) => (
                        <div
                          key={match.interpreter_id || match.id}
                          className={styles.aiMatchCard}
                          onClick={() => {
                            setSelectedMatchDetails(match);
                            setShowAISuggestions(true);
                          }}
                        >
                          <div className={styles.aiMatchHeader}>
                            <span className={styles.aiMatchName}>
                              {match.interpreter?.user?.name ||
                                match.interpreter?.fullName ||
                                match.interpreter?.name ||
                                "Interpreter"}
                            </span>
                            {match.suitability_score && (
                              <span
                                className={`${styles.aiMatchScore} ${
                                  match.suitability_score.overall_score >= 80
                                    ? styles.excellent
                                    : match.suitability_score.overall_score >= 60
                                    ? styles.good
                                    : styles.fair
                                }`}
                              >
                                {Math.round(match.suitability_score.overall_score)}%
                              </span>
                            )}
                          </div>
                          {match.suitability_score?.recommendation && (
                            <p className={styles.aiMatchReason}>
                              {match.suitability_score.recommendation.substring(0, 80)}
                              ...
                            </p>
                          )}
                        </div>
                      ))}
                      {aiMatches.length > 3 && (
                        <button
                          className={styles.viewAllButton}
                          onClick={() => setShowAISuggestions(true)}
                        >
                          View all {aiMatches.length} suggestions →
                        </button>
                      )}
                    </div>
                  ) : aiSuggestionsFetched && !loadingAISuggestions ? (
                    <p className={styles.noSuggestions}>
                      No AI suggestions available at this time.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* AI Suggested Interpreters Modal */}
      <AIMatchModal
        isOpen={showAISuggestions}
        onClose={() => {
          setShowAISuggestions(false);
          navigate(ROUTES.DASHBOARD);
        }}
        title="AI Suggested Interpreters"
        matches={aiMatches.map((match) => ({
          interpreter_id: match.interpreter_id,
          interpreter: match.interpreter || {},
          suitability_score: match.suitability_score,
          match_priority: match.match_priority,
        }))}
        type="interpreters"
        onViewDetails={(match) => {
          setSelectedMatchDetails(match);
        }}
        onInvite={(match) => {
          // TODO: Implement invite functionality
          toast.info("Invite functionality coming soon");
        }}
      />

      {/* Match Details Modal */}
      {selectedMatchDetails && selectedMatchDetails.suitability_score && (
        <div className={styles.matchDetailsOverlay} onClick={() => setSelectedMatchDetails(null)}>
          <div className={styles.matchDetailsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.matchDetailsHeader}>
              <h2>AI Match Analysis</h2>
              <button onClick={() => setSelectedMatchDetails(null)}>×</button>
            </div>
            <div className={styles.matchDetailsContent}>
              <MatchReasonsCard
                suitabilityScore={selectedMatchDetails.suitability_score}
                expandable={false}
                defaultExpanded={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* License Confirmation Modal */}
      {showLicenseConfirmation && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmationModal}>
            <h3>{t("postJob.organization.licenseConfirmation.title")}</h3>
            <p>{t("postJob.organization.licenseConfirmation.message")}</p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelLicense}
              >
                {t("postJob.organization.licenseConfirmation.cancel") ||
                  "Cancel"}
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleConfirmLicense}
              >
                {t("postJob.organization.licenseConfirmation.understand")}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default PostJobPage;
