import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import reviewService from "../../services/reviewService";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import styles from "./Review.module.css";

const ReviewForm = ({ revieweeId, jobApplicationId = null, onReviewAdded }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  const checkExistingReview = useCallback(async () => {
    if (!jobApplicationId || !user) return;
    
    try {
      const reviews = await reviewService.getReviewsByJobApplicationId(jobApplicationId);
      const myReview = reviews.data?.find((r) => r.reviewerId === user.id);
      if (myReview) {
        setExistingReview(myReview);
        setRating(myReview.rating);
        setComment(myReview.comment || "");
      }
    } catch (error) {
      console.error("Error checking existing review:", error);
    }
  }, [jobApplicationId, user]);

  useEffect(() => {
    if (jobApplicationId && user) {
      checkExistingReview();
    }
  }, [jobApplicationId, user, checkExistingReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error(t("reviews.ratingRequired") || "Please select a rating");
      return;
    }

    if (!revieweeId) {
      toast.error(t("reviews.revieweeRequired") || "Reviewee ID is required");
      return;
    }

    try {
      setSubmitting(true);
      const reviewData = {
        revieweeId,
        jobApplicationId,
        rating,
        comment: comment.trim() || null,
      };

      if (existingReview) {
        await reviewService.updateReview(existingReview.id, reviewData);
        toast.success(t("reviews.updateSuccess") || "Review updated successfully");
      } else {
        await reviewService.createReview(reviewData);
        toast.success(t("reviews.createSuccess") || "Review created successfully");
      }

      setComment("");
      setRating(0);
      setExistingReview(null);
      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(
        error.message || t("reviews.submitError") || "Failed to submit review"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, i) => {
      const starValue = i + 1;
      return (
        <FaStar
          key={i}
          className={`${styles.starInput} ${
            starValue <= (hoveredRating || rating)
              ? styles.starFilled
              : styles.starEmpty
          }`}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => setRating(starValue)}
        />
      );
    });
  };

  if (!user) {
    return (
      <div className={styles.loginPrompt}>
        {t("reviews.loginRequired") || "Please login to leave a review"}
      </div>
    );
  }

  return (
    <form className={styles.reviewForm} onSubmit={handleSubmit}>
      <h3 className={styles.formTitle}>
        {existingReview
          ? t("reviews.updateReview") || "Update Your Review"
          : t("reviews.writeReview") || "Write a Review"}
      </h3>
      <div className={styles.ratingInput}>
        <label>{t("reviews.rating") || "Rating"}</label>
        <div className={styles.starsInputContainer}>
          {renderStars()}
          {rating > 0 && (
            <span className={styles.ratingValue}>{rating}/5</span>
          )}
        </div>
      </div>
      <div className={styles.commentInput}>
        <label htmlFor="comment">
          {t("reviews.comment") || "Comment (optional)"}
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviews.commentPlaceholder") || "Share your experience..."}
          rows={4}
        />
      </div>
      <button
        type="submit"
        className={styles.submitBtn}
        disabled={submitting || rating === 0}
      >
        {submitting
          ? t("reviews.submitting") || "Submitting..."
          : existingReview
          ? t("reviews.update") || "Update Review"
          : t("reviews.submit") || "Submit Review"}
      </button>
    </form>
  );
};

export default ReviewForm;

