import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FindJobPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { ROUTES } from "../../constants/enums";
import jobService from "../../services/jobService.js";
import savedJobService from "../../services/savedJobService.js";
import { useAuth } from "../../contexts/AuthContext";
import toastService from "../../services/toastService";
import aiMatchingService from "../../services/aiMatchingService";
import interpreterService from "../../services/interpreterService";

import {
  FaMapMarkerAlt,
  FaBullseye,
  FaBriefcase,
  FaStar,
  FaDollarSign,
  FaClock,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBell,
  FaInfoCircle,
  FaBookmark,
  FaRegBookmark,
  FaSpinner,
  FaList,
} from "react-icons/fa";

const unique = (arr) => Array.from(new Set(arr));

export default function FindJobPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [salaryRange, setSalaryRange] = useState([null, null]);
  // Temporary state for basic filters (only applied when user clicks Apply)
  const [tempBasicFilters, setTempBasicFilters] = useState({
    keyword: "",
    location: "",
    category: "",
    salaryRange: [null, null],
  });
  const [sortBy, setSortBy] = useState("createdAt");
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
    workingMode: "",
    languages: "",
    level: "",
    companyName: "",
    certificate: "",
  });
  // Temporary state for advanced filters modal (only applied when user clicks Apply)
  const [tempAdvancedFilters, setTempAdvancedFilters] = useState({
    workingMode: "",
    languages: "",
    level: "",
    companyName: "",
    certificate: "",
  });

  const pageSize = 9; // 3 x 3 layout

  // API state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Lookup data from API
  const [domains, setDomains] = useState([]);
  const [levels, setLevels] = useState([]);
  const [workingModes, setWorkingModes] = useState([]);
  const [allLocations, setAllLocations] = useState([]); // All available locations (not filtered)
  const [availableLanguages, setAvailableLanguages] = useState([]); // Available languages for filter

  // Auth state
  const { user, isAuthenticated } = useAuth();
  const hasPremium = user?.isPremium || false;

  // Saved jobs state - track which jobs are saved
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [showAIResults, setShowAIResults] = useState(false);
  const [aiJobs, setAiJobs] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // Reset AI state on mount to ensure AI is not called automatically
  useEffect(() => {
    setShowAIResults(false);
    setAiJobs([]);
    setLoadingAI(false);
  }, []);

  // Initialize tempBasicFilters with current filter values on mount
  useEffect(() => {
    setTempBasicFilters({
      keyword: keyword,
      location: location,
      category: category,
      salaryRange: salaryRange,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Applied jobs state - track which jobs are already applied
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

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

  // Fetch lookup data on mount
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const [domainsRes, levelsRes, workingModesRes, languagesRes] = await Promise.all([
          jobService.getDomains(),
          jobService.getLevels(),
          jobService.getWorkingModes(),
          interpreterService.getAvailableLanguages().catch(() => ({ success: false, data: [] })),
        ]);
        if (domainsRes?.success) setDomains(domainsRes.data || []);
        if (levelsRes?.success) setLevels(levelsRes.data || []);
        if (workingModesRes?.success)
          setWorkingModes(workingModesRes.data || []);
        if (languagesRes?.success) {
          // Extract unique language names
          const languages = languagesRes.data || [];
          const uniqueLanguages = Array.from(
            new Map(languages.map((lang) => [lang.name?.toLowerCase(), lang])).values()
          ).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          setAvailableLanguages(uniqueLanguages);
        }
      } catch (error) {
        console.error("Error fetching lookup data:", error);
      }
    };
    fetchLookupData();
  }, []);

  // Fetch saved jobs when user is authenticated
  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!isAuthenticated || !user) {
        setSavedJobIds(new Set());
        return;
      }

      try {
        const response = await jobService.getSavedJobs();

        // Handle different response formats
        // sendPaginated returns: { success: true, data: [...], pagination: {...} }
        // So savedJobs array is directly in response.data
        const savedJobsData = response.data || [];

        if (
          response &&
          response.success !== false &&
          Array.isArray(savedJobsData)
        ) {
          const savedIds = new Set(
            savedJobsData
              .map((saved) => saved.job?.id || saved.id)
              .filter(Boolean)
          );
          setSavedJobIds(savedIds);
        } else {
          setSavedJobIds(new Set());
        }
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
        setSavedJobIds(new Set());
      }
    };

    fetchSavedJobs();
  }, [isAuthenticated, user]);

  // Fetch applied jobs when user is authenticated
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      if (!isAuthenticated || !user) {
        setAppliedJobIds(new Set());
        return;
      }

      try {
        const response = await jobService.getMyApplications();
        const applicationsData = Array.isArray(response.data)
          ? response.data
          : response.data?.applications || [];

        if (
          response &&
          response.success !== false &&
          Array.isArray(applicationsData)
        ) {
          const appliedIds = new Set(
            applicationsData
              .map((app) => app.jobId || app.job?.id)
              .filter(Boolean)
          );
          setAppliedJobIds(appliedIds);
        } else {
          setAppliedJobIds(new Set());
        }
      } catch (error) {
        console.error("Error fetching applied jobs:", error);
        setAppliedJobIds(new Set());
      }
    };

    fetchAppliedJobs();
  }, [isAuthenticated, user]);

  // Load saved jobs function
  const loadSavedJobs = useCallback(async () => {
    if (!user) return;

    try {
      const result = await savedJobService.getAllSavedJobs();

      if (result.success && result.data && Array.isArray(result.data)) {
        const savedIds = new Set(result.data.map((item) => item.id));
        setSavedJobIds(savedIds);
      } else {
        setSavedJobIds(new Set());
      }
    } catch (error) {
      console.error("Error loading saved jobs:", error);
      setSavedJobIds(new Set());
    }
  }, [user]);

  // Load saved jobs on mount and when page becomes visible
  useEffect(() => {
    if (user) {
      loadSavedJobs();
    }

    // Reload saved jobs when user returns to tab/page
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadSavedJobs();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, loadSavedJobs]);

  // Fetch jobs from API with filters - memoized with useCallback
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);

      // Build API filters
      const apiFilters = {
        page,
        limit: pageSize,
        status: "open",
        reviewStatus: "approved", // Only show approved jobs
        sortBy: sortBy || "createdAt",
        sortOrder: sortBy === "title" ? "ASC" : "DESC", // DESC for maxSalary (highest first)
      };

      // Basic Filters
      if (keyword) apiFilters.search = keyword;
      if (location) apiFilters.province = location;
      if (category) {
        // Category is already an ID from the dropdown
        apiFilters.domainId = parseInt(category);
      }
      // Salary range filter
      if (salaryRange && (salaryRange[0] || salaryRange[1])) {
        // Handle array format [min, max]
        if (salaryRange[0]) apiFilters.minSalary = parseInt(salaryRange[0]);
        if (salaryRange[1]) apiFilters.maxSalary = parseInt(salaryRange[1]);
      }

      // Advanced Filters
      if (advancedFilters.workingMode) {
        apiFilters.workingModeId = parseInt(advancedFilters.workingMode);
      }
      if (advancedFilters.level) {
        apiFilters.levelId = parseInt(advancedFilters.level);
      }
      if (advancedFilters.companyName) {
        apiFilters.organizationName = advancedFilters.companyName;
      }
      
      // Note: languages filter is not supported by backend API, will filter on frontend
      // certificate filter is not supported by backend API
      
      // If filtering by language, fetch all jobs (no pagination) then paginate on frontend
      const needsFrontendPagination = advancedFilters.languages && advancedFilters.languages !== "";
      const fetchLimit = needsFrontendPagination ? 1000 : pageSize; // Fetch more if filtering on frontend
      const fetchPage = needsFrontendPagination ? 1 : page; // Always fetch page 1 if filtering on frontend
      
      const fetchFilters = { ...apiFilters, page: fetchPage, limit: fetchLimit };

      const response = await jobService.getJobs(fetchFilters);

      // Check if response is successful and has data
      if (response && (response.success || response.data)) {
        // Handle different response formats
        let jobsData =
          response.data?.jobs ||
          response.data?.data?.jobs ||
          response.data ||
          [];

        // Filter by language on frontend (match both source and target language)
        if (advancedFilters.languages && advancedFilters.languages !== "") {
          const selectedLanguage = advancedFilters.languages.toLowerCase().trim();
          jobsData = jobsData.filter((job) => {
            if (!job.requiredLanguages || job.requiredLanguages.length === 0) {
              return false;
            }
            // Check if any required language matches (both source and target)
            return job.requiredLanguages.some((reqLang) => {
              const langName = (reqLang.language?.name || "").toLowerCase().trim();
              return langName === selectedLanguage;
            });
          });
        }

        // Calculate pagination
        let totalPages, totalCount;
        if (needsFrontendPagination) {
          // Frontend pagination: calculate based on filtered results
          totalCount = jobsData.length;
          totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        } else {
          // Backend pagination: use API response
          totalPages =
            response.data?.totalPages ||
            response.data?.pagination?.totalPages ||
            1;
          totalCount =
            response.data?.total ||
            response.data?.pagination?.total ||
            jobsData.length;
        }
        
        // Transform API data to match UI format
        const transformedJobs = (Array.isArray(jobsData) ? jobsData : []).map(
          (job) => ({
            id: job.id,
            title: job.title,
            company: job.organization?.name || job.company || "Company",
            location:
              job.province || job.address || job.location || "Location TBD",
            category:
              job.domains?.[0]?.name ||
              job.domains?.[0]?.nameVi ||
              job.category ||
              "General",
            level:
              job.requiredLanguages?.[0]?.level?.name || job.level || "Mid",
            type: job.workingMode?.name || job.type || "Full-time",
            salary:
              job.minSalary && job.maxSalary
                ? `$${job.minSalary}-${job.maxSalary}`
                : job.minSalary
                ? `$${job.minSalary}+`
                : job.salary || "Negotiable",
            tags: [
              ...(job.requiredLanguages?.map((rl) => rl.language?.name || "") ||
                []),
              ...(job.domains?.map((d) => d.name || d.nameVi || "") || []),
              ...(job.tags || []),
            ].filter(Boolean),
            desc: job.description || job.desc || "",
            fullDesc: job.description || job.fullDesc || "",
            requirements:
              job.requiredLanguages?.map(
                (rl) => `${rl.language?.name} - ${rl.level?.name}`
              ) ||
              job.requirements ||
              [],
            benefits: job.benefits || [],
            contact: {
              email: job.organization?.email || job.contact?.email || "",
              phone: job.organization?.phone || job.contact?.phone || "",
              address:
                job.address || job.province || job.contact?.address || "",
            },
            reviewStatus: job.reviewStatus || "pending",
            reviewNotes: job.reviewNotes || "",
          })
        );

        // Apply frontend pagination if needed
        let finalJobs = transformedJobs;
        if (needsFrontendPagination) {
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          finalJobs = transformedJobs.slice(startIndex, endIndex);
        }

        if (finalJobs.length > 0 || transformedJobs.length === 0) {
          setJobs(finalJobs);
          setTotalPages(totalPages);
          setTotal(totalCount);
        } else {
          // No jobs found, but API call was successful
          setJobs([]);
          setTotalPages(1);
          setTotal(0);
        }
      } else {
        // API call failed or returned unexpected format
        console.error("API response format unexpected:", response);
        setJobs([]);
        setTotalPages(1);
        setTotal(0);
      }

      // Refresh saved jobs after fetching jobs to ensure sync
      if (isAuthenticated && user) {
        try {
          const savedResponse = await jobService.getSavedJobs();
          const savedJobsData = savedResponse.data || [];
          if (
            savedResponse &&
            savedResponse.success !== false &&
            Array.isArray(savedJobsData)
          ) {
            const savedIds = new Set(
              savedJobsData
                .map((saved) => saved.job?.id || saved.id)
                .filter(Boolean)
            );
            setSavedJobIds(savedIds);
          }
        } catch (savedError) {
          console.error("Error refreshing saved jobs:", savedError);
        }
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      // Show empty state on error
      setJobs([]);
      setTotalPages(1);
      setTotal(0);
      // Show error notification to user
      showNotification(
        t("findJob.errors.fetchFailed") ||
          "Không thể tải danh sách việc làm. Vui lòng thử lại sau.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    keyword,
    location,
    category,
    salaryRange,
    sortBy,
    advancedFilters,
    // domains and levels are not used in the function body, removed from dependencies
    isAuthenticated,
    t,
    user,
    pageSize,
  ]);

  // Call fetchJobs when dependencies change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Fetch all locations once on mount (without filters)
  useEffect(() => {
    const fetchAllLocations = async () => {
      try {
        // Fetch jobs without any location filter to get all available locations
        const response = await jobService.getJobs({
          status: "open",
          reviewStatus: "approved",
          limit: 1000, // Get a large number to ensure we get all locations
        });
        
        if (response && (response.success || response.data)) {
          const allJobs = response.data?.jobs || response.data || [];
          const locations = unique(allJobs.map((j) => j.location || j.province).filter(Boolean));
          setAllLocations(locations);
        }
      } catch (error) {
        console.error("Error fetching all locations:", error);
        // If fetch fails, set empty array - locations will be populated from jobs later via locationsList useMemo
        setAllLocations([]);
      }
    };
    
    fetchAllLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Use allLocations for the dropdown, but also include current location if it's not in the list
  const locationsList = useMemo(() => {
    const currentJobLocations = unique(jobs.map((j) => j.location || j.province).filter(Boolean));
    const combined = [...new Set([...allLocations, ...currentJobLocations])];
    return combined.sort();
  }, [allLocations, jobs]);

  // Display jobs: Always use API data
  const displayJobs = jobs;
  
  // Reset page to 1 when filters change (except page itself)
  useEffect(() => {
    setPage(1);
  }, [keyword, location, category, salaryRange, sortBy, advancedFilters]);
  
  // Ensure page is within valid range
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    } else if (page < 1) {
      setPage(1);
    }
  }, [page, totalPages]);
  
  const pageSafe = Math.min(Math.max(1, page), totalPages || 1);
  const slice = displayJobs;

  function closeJobModal() {
    setIsModalOpen(false);
    setSelectedJob(null);
  }

  // Clear all filters
  const handleClearFilters = () => {
    setKeyword("");
    setLocation("");
    setCategory("");
    setSalaryRange([null, null]);
    setTempBasicFilters({
      keyword: "",
      location: "",
      category: "",
      salaryRange: [null, null],
    });
    setSortBy("createdAt");
    setPage(1);
  };

  // Handle apply basic filters
  const handleApplyBasicFilters = () => {
    setKeyword(tempBasicFilters.keyword);
    setLocation(tempBasicFilters.location);
    setCategory(tempBasicFilters.category);
    setSalaryRange(tempBasicFilters.salaryRange);
    setPage(1); // Reset to first page when applying filters
  };

  // Handle save/unsave job
  const handleToggleSaveJob = async (jobId, e) => {
    e.stopPropagation();

    if (!user) {
      toastService.error(t("findJob.saveJob.loginRequired"));
      return;
    }

    const isSaved = savedJobIds.has(jobId);

    // Optimistic UI update
    setSavedJobIds((prev) => {
      const newSet = new Set(prev);
      if (isSaved) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });

    // Call API
    const result = isSaved
      ? await savedJobService.unsaveJob(jobId)
      : await savedJobService.saveJob(jobId);

    if (result.success) {
      toastService.success(
        isSaved ? t("findJob.saveJob.unsaveSuccess") : t("findJob.saveJob.saveSuccess")
      );
    } else {
      console.error(
        `Failed to ${isSaved ? "unsave" : "save"}:`,
        result.message
      );
      // Rollback on error
      setSavedJobIds((prev) => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.add(jobId);
        } else {
          newSet.delete(jobId);
        }
        return newSet;
      });
      toastService.error(result.message || t("findJob.saveJob.updateFailed"));
    }
  };

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

  // Handle file upload for application
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        showNotification(
          t("jobDetail.apply.errors.pdfOnly") || "Only PDF files are accepted",
          "error"
        );
        event.target.value = ""; // Reset input
        return;
      }
      setApplicationData((prev) => ({ ...prev, pdfFile: file }));
    }
  }

  // Handle application submission
  async function handleSubmitApplication(e) {
    e.preventDefault();

    if (!selectedJob) return;

    // Validate required fields
    if (!applicationData.pdfFile) {
      showNotification(
        t("jobDetail.apply.errors.cvRequired") || "Please upload your CV",
        "error"
      );
      return;
    }

    if (!applicationData.introduction.trim()) {
      showNotification(
        t("jobDetail.apply.errors.introRequired") ||
          "Vui lòng nhập giới thiệu bản thân",
        "error"
      );
      return;
    }

    try {
      const applicationPayload = {
        coverLetter: applicationData.introduction,
        pdfFile: applicationData.pdfFile,
        resumeUrl: applicationData.profileLink || null,
        resumeType: "pdf",
      };

      const response = await jobService.applyForJob(
        selectedJob.id,
        applicationPayload
      );

      if (response && response.success !== false) {
        showNotification(
          t("jobDetail.apply.success") || "Application submitted successfully!",
          "success"
        );

        // Update applied jobs
        setAppliedJobIds((prev) => new Set(prev).add(selectedJob.id));

        // Close modals and reset
        closeApplicationModal();
        closeJobModal();

        // Reload jobs to get updated status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Error applying for job:", error);
      showNotification(
        error.message ||
          t("jobDetail.apply.errors.failed") ||
          "Không thể ứng tuyển",
        "error"
      );
    }
  }

  function handleUpgradeToPremium() {
    // Close modal and navigate to pricing page
    closeJobModal();
    navigate(ROUTES.PRICING);
  }

  return (
    <MainLayout>
      <div className={styles.findJobPage}>
        {/* AI Suggested Jobs will be integrated into the jobs list */}

        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1>{t("findJob.title") || "Find Jobs"}</h1>
            <p>
              {t("findJob.subtitle") ||
                "Discover thousands of job opportunities for interpreters"}
            </p>
          </div>
        </div>

        <div className={styles.pageContainer}>
          {/* Sidebar Filters */}
          <aside className={styles.filterSidebar}>
            <div className={styles.filterHeader}>
              <h3>{t("findJob.filters.title") || "Filters"}</h3>
              <button className={styles.clearBtn} onClick={handleClearFilters}>
                {t("findJob.filters.clearAll") || "Clear All"}
              </button>
            </div>

            {/* Basic Filters */}
            {/* Search */}
            <div className={styles.filterSection}>
              <label>{t("findJob.filters.search") || "Search"}</label>
              <input
                type="text"
                placeholder={
                  t("findJob.filters.searchPlaceholder") || "Search jobs..."
                }
                value={tempBasicFilters.keyword}
                onChange={(e) =>
                  setTempBasicFilters({
                    ...tempBasicFilters,
                    keyword: e.target.value,
                  })
                }
                className={styles.searchInput}
              />
            </div>

            {/* Location Filter */}
            <div className={styles.filterSection}>
              <label>{t("findJob.filters.location") || "Location"}</label>
              <select
                value={tempBasicFilters.location}
                onChange={(e) =>
                  setTempBasicFilters({
                    ...tempBasicFilters,
                    location: e.target.value,
                  })
                }
                className={styles.selectInput}
              >
                <option value="">
                  {t("findJob.filters.allLocations") || "All Locations"}
                </option>
                {locationsList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Category (Domain) Filter */}
            <div className={styles.filterSection}>
              <label>{t("findJob.filters.category") || "Category"}</label>
              <select
                value={tempBasicFilters.category}
                onChange={(e) =>
                  setTempBasicFilters({
                    ...tempBasicFilters,
                    category: e.target.value,
                  })
                }
                className={styles.selectInput}
              >
                <option value="">
                  {t("findJob.filters.allCategories") || "All Categories"}
                </option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary Range Filter */}
            <div className={styles.filterSection}>
              <label>
                {t("findJob.filters.salaryRange") || "Salary Range"}
              </label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  placeholder="Min"
                  value={tempBasicFilters.salaryRange[0] || ""}
                  onChange={(e) =>
                    setTempBasicFilters({
                      ...tempBasicFilters,
                      salaryRange: [
                        e.target.value ? parseInt(e.target.value) : null,
                        tempBasicFilters.salaryRange[1],
                      ],
                    })
                  }
                  className={styles.rangeInput}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={tempBasicFilters.salaryRange[1] || ""}
                  onChange={(e) =>
                    setTempBasicFilters({
                      ...tempBasicFilters,
                      salaryRange: [
                        tempBasicFilters.salaryRange[0],
                        e.target.value ? parseInt(e.target.value) : null,
                      ],
                    })
                  }
                  className={styles.rangeInput}
                />
              </div>
            </div>

            {/* Advanced Filters Button */}
            <button
              className={styles.advancedFiltersBtn}
              onClick={() => setShowAdvancedFilter(true)}
            >
              {t("findJob.filters.advancedFilters") || "Advanced Filters"}
            </button>

            {/* Apply Basic Filters Button */}
            <button
              className={styles.applyBasicFiltersBtn}
              onClick={handleApplyBasicFilters}
            >
              {t("findJob.filters.apply") || "Apply Filters"}
            </button>

          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarTop}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.resultsInfoRow}>
                    {/* Only show results info for client role, hide for interpreter */}
                    {user?.role === "client" && (
                      <div className={styles.resultsInfo}>
                        <span>
                          {showAIResults 
                            ? `${aiJobs.length} ${t("findJob.aiRecommended") || "AI recommended jobs"}`
                            : `${total} ${t("findJob.resultsFound") || "jobs found"}`
                          }
                        </span>
                      </div>
                    )}
                    
                    {/* Sort Controls */}
                    {!showAIResults && (
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={styles.sortSelect}
                      >
                      <option value="createdAt">
                        {t("findJob.sort.newest") || "Newest"}
                      </option>
                      <option value="title">
                        {t("findJob.sort.title") || "Title"}
                      </option>
                      <option value="maxSalary">
                        {t("findJob.sort.salary") || "Highest Salary"}
                      </option>
                      </select>
                    )}
                  </div>
                  
                  {/* Active Filters Tags */}
                  {((advancedFilters.workingMode && advancedFilters.workingMode !== "") ||
                    (advancedFilters.languages && advancedFilters.languages !== "") || 
                    (advancedFilters.level && advancedFilters.level !== "") ||
                    (advancedFilters.certificate && advancedFilters.certificate !== "") ||
                    (advancedFilters.companyName && advancedFilters.companyName.trim() !== "")) && (
                    <div className={styles.activeFiltersTags}>
                      {advancedFilters.workingMode && workingModes.find(m => m.id === parseInt(advancedFilters.workingMode)) && (
                        <span className={styles.filterTag}>
                          {t("findJob.filters.workingMode") || "Working Mode"}: {lang === "vi" 
                            ? workingModes.find(m => m.id === parseInt(advancedFilters.workingMode))?.nameVi 
                            : workingModes.find(m => m.id === parseInt(advancedFilters.workingMode))?.name}
                          <button
                            onClick={() => setAdvancedFilters(prev => ({ ...prev, workingMode: "" }))}
                            className={styles.tagClose}
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {advancedFilters.languages && (
                        <span className={styles.filterTag}>
                          {t("findJob.advancedLanguages") || "Languages"}: {advancedFilters.languages}
                          <button
                            onClick={() => setAdvancedFilters(prev => ({ ...prev, languages: "" }))}
                            className={styles.tagClose}
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {advancedFilters.level && levels.find(l => l.id === parseInt(advancedFilters.level)) && (
                        <span className={styles.filterTag}>
                          {t("findJob.filters.level") || "Level"}: {levels.find(l => l.id === parseInt(advancedFilters.level))?.name}
                          <button
                            onClick={() => setAdvancedFilters(prev => ({ ...prev, level: "" }))}
                            className={styles.tagClose}
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {advancedFilters.certificate && (
                        <span className={styles.filterTag}>
                          {t("findJob.advancedCertificate") || "Certificate"}: {advancedFilters.certificate}
                          <button
                            onClick={() => setAdvancedFilters(prev => ({ ...prev, certificate: "" }))}
                            className={styles.tagClose}
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {advancedFilters.companyName && (
                        <span className={styles.filterTag}>
                          {t("findJob.filters.companyName") || "Company"}: {advancedFilters.companyName}
                          <button
                            onClick={() => setAdvancedFilters(prev => ({ ...prev, companyName: "" }))}
                            className={styles.tagClose}
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.toolbarActions}>
                {isAuthenticated && user?.role === "interpreter" && (
                  <button
                    className={`${styles.aiButton} ${showAIResults ? styles.active : ""}`}
                    onClick={async () => {
                      if (showAIResults) {
                        setShowAIResults(false);
                        return;
                      }
                      setLoadingAI(true);
                      setShowAIResults(true);
                      try {
                        // Use AISuggestedJobsSection logic
                        const interpreterRes = await interpreterService.getInterpreterById(user.id);
                        const interpreter = interpreterRes?.data || interpreterRes;
                        if (!interpreter) throw new Error("Interpreter not found");
                        
                        const jobsRes = await jobService.getJobs({ status: "open", limit: 50 });
                        const jobs = jobsRes?.data?.jobs || jobsRes?.data || [];
                        
                        if (jobs.length === 0) {
                          setAiJobs([]);
                          setLoadingAI(false);
                          return;
                        }
                        
                        const profileId = interpreter?.interpreterProfile?.id || interpreter?.profile?.id || user.id;
                        const jobsToScore = jobs.slice(0, 20);
                        const jobIds = jobsToScore.map((job) => job.id);
                        
                        try {
                          // Use batch scoring instead of individual calls
                          const batchRes = await aiMatchingService.batchScoreSuitability(
                            jobIds,
                            profileId
                          );
                          
                          // Handle both response formats: {success, data} or direct data
                          const responseData = batchRes.data || batchRes;
                          const jobScores = responseData.job_scores || [];
                          
                          if (jobScores.length > 0) {
                            // Map scores back to jobs
                            const scoreMap = new Map();
                            jobScores.forEach((item) => {
                              scoreMap.set(item.job_id, item.suitability_score);
                            });
                            
                            const matches = jobsToScore
                              .map((job) => {
                                const score = scoreMap.get(job.id);
                                if (!score) return null;
                                
                                // Transform to match normal job format
                                return {
                                  id: job.id,
                                  title: job.title,
                                  company: job.organization?.name || job.company || "Company",
                                  location: job.province || job.address || job.location || "Location TBD",
                                  category: job.domains?.[0]?.name || job.domains?.[0]?.nameVi || job.category || "General",
                                  level: job.requiredLanguages?.[0]?.level?.name || job.level || "Mid",
                                  type: job.workingMode?.name || job.type || "Full-time",
                                  salary: job.minSalary && job.maxSalary
                                    ? `$${job.minSalary}-${job.maxSalary}`
                                    : job.minSalary
                                    ? `$${job.minSalary}+`
                                    : job.salary || "Negotiable",
                                  tags: [
                                    ...(job.requiredLanguages?.map((rl) => rl.language?.name || "") || []),
                                    ...(job.domains?.map((d) => d.name || d.nameVi || "") || []),
                                    ...(job.tags || []),
                                  ].filter(Boolean),
                                  desc: job.description || job.desc || "",
                                  fullDesc: job.description || job.fullDesc || "",
                                  requirements: job.requiredLanguages?.map(
                                    (rl) => `${rl.language?.name} - ${rl.level?.name}`
                                  ) || job.requirements || [],
                                  benefits: job.benefits || [],
                                  contact: {
                                    email: job.organization?.email || job.contact?.email || "",
                                    phone: job.organization?.phone || job.contact?.phone || "",
                                    address: job.address || job.province || job.contact?.address || "",
                                  },
                                  reviewStatus: job.reviewStatus || "pending",
                                  reviewNotes: job.reviewNotes || "",
                                  suitability_score: score, // Keep AI score for ranking tag
                                };
                              })
                              .filter((job) => job !== null) // Only include jobs with scores
                              .sort(
                                (a, b) =>
                                  b.suitability_score.overall_score -
                                  a.suitability_score.overall_score
                              );
                            
                            setAiJobs(matches.slice(0, 10));
                          } else {
                            console.warn("No job scores returned from AI service");
                            setAiJobs([]);
                          }
                        } catch (err) {
                          console.error("Error batch scoring jobs:", err);
                          console.error("Error details:", err.response?.data || err.message);
                          // Fallback to empty array on error
                          setAiJobs([]);
                        }
                      } catch (error) {
                        console.error("Error fetching AI suggestions:", error);
                        toastService.error(t("findJob.saveJob.aiRecommendationsFailed"));
                        setShowAIResults(false);
                      } finally {
                        setLoadingAI(false);
                      }
                    }}
                    disabled={loadingAI}
                  >
                    {loadingAI ? (
                      <FaSpinner className={styles.spinningIcon} />
                    ) : showAIResults ? (
                      <FaList />
                    ) : (
                      <svg 
                        stroke="currentColor" 
                        fill="currentColor" 
                        strokeWidth="0" 
                        viewBox="0 0 512 512" 
                        height="24px" 
                        width="24px" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M224 96l16-32 32-16-32-16-16-32-16 32-32 16 32 16 16 32zM80 160l26.66-53.33L160 80l-53.34-26.67L80 0 53.34 53.33 0 80l53.34 26.67L80 160zm352 128l-26.66 53.33L352 368l53.34 26.67L432 448l26.66-53.33L512 368l-53.34-26.67L432 288zm70.62-193.77L417.77 9.38C411.53 3.12 403.34 0 395.15 0c-8.19 0-16.38 3.12-22.63 9.38L9.38 372.52c-12.5 12.5-12.5 32.76 0 45.25l84.85 84.85c6.25 6.25 14.44 9.37 22.62 9.37 8.19 0 16.38-3.12 22.63-9.37l363.14-363.15c12.5-12.48 12.5-32.75 0-45.24zM359.45 203.46l-50.91-50.91 86.6-86.6 50.91 50.91-86.6 86.6z"></path>
                      </svg>
                    )}
                  </button>
                )}
              </div>
              </div>
            </div>

            {/* AI Jobs Grid - Replaces normal jobs when active */}
            {showAIResults ? (
              <div className={styles.jobsGrid}>
                {loadingAI ? (
                  <div className={styles.empty}>
                    <div className={styles.loadingSpinner}></div>
                    <p>{t("findJob.loading") || "AI is analyzing jobs..."}</p>
                  </div>
                ) : aiJobs.length === 0 ? (
                  <div className={styles.empty}>
                    {t("findJob.noAIJobs") || "No AI recommendations available"}
                  </div>
                ) : (
                  aiJobs.map((job) => (
                    <div key={job.id} className={styles.jobCard}>
                      {job.suitability_score && (
                        <div className={styles.aiCornerTag}>
                          <svg 
                            stroke="currentColor" 
                            fill="currentColor" 
                            strokeWidth="0" 
                            viewBox="0 0 512 512" 
                            height="1em" 
                            width="1em" 
                            xmlns="http://www.w3.org/2000/svg"
                            className={styles.aiIcon}
                          >
                            <path d="M224 96l16-32 32-16-32-16-16-32-16 32-32 16 32 16 16 32zM80 160l26.66-53.33L160 80l-53.34-26.67L80 0 53.34 53.33 0 80l53.34 26.67L80 160zm352 128l-26.66 53.33L352 368l53.34 26.67L432 448l26.66-53.33L512 368l-53.34-26.67L432 288zm70.62-193.77L417.77 9.38C411.53 3.12 403.34 0 395.15 0c-8.19 0-16.38 3.12-22.63 9.38L9.38 372.52c-12.5 12.5-12.5 32.76 0 45.25l84.85 84.85c6.25 6.25 14.44 9.37 22.62 9.37 8.19 0 16.38-3.12 22.63-9.37l363.14-363.15c12.5-12.48 12.5-32.75 0-45.24zM359.45 203.46l-50.91-50.91 86.6-86.6 50.91 50.91-86.6 86.6z"></path>
                          </svg>
                          {Math.round(job.suitability_score.overall_score)}%
                        </div>
                      )}
                      <div className={styles.jobTop}>
                        <div className={styles.logo}>{job.company[0]}</div>
                        <div className={styles.jobInfo}>
                          <div className={styles.jobTitleRow}>
                            <h3 className={styles.jobTitle}>{job.title}</h3>
                          </div>
                          <p className={styles.company}>{job.company}</p>
                          <div className={styles.meta}>
                            <span>
                              <FaMapMarkerAlt /> {job.location}
                            </span>
                            <span>
                              <FaBullseye /> {job.category}
                            </span>
                            <span>
                              <FaBriefcase /> {job.type}
                            </span>
                            <span>
                              <FaStar /> {job.level}
                            </span>
                            <span>
                              <FaDollarSign /> {job.salary}
                            </span>
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
                          className={styles.detailBtn}
                          onClick={() =>
                            navigate(ROUTES.JOB_DETAIL.replace(":id", job.id))
                          }
                        >
                          {t("common.viewDetails") || "View Details"}
                        </button>
                        <button
                          className={`${styles.applyBtn} ${
                            appliedJobIds.has(job.id) ? styles.appliedBtn : ""
                          }`}
                          onClick={(e) => {
                            if (!appliedJobIds.has(job.id)) {
                              e.stopPropagation();
                              setSelectedJob(job);
                              setIsApplicationModalOpen(true);
                            }
                          }}
                          disabled={appliedJobIds.has(job.id)}
                          title={
                            appliedJobIds.has(job.id)
                              ? t("findJob.alreadyApplied") || "Already Applied"
                              : t("common.apply") || "Apply"
                          }
                        >
                          {appliedJobIds.has(job.id) ? (
                            <>{t("findJob.alreadyApplied") || "Already Applied"}</>
                          ) : (
                            <>{t("common.apply")}</>
                          )}
                        </button>
                        <button
                          className={`${styles.saveJobBtn} ${
                            savedJobIds.has(job.id) ? styles.saveJobBtnSaved : ""
                          }`}
                          onClick={(e) => handleToggleSaveJob(job.id, e)}
                          title={
                            savedJobIds.has(job.id) ? "Unsave job" : "Save job"
                          }
                        >
                          {savedJobIds.has(job.id) ? (
                            <FaBookmark />
                          ) : (
                            <FaRegBookmark />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Normal Jobs Grid */
              <div className={styles.jobsGrid}>
              {loading && (
                <div className={styles.empty}>
                  <div className={styles.loadingSpinner}></div>
                  <p>{t("findJob.loading") || "Loading jobs..."}</p>
                </div>
              )}
              {!loading && slice.length === 0 && (
                <div className={styles.empty}>{t("findJob.noJobsFound")}</div>
              )}
              {!loading &&
                slice.map((job) => (
                  <div key={job.id} className={styles.jobCard}>
                    <div className={styles.jobTop}>
                      <div className={styles.logo}>{job.company[0]}</div>
                      <div className={styles.jobInfo}>
                        <div className={styles.jobTitleRow}>
                          <h3 className={styles.jobTitle}>{job.title}</h3>
                          {job.reviewStatus &&
                            job.reviewStatus !== "approved" && (
                              <span
                                className={`${styles.reviewBadge} ${
                                  job.reviewStatus === "pending"
                                    ? styles.reviewPending
                                    : job.reviewStatus === "rejected"
                                    ? styles.reviewRejected
                                    : ""
                                }`}
                              >
                                <>
                                  <FaClock />{" "}
                                  {job.reviewStatus === "pending" ? (
                                    "Pending"
                                  ) : (
                                    <>
                                      <FaTimesCircle /> Rejected
                                    </>
                                  )}
                                </>
                              </span>
                            )}
                        </div>
                        <p className={styles.company}>{job.company}</p>
                        <div className={styles.meta}>
                          <span>
                            <FaMapMarkerAlt /> {job.location}
                          </span>
                          <span>
                            <FaBullseye /> {job.category}
                          </span>
                          <span>
                            <FaBriefcase /> {job.type}
                          </span>
                          <span>
                            <FaStar /> {job.level}
                          </span>
                          <span>
                            <FaDollarSign /> {job.salary}
                          </span>
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
                        className={styles.detailBtn}
                        onClick={() =>
                          navigate(ROUTES.JOB_DETAIL.replace(":id", job.id))
                        }
                      >
                        {t("common.viewDetails") || "View Details"}
                      </button>
                      <button
                        className={`${styles.applyBtn} ${
                          appliedJobIds.has(job.id) ? styles.appliedBtn : ""
                        }`}
                        onClick={(e) => {
                          if (!appliedJobIds.has(job.id)) {
                            e.stopPropagation();
                            setSelectedJob(job);
                            setIsApplicationModalOpen(true);
                          }
                        }}
                        disabled={appliedJobIds.has(job.id)}
                        title={
                          appliedJobIds.has(job.id)
                            ? t("findJob.alreadyApplied") || "Already Applied"
                            : t("common.apply") || "Apply"
                        }
                      >
                        {appliedJobIds.has(job.id) ? (
                          <>{t("findJob.alreadyApplied") || "Already Applied"}</>
                        ) : (
                          <>{t("common.apply")}</>
                        )}
                      </button>
                      <button
                        className={`${styles.saveJobBtn} ${
                          savedJobIds.has(job.id) ? styles.saveJobBtnSaved : ""
                        }`}
                        onClick={(e) => handleToggleSaveJob(job.id, e)}
                        title={
                          savedJobIds.has(job.id) ? "Unsave job" : "Save job"
                        }
                      >
                        {savedJobIds.has(job.id) ? (
                          <FaBookmark />
                        ) : (
                          <FaRegBookmark />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination - Only show for normal jobs, not AI results */}
            {!showAIResults && (
              <div className={styles.pagination}>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`${styles.pageBtn} ${
                      p === pageSafe ? styles.active : ""
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              </div>
            )}
          </main>
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
                  <div className={styles.modalJobTitleRow}>
                    <h2 className={styles.modalJobTitle}>
                      {selectedJob.title}
                    </h2>
                    {selectedJob.reviewStatus &&
                      selectedJob.reviewStatus !== "approved" && (
                        <span
                          className={`${styles.reviewBadge} ${
                            selectedJob.reviewStatus === "pending"
                              ? styles.reviewPending
                              : selectedJob.reviewStatus === "rejected"
                              ? styles.reviewRejected
                              : ""
                          }`}
                        >
                          <>
                            {selectedJob.reviewStatus === "pending" ? (
                              <>
                                <FaClock /> Pending Review
                              </>
                            ) : (
                              <>
                                <FaTimesCircle /> Rejected
                              </>
                            )}
                          </>
                        </span>
                      )}
                  </div>
                  <p className={styles.modalCompany}>{selectedJob.company}</p>
                  <div className={styles.modalMeta}>
                    <span>
                      <FaMapMarkerAlt /> {selectedJob.location}
                    </span>
                    <span>
                      <FaBullseye /> {selectedJob.category}
                    </span>
                    <span>
                      <FaBriefcase /> {selectedJob.type}
                    </span>
                    <span>
                      <FaStar /> {selectedJob.level}
                    </span>
                    <span>
                      <FaDollarSign /> {selectedJob.salary}
                    </span>
                  </div>
                  {selectedJob.reviewNotes && (
                    <div className={styles.reviewNotesBanner}>
                      <strong>Review Notes:</strong> {selectedJob.reviewNotes}
                    </div>
                  )}
                </div>
                <div className={styles.modalHeaderActions}>
                  <button
                    className={`${styles.modalApplyBtn} ${
                      appliedJobIds.has(selectedJob.id) ? styles.appliedBtn : ""
                    }`}
                    onClick={() => {
                      if (!appliedJobIds.has(selectedJob.id)) {
                        handleApply();
                      }
                    }}
                    disabled={appliedJobIds.has(selectedJob.id)}
                    title={
                      appliedJobIds.has(selectedJob.id)
                        ? t("findJob.alreadyApplied") || "Already Applied"
                        : t("common.applyNow") || "Apply Now"
                    }
                  >
                    {appliedJobIds.has(selectedJob.id) ? (
                      <>{t("findJob.alreadyApplied") || "Đã ứng tuyển"}</>
                    ) : (
                      <>{t("common.applyNow")}</>
                    )}
                  </button>
                  <button
                    className={`${styles.modalSaveBtn} ${
                      savedJobIds.has(selectedJob.id) ? styles.savedBtn : ""
                    }`}
                    onClick={(e) => handleToggleSaveJob(selectedJob.id, e)}
                    title={
                      savedJobIds.has(selectedJob.id)
                        ? t("findJob.saveJob.unsave") || "Unsave"
                        : t("findJob.saveJob.save") || "Save"
                    }
                  >
                    {savedJobIds.has(selectedJob.id) ? (
                      <>
                        <FaBookmark /> {t("findJob.saveJob.saved") || "Saved"}
                      </>
                    ) : (
                      <>
                        <FaBookmark /> {t("common.save")}
                      </>
                    )}
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
                      <span className={styles.contactLabel}>Email:</span>
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
                      <span className={styles.contactLabel}>
                        <FaMapMarkerAlt /> Address:
                      </span>
                      <span className={styles.contactValue}>
                        {selectedJob.contact?.address}
                      </span>
                    </div>
                  </div>

                  {(!user || !hasPremium) && (
                    <div className={styles.premiumNotice}>
                      <p>
                        Contact information is only available for premium
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
          <div className={styles.modalOverlay} onClick={closeApplicationModal}>
            <div
              className={styles.applicationModal}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.closeBtn}
                onClick={closeApplicationModal}
              >
                ×
              </button>
              <div className={styles.applicationModalHeader}>
                <h2>
                  {t("findJob.applicationModal.title")} {selectedJob?.title}
                </h2>
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
                      {t("findJob.applicationModal.fileSelected")}{" "}
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
                    onClick={handleSubmitApplication}
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
          <div 
            className={styles.modalOverlay}
            onClick={() => {
              // Close modal without applying changes when clicking overlay
              setShowAdvancedFilter(false);
            }}
          >
            <div 
              className={styles.advancedFilterModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.advancedFilterHeader}>
                <h2>{t("findJob.advancedFilter")}</h2>
                <button
                  className={styles.closeBtn}
                  onClick={() => {
                    // Close modal without applying changes when clicking X
                    setShowAdvancedFilter(false);
                  }}
                >
                  ×
                </button>
              </div>

              <div className={styles.advancedFilterBody}>
                <div className={styles.advancedFilterGrid}>
                  {/* Working Mode */}
                  <div className={styles.field}>
                    <label>{t("findJob.filters.workingMode") || "Working Mode"}</label>
                    <select
                      value={tempAdvancedFilters.workingMode || ""}
                      onChange={(e) =>
                        setTempAdvancedFilters((prev) => ({
                          ...prev,
                          workingMode: e.target.value,
                        }))
                      }
                      className={styles.selectInput}
                    >
                      <option value="">
                        {t("findJob.filters.allWorkingModes") || "All Working Modes"}
                      </option>
                      {workingModes.map((mode) => (
                        <option key={mode.id} value={mode.id}>
                          {lang === "vi" ? mode.nameVi : mode.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Languages */}
                  <div className={styles.field}>
                    <label>{t("findJob.advancedLanguages") || "Languages"}</label>
                    <select
                      value={tempAdvancedFilters.languages}
                      onChange={(e) =>
                        setTempAdvancedFilters((prev) => ({
                          ...prev,
                          languages: e.target.value,
                        }))
                      }
                      className={styles.selectInput}
                    >
                      <option value="">{t("findJob.allLanguages") || "All Languages"}</option>
                      {availableLanguages.map((lang) => (
                        <option key={lang.id || lang.name} value={lang.name}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Level */}
                  <div className={styles.field}>
                    <label>{t("findJob.filters.level") || "Level"}</label>
                    <select
                      value={tempAdvancedFilters.level || ""}
                      onChange={(e) =>
                        setTempAdvancedFilters((prev) => ({
                          ...prev,
                          level: e.target.value,
                        }))
                      }
                      className={styles.selectInput}
                    >
                      <option value="">
                        {t("findJob.filters.allLevels") || "All Levels"}
                      </option>
                      {levels.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company Name */}
                  <div className={styles.field}>
                    <label>{t("findJob.filters.companyName") || "Company Name"}</label>
                    <input
                      type="text"
                      value={tempAdvancedFilters.companyName || ""}
                      onChange={(e) =>
                        setTempAdvancedFilters((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      placeholder={t("findJob.filters.companyNamePlaceholder") || "Enter company name"}
                      className={styles.textInput}
                    />
                  </div>

                  {/* Certificate */}
                  <div className={styles.field}>
                    <label>{t("findJob.advancedCertificate") || "Certificate"}</label>
                    <select
                      value={tempAdvancedFilters.certificate}
                      onChange={(e) =>
                        setTempAdvancedFilters((prev) => ({
                          ...prev,
                          certificate: e.target.value,
                        }))
                      }
                      className={styles.selectInput}
                    >
                      <option value="">{t("findJob.allCertificates") || "All Certificates"}</option>
                      <option value="TOEIC">{t("findJob.toeic") || "TOEIC"}</option>
                      <option value="IELTS">{t("findJob.ielts") || "IELTS"}</option>
                      <option value="TOPIK">{t("findJob.topik") || "TOPIK"}</option>
                      <option value="JLPT">{t("findJob.jlpt") || "JLPT"}</option>
                      <option value="HSK">{t("findJob.hsk") || "HSK"}</option>
                      <option value="DELF">{t("findJob.delf") || "DELF"}</option>
                    </select>
                  </div>
                </div>

                <div className={styles.advancedFilterActions}>
                  <button
                    type="button"
                    onClick={() => {
                      // Apply temp filters to actual filters
                      setAdvancedFilters({ ...tempAdvancedFilters });
                      setShowAdvancedFilter(false);
                      setPage(1);
                    }}
                    className={styles.applyAdvancedBtn}
                  >
                    {t("findJob.applyFilters") || "Apply Filters"}
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
                  {notification.type === "error" && <FaExclamationTriangle />}
                  {notification.type === "success" && <FaCheckCircle />}
                  {notification.type === "warning" && <FaBell />}
                  {notification.type === "info" && <FaInfoCircle />}
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
