import React, { useState } from "react";
import styles from "./JobPostPage.module.css";
import { MainLayout } from "../../../layouts";
import { useLanguage } from "../../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";

// Mock data for existing job posts
const MOCK_JOB_POSTS = [
  {
    id: 1,
    title: "Medical Interpreter - Emergency Services",
    type: "Full-time",
    location: "Ho Chi Minh City",
    workType: "On-site",
    salaryMin: 50,
    salaryMax: 70,
    currency: "USD",
    languages: ["Vietnamese", "English"],
    specializations: ["Medical", "Emergency"],
    description:
      "Seeking experienced medical interpreter for emergency services in major hospital. Must be available for shifts including nights and weekends.",
    requirements: [
      "5+ years medical interpretation experience",
      "Medical terminology certification",
      "Fluent in Vietnamese and English",
      "Available for emergency calls",
    ],
    benefits: [
      "Health insurance",
      "Overtime pay",
      "Professional development",
      "Flexible scheduling",
    ],
    deadline: "2025-09-30",
    postedDate: "2025-09-15",
    applicationsCount: 12,
    status: "active",
  },
  {
    id: 2,
    title: "Business Conference Interpreter",
    type: "Contract",
    location: "Hanoi",
    workType: "Hybrid",
    salaryMin: 40,
    salaryMax: 60,
    currency: "USD",
    languages: ["English", "Vietnamese", "Mandarin"],
    specializations: ["Business", "Conference"],
    description:
      "International business conference interpreter needed for quarterly meetings and client presentations.",
    requirements: [
      "Business interpretation experience",
      "Conference interpretation skills",
      "Professional appearance",
      "Excellent communication skills",
    ],
    benefits: [
      "Competitive hourly rate",
      "Travel allowances",
      "Networking opportunities",
      "Flexible hours",
    ],
    deadline: "2025-09-25",
    postedDate: "2025-09-12",
    applicationsCount: 8,
    status: "active",
  },
  {
    id: 3,
    title: "Legal Document Translator",
    type: "Part-time",
    location: "Remote",
    workType: "Remote",
    salaryMin: 45,
    salaryMax: 65,
    currency: "USD",
    languages: ["Vietnamese", "English", "French"],
    specializations: ["Legal", "Document Translation"],
    description:
      "Legal document translation for international law firm specializing in corporate law and immigration.",
    requirements: [
      "Legal translation certification",
      "Law degree preferred",
      "5+ years experience",
      "Attention to detail",
    ],
    benefits: [
      "Remote work",
      "Flexible schedule",
      "Professional development",
      "Performance bonuses",
    ],
    deadline: "2025-09-28",
    postedDate: "2025-09-10",
    applicationsCount: 15,
    status: "active",
  },
];

function JobPostPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("list"); // "list" or "create"
  const [selectedJob, setSelectedJob] = useState(null);

  // Form state for creating new job
  const [formData, setFormData] = useState({
    title: "",
    type: "Full-time",
    location: "",
    workType: "On-site",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    languages: [],
    specializations: [],
    description: "",
    requirements: [""],
    benefits: [""],
    deadline: "",
  });

  const jobTypes = ["Full-time", "Part-time", "Contract", "Freelance"];
  const workTypes = ["On-site", "Remote", "Hybrid"];
  const currencies = ["USD", "VND", "EUR"];
  const availableLanguages = [
    "Vietnamese",
    "English",
    "Japanese",
    "Mandarin",
    "Korean",
    "French",
    "German",
    "Thai",
    "Spanish",
  ];
  const availableSpecializations = [
    "Medical",
    "Legal",
    "Business",
    "Technical",
    "Conference",
    "Education",
    "Finance",
    "Healthcare",
    "Tourism",
    "Government",
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayFieldChange = (field, index, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayField = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const toggleLanguage = (language) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  const toggleSpecialization = (spec) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Creating job post:", formData);
    // Here you would submit to API
    alert("Job post created successfully!");
    setActiveTab("list");
    // Reset form
    setFormData({
      title: "",
      type: "Full-time",
      location: "",
      workType: "On-site",
      salaryMin: "",
      salaryMax: "",
      currency: "USD",
      languages: [],
      specializations: [],
      description: "",
      requirements: [""],
      benefits: [""],
      deadline: "",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return styles.statusActive;
      case "paused":
        return styles.statusPaused;
      case "closed":
        return styles.statusClosed;
      default:
        return styles.statusDefault;
    }
  };

  const handleViewJob = (job) => {
    setSelectedJob(job);
  };

  const closeModal = () => {
    setSelectedJob(null);
  };

  const handleJobAction = (jobId, action) => {
    console.log(`${action} job ${jobId}`);
    // Here you would handle job actions (edit, pause, delete, etc.)
  };

  return (
    <MainLayout>
      <div className={styles.jobPostRoot}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Job Management</h1>
            <p className={styles.pageSubtitle}>
              Create and manage your interpreter job postings
            </p>
          </div>

          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "list" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab("list")}
            >
              📋 My Job Posts
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "create" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab("create")}
            >
              ➕ Create New Job
            </button>
          </div>
        </header>

        {/* Job Posts List */}
        {activeTab === "list" && (
          <section className={styles.jobListSection}>
            <div className={styles.jobListHeader}>
              <div className={styles.listStats}>
                <span className={styles.totalJobs}>
                  {MOCK_JOB_POSTS.length} Active Job Posts
                </span>
                <span className={styles.totalApplications}>
                  {MOCK_JOB_POSTS.reduce(
                    (sum, job) => sum + job.applicationsCount,
                    0
                  )}{" "}
                  Total Applications
                </span>
              </div>
            </div>

            <div className={styles.jobsList}>
              {MOCK_JOB_POSTS.map((job) => (
                <div key={job.id} className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <div className={styles.jobTitleSection}>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <div className={styles.jobMeta}>
                        <span className={styles.jobType}>{job.type}</span>
                        <span className={styles.jobLocation}>
                          📍 {job.location}
                        </span>
                        <span className={styles.workType}>{job.workType}</span>
                      </div>
                    </div>
                    <div
                      className={`${styles.statusBadge} ${getStatusClass(
                        job.status
                      )}`}
                    >
                      {job.status}
                    </div>
                  </div>

                  <div className={styles.jobContent}>
                    <div className={styles.jobDetails}>
                      <div className={styles.salaryInfo}>
                        <strong>Salary:</strong> ${job.salaryMin}-
                        {job.salaryMax}/
                        {job.currency === "USD" ? "hour" : "month"}
                      </div>

                      <div className={styles.languages}>
                        <strong>Languages:</strong>
                        <div className={styles.languageTags}>
                          {job.languages.map((lang) => (
                            <span key={lang} className={styles.languageTag}>
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className={styles.specializations}>
                        <strong>Specializations:</strong>
                        <div className={styles.specializationTags}>
                          {job.specializations.map((spec) => (
                            <span
                              key={spec}
                              className={styles.specializationTag}
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={styles.jobStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Posted:</span>
                        <span className={styles.statValue}>
                          {formatDate(job.postedDate)}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Deadline:</span>
                        <span className={styles.statValue}>
                          {formatDate(job.deadline)}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Applications:</span>
                        <span className={styles.statValue}>
                          {job.applicationsCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.jobActions}>
                    <button
                      className={styles.viewJobBtn}
                      onClick={() => handleViewJob(job)}
                    >
                      View Details
                    </button>
                    <button
                      className={styles.editJobBtn}
                      onClick={() => handleJobAction(job.id, "edit")}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.applicantsBtn}
                      onClick={() => handleJobAction(job.id, "view_applicants")}
                    >
                      View Applicants ({job.applicationsCount})
                    </button>
                    <button
                      className={styles.pauseJobBtn}
                      onClick={() => handleJobAction(job.id, "pause")}
                    >
                      Pause
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Create Job Form */}
        {activeTab === "create" && (
          <section className={styles.createJobSection}>
            <form onSubmit={handleSubmit} className={styles.jobForm}>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Basic Information</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Job Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className={styles.formInput}
                      placeholder="e.g. Medical Interpreter - Emergency Services"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Job Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        handleInputChange("type", e.target.value)
                      }
                      className={styles.formSelect}
                      required
                    >
                      {jobTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Work Type *</label>
                    <select
                      value={formData.workType}
                      onChange={(e) =>
                        handleInputChange("workType", e.target.value)
                      }
                      className={styles.formSelect}
                      required
                    >
                      {workTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Location *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      className={styles.formInput}
                      placeholder="e.g. Ho Chi Minh City"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Application Deadline *
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        handleInputChange("deadline", e.target.value)
                      }
                      className={styles.formInput}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Compensation</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Minimum Rate *</label>
                    <input
                      type="number"
                      value={formData.salaryMin}
                      onChange={(e) =>
                        handleInputChange("salaryMin", e.target.value)
                      }
                      className={styles.formInput}
                      placeholder="50"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Maximum Rate *</label>
                    <input
                      type="number"
                      value={formData.salaryMax}
                      onChange={(e) =>
                        handleInputChange("salaryMax", e.target.value)
                      }
                      className={styles.formInput}
                      placeholder="70"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Currency *</label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        handleInputChange("currency", e.target.value)
                      }
                      className={styles.formSelect}
                      required
                    >
                      {currencies.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Requirements</h3>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Required Languages *
                  </label>
                  <div className={styles.checkboxGrid}>
                    {availableLanguages.map((language) => (
                      <label key={language} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(language)}
                          onChange={() => toggleLanguage(language)}
                          className={styles.checkbox}
                        />
                        {language}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Specializations *</label>
                  <div className={styles.checkboxGrid}>
                    {availableSpecializations.map((spec) => (
                      <label key={spec} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec)}
                          onChange={() => toggleSpecialization(spec)}
                          className={styles.checkbox}
                        />
                        {spec}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Job Description</h3>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className={styles.formTextarea}
                    rows={5}
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Requirements</label>
                  {formData.requirements.map((req, index) => (
                    <div key={index} className={styles.arrayInputRow}>
                      <input
                        type="text"
                        value={req}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            "requirements",
                            index,
                            e.target.value
                          )
                        }
                        className={styles.formInput}
                        placeholder="e.g. 5+ years medical interpretation experience"
                      />
                      {formData.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeArrayField("requirements", index)
                          }
                          className={styles.removeBtn}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField("requirements")}
                    className={styles.addBtn}
                  >
                    + Add Requirement
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Benefits</label>
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className={styles.arrayInputRow}>
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            "benefits",
                            index,
                            e.target.value
                          )
                        }
                        className={styles.formInput}
                        placeholder="e.g. Health insurance"
                      />
                      {formData.benefits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField("benefits", index)}
                          className={styles.removeBtn}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField("benefits")}
                    className={styles.addBtn}
                  >
                    + Add Benefit
                  </button>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Post Job
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Job Details Modal */}
        {selectedJob && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{selectedJob.title}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.jobDetailsSection}>
                  <div className={styles.detailRow}>
                    <strong>Type:</strong> {selectedJob.type}
                  </div>
                  <div className={styles.detailRow}>
                    <strong>Location:</strong> {selectedJob.location}
                  </div>
                  <div className={styles.detailRow}>
                    <strong>Work Type:</strong> {selectedJob.workType}
                  </div>
                  <div className={styles.detailRow}>
                    <strong>Salary:</strong> ${selectedJob.salaryMin}-
                    {selectedJob.salaryMax}/hour
                  </div>
                  <div className={styles.detailRow}>
                    <strong>Languages:</strong>{" "}
                    {selectedJob.languages.join(", ")}
                  </div>
                  <div className={styles.detailRow}>
                    <strong>Specializations:</strong>{" "}
                    {selectedJob.specializations.join(", ")}
                  </div>
                </div>

                <div className={styles.descriptionSection}>
                  <h4>Description</h4>
                  <p>{selectedJob.description}</p>
                </div>

                <div className={styles.requirementsSection}>
                  <h4>Requirements</h4>
                  <ul>
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.benefitsSection}>
                  <h4>Benefits</h4>
                  <ul>
                    {selectedJob.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.modalEditBtn}
                  onClick={() => {
                    handleJobAction(selectedJob.id, "edit");
                    closeModal();
                  }}
                >
                  Edit Job
                </button>
                <button className={styles.modalCloseBtn} onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default JobPostPage;
