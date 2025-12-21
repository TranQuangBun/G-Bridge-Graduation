import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FindJobPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { ROUTES } from "../../constants/enums";
import jobService from "../../services/jobService.js";
import savedJobService from "../../services/savedJobService.js";
import { useAuth } from "../../contexts/AuthContext";
import { AISuggestedJobsSection } from "../../components/AIMatching";
import { toast } from "react-toastify";

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
} from "react-icons/fa";

// Mock interpreter job dataset - fallback when API fails (currently unused)
/* const INTERPRETER_JOBS = [
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
]; */

const unique = (arr) => Array.from(new Set(arr));

export default function FindJobPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [salaryRange, setSalaryRange] = useState([null, null]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Modal state for new layout (reserved for future use)
  // eslint-disable-next-line no-unused-vars
  const [showModal, setShowModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedJobId, setSelectedJobId] = useState(null);
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
  // eslint-disable-next-line no-unused-vars
  const [quickFilters, setQuickFilters] = useState([]);
  const pageSize = 9; // 3 x 3 layout

  // API state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  // const [totalJobs, setTotalJobs] = useState(0); // Reserved for future use

  // Lookup data from API
  const [domains, setDomains] = useState([]);
  const [levels, setLevels] = useState([]);

  // Auth state
  const { user, isAuthenticated } = useAuth();
  const hasPremium = user?.isPremium || false;

  // Saved jobs state - track which jobs are saved
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  // eslint-disable-next-line no-unused-vars
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(true);

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
        const [domainsRes, levelsRes] = await Promise.all([
          jobService.getDomains(),
          jobService.getLevels(),
        ]);
        if (domainsRes?.success) setDomains(domainsRes.data || []);
        if (levelsRes?.success) setLevels(levelsRes.data || []);
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
        console.log("Saved jobs response:", response);

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
          console.log("Saved job IDs:", Array.from(savedIds));
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
          console.log("Applied job IDs:", Array.from(appliedIds));
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
      setLoadingSavedJobs(true);
      const result = await savedJobService.getAllSavedJobs();
      console.log("🔄 Loading saved jobs:", result);

      if (result.success && result.data && Array.isArray(result.data)) {
        const savedIds = new Set(result.data.map((item) => item.id));
        console.log("✅ Saved job IDs loaded:", Array.from(savedIds));
        setSavedJobIds(savedIds);
      } else {
        console.log("⚠️ No saved jobs or invalid format");
        setSavedJobIds(new Set());
      }
    } catch (error) {
      console.error("❌ Error loading saved jobs:", error);
      setSavedJobIds(new Set());
    } finally {
      setLoadingSavedJobs(false);
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
        console.log("🔄 Page visible again, reloading saved jobs");
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
        sortBy: sortBy || "createdAt",
        sortOrder: sortBy === "title" ? "ASC" : "DESC",
      };

      if (keyword) apiFilters.search = keyword;
      if (location) apiFilters.province = location;
      if (category) {
        // Category is already an ID from the dropdown
        apiFilters.domainId = parseInt(category);
      }
      if (level) {
        // Level is already an ID from the dropdown
        apiFilters.levelId = parseInt(level);
      }
      if (salaryRange) {
        // Handle both array format [min, max] and string format "min-max"
        let min, max;
        if (Array.isArray(salaryRange)) {
          [min, max] = salaryRange;
        } else if (typeof salaryRange === "string") {
          [min, max] = salaryRange.split("-").map((s) => s.replace(/\D/g, ""));
        }
        if (min) apiFilters.minSalary = parseInt(min);
        if (max) apiFilters.maxSalary = parseInt(max);
      }

      const response = await jobService.getJobs(apiFilters);

      // Check if response is successful and has data
      if (response && (response.success || response.data)) {
        // Handle different response formats
        const jobsData =
          response.data?.jobs ||
          response.data?.data?.jobs ||
          response.data ||
          [];
        const totalPages =
          response.data?.totalPages ||
          response.data?.pagination?.totalPages ||
          1;
        const totalCount =
          response.data?.total ||
          response.data?.pagination?.total ||
          jobsData.length;
        // const total = response.data?.total || response.data?.pagination?.total || jobsData.length; // Reserved for future use

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

        if (transformedJobs.length > 0) {
          setJobs(transformedJobs);
          setTotalPages(totalPages);
          setTotal(totalCount);
          // setTotalJobs(total); // Reserved for future use
        } else {
          // No jobs found, but API call was successful
          setJobs([]);
          setTotalPages(1);
          setTotal(0);
          // setTotalJobs(0); // Reserved for future use
        }
      } else {
        // API call failed or returned unexpected format
        console.warn("API response format unexpected:", response);
        setJobs([]);
        setTotalPages(1);
        setTotal(0);
        // setTotalJobs(0); // Reserved for future use
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
      // setTotalJobs(0); // Reserved for future use
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
    level,
    salaryRange,
    sortBy,
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

  // Get categories and locations from API data only (reserved for future use)
  // eslint-disable-next-line no-unused-vars
  const categories = useMemo(() => {
    return unique(
      [
        ...domains.map((d) => d.name || d.nameVi),
        ...jobs.map((j) => j.category),
      ].filter(Boolean)
    );
  }, [domains, jobs]);

  const locationsList = useMemo(() => {
    return unique(jobs.map((j) => j.location).filter(Boolean));
  }, [jobs]);

  // eslint-disable-next-line no-unused-vars
  const levelOptions = useMemo(() => {
    return unique(
      [
        ...levels.map((l) => l.name || l.nameVi),
        ...jobs.map((j) => j.level),
      ].filter(Boolean)
    );
  }, [levels, jobs]);

  // Display jobs: Always use API data
  const displayJobs = jobs;
  const pageSafe = Math.min(page, totalPages || 1);
  const slice = displayJobs;

  // eslint-disable-next-line no-unused-vars
  function submit(e) {
    e.preventDefault();
    setPage(1);
  }
  // eslint-disable-next-line no-unused-vars
  function reset() {
    setKeyword("");
    setLocation("");
    setCategory("");
    setLevel("");
    setSalaryRange([null, null]);
    setPage(1);
  }

  function closeJobModal() {
    setIsModalOpen(false);
    setSelectedJob(null);
  }

  // eslint-disable-next-line no-unused-vars
  function handleCloseModal() {
    setShowModal(false);
    setSelectedJobId(null);
  }

  // Toggle quick filter (reserved for future use)
  // eslint-disable-next-line no-unused-vars
  const toggleQuickFilter = (filterId) => {
    setQuickFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setKeyword("");
    setLocation("");
    setCategory("");
    setLevel("");
    setSalaryRange([null, null]);
    setSortBy("createdAt");
    setPage(1);
  };

  // Handle save/unsave job
  const handleToggleSaveJob = async (jobId, e) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to save jobs");
      return;
    }

    const isSaved = savedJobIds.has(jobId);
    console.log(`🔘 Toggle save for job ${jobId}, currently saved: ${isSaved}`);

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
      console.log(`✅ ${isSaved ? "Unsaved" : "Saved"} successfully`);
      toast.success(
        isSaved ? "Job removed from saved" : "Job saved successfully"
      );
    } else {
      console.error(
        `❌ Failed to ${isSaved ? "unsave" : "save"}:`,
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
      toast.error(result.message || "Failed to update saved status");
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
          t("jobDetail.apply.errors.pdfOnly") || "Chỉ chấp nhận file PDF",
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
        t("jobDetail.apply.errors.cvRequired") || "Vui lòng tải lên CV",
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
          t("jobDetail.apply.success") || "Ứng tuyển thành công!",
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

  // Handle save/unsave job (handleFileUpload is already defined above, removed duplicate)

  // eslint-disable-next-line no-unused-vars
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

    // Update applied jobs state
    if (selectedJob?.id) {
      setAppliedJobIds((prev) => new Set([...prev, selectedJob.id]));
    }

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

            {/* Search */}
            <div className={styles.filterSection}>
              <label>{t("findJob.filters.search") || "Search"}</label>
              <input
                type="text"
                placeholder={
                  t("findJob.filters.searchPlaceholder") || "Search jobs..."
                }
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Location Filter */}
            <div className={styles.filterSection}>
              <label>{t("findJob.filters.location") || "Location"}</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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

            {/* Level Filter */}
            <div className={styles.filterSection}>
              <label>{t("findJob.filters.level") || "Level"}</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
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

            {/* Salary Range Filter */}
            <div className={styles.filterSection}>
              <label>
                {t("findJob.filters.salaryRange") || "Salary Range"}
              </label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  placeholder="Min"
                  value={salaryRange[0] || ""}
                  onChange={(e) =>
                    setSalaryRange([
                      e.target.value ? parseInt(e.target.value) : null,
                      salaryRange[1],
                    ])
                  }
                  className={styles.rangeInput}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={salaryRange[1] || ""}
                  onChange={(e) =>
                    setSalaryRange([
                      salaryRange[0],
                      e.target.value ? parseInt(e.target.value) : null,
                    ])
                  }
                  className={styles.rangeInput}
                />
              </div>
            </div>

            <button className={styles.applyBtn} onClick={() => setPage(1)}>
              {t("findJob.filters.apply") || "Apply Filters"}
            </button>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.resultsInfo}>
                <span>
                  {total} {t("findJob.resultsFound") || "jobs found"}
                </span>
              </div>

              <div className={styles.sortControls}>
                <label>{t("findJob.sortBy") || "Sort by"}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.sortSelect}
                >
                  <option value="createdAt">
                    {t("findJob.sort.newest") || "Newest"}
                  </option>
                  <option value="minSalary">
                    {t("findJob.sort.salary") || "Highest Salary"}
                  </option>
                  <option value="title">
                    {t("findJob.sort.title") || "Job Title"}
                  </option>
                </select>
              </div>
            </div>

            {/* AI Recommended Jobs Section - Integrated naturally */}
            {isAuthenticated && user?.role === "interpreter" && (
              <div className={styles.aiSection}>
                <div className={styles.aiSectionHeader}>
                  <h3>
                    <span className={styles.aiBadge}>AI</span>{" "}
                    {t("findJob.aiRecommended") || "Recommended for You"}
                  </h3>
                </div>
                <AISuggestedJobsSection 
                  interpreterId={user.id} 
                  autoFetch={true}
                  compact={true}
                />
              </div>
            )}

            {/* Jobs Grid */}
            <div className={styles.jobsGrid}>
              {loading && (
                <div className={styles.empty}>
                  {t("findJob.loading") || "Loading jobs..."}
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
                        {t("common.viewDetails") || "Chi tiết"}
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
                            ? t("findJob.alreadyApplied") || "Đã ứng tuyển"
                            : t("common.apply") || "Ứng tuyển"
                        }
                      >
                        {appliedJobIds.has(job.id) ? (
                          <>{t("findJob.alreadyApplied") || "Đã ứng tuyển"}</>
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

            {/* Pagination */}
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
                        ? t("findJob.alreadyApplied") || "Đã ứng tuyển"
                        : t("common.applyNow") || "Ứng tuyển ngay"
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
                        ? t("findJob.saveJob.unsave") || "Bỏ lưu"
                        : t("findJob.saveJob.save") || "Lưu"
                    }
                  >
                    {savedJobIds.has(selectedJob.id) ? (
                      <>
                        <FaBookmark /> {t("findJob.saveJob.saved") || "Đã lưu"}
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
