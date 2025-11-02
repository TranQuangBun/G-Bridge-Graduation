import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../translet/LanguageContext";
import { MainLayout } from "../../layouts";
import styles from "./PostJobPage.module.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const PostJobPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Lookup data
  const [workingModes, setWorkingModes] = useState([]);
  const [domains, setDomains] = useState([]);
  const [levels, setLevels] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    organizationId: 1, // TODO: Get from auth context/user profile
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
    minSalary: "",
    maxSalary: "",
    salaryType: "NEGOTIABLE",
    contactEmail: "",
    contactPhone: "",
    domains: [],
    requiredLanguages: [],
    requiredCertificates: [],
  });

  // Language/certificate input
  const [currentLanguage, setCurrentLanguage] = useState({
    languageId: "",
    levelId: "",
    isRequired: true,
  });

  const [currentCertificate, setCurrentCertificate] = useState({
    certificateName: "",
    isRequired: false,
  });

  const [errors, setErrors] = useState({});

  // Fetch lookup data on mount
  useEffect(() => {
    fetchLookupData();
  }, []);

  const fetchLookupData = async () => {
    try {
      // Fetch working modes
      const modesRes = await fetch(`${API_URL}/jobs/lookup/working-modes`);
      const modesData = await modesRes.json();
      if (modesData.success) {
        setWorkingModes(modesData.data);
      }

      // Fetch domains
      const domainsRes = await fetch(`${API_URL}/jobs/lookup/domains`);
      const domainsData = await domainsRes.json();
      if (domainsData.success) {
        setDomains(domainsData.data);
      }

      // Fetch levels
      const levelsRes = await fetch(`${API_URL}/jobs/lookup/levels`);
      const levelsData = await levelsRes.json();
      if (levelsData.success) {
        setLevels(levelsData.data);
      }
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      // Set empty arrays on error to prevent crashes
      setWorkingModes([]);
      setDomains([]);
      setLevels([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDomainToggle = (domainId) => {
    setFormData((prev) => ({
      ...prev,
      domains: prev.domains.includes(domainId)
        ? prev.domains.filter((id) => id !== domainId)
        : [...prev.domains, domainId],
    }));
  };

  const addLanguage = () => {
    if (!currentLanguage.languageId || !currentLanguage.levelId) {
      alert(t("postJob.pleaseSelectLanguageAndLevel"));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      requiredLanguages: [...prev.requiredLanguages, { ...currentLanguage }],
    }));

    setCurrentLanguage({
      languageId: "",
      levelId: "",
      isRequired: true,
    });
  };

  const removeLanguage = (index) => {
    setFormData((prev) => ({
      ...prev,
      requiredLanguages: prev.requiredLanguages.filter((_, i) => i !== index),
    }));
  };

  const addCertificate = () => {
    if (!currentCertificate.certificateName.trim()) {
      alert(t("postJob.pleaseEnterCertificateName"));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      requiredCertificates: [
        ...prev.requiredCertificates,
        { ...currentCertificate },
      ],
    }));

    setCurrentCertificate({
      certificateName: "",
      isRequired: false,
    });
  };

  const removeCertificate = (index) => {
    setFormData((prev) => ({
      ...prev,
      requiredCertificates: prev.requiredCertificates.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = t("postJob.titleRequired");
      if (!formData.workingModeId)
        newErrors.workingModeId = t("postJob.workingModeRequired");
      if (!formData.province.trim())
        newErrors.province = t("postJob.provinceRequired");
      if (!formData.expirationDate)
        newErrors.expirationDate = t("postJob.expirationDateRequired");
      if (!formData.quantity || formData.quantity < 1)
        newErrors.quantity = t("postJob.quantityRequired");
    }

    if (currentStep === 2) {
      if (!formData.descriptions.trim())
        newErrors.descriptions = t("postJob.descriptionsRequired");
    }

    if (currentStep === 3) {
      if (formData.salaryType !== "NEGOTIABLE") {
        if (!formData.minSalary || formData.minSalary <= 0)
          newErrors.minSalary = t("postJob.minSalaryRequired");
        if (
          formData.maxSalary &&
          parseFloat(formData.maxSalary) < parseFloat(formData.minSalary)
        ) {
          newErrors.maxSalary = t("postJob.maxSalaryMustBeGreater");
        }
      }
      if (!formData.contactEmail.trim()) {
        newErrors.contactEmail = t("postJob.contactEmailRequired");
      } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.contactEmail)) {
          newErrors.contactEmail = t("postJob.invalidEmailFormat");
        }
      }
    }

    if (currentStep === 4) {
      // Yêu cầu ít nhất 1 ngôn ngữ
      if (
        !formData.requiredLanguages ||
        formData.requiredLanguages.length === 0
      ) {
        newErrors.requiredLanguages =
          t("postJob.requiredLanguagesRequired") ||
          "Please add at least one required language";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Nếu chưa đến bước cuối, chỉ next step
    if (step < totalSteps) {
      nextStep();
      return;
    }

    // Validate bước cuối trước khi submit
    if (!validateStep(step)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(t("postJob.jobPostedSuccessfully"));
        navigate("/dashboard"); // Or wherever you want to redirect
      } else {
        alert(data.message || t("postJob.errorPostingJob"));
      }
    } catch (error) {
      console.error("Error posting job:", error);
      alert(t("postJob.errorPostingJob"));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{t("postJob.step1Title")}</h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {t("postJob.jobTitle")}{" "}
                <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`${styles.input} ${
                  errors.title ? styles.error : ""
                }`}
                placeholder={t("postJob.jobTitlePlaceholder")}
              />
              {errors.title && (
                <span className={styles.errorText}>{errors.title}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {t("postJob.workingMode")}{" "}
                <span className={styles.required}>*</span>
              </label>
              <select
                name="workingModeId"
                value={formData.workingModeId}
                onChange={handleInputChange}
                className={`${styles.select} ${
                  errors.workingModeId ? styles.error : ""
                }`}
              >
                <option value="">{t("postJob.selectWorkingMode")}</option>
                {workingModes.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {language === "vi" && mode.nameVi ? mode.nameVi : mode.name}
                  </option>
                ))}
              </select>
              {errors.workingModeId && (
                <span className={styles.errorText}>{errors.workingModeId}</span>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {t("postJob.province")}{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  className={`${styles.input} ${
                    errors.province ? styles.error : ""
                  }`}
                  placeholder={t("postJob.provincePlaceholder")}
                />
                {errors.province && (
                  <span className={styles.errorText}>{errors.province}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t("postJob.commune")}</label>
                <input
                  type="text"
                  name="commune"
                  value={formData.commune}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder={t("postJob.communePlaceholder")}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t("postJob.address")}</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={styles.input}
                placeholder={t("postJob.addressPlaceholder")}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {t("postJob.expirationDate")}{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={`${styles.input} ${
                    errors.expirationDate ? styles.error : ""
                  }`}
                />
                {errors.expirationDate && (
                  <span className={styles.errorText}>
                    {errors.expirationDate}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {t("postJob.quantity")}{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className={`${styles.input} ${
                    errors.quantity ? styles.error : ""
                  }`}
                />
                {errors.quantity && (
                  <span className={styles.errorText}>{errors.quantity}</span>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{t("postJob.step2Title")}</h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {t("postJob.jobDescription")}{" "}
                <span className={styles.required}>*</span>
              </label>
              <textarea
                name="descriptions"
                value={formData.descriptions}
                onChange={handleInputChange}
                className={`${styles.textarea} ${
                  errors.descriptions ? styles.error : ""
                }`}
                placeholder={t("postJob.jobDescriptionPlaceholder")}
                rows="6"
              />
              {errors.descriptions && (
                <span className={styles.errorText}>{errors.descriptions}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {t("postJob.responsibility")}
              </label>
              <textarea
                name="responsibility"
                value={formData.responsibility}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder={t("postJob.responsibilityPlaceholder")}
                rows="5"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t("postJob.benefits")}</label>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder={t("postJob.benefitsPlaceholder")}
                rows="5"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t("postJob.domains")}</label>
              <div className={styles.checkboxGrid}>
                {domains.map((domain) => (
                  <label key={domain.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.domains.includes(domain.id)}
                      onChange={() => handleDomainToggle(domain.id)}
                      className={styles.checkbox}
                    />
                    <span>
                      {language === "vi" && domain.nameVi
                        ? domain.nameVi
                        : domain.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{t("postJob.step3Title")}</h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t("postJob.salaryType")}</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="salaryType"
                    value="NEGOTIABLE"
                    checked={formData.salaryType === "NEGOTIABLE"}
                    onChange={handleInputChange}
                    className={styles.radio}
                  />
                  <span>{t("postJob.negotiable")}</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="salaryType"
                    value="GROSS"
                    checked={formData.salaryType === "GROSS"}
                    onChange={handleInputChange}
                    className={styles.radio}
                  />
                  <span>{t("postJob.gross")}</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="salaryType"
                    value="NET"
                    checked={formData.salaryType === "NET"}
                    onChange={handleInputChange}
                    className={styles.radio}
                  />
                  <span>{t("postJob.net")}</span>
                </label>
              </div>
            </div>

            {formData.salaryType !== "NEGOTIABLE" && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("postJob.minSalary")} (USD)
                  </label>
                  <input
                    type="number"
                    name="minSalary"
                    value={formData.minSalary}
                    onChange={handleInputChange}
                    min="0"
                    step="100"
                    className={`${styles.input} ${
                      errors.minSalary ? styles.error : ""
                    }`}
                    placeholder="1000"
                  />
                  {errors.minSalary && (
                    <span className={styles.errorText}>{errors.minSalary}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("postJob.maxSalary")} (USD)
                  </label>
                  <input
                    type="number"
                    name="maxSalary"
                    value={formData.maxSalary}
                    onChange={handleInputChange}
                    min="0"
                    step="100"
                    className={`${styles.input} ${
                      errors.maxSalary ? styles.error : ""
                    }`}
                    placeholder="5000"
                  />
                  {errors.maxSalary && (
                    <span className={styles.errorText}>{errors.maxSalary}</span>
                  )}
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {t("postJob.contactEmail")}{" "}
                <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className={`${styles.input} ${
                  errors.contactEmail ? styles.error : ""
                }`}
                placeholder="hr@company.com"
              />
              {errors.contactEmail && (
                <span className={styles.errorText}>{errors.contactEmail}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {t("postJob.contactPhone")}
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{t("postJob.step4Title")}</h2>

            {/* Required Languages */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {t("postJob.requiredLanguages")}
              </label>

              <div className={styles.addItemContainer}>
                <select
                  value={currentLanguage.languageId}
                  onChange={(e) =>
                    setCurrentLanguage((prev) => ({
                      ...prev,
                      languageId: e.target.value,
                    }))
                  }
                  className={styles.selectSmall}
                >
                  <option value="">{t("postJob.selectLanguage")}</option>
                  <option value="1">English</option>
                  <option value="2">Vietnamese</option>
                  <option value="3">French</option>
                  <option value="4">Spanish</option>
                  <option value="5">Chinese</option>
                  <option value="6">Japanese</option>
                  <option value="7">Korean</option>
                </select>

                <select
                  value={currentLanguage.levelId}
                  onChange={(e) =>
                    setCurrentLanguage((prev) => ({
                      ...prev,
                      levelId: e.target.value,
                    }))
                  }
                  className={styles.selectSmall}
                >
                  <option value="">{t("postJob.selectLevel")}</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>

                <label className={styles.checkboxInline}>
                  <input
                    type="checkbox"
                    checked={currentLanguage.isRequired}
                    onChange={(e) =>
                      setCurrentLanguage((prev) => ({
                        ...prev,
                        isRequired: e.target.checked,
                      }))
                    }
                    className={styles.checkbox}
                  />
                  <span>{t("postJob.required")}</span>
                </label>

                <button
                  type="button"
                  onClick={addLanguage}
                  className={styles.addButton}
                >
                  {t("postJob.add")}
                </button>
              </div>

              {errors.requiredLanguages && (
                <span className={styles.errorText}>
                  {errors.requiredLanguages}
                </span>
              )}

              {formData.requiredLanguages.length > 0 && (
                <div className={styles.itemsList}>
                  {formData.requiredLanguages.map((lang, index) => (
                    <div key={index} className={styles.itemCard}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>
                          Language ID: {lang.languageId} - Level ID:{" "}
                          {lang.levelId}
                        </span>
                        {lang.isRequired && (
                          <span className={styles.requiredBadge}>
                            {t("postJob.required")}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className={styles.removeButton}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Required Certificates */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {t("postJob.requiredCertificates")}
              </label>

              <div className={styles.addItemContainer}>
                <input
                  type="text"
                  value={currentCertificate.certificateName}
                  onChange={(e) =>
                    setCurrentCertificate((prev) => ({
                      ...prev,
                      certificateName: e.target.value,
                    }))
                  }
                  className={styles.inputSmall}
                  placeholder={t("postJob.certificateNamePlaceholder")}
                />

                <label className={styles.checkboxInline}>
                  <input
                    type="checkbox"
                    checked={currentCertificate.isRequired}
                    onChange={(e) =>
                      setCurrentCertificate((prev) => ({
                        ...prev,
                        isRequired: e.target.checked,
                      }))
                    }
                    className={styles.checkbox}
                  />
                  <span>{t("postJob.required")}</span>
                </label>

                <button
                  type="button"
                  onClick={addCertificate}
                  className={styles.addButton}
                >
                  {t("postJob.add")}
                </button>
              </div>

              {formData.requiredCertificates.length > 0 && (
                <div className={styles.itemsList}>
                  {formData.requiredCertificates.map((cert, index) => (
                    <div key={index} className={styles.itemCard}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>
                          {cert.certificateName}
                        </span>
                        {cert.isRequired && (
                          <span className={styles.requiredBadge}>
                            {t("postJob.required")}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCertificate(index)}
                        className={styles.removeButton}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>{t("postJob.pageTitle")}</h1>
          <p className={styles.pageSubtitle}>{t("postJob.pageSubtitle")}</p>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`${styles.progressStep} ${
                  stepNum <= step ? styles.active : ""
                } ${stepNum < step ? styles.completed : ""}`}
              >
                <div className={styles.stepCircle}>{stepNum}</div>
                <span className={styles.stepLabel}>
                  {t(`postJob.step${stepNum}Label`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className={styles.buttonContainer}>
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className={styles.backButton}
                disabled={loading}
              >
                {t("common.previous")}
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className={styles.nextButton}
              >
                {t("common.next")}
              </button>
            ) : (
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? t("common.loading") : t("postJob.postJob")}
              </button>
            )}
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default PostJobPage;
