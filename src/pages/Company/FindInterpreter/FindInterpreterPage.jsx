import React, { useState } from "react";
import styles from "./FindInterpreterPage.module.css";
import { MainLayout } from "../../../layouts";
import { useLanguage } from "../../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants";

// Mock data for interpreters
const MOCK_INTERPRETERS = [
  {
    id: 1,
    name: "Nguyễn Minh Anh",
    avatar: "/src/assets/images/avatar/minhanh.png",
    title: "Senior Conference Interpreter",
    languages: ["English", "Vietnamese", "Japanese"],
    specializations: ["Medical", "Legal", "Business"],
    experience: "8 years",
    rating: 4.9,
    reviews: 127,
    hourlyRate: "$45-60",
    location: "Ho Chi Minh City",
    availability: "Available",
    certifications: [
      "NAATI Certified",
      "JLPT N1",
      "Medical Interpreter Certificate",
    ],
    completedJobs: 234,
    responseTime: "2 hours",
    languages_detail: {
      English: "Native",
      Vietnamese: "Native",
      Japanese: "Professional",
    },
    bio: "Experienced conference interpreter specializing in medical and legal translation with over 8 years of international experience.",
  },
  {
    id: 2,
    name: "David Wilson",
    avatar: "/src/assets/images/avatar/nam.png",
    title: "Business Interpreter & Translator",
    languages: ["English", "Vietnamese", "Mandarin"],
    specializations: ["Business", "Finance", "Technology"],
    experience: "6 years",
    rating: 4.7,
    reviews: 89,
    hourlyRate: "$40-55",
    location: "Hanoi",
    availability: "Available",
    certifications: ["Business Interpreter Certificate", "HSK Level 6"],
    completedJobs: 156,
    responseTime: "1 hour",
    languages_detail: {
      English: "Native",
      Vietnamese: "Professional",
      Mandarin: "Professional",
    },
    bio: "Business-focused interpreter with expertise in financial and technology sectors, facilitating international business communications.",
  },
  {
    id: 3,
    name: "Trần Thị Hương",
    avatar: "/src/assets/images/avatar/huonng.png",
    title: "Medical Interpreter Specialist",
    languages: ["Vietnamese", "English", "French"],
    specializations: ["Medical", "Healthcare", "Pharmaceutical"],
    experience: "10 years",
    rating: 4.8,
    reviews: 203,
    hourlyRate: "$50-70",
    location: "Da Nang",
    availability: "Busy until Oct 5",
    certifications: [
      "Medical Interpreter Certification",
      "DELF B2",
      "Healthcare Translation Certificate",
    ],
    completedJobs: 312,
    responseTime: "3 hours",
    languages_detail: {
      Vietnamese: "Native",
      English: "Professional",
      French: "Professional",
    },
    bio: "Specialized medical interpreter with extensive experience in healthcare settings, pharmaceutical research, and medical conferences.",
  },
  {
    id: 4,
    name: "Kim Min-jun",
    avatar: "/src/assets/images/avatar/nam.png",
    title: "Legal & Technical Interpreter",
    languages: ["Korean", "English", "Vietnamese"],
    specializations: ["Legal", "Technical", "Government"],
    experience: "7 years",
    rating: 4.6,
    reviews: 94,
    hourlyRate: "$35-50",
    location: "Ho Chi Minh City",
    availability: "Available",
    certifications: ["Legal Interpreter Certificate", "TOPIK Level 6"],
    completedJobs: 178,
    responseTime: "4 hours",
    languages_detail: {
      Korean: "Native",
      English: "Professional",
      Vietnamese: "Intermediate",
    },
    bio: "Specialized in legal and technical interpretation with strong background in government relations and international law.",
  },
  {
    id: 5,
    name: "Sarah Johnson",
    avatar: "/src/assets/images/avatar/minhanh.png",
    title: "Conference Interpreter",
    languages: ["English", "Vietnamese", "Thai"],
    specializations: ["Conference", "Education", "Tourism"],
    experience: "5 years",
    rating: 4.5,
    reviews: 67,
    hourlyRate: "$30-45",
    location: "Ho Chi Minh City",
    availability: "Available",
    certifications: ["Conference Interpreter Certificate", "TESOL Certificate"],
    completedJobs: 123,
    responseTime: "2 hours",
    languages_detail: {
      English: "Native",
      Vietnamese: "Professional",
      Thai: "Intermediate",
    },
    bio: "Dynamic conference interpreter focused on educational events, tourism, and international conferences with multicultural expertise.",
  },
  {
    id: 6,
    name: "Lê Văn Nam",
    avatar: "/src/assets/images/avatar/nam.png",
    title: "Technical Translator",
    languages: ["Vietnamese", "English", "German"],
    specializations: ["Technical", "Engineering", "Manufacturing"],
    experience: "12 years",
    rating: 4.9,
    reviews: 156,
    hourlyRate: "$55-75",
    location: "Hanoi",
    availability: "Available",
    certifications: [
      "Technical Translation Certificate",
      "Goethe C1",
      "Engineering Translation Specialist",
    ],
    completedJobs: 287,
    responseTime: "1 hour",
    languages_detail: {
      Vietnamese: "Native",
      English: "Professional",
      German: "Professional",
    },
    bio: "Senior technical translator with deep expertise in engineering, manufacturing, and industrial processes with German market focus.",
  },
];

function FindInterpreterPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [availability, setAvailability] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [selectedInterpreter, setSelectedInterpreter] = useState(null);

  const specializations = [
    "Medical",
    "Legal",
    "Business",
    "Technical",
    "Conference",
    "Education",
    "Finance",
    "Healthcare",
    "Tourism",
  ];
  const locations = [
    "Ho Chi Minh City",
    "Hanoi",
    "Da Nang",
    "Can Tho",
    "Hai Phong",
  ];
  const languages = [
    "English",
    "Vietnamese",
    "Japanese",
    "Mandarin",
    "Korean",
    "French",
    "German",
    "Thai",
  ];

  const filteredInterpreters = MOCK_INTERPRETERS.filter((interpreter) => {
    return (
      (searchTerm === "" ||
        interpreter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interpreter.specializations.some((spec) =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        )) &&
      (selectedLanguages.length === 0 ||
        selectedLanguages.every((lang) =>
          interpreter.languages.includes(lang)
        )) &&
      (selectedSpecialization === "" ||
        interpreter.specializations.includes(selectedSpecialization)) &&
      (selectedLocation === "" || interpreter.location === selectedLocation) &&
      (availability === "" ||
        (availability === "available" &&
          interpreter.availability === "Available") ||
        (availability === "busy" && interpreter.availability !== "Available"))
    );
  }).sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "experience":
        return parseInt(b.experience) - parseInt(a.experience);
      case "price_low":
        return (
          parseInt(a.hourlyRate.split("-")[0].replace("$", "")) -
          parseInt(b.hourlyRate.split("-")[0].replace("$", ""))
        );
      case "price_high":
        return (
          parseInt(b.hourlyRate.split("-")[0].replace("$", "")) -
          parseInt(a.hourlyRate.split("-")[0].replace("$", ""))
        );
      default:
        return 0;
    }
  });

  const handleLanguageToggle = (language) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLanguages([]);
    setSelectedSpecialization("");
    setSelectedLocation("");
    setPriceRange("");
    setAvailability("");
    setSortBy("rating");
  };

  const handleHireInterpreter = (interpreter) => {
    // Navigate to job posting page with interpreter preselected
    navigate(`/company/job-post?interpreter=${interpreter.id}`);
  };

  const handleViewProfile = (interpreter) => {
    setSelectedInterpreter(interpreter);
  };

  const closeModal = () => {
    setSelectedInterpreter(null);
  };

  return (
    <MainLayout>
      <div className={styles.findInterpreterRoot}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Find Professional Interpreters</h1>
            <p className={styles.pageSubtitle}>
              Connect with certified interpreters and translators for your
              business needs
            </p>
          </div>
        </header>

        {/* Search and Filters */}
        <section className={styles.filtersSection}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search by name, specialization, or language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <button className={styles.searchBtn}>🔍</button>
          </div>

          <div className={styles.filtersGrid}>
            {/* Languages Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Languages:</label>
              <div className={styles.languageButtons}>
                {languages.map((language) => (
                  <button
                    key={language}
                    className={`${styles.languageBtn} ${
                      selectedLanguages.includes(language)
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() => handleLanguageToggle(language)}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            {/* Specialization Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Specialization:</label>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Location:</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Availability:</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Any Availability</option>
                <option value="available">Available Now</option>
                <option value="busy">Busy</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="rating">Highest Rating</option>
                <option value="experience">Most Experience</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            <button className={styles.clearFiltersBtn} onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </section>

        {/* Results Count */}
        <section className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultsCount}>
              {filteredInterpreters.length} interpreters found
            </span>
          </div>
        </section>

        {/* Interpreters Grid */}
        <section className={styles.interpretersSection}>
          <div className={styles.interpretersGrid}>
            {filteredInterpreters.map((interpreter) => (
              <div key={interpreter.id} className={styles.interpreterCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatarSection}>
                    <img
                      src={interpreter.avatar}
                      alt={interpreter.name}
                      className={styles.avatar}
                    />
                    <div
                      className={`${styles.availabilityBadge} ${
                        interpreter.availability === "Available"
                          ? styles.available
                          : styles.busy
                      }`}
                    >
                      {interpreter.availability}
                    </div>
                  </div>
                  <div className={styles.nameSection}>
                    <h3 className={styles.interpreterName}>
                      {interpreter.name}
                    </h3>
                    <p className={styles.interpreterTitle}>
                      {interpreter.title}
                    </p>
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.languages}>
                    <strong>Languages:</strong>
                    <div className={styles.languageTags}>
                      {interpreter.languages.map((lang) => (
                        <span key={lang} className={styles.languageTag}>
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.specializations}>
                    <strong>Specializations:</strong>
                    <div className={styles.specializationTags}>
                      {interpreter.specializations.map((spec) => (
                        <span key={spec} className={styles.specializationTag}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.stats}>
                    <div className={styles.statItem}>
                      <span className={styles.statIcon}>⭐</span>
                      <span>
                        {interpreter.rating} ({interpreter.reviews} reviews)
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statIcon}>🕒</span>
                      <span>{interpreter.experience} experience</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statIcon}>💼</span>
                      <span>{interpreter.completedJobs} jobs completed</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statIcon}>📍</span>
                      <span>{interpreter.location}</span>
                    </div>
                  </div>

                  <div className={styles.pricing}>
                    <span className={styles.priceLabel}>Hourly Rate:</span>
                    <span className={styles.priceValue}>
                      {interpreter.hourlyRate}
                    </span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    className={styles.viewProfileBtn}
                    onClick={() => handleViewProfile(interpreter)}
                  >
                    View Profile
                  </button>
                  <button
                    className={styles.hireBtn}
                    onClick={() => handleHireInterpreter(interpreter)}
                  >
                    Hire Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredInterpreters.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <h3>No interpreters found</h3>
              <p>Try adjusting your search criteria or filters</p>
              <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </section>

        {/* Interpreter Profile Modal */}
        {selectedInterpreter && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{selectedInterpreter.name}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.profileSection}>
                  <img
                    src={selectedInterpreter.avatar}
                    alt={selectedInterpreter.name}
                    className={styles.modalAvatar}
                  />
                  <div className={styles.profileInfo}>
                    <h3>{selectedInterpreter.title}</h3>
                    <p className={styles.bio}>{selectedInterpreter.bio}</p>

                    <div className={styles.modalStats}>
                      <div className={styles.modalStatItem}>
                        <strong>Rating:</strong> ⭐ {selectedInterpreter.rating}{" "}
                        ({selectedInterpreter.reviews} reviews)
                      </div>
                      <div className={styles.modalStatItem}>
                        <strong>Experience:</strong>{" "}
                        {selectedInterpreter.experience}
                      </div>
                      <div className={styles.modalStatItem}>
                        <strong>Response Time:</strong>{" "}
                        {selectedInterpreter.responseTime}
                      </div>
                      <div className={styles.modalStatItem}>
                        <strong>Completed Jobs:</strong>{" "}
                        {selectedInterpreter.completedJobs}
                      </div>
                      <div className={styles.modalStatItem}>
                        <strong>Location:</strong>{" "}
                        {selectedInterpreter.location}
                      </div>
                      <div className={styles.modalStatItem}>
                        <strong>Availability:</strong>{" "}
                        {selectedInterpreter.availability}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.detailsSection}>
                  <div className={styles.detailGroup}>
                    <h4>Languages & Proficiency</h4>
                    <div className={styles.languageDetails}>
                      {Object.entries(selectedInterpreter.languages_detail).map(
                        ([lang, level]) => (
                          <div key={lang} className={styles.languageDetail}>
                            <span className={styles.langName}>{lang}:</span>
                            <span className={styles.langLevel}>{level}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className={styles.detailGroup}>
                    <h4>Certifications</h4>
                    <div className={styles.certifications}>
                      {selectedInterpreter.certifications.map((cert) => (
                        <span key={cert} className={styles.certificationBadge}>
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.detailGroup}>
                    <h4>Specializations</h4>
                    <div className={styles.modalSpecializations}>
                      {selectedInterpreter.specializations.map((spec) => (
                        <span
                          key={spec}
                          className={styles.modalSpecializationTag}
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.pricingSection}>
                    <h4>Pricing</h4>
                    <div className={styles.modalPricing}>
                      <span className={styles.modalPriceValue}>
                        {selectedInterpreter.hourlyRate}/hour
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.modalHireBtn}
                  onClick={() => {
                    handleHireInterpreter(selectedInterpreter);
                    closeModal();
                  }}
                >
                  Hire This Interpreter
                </button>
                <button className={styles.modalCancelBtn} onClick={closeModal}>
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

export default FindInterpreterPage;
