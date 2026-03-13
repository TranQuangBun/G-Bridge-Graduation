import React from "react";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { FaStar } from "react-icons/fa";
import styles from "./Review.module.css";

const ReviewItem = ({ review, onUpdate }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isOwner = user?.id === review.reviewerId;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        className={`${styles.star} ${i < rating ? styles.starFilled : styles.starEmpty}`}
      />
    ));
  };

  return (
    <div className={styles.reviewItem}>
      <div className={styles.reviewHeader}>
        <div className={styles.reviewerInfo}>
          <div className={styles.avatar}>
            {review.reviewer?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className={styles.reviewerDetails}>
            <div className={styles.reviewerName}>
              {review.reviewer?.fullName || "Anonymous"}
            </div>
            <div className={styles.reviewDate}>
              {formatDate(review.createdAt)}
            </div>
          </div>
        </div>
        <div className={styles.ratingDisplay}>
          {renderStars(review.rating)}
        </div>
      </div>
      {review.comment && (
        <div className={styles.reviewComment}>{review.comment}</div>
      )}
      {isOwner && (
        <div className={styles.reviewActions}>
          <span className={styles.ownerBadge}>
            {t("reviews.yourReview") || "Your review"}
          </span>
        </div>
      )}
    </div>
  );
};

export default ReviewItem;

