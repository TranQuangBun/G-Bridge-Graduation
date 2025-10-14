import React, { useState, useEffect } from "react";
import styles from "./ProfilePage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/authService";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    user,
    profile: userProfile,
    isAuthenticated,
    loading: authLoading,
    refreshUser,
  } = useAuth();

  // States for editing
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
  });

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
      const currentLanguages = userProfile?.languages || [];
      const newLanguages = [...currentLanguages, languageForm];

      await authService.updateInterpreterProfile({ languages: newLanguages });
      await refreshUser();
      setIsAddingLanguage(false);
      setLanguageForm({ name: "", level: "Beginner" });
      toast.success("Language added successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to add language");
    } finally {
      setLoading(false);
    }
  };

  // Handle remove language
  const handleRemoveLanguage = async (index) => {
    setLoading(true);

    try {
      const currentLanguages = userProfile?.languages || [];
      const newLanguages = currentLanguages.filter((_, i) => i !== index);

      await authService.updateInterpreterProfile({ languages: newLanguages });
      await refreshUser();
      toast.success("Language removed successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to remove language");
    } finally {
      setLoading(false);
    }
  };

  // Handle add certification
  const handleAddCertification = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentCertifications = userProfile?.certifications || [];
      const newCertifications = [...currentCertifications, certificationForm];

      await authService.updateInterpreterProfile({
        certifications: newCertifications,
      });
      await refreshUser();
      setIsAddingCertification(false);
      setCertificationForm({ name: "", score: "", year: "" });
      toast.success("Certification added successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to add certification");
    } finally {
      setLoading(false);
    }
  };

  // Handle remove certification
  const handleRemoveCertification = async (index) => {
    setLoading(true);

    try {
      const currentCertifications = userProfile?.certifications || [];
      const newCertifications = currentCertifications.filter(
        (_, i) => i !== index
      );

      await authService.updateInterpreterProfile({
        certifications: newCertifications,
      });
      await refreshUser();
      toast.success("Certification removed successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to remove certification");
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
        <div className={styles.mainContent}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>My Profile</h1>
            <p className={styles.pageSubtitle}>
              Manage your profile information
            </p>
          </div>

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
                  <h3>Complete Your Profile</h3>
                  <p>
                    Add more information to increase your visibility to
                    potential clients
                  </p>
                </div>
              </div>

              <div className={styles.progressBarContainer}>
                <div className={styles.progressBarLabel}>
                  <span>Profile Completeness</span>
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
                  <h4>Missing Information:</h4>
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
              <h3 className={styles.cardTitle}>Basic Information</h3>
              <button
                className={styles.editBtn}
                onClick={() => setIsEditingBasicInfo(!isEditingBasicInfo)}
              >
                {isEditingBasicInfo ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className={styles.cardContent}>
              {!isEditingBasicInfo ? (
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Full Name</label>
                    <p>{user.fullName || "Not provided"}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Email</label>
                    <p>{user.email}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Phone</label>
                    <p>{user.phone || "Not provided"}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Address</label>
                    <p>{user.address || "Not provided"}</p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleUpdateBasicInfo}
                  className={styles.editForm}
                >
                  <div className={styles.formGroup}>
                    <label>Full Name *</label>
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
                    <label>Phone</label>
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
                    <label>Address</label>
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

          {/* Languages Card */}
          {user.role === "interpreter" && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Languages</h3>
                <button
                  className={styles.addBtn}
                  onClick={() => setIsAddingLanguage(true)}
                >
                  + Add Language
                </button>
              </div>

              <div className={styles.cardContent}>
                {Array.isArray(userProfile?.languages) &&
                userProfile.languages.length > 0 ? (
                  <div className={styles.languagesList}>
                    {userProfile.languages.map((lang, index) => (
                      <div key={index} className={styles.languageItem}>
                        <div className={styles.languageInfo}>
                          <h4>{lang.name}</h4>
                          <span className={styles.languageLevel}>
                            {lang.level}
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
                  <p className={styles.emptyMessage}>No languages added yet</p>
                )}

                {isAddingLanguage && (
                  <form onSubmit={handleAddLanguage} className={styles.addForm}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Language *</label>
                        <input
                          type="text"
                          value={languageForm.name}
                          onChange={(e) =>
                            setLanguageForm({
                              ...languageForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g., English"
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Level *</label>
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
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Native">Native</option>
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
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.saveBtn}
                        disabled={loading}
                      >
                        {loading ? "Adding..." : "Add Language"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Certifications Card */}
          {user.role === "interpreter" && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Certifications</h3>
                <button
                  className={styles.addBtn}
                  onClick={() => setIsAddingCertification(true)}
                >
                  + Add Certification
                </button>
              </div>

              <div className={styles.cardContent}>
                {Array.isArray(userProfile?.certifications) &&
                userProfile.certifications.length > 0 ? (
                  <div className={styles.certificationsList}>
                    {userProfile.certifications.map((cert, index) => (
                      <div key={index} className={styles.certificationItem}>
                        <div className={styles.certificationInfo}>
                          <h4>{cert.name}</h4>
                          <div className={styles.certificationMeta}>
                            {cert.score && <span>Score: {cert.score}</span>}
                            {cert.year && <span>Year: {cert.year}</span>}
                          </div>
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
                    No certifications added yet
                  </p>
                )}

                {isAddingCertification && (
                  <form
                    onSubmit={handleAddCertification}
                    className={styles.addForm}
                  >
                    <div className={styles.formGroup}>
                      <label>Certification Name *</label>
                      <input
                        type="text"
                        value={certificationForm.name}
                        onChange={(e) =>
                          setCertificationForm({
                            ...certificationForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., TOEIC, IELTS"
                        required
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Score</label>
                        <input
                          type="text"
                          value={certificationForm.score}
                          onChange={(e) =>
                            setCertificationForm({
                              ...certificationForm,
                              score: e.target.value,
                            })
                          }
                          placeholder="e.g., 990, 8.5"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Year</label>
                        <input
                          type="text"
                          value={certificationForm.year}
                          onChange={(e) =>
                            setCertificationForm({
                              ...certificationForm,
                              year: e.target.value,
                            })
                          }
                          placeholder="e.g., 2024"
                        />
                      </div>
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
                          });
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.saveBtn}
                        disabled={loading}
                      >
                        {loading ? "Adding..." : "Add Certification"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Professional Information Card */}
          {user.role === "interpreter" && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Professional Information</h3>
                <button
                  className={styles.editBtn}
                  onClick={() =>
                    setIsEditingProfessional(!isEditingProfessional)
                  }
                >
                  {isEditingProfessional ? "Cancel" : "Edit"}
                </button>
              </div>

              <div className={styles.cardContent}>
                {!isEditingProfessional ? (
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>Hourly Rate</label>
                      <p>
                        {userProfile?.hourlyRate
                          ? `$${userProfile.hourlyRate} ${
                              userProfile.currency || "USD"
                            }`
                          : "Not provided"}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Years of Experience</label>
                      <p>{userProfile?.experience || "Not provided"}</p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Specializations</label>
                      <p>
                        {userProfile?.specializations?.length
                          ? userProfile.specializations.join(", ")
                          : "Not provided"}
                      </p>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Portfolio/Bio</label>
                      <p>{userProfile?.portfolio || "Not provided"}</p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleUpdateProfessional}
                    className={styles.editForm}
                  >
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Hourly Rate (USD)</label>
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
                          placeholder="e.g., 50"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Years of Experience</label>
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
                      <label>Specializations</label>
                      <div className={styles.specializationsInput}>
                        <input
                          type="text"
                          placeholder="Add specialization and press Enter"
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
                      <label>Portfolio/Bio</label>
                      <textarea
                        value={professionalForm.portfolio}
                        onChange={(e) =>
                          setProfessionalForm({
                            ...professionalForm,
                            portfolio: e.target.value,
                          })
                        }
                        rows={5}
                        placeholder="Tell clients about yourself..."
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
          )}

          {/* Stats Card */}
          {user.role === "interpreter" && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Statistics</h3>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>⭐</div>
                    <div className={styles.statInfo}>
                      <h4>{userProfile?.rating || "0.0"}</h4>
                      <p>Rating</p>
                    </div>
                  </div>

                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statInfo}>
                      <h4>{userProfile?.completedJobs || 0}</h4>
                      <p>Completed Jobs</p>
                    </div>
                  </div>

                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statInfo}>
                      <h4>{userProfile?.totalReviews || 0}</h4>
                      <p>Total Reviews</p>
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
