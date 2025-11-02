import React, { useState, useEffect } from "react";
import styles from "./BookingModal.module.css";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import bookingService from "../../services/bookingService";
import { toast } from "react-toastify";

const BookingModal = ({ isOpen, onClose, interpreter }) => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    serviceType: "",
    bookingType: "online", // online or offline
    location: "",
    eventDuration: "single", // single or multiple days
    // For single day
    eventDate: "",
    startTime: "",
    endTime: "",
    // For multiple days
    startDate: "",
    endDate: "",
    timeRequirement: "", // cả ngày, nửa ngày, theo lịch trình, khác
    topic: "",
    // Contact info (for non-authenticated users)
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        serviceType: "",
        bookingType: "online",
        location: "",
        eventDuration: "single",
        eventDate: "",
        startTime: "",
        endTime: "",
        startDate: "",
        endDate: "",
        timeRequirement: "",
        topic: "",
        fullName: user?.fullName || "",
        email: user?.email || "",
        phone: user?.phone || "",
      });
      setErrors({});
    }
  }, [isOpen, user]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updates = { [name]: value };

    // Logic 1: If service type is "online", force bookingType to "online" and disable offline
    if (name === "serviceType" && value === "online") {
      updates.bookingType = "online";
    }

    // Logic 2: If service type is "escort", default eventDuration to "multiple"
    if (name === "serviceType" && value === "escort") {
      updates.eventDuration = "multiple";
    }

    // Logic 3: If bookingType changes to "online", clear location
    if (name === "bookingType" && value === "online") {
      updates.location = "";
    }

    // Logic 4: If eventDuration changes, clear irrelevant date/time fields
    if (name === "eventDuration") {
      if (value === "single") {
        updates.startDate = "";
        updates.endDate = "";
        updates.timeRequirement = "";
      } else {
        updates.eventDate = "";
        updates.startTime = "";
        updates.endTime = "";
      }
    }

    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));

    // Clear errors for affected fields
    const errorsToClear = Object.keys(updates);
    if (errorsToClear.length > 0) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        errorsToClear.forEach((key) => delete newErrors[key]);
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Service type is required
    if (!formData.serviceType) {
      newErrors.serviceType = t("bookingModal.errors.serviceTypeRequired");
    }

    // Location is required if offline
    if (formData.bookingType === "offline" && !formData.location) {
      newErrors.location = t("bookingModal.errors.locationRequired");
    }

    // Validate based on event duration
    if (formData.eventDuration === "single") {
      // Single day validation
      if (!formData.eventDate) {
        newErrors.eventDate = t("bookingModal.errors.eventDateRequired");
      }
      if (!formData.startTime) {
        newErrors.startTime = t("bookingModal.errors.startTimeRequired");
      }
      if (!formData.endTime) {
        newErrors.endTime = t("bookingModal.errors.endTimeRequired");
      }
      if (
        formData.startTime &&
        formData.endTime &&
        formData.startTime >= formData.endTime
      ) {
        newErrors.endTime = t("bookingModal.errors.endTimeAfterStart");
      }
    } else {
      // Multiple days validation
      if (!formData.startDate) {
        newErrors.startDate = t("bookingModal.errors.startDateRequired");
      }
      if (!formData.endDate) {
        newErrors.endDate = t("bookingModal.errors.endDateRequired");
      }
      if (
        formData.startDate &&
        formData.endDate &&
        formData.startDate >= formData.endDate
      ) {
        newErrors.endDate = t("bookingModal.errors.endDateAfterStart");
      }
      if (!formData.timeRequirement) {
        newErrors.timeRequirement = t(
          "bookingModal.errors.timeRequirementRequired"
        );
      }
    }

    // Topic is required
    if (!formData.topic || formData.topic.trim().length < 10) {
      newErrors.topic = t("bookingModal.errors.topicRequired");
    }

    // Validate contact info for non-authenticated users
    if (!isAuthenticated) {
      if (!formData.fullName || formData.fullName.trim().length < 2) {
        newErrors.fullName = t("bookingModal.errors.fullNameRequired");
      }

      if (
        !formData.email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        newErrors.email = t("bookingModal.errors.emailInvalid");
      }

      if (
        !formData.phone ||
        !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ""))
      ) {
        newErrors.phone = t("bookingModal.errors.phoneInvalid");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const estimatedCostData = calculateEstimatedCost();

      const bookingData = {
        interpreterId: interpreter?.id,
        serviceType: formData.serviceType,
        bookingType: formData.bookingType,
        location: formData.location || null,
        eventDuration: formData.eventDuration,
        // Single day fields
        eventDate:
          formData.eventDuration === "single" ? formData.eventDate : null,
        startTime:
          formData.eventDuration === "single" ? formData.startTime : null,
        endTime: formData.eventDuration === "single" ? formData.endTime : null,
        // Multiple days fields
        startDate:
          formData.eventDuration === "multiple" ? formData.startDate : null,
        endDate:
          formData.eventDuration === "multiple" ? formData.endDate : null,
        timeRequirement:
          formData.eventDuration === "multiple"
            ? formData.timeRequirement
            : null,
        topic: formData.topic,
        fullName: !isAuthenticated ? formData.fullName : null,
        email: !isAuthenticated ? formData.email : null,
        phone: !isAuthenticated ? formData.phone : null,
        estimatedCost: estimatedCostData?.cost || null,
        estimatedHours: estimatedCostData?.hours || null,
      };

      console.log("📤 Submitting booking:", bookingData);

      const response = await bookingService.createBooking(bookingData);

      console.log("✅ Booking created:", response);

      toast.success(t("bookingModal.successMessage"));
      onClose();
    } catch (error) {
      console.error("❌ Error submitting booking:", error);
      toast.error(error.message || "Failed to submit booking request");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Calculate estimated cost based on time duration and hourly rate
  const calculateEstimatedCost = () => {
    if (!interpreter?.hourlyRate) {
      return null;
    }

    try {
      const hourlyRate = parseFloat(interpreter.hourlyRate) || 0;

      if (formData.eventDuration === "single") {
        // Single day: calculate from startTime to endTime
        if (!formData.startTime || !formData.endTime) {
          return null;
        }

        const [startHour, startMin] = formData.startTime.split(":").map(Number);
        const [endHour, endMin] = formData.endTime.split(":").map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (endMinutes <= startMinutes) {
          return null;
        }

        const durationHours = (endMinutes - startMinutes) / 60;
        const estimatedCost = durationHours * hourlyRate;

        return {
          hours: durationHours,
          cost: estimatedCost,
        };
      } else {
        // Multiple days: calculate based on date range and time requirement
        if (
          !formData.startDate ||
          !formData.endDate ||
          !formData.timeRequirement
        ) {
          return null;
        }

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end <= start) {
          return null;
        }

        // Calculate number of days
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include end date

        // Determine hours per day based on time requirement
        let hoursPerDay = 8; // Default full day
        if (formData.timeRequirement === "fullDay") {
          hoursPerDay = 8;
        } else if (formData.timeRequirement === "halfDay") {
          hoursPerDay = 4;
        } else if (formData.timeRequirement === "eventSchedule") {
          hoursPerDay = 6; // Estimate average
        } else if (formData.timeRequirement === "other") {
          hoursPerDay = 5; // Conservative estimate
        }

        const totalHours = diffDays * hoursPerDay;
        const estimatedCost = totalHours * hourlyRate;

        return {
          hours: totalHours,
          cost: estimatedCost,
          days: diffDays,
        };
      }
    } catch (error) {
      return null;
    }
  };

  const estimatedCost = calculateEstimatedCost();

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>{t("bookingModal.title")}</h2>
            <div className={styles.interpreterInfo}>
              {interpreter?.avatar && (
                <img
                  src={interpreter.avatar}
                  alt={interpreter.name}
                  className={styles.interpreterAvatar}
                />
              )}
              <p className={styles.interpreterName}>
                {t("bookingModal.bookingWith")}{" "}
                <strong>{interpreter?.name}</strong>
              </p>
            </div>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t("bookingModal.close")}
          >
            ✕
          </button>
        </div>

        {/* Body - Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Service Type */}
          <div className={styles.formGroup}>
            <label htmlFor="serviceType" className={styles.label}>
              {t("bookingModal.serviceType")}{" "}
              <span className={styles.required}>*</span>
            </label>
            <select
              id="serviceType"
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              className={`${styles.select} ${
                errors.serviceType ? styles.error : ""
              }`}
            >
              <option value="">{t("bookingModal.selectService")}</option>
              <option value="consecutive">
                {t("bookingModal.services.consecutive")}
              </option>
              <option value="simultaneous">
                {t("bookingModal.services.simultaneous")}
              </option>
              <option value="escort">
                {t("bookingModal.services.escort")}
              </option>
              <option value="online">
                {t("bookingModal.services.online")}
              </option>
            </select>
            {errors.serviceType && (
              <span className={styles.errorText}>{errors.serviceType}</span>
            )}
          </div>

          {/* Booking Type - Online/Offline */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("bookingModal.bookingType")}{" "}
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="bookingType"
                  value="online"
                  checked={formData.bookingType === "online"}
                  onChange={handleChange}
                  className={styles.radio}
                />
                <span>{t("bookingModal.online")}</span>
              </label>
              <label
                className={`${styles.radioLabel} ${
                  formData.serviceType === "online" ? styles.disabled : ""
                }`}
              >
                <input
                  type="radio"
                  name="bookingType"
                  value="offline"
                  checked={formData.bookingType === "offline"}
                  onChange={handleChange}
                  className={styles.radio}
                  disabled={formData.serviceType === "online"}
                />
                <span>{t("bookingModal.offline")}</span>
              </label>
            </div>
          </div>

          {/* Location - Only show if Offline */}
          {formData.bookingType === "offline" && (
            <div className={styles.formGroup}>
              <label htmlFor="location" className={styles.label}>
                {t("bookingModal.location")}{" "}
                <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder={t("bookingModal.locationPlaceholder")}
                className={`${styles.input} ${
                  errors.location ? styles.error : ""
                }`}
              />
              {errors.location && (
                <span className={styles.errorText}>{errors.location}</span>
              )}
            </div>
          )}

          {/* Event Duration - Single Day or Multiple Days */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("bookingModal.eventDuration")}{" "}
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="eventDuration"
                  value="single"
                  checked={formData.eventDuration === "single"}
                  onChange={handleChange}
                  className={styles.radio}
                />
                <span>{t("bookingModal.singleDay")}</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="eventDuration"
                  value="multiple"
                  checked={formData.eventDuration === "multiple"}
                  onChange={handleChange}
                  className={styles.radio}
                />
                <span>{t("bookingModal.multipleDays")}</span>
              </label>
            </div>
          </div>

          {/* Conditional Date/Time Fields based on Event Duration */}
          {formData.eventDuration === "single" ? (
            <>
              {/* Single Day: Event Date + Start Time + End Time */}
              <div className={styles.formGroup}>
                <label htmlFor="eventDate" className={styles.label}>
                  {t("bookingModal.eventDate")}{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={`${styles.input} ${styles.dateInput} ${
                    errors.eventDate ? styles.error : ""
                  }`}
                />
                {errors.eventDate && (
                  <span className={styles.errorText}>{errors.eventDate}</span>
                )}
              </div>

              {/* Time Range */}
              <div className={styles.timeGroup}>
                <div className={styles.formGroup}>
                  <label htmlFor="startTime" className={styles.label}>
                    {t("bookingModal.startTime")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className={`${styles.input} ${styles.timeInput} ${
                      errors.startTime ? styles.error : ""
                    }`}
                  />
                  {errors.startTime && (
                    <span className={styles.errorText}>{errors.startTime}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="endTime" className={styles.label}>
                    {t("bookingModal.endTime")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className={`${styles.input} ${styles.timeInput} ${
                      errors.endTime ? styles.error : ""
                    }`}
                  />
                  {errors.endTime && (
                    <span className={styles.errorText}>{errors.endTime}</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Multiple Days: Start Date + End Date */}
              <div className={styles.timeGroup}>
                <div className={styles.formGroup}>
                  <label htmlFor="startDate" className={styles.label}>
                    {t("bookingModal.startDate")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className={`${styles.input} ${styles.dateInput} ${
                      errors.startDate ? styles.error : ""
                    }`}
                  />
                  {errors.startDate && (
                    <span className={styles.errorText}>{errors.startDate}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="endDate" className={styles.label}>
                    {t("bookingModal.endDate")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={
                      formData.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    className={`${styles.input} ${styles.dateInput} ${
                      errors.endDate ? styles.error : ""
                    }`}
                  />
                  {errors.endDate && (
                    <span className={styles.errorText}>{errors.endDate}</span>
                  )}
                </div>
              </div>

              {/* Time Requirement */}
              <div className={styles.formGroup}>
                <label htmlFor="timeRequirement" className={styles.label}>
                  {t("bookingModal.timeRequirement")}{" "}
                  <span className={styles.required}>*</span>
                </label>
                <select
                  id="timeRequirement"
                  name="timeRequirement"
                  value={formData.timeRequirement}
                  onChange={handleChange}
                  className={`${styles.select} ${
                    errors.timeRequirement ? styles.error : ""
                  }`}
                >
                  <option value="">
                    {t("bookingModal.selectTimeRequirement")}
                  </option>
                  <option value="fullDay">
                    {t("bookingModal.timeOptions.fullDay")}
                  </option>
                  <option value="halfDay">
                    {t("bookingModal.timeOptions.halfDay")}
                  </option>
                  <option value="eventSchedule">
                    {t("bookingModal.timeOptions.eventSchedule")}
                  </option>
                  <option value="other">
                    {t("bookingModal.timeOptions.other")}
                  </option>
                </select>
                {errors.timeRequirement && (
                  <span className={styles.errorText}>
                    {errors.timeRequirement}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Topic/Content */}
          <div className={styles.formGroup}>
            <label htmlFor="topic" className={styles.label}>
              {t("bookingModal.topic")}{" "}
              <span className={styles.required}>*</span>
            </label>
            <textarea
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder={t("bookingModal.topicPlaceholder")}
              rows={4}
              className={`${styles.textarea} ${
                errors.topic ? styles.error : ""
              }`}
            />
            {errors.topic && (
              <span className={styles.errorText}>{errors.topic}</span>
            )}
          </div>

          {/* Contact Information - Only for non-authenticated users */}
          {!isAuthenticated && (
            <>
              <div className={styles.divider}>
                <span>{t("bookingModal.contactInfo")}</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fullName" className={styles.label}>
                  {t("bookingModal.fullName")}{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={t("bookingModal.fullNamePlaceholder")}
                  className={`${styles.input} ${
                    errors.fullName ? styles.error : ""
                  }`}
                />
                {errors.fullName && (
                  <span className={styles.errorText}>{errors.fullName}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  {t("bookingModal.email")}{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("bookingModal.emailPlaceholder")}
                  className={`${styles.input} ${
                    errors.email ? styles.error : ""
                  }`}
                />
                {errors.email && (
                  <span className={styles.errorText}>{errors.email}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  {t("bookingModal.phone")}{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t("bookingModal.phonePlaceholder")}
                  className={`${styles.input} ${
                    errors.phone ? styles.error : ""
                  }`}
                />
                {errors.phone && (
                  <span className={styles.errorText}>{errors.phone}</span>
                )}
              </div>
            </>
          )}

          {/* Footer - Estimated Cost & Action Buttons */}
          <div className={styles.footer}>
            {/* Estimated Cost */}
            {estimatedCost && (
              <div className={styles.estimatedCost}>
                <div className={styles.costLabel}>
                  <span className={styles.costIcon}>💰</span>
                  {t("bookingModal.estimatedCost")}:
                </div>
                <div className={styles.costDetails}>
                  <span className={styles.duration}>
                    ⏱️ {estimatedCost.hours.toFixed(1)}{" "}
                    {t("bookingModal.hours")}
                  </span>
                  <span className={styles.costAmount}>
                    ${estimatedCost.cost.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.footerActions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
              >
                {t("bookingModal.cancel")}
              </button>
              <button type="submit" className={styles.submitButton}>
                {t("bookingModal.submit")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
